# 명로

`명로`는 사주의 **명(命)**과 타로가 비추는 **길(路)**을 결합한 이름입니다.

한국어 사용자를 위한 모바일 우선 AI 타로·사주 MVP입니다. 리딩 생성과 기록 저장은 Spring backend에 로그인한 사용자에게 제공됩니다.

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

공개 콘텐츠·검색 설정의 브라우저 검증은 프로덕션 빌드 후 실행합니다. 설치된 Chrome 대신 현재 Playwright 버전에 맞는 Chromium을 사용합니다.

```powershell
npx playwright install chromium
npm run test:public-content
```

검증은 임의의 로컬 포트에 가짜 인증 Backend와 Next 서버를 띄웁니다. 실제 계정·DB·OpenAI는 사용하지 않습니다. 공개 canonical, robots/sitemap, 로그아웃 시 기록 화면의 로그인 이동과 로그인 후 실제 기록·결과 화면의 noindex, 모바일·데스크톱·JavaScript 비활성 본문을 확인합니다. 이미지 산출물은 `build/public-content-check/`에 남습니다.

`.github/workflows/public-content.yml`에서 `dev`·`main` 대상 PR과 push에 이 검증을 실행합니다. CI는 Chromium과 시스템 의존성을 설치하고 격리된 빌드·검사를 수행합니다. Amplify 배포와는 별도 검사이며, 이 상태 검사를 머지 필수 조건으로 지정하려면 저장소의 branch protection 설정이 필요합니다.

공개 페이지를 추가하면 `src/infrastructure/site-routes.json`의 `publicPages`에 경로를 등록하고 해당 페이지에서 `publicPageMetadata`를 사용하세요. sitemap과 브라우저 검증은 같은 등록부를 읽습니다. 페이지 파일이 등록부나 비공개 경로 범위에 없으면 `search-discovery.test.ts`가 실패합니다. 비공개 페이지는 상위 layout의 검색 제외 설정을 유지해야 합니다.

사주 MVP 계산기는 양력 `1900-2099`만 지원하고 월·년 경계를 절기 대신 그레고리력으로 근사합니다. 검증된 음력·절기 데이터셋을 연결하기 전까지 음력 입력은 명시적으로 거절됩니다.

## 안전

리딩은 오락과 자기 성찰을 위한 콘텐츠입니다. 자해, 의료, 법률, 투자, 생사, 임신, 범죄·강압 관련 질문은 점술 응답을 생성하지 않고 안전 안내로 전환합니다. 분석 이벤트에는 질문 원문과 출생 정보를 포함하지 않습니다.
