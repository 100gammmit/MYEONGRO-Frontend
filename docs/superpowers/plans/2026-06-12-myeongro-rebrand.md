# 명로 서비스 리브랜딩 Implementation Plan

> **Current execution policy:** Follow repository `AGENTS.md`. This historical
> plan does not require task-by-task subagent execution. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** 임시 브랜드 `운담`을 공식 브랜드 `명로`로 교체하고 기존 게스트 세션을 유지한다.

**Architecture:** 브랜드 표시 문자열과 런타임 식별자를 분리한다. 게스트 인증 계층이 신규 쿠키를 우선 읽고 유효한 구 쿠키를 신규 쿠키로 승격하며, API 응답은 신규 발급과 구 쿠키 만료를 함께 전달한다.

**Tech Stack:** Next.js 15, TypeScript, Vitest, signed HttpOnly cookies

---

### Task 1: 게스트 쿠키 호환 마이그레이션

**Files:**
- Modify: `src/infrastructure/auth/guest-identity.ts`
- Modify: `src/infrastructure/auth/guest-identity.test.ts`
- Modify: consent, reading, OAuth callback handlers and tests

- [x] 구 쿠키를 읽어 신규 쿠키로 승격하는 실패 테스트를 추가한다.
- [x] 테스트가 `woondam_guest` 미지원으로 실패하는지 확인한다.
- [x] 신규 쿠키 우선, 구 쿠키 fallback, 신규 발급과 구 쿠키 만료를 구현한다.
- [x] 집중 테스트를 실행한다.

### Task 2: 사용자 표시와 프로젝트 식별자 변경

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `README.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] 화면 테스트에 `명로` 브랜드 기대값을 추가한다.
- [x] 테스트 실패를 확인한다.
- [x] 사용자 표시를 `명로`, 영문 표기를 `MYEONGRO`로 교체한다.
- [x] 패키지 이름을 `myeongro`로 교체한다.

### Task 3: 잔여 표기와 전체 검증

**Files:**
- Modify: 관련 테스트와 문서

- [x] `운담`, `WOONDAM`, `woondam` 잔여 표기를 검색한다.
- [x] 구형 localStorage 정리와 쿠키 호환 코드만 예외로 남긴다.
- [x] 전체 테스트, 타입 검사, 린트, 프로덕션 빌드를 실행한다.
