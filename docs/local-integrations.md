# 로컬 외부 서비스 연결

## 먼저 알아둘 점

프론트 `.env.local`에 키를 넣는 것만으로 전체 기능이 켜지지는 않습니다. 현재 인증과 데이터 쓰기는 Spring backend가 담당하고, 프론트는 Spring session 쿠키를 전달하는 경계만 가집니다.

| 기능 | 프론트 키만으로 가능 | 추가로 필요한 설정 |
| --- | --- | --- |
| 무료 데모 리딩 | 가능 | 외부 키 불필요 |
| OpenAI 실제 리딩 | 불가능 | backend OpenAI key와 사용 가능한 모델 권한 |
| 로그인/기록 관리 | 불가능 | Spring backend 실행, PostgreSQL/Flyway migration, OAuth provider redirect 등록 |

## 프론트 `.env.local`

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8080
```

`NEXT_PUBLIC_`이 붙은 값은 브라우저 번들에서 볼 수 있습니다. OpenAI key, OAuth client secret, DB password 같은 secret은 프론트 환경변수에 넣지 않습니다. 환경변수를 변경한 뒤에는 `npm run dev`를 다시 시작해야 합니다.

## Spring Backend

로컬 로그인과 기록 API를 확인하려면 backend를 함께 실행해야 합니다.

1. PostgreSQL을 준비합니다.
2. backend `application-secret.yaml`에 DB 접속 정보, guest signing secret, OAuth provider client id/secret/redirect URI를 넣습니다.
3. backend를 실행하면 Flyway가 `MYEONGRO-Backend/src/main/resources/db/migration`의 migration을 적용합니다.
4. 프론트의 `BACKEND_BASE_URL`이 backend 주소와 일치하는지 확인합니다.

기존 프론트 `supabase/migrations` 폴더는 더 이상 기준이 아닙니다. DB 재현성 기준은 Spring backend의 Flyway migration입니다.

## OAuth Redirect URI

Kakao Developers, Google Cloud Console 등 OAuth provider 콘솔에는 Spring backend redirect URI를 등록합니다.

```text
http://localhost:8080/login/oauth2/code/kakao
http://localhost:8080/login/oauth2/code/google
```

프론트 로그인 화면은 Kakao와 Google 버튼을 노출하고, 사용자를 Spring OAuth 시작 경로로 보냅니다. 프론트 route는 `/auth/login/{provider}` 형태로 Kakao와 Google redirect를 모두 처리합니다. 로그인 성공 후에는 Spring success handler가 프론트 기본 주소와 return URL 정책에 따라 사용자를 돌려보냅니다.

Google 로그인을 실제로 테스트하려면 백엔드 `application-secret.yaml`에 Spring Security Google registration 값을 추가해야 합니다. Google scope에는 `openid`를 포함해 OIDC login 경로를 사용합니다.

## OpenAI

OpenAI 실제 생성은 backend 설정으로 관리합니다.

1. [OpenAI API Keys](https://platform.openai.com/api-keys)에서 프로젝트 API key를 생성합니다.
2. backend secret 설정에 `OPENAI_API_KEY` 또는 대응되는 설정 값을 넣습니다.
3. API 프로젝트에 결제 수단 또는 크레딧과 모델 사용 권한이 있는지 확인합니다.

키가 비어 있으면 앱은 오류 대신 결정적 데모 리딩을 반환해야 합니다.

## 현재 상태 확인

backend와 frontend 개발 서버를 모두 실행합니다.

```powershell
# MYEONGRO-Backend
.\gradlew.bat bootRun

# MYEONGRO-Front
npm run dev
```

다음 순서로 확인합니다.

1. `/login`에서 Kakao OAuth 화면으로 이동하고 앱으로 돌아오는지 확인합니다.
2. `/login`에서 Google OAuth 화면으로 이동하고 앱으로 돌아오는지 확인합니다.
3. 로그인 후 `/api/me`가 인증된 사용자 응답을 반환하는지 확인합니다.
4. 무료 리딩 생성 후 `/records`에서 Spring backend 기록 조회가 동작하는지 확인합니다.
5. 기록 삭제가 `204 No Content`로 처리되고 화면에서 실패로 표시되지 않는지 확인합니다.

키 값을 채팅, Git, 브라우저 콘솔 또는 스크린샷에 노출하지 마세요.
