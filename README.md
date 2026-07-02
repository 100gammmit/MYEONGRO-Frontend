# 명로

`명로`는 사주의 **명(命)**과 타로가 비추는 **길(路)**을 결합한 이름입니다.

한국어 사용자를 위한 모바일 우선 AI 타로·사주 MVP입니다. 비회원은 동의 후 무료 데모 리딩을 체험하고, Spring backend를 연결하면 로그인, 백엔드 기반 AI 생성과 기록 저장을 사용할 수 있습니다.

## 로컬 실행

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`http://localhost:3000`에서 홈, 타로, 사주, 기록, 로그인 화면을 확인할 수 있습니다. OpenAI API 호출과 실제 생성 제어는 Spring backend가 담당합니다.

## 환경 변수

- `NEXT_PUBLIC_APP_URL`: 로컬에서는 `http://localhost:3000`
- `BACKEND_API_URL`: 로컬 Spring backend 주소. 기본값 `http://localhost:8080`

키 발급 위치, OAuth 리디렉션과 로컬 테스트 가능 범위는
[`docs/local-integrations.md`](docs/local-integrations.md)를 참고하세요.

## 데이터베이스

프론트 저장소는 데이터베이스 migration history를 더 이상 관리하지 않습니다. DB 재현성과 신규 데이터베이스 변경은 Spring backend의 Flyway migration에서 관리합니다.

## 검증

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

사주 MVP 계산기는 양력 `1900-2099`만 지원하고 월·년 경계를 절기 대신 그레고리력으로 근사합니다. 검증된 음력·절기 데이터셋을 연결하기 전까지 음력 입력은 명시적으로 거절됩니다.

## 안전

리딩은 오락과 자기 성찰을 위한 콘텐츠입니다. 자해, 의료, 법률, 투자, 생사, 임신, 범죄·강압 관련 질문은 점술 응답을 생성하지 않고 안전 안내로 전환합니다. 분석 이벤트에는 질문 원문과 출생 정보를 포함하지 않습니다.
