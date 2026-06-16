# Free MVP Stabilization Implementation Plan

> **Current execution policy:** Follow repository `AGENTS.md`. This historical
> plan does not require task-by-task subagents or dedicated reviewers for each
> implementation task.
>
> Detailed subagent execution rules have since been consolidated into the
> repository `AGENTS.md`.

**Goal:** Complete a Kakao-authenticated free tarot and saju MVP with safe guest identity, persisted AI readings, records, deletion, quotas, and cost controls.

**Architecture:** Next.js App Router owns session-aware pages and route handlers. Supabase stores consent, reading, generation, and quota state behind RLS and server-owned RPCs. OpenAI generation is reachable only through a server application service that derives ownership, tier, saju pillars, quota, and persistence state.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase PostgreSQL/Auth, OpenAI Responses API, Zod, Vitest.

---

### Task 1: Authentication and session UX
- Add Supabase session-refresh middleware.
- Render session-aware navigation with Kakao login and logout.
- Protect records routes and preserve a normalized local `next` destination.
- Reject protocol-relative, backslash, absolute, and malformed redirect values.
- Clear auth state after logout and account deletion.
- Add route, component, and redirect security tests.

### Task 2: Trusted guest identity and consent
- Replace localStorage guest ownership with a signed HttpOnly guest cookie.
- Require `APP_SIGNING_SECRET` and use `SameSite=Lax`; use `Secure` in production.
- Add consent status lookup and wait for successful persistence before advancing.
- Preserve original acceptance timestamps for the same document version.
- Transfer guest consent/readings after OAuth callback exactly once, then clear the cookie.
- Test tampering, retry, version changes, and cross-user transfer rejection.

**Status (2026-06-12): Complete locally.**

- Added incremental migrations for consent timestamp preservation and a
  service-role-only guest ownership transfer RPC.
- Removed the authenticated direct-RPC transfer path and pass the OAuth user ID
  explicitly from the verified server callback.
- Preserve the earliest consent timestamps when guest and user records merge.
- Show safe transfer-failure notices on records and checkout return paths.
- The baseline and Task 2 migrations are recorded and applied to the remote
  Supabase project.

### Task 3: Reading persistence, idempotency, and quotas
- Add a migration for soft deletion, request idempotency/input hashes, quota events, indexes, RLS, profile backfill, and atomic quota reservation.
- Implement a server-owned reading application service and repositories.
- Add `POST /api/readings`, authenticated records queries, detail, retry, and soft-delete handlers.
- Enforce guest limits of 3/hour and 5/day and authenticated limits of 10/day.
- Store only an HMAC hash of IP data.
- Test concurrent duplicate requests, payload mismatch, quotas, ownership, and state transitions.

**Status (2026-06-12): Persistence and generation API complete.**

- Applied the incremental persistence/quota migration to remote Supabase.
- Added service-role-only atomic RPCs for pending, completed, and failed
  generation transitions.
- Enforced guest session and IP quotas, owner-scoped idempotency, soft-delete
  filtering, HMAC IP storage, and browser write restrictions.
- Transfer guest quota events to the authenticated owner during OAuth ownership
  transfer so login cannot reset free usage.
- Added the server-owned reading service and `POST /api/readings`.
- Records list/detail/retry/delete handlers remain in Task 5.

### Task 4: Actual tarot and saju generation
- Make tarot submit exactly three canonical card IDs to the reading API.
- Calculate saju pillars on the server from solar input; never accept client pillars.
- Replace hardcoded output with persisted structured OpenAI results.
- Clearly label saju as a solar, approximate beta.
- Add 300-character input limits, bounded output, 30-second timeout, transient retries, sanitized errors, and existing high-risk routing.
- Test success, safety, timeout, malformed output, and server-derived saju inputs.

**Status (2026-06-12): Complete.**

- Tarot and saju now render persisted structured OpenAI results.
- Saju pillars are calculated from solar input on the server and the UI labels
  the calculation as an approximate beta.
- Live guest smoke tests completed one tarot and one saju reading; retrying the
  same saju request returned the same reading ID.
- Verification: 46 Vitest files / 271 tests, TypeScript, ESLint, and the Next.js
  production build pass.

### Task 5: Records and deferred paid UX
- Render owner-only reading list, detail, status, retry, and soft-delete UI.
- Hide account controls from guests and expose logout to authenticated users.
- Replace checkout/payment CTAs with a clear “준비 중” state.
- Remove active Google and paid/follow-up entry points for this release.
- Test empty, completed, failed, deleted, and foreign-owner behavior.

**Status (2026-06-13): Complete.**

- Added authenticated reading list, detail, retry, and soft-delete routes and UI.
- Added an owner-scoped atomic retry RPC and persisted-input reconstruction.
- Disabled checkout actions, Toss confirmation, and Toss webhook entry points
  with explicit preparation-state responses.
- Applied the retry migration to remote Supabase and verified that only
  `service_role` can execute it.

### Task 6: Final security and release verification
- Verify no public paid/follow-up generation path remains.
- Verify prompts, birth data, and raw IPs are absent from operational logs.
- Run unit tests, typecheck, lint, build, Supabase schema/RLS checks, and mobile browser E2E.
- Review the implementation for spec compliance and code quality.
