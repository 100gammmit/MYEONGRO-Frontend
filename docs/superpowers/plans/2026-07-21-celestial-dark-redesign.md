# Celestial Dark Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This repository requires the primary thread to implement this shared-state redesign directly.

**Goal:** Redesign the existing MYEONGRO frontend as a desktop-first Lunar Editorial experience using black-purple surfaces, lilac starlight, constellation and moon motifs, while preserving every existing user-flow behavior.

**Architecture:** Keep the current Next.js App Router and component boundaries unchanged. Replace the global visual foundation in `globals.css`, then make only small semantic markup additions to the home and shared layout where CSS alone cannot express the approved celestial composition. Existing component tests remain the behavioral contract.

**Tech Stack:** Next.js 15, React 19, TypeScript, global CSS, Vitest, Testing Library, Playwright.

## Global Constraints

- Desktop-first at 1440px; retain a polished layout at the existing 760px mobile breakpoint.
- Palette: black purple canvas, deep plum panels, lilac accent, moonlight primary text; remove the gold visual language.
- Typography: Korean serif headings, Korean sans-serif body, editorial serif for English eyebrow labels; use local font fallbacks without adding a network dependency.
- Preserve authentication, consent, tarot draw recovery, saju submission, records, account, and API behavior.
- Preserve keyboard focus visibility and `prefers-reduced-motion` behavior.
- Do not use subagents because the affected screens share one stylesheet and must be changed sequentially.

---

### Task 1: Rebuild the global Lunar Editorial foundation

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: all existing class names rendered by `src/app` and `src/components`.
- Produces: CSS variables and shared surface/button/form styles consumed by every route.

- [ ] Replace navy, cream, and gold variables with black-purple, plum, lilac, moonlight, muted, border, and danger tokens.
- [ ] Add layered starfield, vignette, ambient glow, and subtle noise backgrounds without external images.
- [ ] Update shared typography, header, footer, buttons, focus states, panels, fields, notices, and responsive rules.
- [ ] Run `npm test -- --run src/components/site-header.test.tsx src/components/reading-shell.test.tsx src/components/consent-gate.test.tsx` and expect all tests to pass.

### Task 2: Refine the landing-page celestial composition

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Test: `src/app/home.test.tsx`

**Interfaces:**
- Consumes: existing `/tarot` and `/saju` links and home copy.
- Produces: the approved desktop hero, moon/constellation motif, reading choice cards, and mobile home treatment.

- [ ] Add decorative, `aria-hidden` constellation/orbit layers to the existing hero without changing the accessible heading or links.
- [ ] Restyle the hero, trust row, reading cards, and feature row using the Lunar Editorial token set.
- [ ] Run `npm test -- --run src/app/home.test.tsx` and expect all tests to pass.

### Task 3: Apply the design to the core tarot and saju journeys

**Files:**
- Modify: `src/app/globals.css`
- Verify: `src/components/tarot-experience.tsx`
- Verify: `src/components/saju-experience.tsx`
- Test: `src/components/tarot-experience.test.tsx`
- Test: `src/components/saju-experience.test.tsx`

**Interfaces:**
- Consumes: the existing `ReadingShell`, phase state machines, form markup, and result structures.
- Produces: Lunar Editorial progress, spread choices, form panels, tarot backs/reveals, saju pillars, result sections, loading, error, and confirmation states.

- [ ] Restyle every existing state through current class names; do not change state transitions or request payloads.
- [ ] Ensure card-selection hover/focus and active states remain distinguishable without relying on gold.
- [ ] Run `npm test -- --run src/components/tarot-experience.test.tsx src/components/saju-experience.test.tsx` and expect all tests to pass.

### Task 4: Align supporting authenticated and legal screens

**Files:**
- Modify: `src/app/globals.css`
- Verify: `src/app/login/page.tsx`
- Verify: `src/app/records/page.tsx`
- Verify: `src/app/records/[readingId]/page.tsx`
- Verify: `src/app/account/page.tsx`
- Verify: `src/app/privacy/page.tsx`

**Interfaces:**
- Consumes: existing server-rendered page markup and auth boundaries.
- Produces: visually consistent login, empty, list, detail, account, unavailable, and legal surfaces.

- [ ] Restyle simple pages, auth card, record cards, detail sections, statuses, danger actions, and legal content.
- [ ] Run `npm test -- --run src/app/login/page.test.tsx src/app/records/page.test.tsx src/app/records/[readingId]/page.test.tsx src/app/account/page.test.tsx src/app/privacy/page.test.tsx` and expect all tests to pass.

### Task 5: Visual QA and milestone verification

**Files:**
- Verify only; do not add generated screenshots to the repository.

**Interfaces:**
- Consumes: completed frontend branch.
- Produces: verified desktop and mobile visuals plus one full validation result for the milestone.

- [ ] Run the local app and inspect `/`, `/saju`, and reachable tarot/auth states at 1440px and 390px.
- [ ] Fix any clipping, overlap, weak contrast, or broken responsive behavior and rerun directly related tests.
- [ ] Run the milestone-wide validation exactly once: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Confirm `git diff --check` passes.
- [ ] Commit the reviewed implementation on `feature/celestial-dark-redesign`.
- [ ] Send the required review request to `MYEONGRO Review Desk` with the current request thread ID and exact HEAD.
- [ ] If review returns `changes-requested`, fix on the same branch, rerun affected verification, commit, and send a re-review request.
- [ ] Report completion only after `approved` or explicit user approval.
