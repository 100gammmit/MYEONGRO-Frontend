# Theme Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the approved Celestial Dark UI onto semantic theme tokens and establish the root `data-theme` contract without implementing light mode.

**Architecture:** Keep all current dark values in one theme declaration at the top of `globals.css`, but expose them through semantic roles consumed by selectors. Render `data-theme="dark"` from the server layout so a later light-mode milestone can override the same roles under `[data-theme="light"]` without rewriting components.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, global CSS, Vitest, Testing Library

## Global Constraints

- Continue on `feature/landing-fast-entry-redesign` as explicitly requested.
- Preserve the current dark appearance and all application behavior.
- Do not add a light palette, toggle, system preference detection, or persistence.
- Keep third-party provider colors explicit and semantically named.
- Work directly in this thread because the change is one sequential CSS/layout task.
- Run related tests during implementation and the full validation suite exactly once at milestone completion.
- Request Review Desk review with request thread ID `019f8380-5f15-7c42-a34e-d033ef4f1d05` and do not report completion before approval.

---

### Task 1: Establish the theme contract and semantic tokens

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: root `data-theme="dark"` attribute and semantic CSS variables for every existing visual role.
- Preserves: all routes, DOM structure, application behavior, provider artwork, and current dark computed colors.

- [ ] Add `data-theme="dark"` to the root `<html lang="ko">` element.
- [ ] Replace the current palette-only root variables with semantic background, surface, text, border, accent, state, gradient, shadow, and effect tokens.
- [ ] Retain only raw color primitives inside the theme declaration, SVG data URI, and provider SVG paths.
- [ ] Replace every component-facing hex, rgb/rgba, gradient, outline color, and shadow color in `globals.css` with a semantic token.
- [ ] Name Kakao and Google button colors as brand tokens instead of treating them as theme colors.
- [ ] Run `npm test -- src/app/home.test.tsx src/app/layout.test.tsx` if the layout test exists; otherwise run `npm test -- src/app/home.test.tsx`.

### Task 2: Verify and hand off the milestone

**Files:**
- Verify the working tree; modify implementation only if verification exposes a regression.

**Interfaces:**
- Consumes: Task 1 theme contract.
- Produces: a reviewable commit with evidence that the visual refactor preserved behavior and presentation.

- [ ] Search `src/app/globals.css` for remaining color literals and confirm every exception is theme declaration or embedded texture data.
- [ ] Inspect the landing and one form/result flow at desktop and mobile widths, including focus visibility and horizontal overflow.
- [ ] Run the milestone verification once: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Commit the implementation with an exact, focused commit message.
- [ ] Send the required review template to MYEONGRO Review Desk with the exact branch, commit, verification evidence, and request thread ID.
- [ ] If review requests changes, fix them on the same branch, run focused verification, commit, and request re-review.
- [ ] After approval, create or update one milestone report in the Notion build/report log.
