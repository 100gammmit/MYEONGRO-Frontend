# 보호 페이지 공통 인증 경계 설계

## 목표

Spring session 인증이 필요한 페이지는 `/api/me` 응답이 확정되기 전까지 페이지 본문을 렌더링하지 않는다. 인증 확인 전용 화면이나 문구는 표시하지 않으며, 공통 헤더와 푸터는 기존대로 유지한다.

## 적용 범위

다음 페이지 본문을 하나의 공통 인증 경계로 보호한다.

- `/tarot`
- `/records`
- `/records/[readingId]`
- `/account`

`/saju`는 MVP에서 로그인 전 서비스 탐색과 입력이 허용되므로 페이지 전체 보호 대상에서 제외한다. 실제 동의 및 리딩 생성 시점의 기존 인증 경계는 유지한다.

## 구조

URL을 바꾸지 않는 Next.js Route Group에 보호 페이지를 배치하고, 해당 그룹의 공통 layout이 client 인증 경계를 적용한다. 인증 경계는 `/api/me`를 same-origin credentials로 한 번 호출하며 결과에 따라 자식 본문 렌더링 여부를 결정한다.

공통 root layout의 헤더, 배경과 푸터는 이 경계 밖에 둔다. 따라서 인증 확인 중에는 보호 페이지의 `<main>` 본문만 비어 있고 사이트 공통 chrome은 유지된다.

## 상태 전이

### 확인 중

- 초기 상태에서는 자식 본문을 `null`로 렌더링한다.
- loading shell, spinner, skeleton 또는 “로그인 확인 중” 문구를 표시하지 않는다.
- 인증 결과가 오기 전에는 보호 페이지의 버튼, 입력, 기록이나 계정 정보가 DOM에 나타나지 않는다.

### 인증됨

- `200` 응답이며 `authenticated === true`일 때만 자식 본문을 렌더링한다.
- 보호 페이지가 렌더링된 뒤에는 기존 페이지별 데이터 및 상태 복구 흐름을 실행한다.

### 비로그인

- 명시적 `401` 또는 `200` 응답의 `authenticated === false`만 비로그인으로 처리한다.
- 현재 pathname과 query를 `next`에 보존해 `/login`으로 이동한다.
- redirect가 결정된 동안에도 보호 페이지 본문은 렌더링하지 않는다.

### 인증 확인 실패

- `5xx`, 기타 비정상 status, malformed payload 또는 network exception을 비로그인으로 오인하지 않는다.
- 응답 실패가 확인된 뒤에만 공통 재시도 오류 화면을 렌더링한다.
- 재시도는 `/api/me`만 다시 호출하며 보호 페이지 본문은 계속 숨긴다.

## 타로 상태 복구 조정

`TarotExperience`는 공통 경계 뒤에서만 마운트되므로 자체 `/api/me` 호출과 “로그인 상태를 확인하고 있어요” phase를 제거한다. 마운트 후에는 바로 active draw session 복구를 시작한다.

active draw session 조회 중에도 로그인 확인 문구는 표시하지 않는다. 조회 결과가 없으면 spread 선택으로, 진행 중이면 draw 또는 입력 복구로, 완료 상태면 confirm으로 이동한다. active 조회의 `401`과 서버 오류에 대한 기존 draft 보존 및 오류 정책은 유지한다.

## 기존 서버 경계와의 관계

- records 및 account Server Component의 Spring session 기반 데이터 접근은 방어적 서버 권한 경계로 유지한다.
- middleware의 records redirect는 기존 동작을 유지하되, 공통 client 경계는 페이지 본문 노출 시점을 일관되게 담당한다.
- Backend 장애를 비로그인으로 오인하는 정책을 새 공통 경계에 복제하지 않는다.
- API proxy와 Backend DTO 계약은 변경하지 않는다.

## 테스트 기준

공통 인증 경계 테스트는 다음을 검증한다.

- pending `/api/me` 동안 자식 본문이 DOM에 없음
- `authenticated: true` 응답 후에만 자식 본문 노출
- `authenticated: false`와 명시적 `401`에서 현재 경로를 보존한 로그인 이동
- `502` 및 network exception에서 로그인 이동 없이 재시도 오류 노출
- 재시도 중 자식 본문 비노출, 성공 응답 뒤 노출

페이지 통합 테스트는 다음을 검증한다.

- tarot가 내부 `/api/me`를 중복 호출하지 않고 active session 조회부터 시작
- tarot의 기존 active in-progress/complete 복원과 draft 복구 유지
- records 목록·상세와 account 본문이 공통 경계 아래 배치됨
- saju는 공통 보호 그룹에 포함되지 않음

## 비범위

- 공통 헤더와 푸터의 인증 로딩 정책 변경
- 인증 결과 캐시 또는 전역 client session store 도입
- 새로운 loading animation, skeleton 또는 microcopy 추가
- Backend 인증 DTO, Spring Security 또는 session 정책 변경
- saju 전체 페이지의 로그인 필수화
