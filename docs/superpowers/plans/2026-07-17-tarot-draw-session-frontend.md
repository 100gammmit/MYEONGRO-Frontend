# Server-Owned Tarot Draw Session Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-owned tarot draws with authenticated Spring draw sessions whose in-progress browser state contains only opaque candidate tokens, then submit `drawSessionId` for reading generation.

**Architecture:** Next route handlers proxy the four frozen draw-session endpoints with Spring session cookies. A strict frontend contract module parses the `in_progress` and `complete` response union, while `TarotExperience` owns only auth gating, input draft data, opaque-token focus/activation, recovery, and final-card rendering after completion. Browser-side deck sampling and pre-completion card ID state are removed.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.8, Zod 3, Vitest, Testing Library.

## Global Constraints

- `D:/GitHub/MYEONGRO/docs/tarot-draw-session-contract.md` is the highest-priority contract for this milestone.
- Front repository only; Backend responses are exact mocked fixtures.
- No browser fallback candidate generation and no client-generated candidate token.
- An `in_progress` response, React state, props, `sessionStorage`, and `localStorage` must not contain actual card IDs.
- Candidate tokens are opaque identifiers and must not be rendered as text or DOM attributes.
- Focus and hover never submit; only click, Enter, or Space submit once.
- A confirmed position cannot be changed.
- `POST /api/readings` submits `drawSessionId`, never `cardIds`.
- Do not change saju or records contracts unnecessarily.
- Do not pin Markdown body copy in tests.
- Run only related tests during tasks; run lint, typecheck, full test, and build once at the milestone end.

---

### Task 1: Frozen draw-session response contracts and Next proxies

**Files:**
- Create: `src/domain/tarot/draw-session.ts`
- Create: `src/domain/tarot/draw-session.test.ts`
- Modify: `src/domain/tarot/index.ts`
- Create: `src/app/api/tarot/draw-sessions/route.ts`
- Create: `src/app/api/tarot/draw-sessions/active/route.ts`
- Create: `src/app/api/tarot/draw-sessions/[drawSessionId]/selections/route.ts`
- Create: `src/app/api/tarot/draw-sessions/[drawSessionId]/route.ts`
- Create: `src/app/api/tarot/draw-sessions/proxy-routes.test.ts`
- Delete: `src/domain/tarot/draw.ts`
- Delete: `src/domain/tarot/draw.test.ts`

**Interfaces:**
- Produces: `TarotDrawSessionState`, `TarotDrawInProgress`, `TarotDrawComplete`, `TarotDrawError`, and `parseTarotDrawSessionState(input)`.
- Proxies: exact same-origin paths to the corresponding Spring `/api/tarot/draw-sessions...` paths.

- [x] **Step 1: Write failing parser and proxy tests**

```ts
expect(parseTarotDrawSessionState(inProgressFixture)).toMatchObject({
  status: "in_progress",
  candidates: [{ token: "opaque-token-1" }],
});
expect(JSON.stringify(inProgressFixture)).not.toContain("cardId");
expect(proxyBackendRequest).toHaveBeenCalledWith({
  request,
  path: "/api/tarot/draw-sessions/draw%2Fid/selections",
});
```

- [x] **Step 2: Run tests and verify RED**

Run: `npm test -- src/domain/tarot/draw-session.test.ts src/app/api/tarot/draw-sessions/proxy-routes.test.ts`

Expected: FAIL because the contract module and routes do not exist.

- [x] **Step 3: Implement strict response union and four proxy routes**

```ts
const candidateSchema = z.object({ token: z.string().min(1) }).strict();
const inProgressSchema = baseSchema.extend({
  status: z.literal("in_progress"),
  currentPosition: tarotPositionSchema,
  candidates: z.array(candidateSchema).length(5),
}).strict();
```

Dynamic route IDs must use `encodeURIComponent`. All route handlers delegate to `proxyBackendRequest`; they do not interpret or synthesize DTOs.

