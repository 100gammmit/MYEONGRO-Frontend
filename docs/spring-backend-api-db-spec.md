# 명로 Spring 백엔드 API·DB 명세

## 1. 권장 전환 방식

무료 MVP까지는 다음 구조가 가장 경제적이다.

- 프론트엔드: 기존 Next.js 유지
- 인증: 우선 Supabase Kakao Auth 유지
- 백엔드: Spring Boot가 리딩, 동의, 기록, 쿼터, OpenAI 호출 담당
- 데이터베이스: 기존 Supabase PostgreSQL 유지
- 회원 식별자: Supabase JWT의 `sub` UUID를 `profiles.id`로 사용
- 브라우저가 DB를 직접 조작하지 않도록 읽기·쓰기를 Spring API로 이동

이 방식은 익숙한 Spring 디버깅 환경을 얻으면서 OAuth와 기존 회원 데이터의
재구축을 피한다. 자체 Kakao OAuth와 회원 테이블 이전은 무료 MVP 안정화 뒤에
별도 단계로 진행하는 편이 낫다.

Spring API 주소가 별도 도메인이라면 Next.js의 `/api/*`를 Spring으로
프록시하면 현재 프론트 계약을 거의 그대로 유지할 수 있다.

## 2. 인증과 게스트 식별

### 회원 요청

- 프론트가 Supabase access token을 `Authorization: Bearer <JWT>`로 전달한다.
- Spring Security Resource Server가 JWT 서명과 만료를 검증한다.
- JWT `sub`를 회원 UUID로 사용한다.
- 본인 소유 리소스가 아니면 `403` 대신 `404`를 반환한다.

### 게스트 요청

- 쿠키 이름: `myeongro_guest`
- 속성: `HttpOnly`, `SameSite=Lax`, `Path=/`, 유효기간 30일
- 운영 환경에서 `Secure`
- 서버가 발급하고 `APP_SIGNING_SECRET`으로 HMAC-SHA256 서명
- 최소 32바이트 이상의 랜덤 시크릿 사용
- 기존 사용자 이전 기간에는 `woondam_guest` 쿠키도 읽고 새 쿠키로 교체

클라이언트가 전달한 사용자 ID, 게스트 UUID, tier, 모델명, 사주 명식은 신뢰하지
않는다.

## 3. 공통 응답 규칙

오류 형식:

```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "오늘 이용 가능한 무료 리딩을 모두 사용했어요."
}
```

주요 HTTP 상태:

| 상태 | 의미 |
| --- | --- |
| 400 | 입력 형식 오류 |
| 401 | 유효한 회원 또는 게스트 식별자가 없음 |
| 403 | 필수 동의 누락 |
| 404 | 리소스 없음 또는 다른 사용자 소유 |
| 409 | idempotency 충돌 또는 이미 생성 중 |
| 429 | 무료 생성 한도 초과 |
| 502 | AI 생성 실패 또는 타임아웃 |

공급자 오류 원문, 질문 원문, 출생 정보, 원본 IP는 로그에 남기지 않는다.

## 4. 필수 API

### 4.1 현재 사용자

`GET /api/me`

