# 사주 콘텐츠 확장 M1: 결과 탐색 검증

## 범위와 데이터 경계

- 기존 결과와 기록 상세에서 저장된 snapshot만 탐색한다. API, DB, 생성 프롬프트, 크레딧과 개인정보 정책은 변경하지 않는다.
- 일간·오행·명식 관계 설명은 정적 용어 안내다. 개인 성격, 용신, 강약이나 사건을 추가로 판정하지 않는다.
- 오행 대응 사전은 Backend `LunarJavaFourPillarsAdapter.ELEMENTS` 및 `SajuKoreanTerms`의 천간·지지 표기와 대조했다. 천간 10자·지지 12자를 한글·한자로 검증한다.
- 관계 snapshot에는 기둥 위치가 없다. 같은 lane(천간/지지)에서 모든 관계 구성원의 출현 횟수가 요구 개수와 정확히 같을 때만 강조한다. 중복 위치가 모호하거나 누락·미지원 코드가 있으면 설명만 제공한다. 자형도 같은 원칙을 적용한다.
- 오행 개수는 저장값을 그대로 표시하고 해당 글자 강조는 명식 문자열의 검증 가능한 사전 대응만 사용한다. 과거 기록의 수치를 재계산·수정하지 않는다.
- 일간 미확정, 기둥 누락, 알 수 없는 글자는 추정하지 않는다. 결과 근거 키가 일치하는 본문만 연결한다.
- 선택은 컴포넌트 메모리에만 있으며 다른 기록 ID나 새로고침에서 초기화된다. URL/브라우저 저장소/로그/추적 이벤트에 계산이나 출생정보를 추가하지 않는다.

## 실행 결과

- 관련 검증: `npm test -- --run src/domain/saju/exploration.test.ts src/components/saju-calculation-explorer.test.tsx src/components/saju-reading-result.test.tsx src/app/saju/results src/app/records` — 6 files / 42 tests 통과.
- 서비스 업데이트 model 관련 테스트도 통과했다.
- 마일스톤 전체 테스트 `npm test` 1회: 76 files / 483 tests 중 482 통과, 1 실패. 변경하지 않은 `daily-card-experience.test.tsx`의 결과 heading 포커스 즉시 assertion이 실패했다. 해당 파일만 독립 재실행한 결과 9/9 통과했다. 전체 suite 성공으로 보고하지 않는다. 무료 카드 코드는 수정하지 않았다.
- `npm run typecheck`, `npm run lint`, 최초 `npm run build` 통과.
- 브라우저 최초 실행은 sandbox localhost fetch EACCES로 실패했다. 허용된 실행 환경에서 동일 스크립트로 재검증했다.
- 첫 브라우저 화면 검사 후 위/아래 글자 안내와 맞도록 명식을 세로 배치했다. 이 CSS 수정에 대해 build/browser 단계만 재실행했다. 빌드는 기존 `.next` 산출물 접근 EPERM 때문에 허용된 환경에서 동일 명령을 재실행했다.
- 최종 세로 배치 반영 production build와 Chrome 브라우저 스크립트 모두 통과했다. 모바일·데스크톱 스크린샷을 직접 열어 확인했다.

## 브라우저 재현

`npm run build` 후 `node scripts/check-saju-explorer.mjs`를 실행한다. Chrome이 설치되어 있어야 하며 localhost 서버·브라우저 실행 권한이 필요하다. 스크립트는 127.0.0.1:3118의 합성 Backend와 3119의 production Next 서버를 띄우고 종료 시 닫는다. 포트가 사용 중이면 먼저 해당 작업의 서버를 종료한다.

- 375px / 1280px 실제 Chrome에서 결과 렌더·가로 넘침 없음, Enter/Space 선택, 색상 외 선택 표식, 근거 본문으로 focus 이동을 검사한다.
- 새로고침 시 기본 선택 복원과 `/records/synthetic-saju`에서 같은 탐색 제공을 검사한다.
- 합성 snapshot만 사용하며 실제 OAuth 세션·Backend 계산·OpenAI·실제 사용자 데이터는 사용하지 않는다. 요청이 GET만인지 검사한다.
- 스크린샷은 gitignored `build/saju-explorer-check`에 생성한다. 수동 화면 검사로 모바일·데스크톱 가독성과 명식 배치를 확인한다.
- 실제 스크린리더 음성 출력은 검사하지 않았다. 네이티브 button, aria-pressed, aria-controls, live 설명, focus 가능한 본문과 키보드 동작을 테스트했다.

## 후속 범위

M2 심화 리딩부터는 별도 기획과 AI-preview 비교, 출력 계약 검증이 필요하다. 이 변경은 M2 이후 기능을 포함하지 않는다. Backend·공통 Docs 정책 변경도 없다.
