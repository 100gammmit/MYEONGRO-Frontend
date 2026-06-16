# 로컬 외부 서비스 연결

## 먼저 알아둘 점

`.env.local`에 시크릿 키만 입력한다고 모든 기능이 바로 동작하지는 않습니다.

| 기능 | 키 입력만으로 가능 | 추가로 필요한 설정 |
| --- | --- | --- |
| 무료 데모 리딩 | 가능 | 외부 키 불필요 |
| OpenAI 실제 리딩 | 거의 가능 | API 결제 수단 또는 크레딧, 사용 가능한 모델 권한 |
| Supabase 데이터 접근 | 불가능 | SQL 마이그레이션과 RLS 정책 적용 |
| Google/Kakao 로그인 | 불가능 | 각 공급자 앱 생성, Supabase 공급자 설정, 리디렉션 URL 등록 |

## `.env.local`

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

OPENAI_API_KEY=sk-...
OPENAI_FREE_MODEL=gpt-5.4-mini
```

`NEXT_PUBLIC_`이 붙은 값은 브라우저 번들에서 볼 수 있습니다. 여기에 OpenAI,
Supabase secret key를 넣으면 안 됩니다. 환경변수를 변경한
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

이 앱은 Responses API의 Structured Outputs를 사용합니다. 기본 모델은
`gpt-5.4-mini`입니다. 키가 비어 있으면 앱은 오류 대신
결정적 데모 리딩을 반환합니다.

## 현재 상태 확인

키를 입력하고 개발 서버를 다시 시작합니다.

```powershell
npm run dev
```

다음 순서로 확인합니다.

1. 타로 무료 리딩 API 응답의 `meta.provider`가 `openai`인지 확인합니다.
2. `/login`에서 Google/Kakao OAuth 화면으로 이동하고 앱으로 돌아오는지 확인합니다.
3. 로그인 후 Supabase 기록 조회가 RLS 오류 없이 동작하는지 확인합니다.

키 값을 채팅, Git, 브라우저 콘솔 또는 스크린샷에 노출하지 마세요.
