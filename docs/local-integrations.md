# 로컬 외부 서비스 연결

## 먼저 알아둘 점

`.env.local`에 시크릿 키만 입력한다고 모든 기능이 바로 동작하지는 않습니다.

| 기능 | 키 입력만으로 가능 | 추가로 필요한 설정 |
| --- | --- | --- |
| 무료 데모 리딩 | 가능 | 외부 키 불필요 |
| OpenAI 실제 리딩 | 거의 가능 | API 결제 수단 또는 크레딧, 사용 가능한 모델 권한 |
| Supabase 데이터 접근 | 불가능 | SQL 마이그레이션과 RLS 정책 적용 |
| Google/Kakao 로그인 | 불가능 | 각 공급자 앱 생성, Supabase 공급자 설정, 리디렉션 URL 등록 |
| 토스 결제 승인 API | 부분 가능 | 테스트 주문과 결제 인증 결과 필요 |
| 토스 결제위젯 전체 흐름 | 현재 불가능 | 주문 생성·위젯 호출·성공/실패 화면 구현 필요 |
| 토스 웹훅 로컬 수신 | localhost로 불가능 | Vercel 배포 주소 또는 ngrok 같은 공개 HTTPS 터널 |

현재 체크아웃 화면은 안내 화면이며 토스 결제위젯을 아직 호출하지 않습니다. 따라서
토스 키가 올바르더라도 브라우저에서 실제 테스트 결제를 시작할 수는 없습니다.

## `.env.local`

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

OPENAI_API_KEY=sk-...
OPENAI_FREE_MODEL=gpt-5.4-mini
OPENAI_PAID_MODEL=gpt-5.4

NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

`NEXT_PUBLIC_`이 붙은 값은 브라우저 번들에서 볼 수 있습니다. 여기에 OpenAI,
Supabase secret key 또는 토스 secret key를 넣으면 안 됩니다. 환경변수를 변경한
뒤에는 `npm run dev`를 다시 시작해야 합니다.

## Supabase

1. Supabase Dashboard에서 프로젝트를 엽니다.
2. `Connect` 또는 `Project Settings > API Keys`로 이동합니다.
3. Project URL을 `NEXT_PUBLIC_SUPABASE_URL`에 넣습니다.
4. `Publishable key`의 `sb_publishable_...` 값을
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 넣습니다.
5. `Secret keys`의 `sb_secret_...` 값을 `SUPABASE_SERVICE_ROLE_KEY`에 넣습니다.
6. SQL Editor에서
   `supabase/migrations/20260610120000_initial_persistence.sql`을 실행합니다.

기존 프로젝트라면 legacy `anon`과 `service_role` JWT도 동작하지만, 새 프로젝트는
publishable/secret key 사용을 권장합니다. secret key는 RLS를 우회하므로 서버
환경변수로만 사용합니다.

### 앱 리디렉션

Supabase Dashboard의 `Authentication > URL Configuration`에서 다음을 등록합니다.

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

로컬에서 여러 경로가 필요하면 `http://localhost:3000/**`를 추가할 수 있습니다.

### Google 로그인

1. Google Cloud Console에서 OAuth Web Client를 만듭니다.
2. Authorized redirect URI에는 Supabase의 Google Provider 화면에 표시되는
   `https://PROJECT_REF.supabase.co/auth/v1/callback`을 등록합니다.
3. 발급된 Google Client ID와 Client Secret을 Supabase Dashboard의
   `Authentication > Sign In / Providers > Google`에 입력하고 활성화합니다.

Google Client Secret은 이 앱의 `.env.local`에 직접 넣지 않습니다.

### Kakao 로그인

1. Kakao Developers에서 앱을 만들고 Kakao Login을 활성화합니다.
2. Redirect URI에는 Supabase의 Kakao Provider 화면에 표시되는
   `https://PROJECT_REF.supabase.co/auth/v1/callback`을 등록합니다.
3. Kakao REST API key와 활성화한 Client Secret을 Supabase Dashboard의
   `Authentication > Sign In / Providers > Kakao`에 입력합니다.

Kakao Client Secret도 이 앱의 `.env.local`에 직접 넣지 않습니다.

## OpenAI

1. [OpenAI API Keys](https://platform.openai.com/api-keys)에서 프로젝트 API key를
   생성합니다.
2. 생성 직후 한 번만 표시되는 `sk-...` 값을 `OPENAI_API_KEY`에 넣습니다.
3. API 프로젝트에 결제 수단 또는 크레딧과 모델 사용 권한이 있는지 확인합니다.

이 앱은 Responses API의 Structured Outputs를 사용합니다. `gpt-5.4-mini`와
`gpt-5.4`는 이 API와 구조화 출력을 지원합니다. 키가 비어 있으면 앱은 오류 대신
결정적 데모 리딩을 반환합니다.

## 토스페이먼츠

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)에 로그인합니다.
2. 테스트 상점의 API 키 화면에서 `test_ck_...` 클라이언트 키를
   `NEXT_PUBLIC_TOSS_CLIENT_KEY`에 넣습니다.
3. 같은 테스트 상점의 `test_sk_...` 시크릿 키를 `TOSS_SECRET_KEY`에 넣습니다.
4. 클라이언트 키와 시크릿 키는 반드시 같은 MID의 한 쌍을 사용합니다.

라이브 키인 `live_ck_...`, `live_sk_...`는 로컬 개발에 사용하지 않습니다.
`PAYMENT_STATUS_CHANGED` 웹훅에는 별도의 웹훅 시크릿이 없으므로
`TOSS_WEBHOOK_SECRET`도 필요하지 않습니다.

### 웹훅

개발자센터의 테스트 MID 웹훅 메뉴에서 다음과 같이 등록합니다.

- 이벤트: `PAYMENT_STATUS_CHANGED`
- URL: `https://PUBLIC_HOST/api/webhooks/toss`

가상계좌 입금만 별도로 처리해야 할 때 `DEPOSIT_CALLBACK`을 추가합니다.
`PAYMENT_STATUS_CHANGED`와 함께 등록하면 가상계좌 관련 이벤트가 중복될 수 있습니다.

`http://localhost:3000/api/webhooks/toss`는 토스 서버가 접근할 수 없어서 등록할 수
없습니다. 로컬 테스트에서는 다음처럼 공개 주소를 만든 뒤 등록합니다.

```powershell
ngrok http 3000
```

예를 들어 ngrok 주소가 `https://example.ngrok.app`이면 웹훅 URL은
`https://example.ngrok.app/api/webhooks/toss`입니다.

## 현재 상태 확인

키를 입력하고 개발 서버를 다시 시작합니다.

```powershell
npm run dev
```

다음 순서로 확인합니다.

1. 타로 무료 리딩 API 응답의 `meta.provider`가 `openai`인지 확인합니다.
2. `/login`에서 Google/Kakao OAuth 화면으로 이동하고 앱으로 돌아오는지 확인합니다.
3. 로그인 후 Supabase 기록 조회가 RLS 오류 없이 동작하는지 확인합니다.
4. 토스 전체 결제 흐름은 결제위젯 구현이 끝난 뒤 테스트합니다.
5. 웹훅은 개발자센터의 전송 기록과 서버의 HTTP 200 응답을 함께 확인합니다.

키 값을 채팅, Git, 브라우저 콘솔 또는 스크린샷에 노출하지 마세요.
