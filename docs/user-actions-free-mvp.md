# 무료 MVP 사용자 작업

코드로 대신할 수 없는 대시보드 및 운영 설정입니다.

## 지금 필요한 작업

- `.env.local`과 Vercel 환경변수에 32바이트 이상의 `APP_SIGNING_SECRET`을 등록합니다.
- Supabase Kakao Provider를 활성 상태로 유지합니다.
- Kakao Developers Redirect URI를 확인합니다.
  - `https://nwrrncuhbtbbzzepuizy.supabase.co/auth/v1/callback`
- Supabase Auth Redirect URL을 등록합니다.
  - `http://localhost:3000/auth/callback`
  - `https://실제-배포-도메인/auth/callback`
- OpenAI 프로젝트에 월간 예산과 사용량 알림을 설정합니다.

## 구현 완료 후 확인

- 실제 Kakao 계정으로 로그인, 로그아웃, 재로그인을 확인합니다.
- 게스트 리딩이 로그인 후 기록으로 이전되는지 확인합니다.
- 회원 탈퇴 후 같은 계정으로 재가입할 때 기대 동작을 확인합니다.
- 개인정보 처리방침에 질문과 출생 정보의 저장 목적 및 보관 기간을 확정합니다.

## 이번 범위에서 불필요한 작업

- 토스 결제위젯, 웹훅, 라이브 키 설정
- Google OAuth 설정
- 유료 리딩 및 후속 질문 운영 설정
