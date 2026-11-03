# 사주 콘텐츠 확장 M3 — 연도 선택·월운 계산 기반

## 계약과 범위

- 사용자 요청에 따라 M2보다 M3를 먼저 진행하고 Front는 기존 feature/saju-result-explorer 브랜치를 이어 사용한다. Backend와 공통 Docs에도 대응 브랜치를 사용한다. M1 탐색은 그대로 유지한다.
- Front는 한국 날짜 기준 올해·내년을 선택해 targetYear를 명시적으로 전송하고 확인 화면에 표시한다. API 생략 입력은 올해로 정규화한다. 연도는 HMAC 요청 지문에 포함된다. 입력 연도 변경은 새 requestId를 발급한다.
- 새 생성은 올해·내년만 허용한다. 기존 완료 요청의 멱등 조회가 이 생성 범위 검사보다 앞서므로 명시 연도 요청은 연말을 넘어도 기존 결과로 수렴한다. 타입은 정수만 받으며 비정수 JSON·과거/먼 미래 신규 요청은 400이다.
- 새 schema v6은 기존 최소 snapshot에 monthlyCalendar를 추가한다. 원국 계산은 saju-ko-v4, 월운은 saju-monthly-ko-v1이다. 기존 Front v2~v5 표시 및 DB v5는 재계산하지 않는다.
- 사용자가 선택한 달력 1~12월 안에서 절입 전/후 두 구간을 제공한다. timestamp는 한국 시각, 시작 포함/끝 미포함이다. 기간별 연·월 간지와 확정된 일간에 대한 월간 십성만 저장한다. 입춘 전 연간지는 달력 연도와 다를 수 있다.
- 엔진 UTC+8 절입을 instant로 바꿔 Asia/Seoul에 적용한다. 달력 시각에 진태양시 보정을 적용하지 않는다. 월운은 출생 후보 병합 후 한 번 계산한다. 월운 오류는 기존 SAJU_CALCULATION_FAILED 경계를 사용한다.
- M3 월운은 OpenAI에 전달하지 않고, 월별 풀이를 생성하거나 표시하지 않는다. 원본 출생정보/후보 시각/좌표는 기존대로 저장·AI 전송에서 제외한다. 크레딧·생성 프롬프트·제공자 설정은 바꾸지 않았다.
- Backend V3 migration은 v5 검증을 그대로 보존하고 v6 월별 필드의 whitelist·12개월·월 순서·구간 연속성·일간 근거를 검사한다. 기존 제약을 완화해 원문 출생정보를 허용하지 않는다. Front strict parser도 같은 기본 구조와 연도·구간·일간 조건을 검사한다.

## 검증