- [x] **Step 4: Remove browser draw implementation and export the server contract**

Remove `drawCandidateCardIds` and its tests/exports. Do not replace it with another local sampling helper.

- [x] **Step 5: Run tests and verify GREEN**

Run: `npm test -- src/domain/tarot/draw-session.test.ts src/app/api/tarot/draw-sessions/proxy-routes.test.ts`

Expected: both files pass.

### Task 2: Reading request switches from card IDs to draw session ID

**Files:**
- Modify: `src/domain/tarot/request.ts`
- Modify: `src/domain/tarot/request.test.ts`

**Interfaces:**
- Consumes: `spreadType`, question, optional choice options, request ID, and completed `drawSessionId`.
- Produces: frozen tarot reading request without `cardIds`, candidate token, position, or schema version.

- [x] **Step 1: Replace request expectations with `drawSessionId` and verify RED**

```ts
expect(createTarotReadingRequest({
  spreadType: "daily_one_card",
  question: "ignored",
  requestId,
  drawSessionId: "draw-session-1",
})).toEqual({
  kind: "tarot",
  spreadType: "daily_one_card",
  question: DAILY_QUESTION,
  requestId,
  drawSessionId: "draw-session-1",
});
```

Assert that the result has none of `cardIds`, `candidateToken`, `position`, `candidateSets`, or `schemaVersion`.

- [x] **Step 2: Run request tests and verify RED**

Run: `npm test -- src/domain/tarot/request.test.ts`

Expected: FAIL because the current builder requires and returns `cardIds`.

- [x] **Step 3: Implement the minimal request contract**

Validate non-empty `drawSessionId`, preserve existing question/choice validation, and remove all local deck/card-count validation from request construction.

- [x] **Step 4: Run request tests and verify GREEN**

Run: `npm test -- src/domain/tarot/request.test.ts`

Expected: all request tests pass.

### Task 3: Auth-first draw-session state machine and secure candidate interaction

**Files:**
- Modify: `src/components/tarot-experience.tsx`
- Rewrite: `src/components/tarot-experience.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `/api/me`, draw-session proxy endpoints, consent flow, and `/api/readings`.
- Persists: only `spreadType`, question, choice options, and optional `drawSessionId` in a versioned session draft.
- Holds while in progress: opaque candidate tokens only.
- Holds after complete: ordered final cards returned by Backend.

- [x] **Step 1: Add auth-first and draft-safety tests; verify RED**

Cover `/api/me` before the spread screen, 401/`authenticated:false` redirect, 502 retry state, removal of the legacy card-ID draft key, and no card IDs in the new draft.

Run: `npm test -- src/components/tarot-experience.test.tsx`

Expected: FAIL because the current screen renders spreads before auth and restores `cardIds`.

- [x] **Step 2: Implement auth-first bootstrap and active recovery**

Bootstrap sequence:

```text
GET /api/me
  -> unauthenticated: /login?next=%2Ftarot
  -> server failure: retryable auth error
  -> authenticated: GET /api/tarot/draw-sessions/active
       -> 404 DRAW_SESSION_NOT_FOUND: spread selection
       -> in_progress: draw screen
       -> complete: final confirmation
