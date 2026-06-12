# 명로

`명로`는 사주의 **명(命)**과 타로가 비추는 **길(路)**을 결합한 이름입니다.

한국어 사용자를 위한 모바일 우선 AI 타로·사주 MVP입니다. 비회원은 동의 후 무료 데모 리딩을 체험하고, Supabase·OpenAI·토스페이먼츠 환경을 연결하면 로그인, 구조화 AI 생성, 저장, 3,900원 심층 리딩 결제를 사용할 수 있습니다.

## 로컬 실행

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`http://localhost:3000`에서 홈, 타로, 사주, 기록, 로그인 화면을 확인할 수 있습니다. 외부 서비스 키가 없으면 AI 생성 API는 결정적인 데모 생성기를 사용하며 OAuth·결제는 설정 안내를 반환합니다.

## 환경 변수

- `NEXT_PUBLIC_APP_URL`: 로컬에서는 `http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 브라우저용 publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 secret key
- `OPENAI_API_KEY`: 서버 전용 OpenAI 프로젝트 API key
- `OPENAI_FREE_MODEL`: 기본값 `gpt-5.4-mini`
- `OPENAI_PAID_MODEL`: 기본값 `gpt-5.4`
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`: 브라우저용 토스 테스트 클라이언트 키
- `TOSS_SECRET_KEY`: 서버 전용 토스 테스트 시크릿 키

키 발급 위치, OAuth 리디렉션, 토스 웹훅과 로컬 테스트 가능 범위는
[`docs/local-integrations.md`](docs/local-integrations.md)를 참고하세요.

## 데이터베이스

`supabase/migrations/20260610120000_initial_persistence.sql`을 Supabase 프로젝트에 적용합니다. 마이그레이션은 리딩, 동의, 구매, 후속 질문, 생성 기록과 RLS 정책을 생성합니다.

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