회원이면:

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "displayName": "명로 사용자"
  }
}
```

게스트이면:

```json
{ "authenticated": false }
```

### 4.2 동의 상태 조회

`GET /api/consents`

비회원에게 유효한 게스트 쿠키가 없으면 이 요청에서 발급한다.

```json
{
  "status": {
    "acceptedDocumentTypes": ["terms", "privacy", "sensitive-data"],
    "requiredDocumentTypes": ["terms", "privacy", "sensitive-data"],
    "hasAcceptedRequired": true
  }
}
```

현재 문서 버전은 세 문서 모두 `2026-06-10`이다. 버전은 코드 상수보다 설정
또는 별도 테이블로 관리하는 것이 좋다.

### 4.3 동의 저장

`POST /api/consents`

```json
{
  "acceptedDocumentTypes": ["terms", "privacy", "sensitive-data"]
}
```

규칙:

- 필수 문서가 모두 포함되어야 한다.
- 현재 버전과 주체 조합으로 upsert한다.
- 같은 버전의 재요청은 최초 `accepted_at`을 덮어쓰지 않는다.
- 클라이언트가 전달한 동의 시각은 받지 않는다.

### 4.4 무료 리딩 생성

`POST /api/readings`

타로 요청:

```json
{
  "kind": "tarot",
  "question": "앞으로의 연애 흐름이 궁금해요.",
  "requestId": "uuid",
  "cardIds": ["major-00", "major-06", "major-17"]
}
```

사주 요청:

```json
{
  "kind": "saju",
  "question": "올해 일과 재물의 흐름이 궁금해요.",
  "requestId": "uuid",
  "birthDate": "1995-04-21",
  "birthTime": "14:30",
  "gender": "female"
}
```

검증:

- `question`: 공백 제거 후 1~300자
- `requestId`: UUID
- 타로 카드: 서버 canonical 목록에 존재하는 서로 다른 카드 정확히 3장
- 사주 달력: 무료 MVP에서는 양력 고정
- `birthTime`: 선택 사항
- `gender`: `female`, `male`, `unspecified`
- 정의되지 않은 필드는 거부
- 명식은 서버가 계산

성공 응답:

```json
{
  "reading": {
    "id": "uuid",
    "kind": "tarot",
    "status": "completed",
    "input": {},
    "result": {
      "title": "관계의 흐름을 다시 세우는 시기",
      "summary": "요약 해석",
      "sections": [
        {
          "heading": "현재의 흐름",
          "body": "상세 해석"
        }
      ],
      "guidance": ["서두르기보다 상대의 반응을 살펴보세요."],
      "disclaimer": "이 해석은 자기 성찰과 오락을 위한 참고 정보입니다."
    },
    "createdAt": "2026-06-12T10:00:00Z",
    "updatedAt": "2026-06-12T10:00:05Z"
  }
}
```

idempotency 규칙:

- 소유자와 `requestId`가 같고 입력 해시도 같으면 기존 결과 반환
- 같은 `requestId`에 다른 입력이면 `409`
- 이미 생성 중이면 `409`
- 입력 해시는 정규화된 서버 입력의 SHA-256

무료 한도:

- 게스트: 최근 1시간 3회
- 게스트: Asia/Seoul 기준 하루 5회
- 회원: Asia/Seoul 기준 하루 10회
- 게스트는 `guest_session_id`와 `ip_hash` 양쪽으로 검사
- 원본 IP 대신 `APP_SIGNING_SECRET` 기반 HMAC 해시만 저장

### 4.5 리딩 목록

`GET /api/readings?cursor=<createdAt>&size=20`

- 로그인 필수
- `deleted_at IS NULL`
- 최신순

```json
{
  "items": [
    {
      "id": "uuid",
      "kind": "tarot",
      "status": "completed",
      "title": "관계의 흐름을 다시 세우는 시기",
      "questionPreview": "앞으로의 연애 흐름...",
      "createdAt": "2026-06-12T10:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### 4.6 리딩 상세

`GET /api/readings/{readingId}`

- 로그인 필수
- 본인 소유이며 삭제되지 않은 리딩만 반환
- 다른 사용자의 ID와 존재하지 않는 ID 모두 `404`

### 4.7 리딩 삭제

`DELETE /api/readings/{readingId}`

- 실제 삭제하지 않고 `deleted_at` 설정
- 성공: `204 No Content`
- 이미 삭제되었거나 타인 소유: `404`

### 4.8 실패 리딩 재시도

`POST /api/readings/{readingId}/retry`

- 로그인 필수
- 본인 소유, `status=failed`, 삭제되지 않은 리딩만 허용
- 새 `generation_records` 행 생성
- 리딩 입력과 서버 계산값을 재사용
- 동시에 한 번만 실행되도록 DB 잠금 또는 원자적 상태 전환 사용

### 4.9 게스트 데이터 귀속

`POST /api/guest/claim`

- 로그인 직후 한 번 호출
- JWT 회원과 서명된 게스트 쿠키가 모두 필요
- 리딩, 동의, 쿼터 이벤트를 한 트랜잭션으로 회원에게 이전
- 같은 게스트를 같은 회원에게 재요청하면 성공 처리
- 이미 다른 회원에게 귀속된 게스트면 거부
- 성공 후 게스트 쿠키 제거

### 4.10 로그아웃과 탈퇴

`POST /api/auth/logout`

- Supabase Auth를 유지하는 동안 프론트가 Supabase 로그아웃을 수행하고 쿠키 제거

`DELETE /api/account`

- 로그인 필수
- 무료 MVP에서는 회원 데이터 삭제 정책을 먼저 확정해야 한다.
- 즉시 삭제를 택하면 리딩·동의·프로필을 트랜잭션으로 정리하고 Auth 사용자도 삭제
- 법적 보존이 필요한 결제 데이터가 생긴 뒤에는 익명화 방식으로 변경

## 5. PostgreSQL 스키마

현재 Supabase 스키마와 호환되는 핵심 구조다. 실제 Flyway migration에서는 기존
객체 존재 여부를 확인한 뒤 변경해야 한다.

```sql
create type reading_kind as enum ('tarot', 'saju');
create type reading_tier as enum ('free', 'paid');
create type reading_status as enum ('draft', 'generating', 'completed', 'failed');
create type consent_document_type as enum ('terms', 'privacy', 'sensitive-data');
create type generation_status as enum ('pending', 'completed', 'failed');

create table profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid,
  kind reading_kind not null,
  tier reading_tier not null default 'free',
  status reading_status not null default 'draft',
  title text not null,
  input jsonb not null,
  result jsonb,
  request_id uuid not null,
  input_hash text not null check (length(input_hash) > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((user_id is null) <> (guest_session_id is null))
);

create unique index readings_user_request_uq
  on readings(user_id, request_id)
  where user_id is not null;

create unique index readings_guest_request_uq
  on readings(guest_session_id, request_id)
  where guest_session_id is not null;

create index readings_user_active_created_idx
  on readings(user_id, created_at desc)
  where user_id is not null and deleted_at is null;

create index readings_guest_active_created_idx
  on readings(guest_session_id, created_at desc)
  where guest_session_id is not null and deleted_at is null;

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid,
  document_type consent_document_type not null,
  document_version text not null check (length(document_version) > 0),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check ((user_id is null) <> (guest_session_id is null))
);

create unique index consents_user_document_uq
  on consents(user_id, document_type, document_version)
  where user_id is not null;

create unique index consents_guest_document_uq
  on consents(guest_session_id, document_type, document_version)
  where guest_session_id is not null;

create table generation_records (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references readings(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  idempotency_key text not null unique,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  status generation_status not null default 'pending',
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generation_records_reading_created_idx
  on generation_records(reading_id, created_at desc);

create table free_reading_quota_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid,
  ip_hash text not null check (length(ip_hash) > 0),
  reading_id uuid references readings(id) on delete set null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  check ((user_id is null) <> (guest_session_id is null))
);

create unique index quota_user_request_uq
  on free_reading_quota_events(user_id, request_id)
  where user_id is not null;

create unique index quota_guest_request_uq
  on free_reading_quota_events(guest_session_id, request_id)
  where guest_session_id is not null;

create unique index quota_reading_uq
  on free_reading_quota_events(reading_id)
  where reading_id is not null;

create index quota_user_created_idx
  on free_reading_quota_events(user_id, created_at desc)
  where user_id is not null;

create index quota_guest_created_idx
  on free_reading_quota_events(guest_session_id, created_at desc)
  where guest_session_id is not null;

create index quota_ip_created_idx
  on free_reading_quota_events(ip_hash, created_at desc);

create table guest_ownership_transfers (
  guest_session_id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  transferred_reading_count integer not null default 0,
  transferred_consent_count integer not null default 0,
  created_at timestamptz not null default now()
);
```

Spring/JPA에서는 PostgreSQL enum 대신 `varchar + check constraint`를 사용하면
마이그레이션과 테스트 DB 운용이 단순해진다. 기존 DB를 그대로 사용할 때는
`@JdbcTypeCode(SqlTypes.NAMED_ENUM)` 또는 명시적 converter를 사용한다.

## 6. 핵심 트랜잭션

### 무료 생성 예약

한 트랜잭션에서 다음 순서를 지킨다.

1. 사용자 또는 게스트 기준 advisory lock을 획득한다.
2. 같은 `requestId` 리딩을 조회한다.
3. 기존 입력 해시와 비교해 재사용 또는 충돌 처리한다.
4. 현재 동의 버전을 검증한다.
5. 시간·일일 쿼터를 조회한다.
6. `readings(status=generating)`를 생성한다.
7. `free_reading_quota_events`를 생성한다.
8. `generation_records(status=pending)`를 생성하고 커밋한다.
9. 트랜잭션 밖에서 OpenAI를 호출한다.
10. 성공 또는 실패 상태를 짧은 별도 트랜잭션으로 반영한다.

OpenAI 네트워크 호출 중 DB 트랜잭션을 계속 잡고 있으면 안 된다.

### 게스트 귀속

1. 게스트 ID 기준 잠금
2. 기존 `guest_ownership_transfers` 확인
3. 게스트 리딩의 `user_id` 설정 및 `guest_session_id` 제거
4. 동의는 회원에게 merge하고 가장 이른 `accepted_at` 보존
5. 쿼터 이벤트를 회원에게 이전
6. transfer 감사 행 기록
7. 커밋 후 게스트 쿠키 제거

## 7. AI 생성 정책

- 무료 모델 기본값: `gpt-5.4-mini`
- 최대 출력: 1,200 tokens
- 타임아웃: 30초
- 일시적 오류만 최대 2회 재시도
- JSON Schema 기반 구조화 출력
- 모델명과 prompt version을 `generation_records`에 기록
- 고위험 질문은 AI 예언 대신 고정된 안전 응답으로 전환
- 의료, 법률, 투자, 자해, 생사, 임신에 대한 확정적 판단 금지
- 사주 결과에는 `양력 기반 근사 베타` 안내 표시

## 8. Spring 모듈 권장 구조

```text
com.myeongro
├─ auth
├─ consent
├─ guest
├─ reading
│  ├─ tarot
│  ├─ saju
│  └─ generation
├─ quota
├─ safety
└─ common
```

주요 인터페이스:

```java
public interface ReadingGenerator {
    ReadingResult generate(GenerationCommand command);
}
```

OpenAI 의존성은 `OpenAiReadingGenerator` 어댑터에만 둔다. 사주 계산 엔진은
외부 호출 없는 순수 Java 모듈로 분리한다.

## 9. 환경 변수

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
SUPABASE_JWT_ISSUER
SUPABASE_JWT_JWKS_URL
APP_SIGNING_SECRET
OPENAI_API_KEY
OPENAI_FREE_MODEL=gpt-5.4-mini
OPENAI_PROMPT_VERSION
FRONTEND_ORIGIN
```

## 10. 구현 순서

1. Flyway baseline과 현재 Supabase migration 상태 맞추기
2. Spring Security에서 Supabase JWT 검증
3. 게스트 쿠키 발급·검증
4. 동의 API
5. 원자적 쿼터 예약과 idempotency
6. 사주 계산 엔진 및 타로 canonical 검증
7. OpenAI 구조화 출력 어댑터
8. 리딩 목록·상세·soft delete·재시도
9. 게스트 귀속
10. Next.js API를 Spring으로 전환한 뒤 모바일 E2E 검증

결제, 유료 리딩, 후속 질문 테이블과 API는 이번 무료 MVP 범위에서 제외한다.