```

Do not parse the legacy draft containing `cardIds`; delete its storage key. Parse only the new versioned draft shape.

- [x] **Step 3: Add focus/hover/click/Enter/Space and duplicate-prevention tests; verify RED**

Assert that focus and hover leave the selection endpoint untouched. Assert exactly one POST for click, Enter, and Space activation, including rapid duplicate activation while the first request is pending.

- [x] **Step 4: Implement opaque-token candidate buttons**

Render five identical buttons whose DOM exposes only labels such as `숨은 카드 1`. Keep tokens in response state and event closures only. Use an in-flight ref plus disabled state to block duplicate submissions. Prevent default keyboard activation and submit explicitly for Enter/Space.

- [x] **Step 5: Add and implement 3-card/5-card secrecy and completion tests**

For each `in_progress` fixture, assert no canonical ID in response fixture, rendered markup, or storage. After the final `complete` response, render ordered cards by `position`. Display confirmed-position progress without any back/change controls.

- [x] **Step 6: Add and implement active refresh recovery tests**

Verify both `in_progress` and `complete` active responses restore their matching phase after authentication without creating a new session.

- [x] **Step 7: Run component tests and verify GREEN**

Run: `npm test -- src/components/tarot-experience.test.tsx`

Expected: all component tests pass without warnings.

### Task 4: Abandon, stable errors, and no-fallback recovery

**Files:**
- Modify: `src/components/tarot-experience.tsx`
- Modify: `src/components/tarot-experience.test.tsx`

**Interfaces:**
- Consumes: stable error `{ code, message }` values from the frozen contract.
- Produces: deterministic recovery actions without automatic token resubmission or local draws.

- [x] **Step 1: Write failing active/abandon/error recovery tests**

Cover:

- `DRAW_SESSION_ACTIVE`: fetch active and offer continue or explicit abandon.
- explicit abandon: confirmation before DELETE; no new POST before DELETE 204.
- `DRAW_SESSION_STATE_CONFLICT`: re-fetch active exactly once; never resend the token.
- `DRAW_SESSION_NOT_FOUND`: return to new-session start state.
- `DRAW_SESSION_ALREADY_CONSUMED`: show records/new-start guidance.
- 502: retain server session context, show retry, and never generate local candidates.

- [x] **Step 2: Run component tests and verify RED**

Run: `npm test -- src/components/tarot-experience.test.tsx`

Expected: new recovery tests fail against the incomplete state machine.

- [x] **Step 3: Implement stable-code recovery and explicit abandon**

Read errors as `{ code, message }`. Never branch only on generic 409 for draw operations. DELETE only after user confirmation; clear the draft after 204 and return to spread selection. Recovery from state conflict calls active lookup, not the selection request.

- [x] **Step 4: Submit readings using only `drawSessionId`**

The confirm action proceeds to consent and reading creation without a second normal auth check. A reading 401 still preserves the safe draft and redirects without automatic retry. Validate the reading response against the Backend-completed ordered cards already visible on the final confirmation screen.

- [x] **Step 5: Run all related tests and verify GREEN**

Run: `npm test -- src/components/tarot-experience.test.tsx src/domain/tarot/draw-session.test.ts src/domain/tarot/request.test.ts src/app/api/tarot/draw-sessions/proxy-routes.test.ts src/app/api/readings/route.test.ts src/components/consent-gate.test.tsx src/app/records/[readingId]/page.test.tsx`

Expected: all related tests pass.

### Task 5: Milestone verification, commit, Review Desk, and report

**Files:**
- Review all modified Front files only.
- Update the existing Notion milestone/report log after approval.

- [x] **Step 1: Inspect browser-state and request boundaries**

Run targeted searches proving that browser draw sampling is gone, `cardIds` is absent from tarot request construction, and candidate tokens are not stored.

- [x] **Step 2: Run the one full milestone verification**

Run once:

```text
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

- [ ] **Step 3: Commit the milestone**

```text
git add <only Front milestone files>
git commit -m "feat: use server-owned tarot draw sessions"
```

- [ ] **Step 4: Request Review Desk review**

Send the AGENTS.md review template to thread `019ebac7-a70b-7d72-a8d1-af39af21a3fb` with request thread ID `019f6641-f5f0-7820-8864-9ed6610686c2`.

- [ ] **Step 5: Apply changes-requested and re-review until approved**

Use new commits on the same branch. Do not amend the reviewed commit.

- [ ] **Step 6: After approval, create or update one milestone Notion report**

Report the approved commit, exact verification results, contract decisions, known risks, and Backend smoke-test follow-up.
