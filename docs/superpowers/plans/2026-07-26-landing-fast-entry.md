# Fast-Entry Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the decorative two-column home hero with a centered, typography-led fast-entry landing that exposes tarot and saju actions sooner while preserving existing routes and behaviors.

**Architecture:** Keep the page as a server component and express the redesign through semantic JSX plus landing-scoped CSS. Load MaruBuri and Pretendard from pinned OFL-1.1 npm packages so Next bundles the assets, but apply the new type stack only below `.landing-page` to avoid changing other screens.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, global CSS, Vitest, Testing Library

## Global Constraints

- Work directly in this thread; do not use subagents because this is one focused landing-page task.
- Keep `/tarot` and `/saju` as the destinations for every corresponding landing CTA.
- Remove the hero planet, moon, orbit, and constellation illustration.
- Center the hero kicker, Korean headline, description, and two CTAs in one column.
- Apply MaruBuri to landing headings and Pretendard to landing body/UI text only.
- Do not add advertisements, empty advertisement slots, authentication changes, or reading logic changes.
- Run only related tests during implementation and run the full milestone verification once immediately before review.
- Request MYEONGRO Review Desk review with request thread ID `019f8380-5f15-7c42-a34e-d033ef4f1d05`; do not report completion before approval.

---

## File Structure

- `src/app/page.tsx`: semantic landing content, CTA links, trust strip, and three-step process.
- `src/app/home.test.tsx`: user-visible landing copy and route regression coverage.
- `src/app/globals.css`: landing-scoped typography, compact hero/cards, responsive layout, focus and reduced-motion styles; removal of unused hero-orbit styles.
- `src/app/layout.tsx`: imports the packaged font CSS so font assets are bundled by Next.
- `package.json` and `package-lock.json`: pin `@kfonts/maruburi@0.1.0` and `pretendard@1.3.9`.
- `THIRD_PARTY_NOTICES.md`: records the MaruBuri and Pretendard OFL-1.1 sources and package versions.

### Task 1: Lock the fast-entry content contract

**Files:**
- Modify: `src/app/home.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: existing Next `Link` routes `/tarot` and `/saju`.
- Produces: one `.landing-page` root, centered hero links named `타로로 시작` and `사주로 시작`, two reading-card links, three trust statements, and three process steps.

- [ ] **Step 1: Write the failing landing test**

Replace `src/app/home.test.tsx` with assertions that describe the approved UI:

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("offers fast tarot and saju entry from the centered hero", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "지금의 마음을 별빛 아래 펼쳐보세요",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "타로로 시작" })).toHaveAttribute(
      "href",
      "/tarot",
    );
    expect(screen.getByRole("link", { name: "사주로 시작" })).toHaveAttribute(
      "href",
      "/saju",
    );
  });

  it("keeps both reading journeys and explains the service flow", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "타로 리딩 시작" }),
    ).toHaveAttribute("href", "/tarot");
    expect(
      screen.getByRole("link", { name: "사주 리딩 시작" }),
    ).toHaveAttribute("href", "/saju");
    expect(screen.getByText("Google 로그인 후 시작")).toBeInTheDocument();
    expect(screen.getByText("완료한 리딩 기록 저장")).toBeInTheDocument();
    expect(screen.getByText("선택을 돕는 성찰형 해석")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "질문을 남겨요" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "카드 또는 정보를 선택해요" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "나만의 해석을 읽어요" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/app/home.test.tsx
```

Expected: FAIL because the new headline, hero links, third trust statement, and revised process headings do not exist yet.

- [ ] **Step 3: Implement the semantic landing markup**

Update `src/app/page.tsx` so it:

- wraps all landing sections in `<div className="landing-page">`;
- renders a centered `.landing-hero` with the approved kicker, headline, description, and two direct route links;
- omits `.hero-orbit`, `.orbit`, `.moon`, `.star`, and `.card-symbol` elements;
- retains two `<article className="reading-card ...">` entries with their existing destination links;
- places the three trust statements in a `.landing-trust` region after the choice cards;
- maps these exact feature records into the three-step process:

```tsx
const features = [
  {
    number: "01",
    title: "질문을 남겨요",
    copy: "지금 마음에 머무는 질문을 한 문장으로 적습니다.",
  },
  {
    number: "02",
    title: "카드 또는 정보를 선택해요",
    copy: "타로 카드를 고르거나 생년월일시를 입력합니다.",
  },
  {
    number: "03",
    title: "나만의 해석을 읽어요",
    copy: "AI가 정리한 리딩을 읽고 완료한 기록을 다시 확인합니다.",
  },
];
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm test -- src/app/home.test.tsx
```

Expected: 2 tests PASS with no warnings.

- [ ] **Step 5: Commit the content contract**

```powershell
git add src/app/home.test.tsx src/app/page.tsx
git commit -m "feat: streamline landing reading entry"
```

### Task 2: Apply Korean editorial typography

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: `.landing-page` from Task 1 and package entrypoints `@kfonts/maruburi` plus `pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css`.
- Produces: locally bundled `MaruBuri` and `Pretendard Variable` font families, scoped typography tokens `--landing-serif` and `--landing-sans`.

- [ ] **Step 1: Install the pinned OFL font packages**

Run:

```powershell
npm install @kfonts/maruburi@0.1.0 pretendard@1.3.9
```

Expected: `package.json` and `package-lock.json` add only the two font packages.