- Backend 관련 실행: SajuMonthlyCalendarTests, SajuCalculationGoldenTests, SajuTargetYearTests, SajuReadingInputAssemblerTests, ReadingInputNormalizationContractTests, ReadingInputFingerprinterTests, ReadingCreationWorkflowTests, ReadingEndpointContractTests, SajuMonthlyCalendarPostgresTests, FlywayFreshPostgresReplayTests, SajuM3VerificationTests 통과.
- 2020년 입춘 KST 18:03:19 경계와 2027년 전체 절입을 새 골든 fixture에 고정했다. 절입 직전 1초/경계 시각, 윤년, 연말연시, 월별 공백·중첩 없음과 기존 원국 회귀를 검사한다. 골든은 지정 엔진 버전의 재현성을 검증하며 천문 오차나 미래 예측을 입증하지 않는다.
- 기존 DB와 분리한 임시 PostgreSQL 16에서 V1/V2 적용→v5 기록 삽입→V3 적용 시 기존 기록 불변을 확인했다. v5/v6 정상 저장과 월운 안 원문/미지원 필드·구간 공백 거부를 실제 DB에서 확인했다.
- Backend 최종 전체 check/bootJar 1회는 373 tests 중 372 통과, 기본 contextLoads 1건이 Redis 부재로 실패했다. 테스트 전용 비영속 Redis 준비 후 실패한 context 클래스만 재실행해 통과했다. 전체 green인 단일 실행으로 보고하지 않는다. bootJar는 성공했다.
- 전체 검증 후 새 월운 오류를 기존 계산 오류로 감싸는 안전 보정을 추가하고, 관련 계산·생성·assembler 테스트와 bootJar만 다시 검증했다. 전체 suite는 반복하지 않았다.
- Front 최종 전체 77 files / 504 tests 통과, typecheck/lint/production build 통과. 관련 테스트는 선택 연도 전송/확인, 연도 수정 시 requestId 교체, 한국 연말 경계, v6 저장 형식 복원/불완전 구간·다른 연도·미지원 필드 거부, 기존 v5 불변을 포함한다.
- Chrome 375/1280px에서 기존 탐색 전체 회귀와 내년 선택→입력 확인→합성 제출→v6 결과→새로고침/기록 복원이 통과했다. Backend 합성 검증이 내보낸 calendar-next-year.json으로 Front 실제 strict parser를 통과시켰다. 화면 스크린샷을 직접 열어 연도와 배치를 확인했다.
- 브라우저 검증은 실제 OAuth·Backend HTTP 계산·OpenAI를 호출하지 않는다. GET 및 로컬 합성 읽기 생성 endpoint에만 POST한다. 실제 스크린리더 음성 E2E도 미실행이다.
- 초기 브라우저 동의 조회는 production build에 구워진 localhost:8080 rewrite가 3118의 runtime 합성 서버와 달라 500이었다. 제품 코드는 바꾸지 않고 스크립트가 build manifest의 local rewrite 주소를 확인해 같은 합성 응답을 제공하도록 수정한 뒤 통과했다. 외부 주소·사용 중 포트는 거부한다.

## 성능 측정과 한계

합성 입력으로 각 정확도별 워밍업 1회 후 단일 6개, 4-worker 동시 작업 8개를 측정했다. 후보 계산+월운 달력을 포함하며 HTTP·DB·AI 지연은 포함하지 않는다. 별도 SLA나 운영 동시 부하 검증으로 해석하지 않는다. 전체 검증 중 Front 빌드/테스트가 함께 실행돼 앞선 focused 측정보다 느렸다.

| 정확도 | 최종 단일 표본 범위 | 최종 4-worker 표본 범위 |
| --- | --- | --- |
| 정확 | 9~22ms | 6~20ms |
| 근사 | 172~275ms | 297~448ms |
| 미상 | 1,225~1,901ms | 2,092~2,316ms |

ignored Backend build/saju-m3/performance.json에 표본 배열이 생성된다. 재실행 때 숫자는 달라진다. 운영 하드웨어와 실제 동시 요청 분포에서는 별도 측정이 필요하다.

## 재현과 배포 경계

- Backend의 SajuM3VerificationTests를 실행하면 공개 대상 연도 artifact인 build/saju-m3/calendar-next-year.json이 생성된다.
- Front production build 후 node scripts/check-saju-explorer.mjs --m3로 브라우저 회귀를 실행한다. Chrome과 로컬 테스트 포트가 필요하다. --m3 없이 기존 탐색-only 검증도 유지된다.
- Backend 전체 검증은 일회용 PostgreSQL의 freshPostgres* 시스템 속성을 전달해 실행했다. 실제 개발 DB에 Flyway clean을 실행하지 않는다. Spring context 검증에는 테스트용 Redis가 필요하다.
- V3 migration·Backend v6·Front v6 parser는 함께 반영해야 한다. M1 위에 이어진 Front 부모 커밋도 보존한다. push/PR/merge는 사용자 담당이다.
- M4는 승인된 계산 계약을 사용해 월별 리포트 출력 구조·AI-preview·비용·지연을 별도로 검증한 뒤 진행한다. 이 변경은 월별 AI 해석의 품질이나 공개 승인이 아니다.