- [ ] **Step 2: Import the font styles once**

Add these imports before `./globals.css` in `src/app/layout.tsx`:

```tsx
import "@kfonts/maruburi";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
```

- [ ] **Step 3: Add landing-scoped font tokens and roles**

Define the typography under `.landing-page` in `src/app/globals.css`:

```css
.landing-page {
  --landing-serif: "MaruBuri", "Noto Serif KR", "Iowan Old Style", serif;
  --landing-sans: "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif;
  font-family: var(--landing-sans);
  letter-spacing: -0.01em;
}

.landing-page h1,
.landing-page h2,
.landing-page h3 {
  font-family: var(--landing-serif);
  font-weight: 400;
}
```

Use 500–600 weight for buttons and short UI labels, 400 for body, `line-height: 1.65` or greater for body copy, and `line-height: 1.12–1.2` for the hero title.

- [ ] **Step 4: Record the font licenses and sources**

Create `THIRD_PARTY_NOTICES.md` with these entries:

```markdown
# Third-Party Notices

## MaruBuri

- Package: `@kfonts/maruburi@0.1.0`
- Original project: <https://hangeul.naver.com/maruproject_11>
- License: SIL Open Font License 1.1

## Pretendard

- Package: `pretendard@1.3.9`
- Original project: <https://github.com/orioncactus/pretendard>
- License: SIL Open Font License 1.1
```

- [ ] **Step 5: Run the related home test**

Run:

```powershell
npm test -- src/app/home.test.tsx
```

Expected: 2 tests PASS; font imports do not break the jsdom render.

- [ ] **Step 6: Commit the typography integration**

```powershell
git add package.json package-lock.json src/app/layout.tsx src/app/globals.css THIRD_PARTY_NOTICES.md
git commit -m "feat: add Korean editorial landing typography"
```

### Task 3: Build the compact responsive presentation

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Task 1 landing classes and Task 2 typography tokens.
- Produces: desktop-first centered hero, compact 2-column cards, trust strip, 3-column process, 390px mobile stack, visible focus states, and reduced-motion behavior.

- [ ] **Step 1: Replace the old landing CSS**

Remove the unused `.hero-orbit`, `.orbit`, `.moon`, `.star`, and `spin` keyframe rules. Scope all new landing rules beneath `.landing-page` and implement:

```css
.landing-page .landing-hero {
  min-height: 500px;
  display: grid;
  place-items: center;
  padding-block: 64px 54px;
  text-align: center;
}

.landing-page .hero-copy {
  width: min(720px, 100%);
  padding: 0;
}

.landing-page .hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
```

Complete the approved design with:

- a 56–68px desktop hero title and 36–44px mobile title;
- choice-card start visible within a 1440×1000 viewport;
- cards reduced from 500px to roughly 300–340px minimum height;
- equal visual weight for the two hero CTAs while preserving primary/secondary card treatments;
- `.landing-trust` bordered above and below, three centered items, wrapping on mobile;
- desktop three-column `.feature-row` and mobile one-column flow;
- `:focus-visible` styles for hero and card links;
- no horizontal overflow at 390px;
- transform removal under `prefers-reduced-motion: reduce`.

- [ ] **Step 2: Run the related home test**

Run:

```powershell
npm test -- src/app/home.test.tsx
```

Expected: 2 tests PASS after the style replacement.

- [ ] **Step 3: Start the application for visual QA**

Run:

```powershell
npm run dev
```

Inspect `/` at 1440×1000 and 390×844. Confirm the title and CTAs are centered, no planet illustration appears, both journeys are visible without layout overlap, the mobile page has no horizontal scroll, keyboard focus is visible, font files load from local Next assets, and the console has no new warning or error.

- [ ] **Step 4: Commit the responsive presentation**

```powershell
git add src/app/globals.css
git commit -m "feat: refine responsive landing presentation"
```

### Task 4: Complete milestone verification and review handoff

**Files:**
- Verify only; update files only if a failure exposes a defect.

**Interfaces:**
- Consumes: Tasks 1–3 committed implementation.
- Produces: one clean milestone verification record and a reviewable HEAD commit.

- [ ] **Step 1: Run the full milestone verification exactly once**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all tests, typecheck, lint, production build, and whitespace check PASS.

- [ ] **Step 2: Record the exact review target**

Run:

```powershell
git status --short --branch
git rev-parse --short HEAD
git log --oneline --decorate -6
```

Expected: branch `feature/landing-fast-entry-redesign`, no tracked working-tree changes, and an exact HEAD for review.

- [ ] **Step 3: Request Review Desk review**

Send the repository review template to Review Desk `019ebac7-a70b-7d72-a8d1-af39af21a3fb` with request thread ID `019f8380-5f15-7c42-a34e-d033ef4f1d05`, exact branch/HEAD, actual verification commands and results, and explicit visual QA details.

- [ ] **Step 4: Process the review result**

If status is `changes-requested`, fix each finding on the same branch, run focused verification for the fix, commit, and send the re-review template with the same request thread ID. If status is `approved`, treat that commit as the merge candidate.

- [ ] **Step 5: Write the milestone Notion report after approval**

Create or update one page in `AI 사주/타로 프로젝트` → `빌드/보고 로그` containing the milestone name, goal, final scope, changed judgments, approved commit, verification result, remaining issues, and next-milestone entry condition.
