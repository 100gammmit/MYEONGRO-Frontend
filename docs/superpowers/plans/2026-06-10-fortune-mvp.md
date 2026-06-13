# Fortune Reading MVP Implementation Plan

> **Current execution policy:** Follow repository `AGENTS.md`. This historical
> plan does not require task-by-task subagent execution.

**Goal:** Build a mobile-first Korean AI tarot and saju MVP with guest previews, consent, paid deep readings, and two follow-up questions.

**Architecture:** A Next.js App Router application owns the UI and route handlers. Pure domain modules calculate and validate tarot/saju inputs, provider adapters generate structured readings, and repository/payment ports isolate Supabase and Toss integrations. External services degrade to explicit demo behavior when credentials are absent.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Supabase, Toss Payments, OpenAI Responses API, Zod.

---

### Task 1: Project foundation
- Configure Next.js, TypeScript, ESLint, Vitest, environment variables, shared reading types, and application shell.

### Task 2: Tarot domain
- Define the 22-card major arcana deck, validate three unique selections, assign spread positions, and provide deterministic demo summaries.
- Test duplicate rejection, position order, and interpretation shape before implementation.

### Task 3: Saju domain
- Validate Korean birth inputs and calculate four pillars through a replaceable calculator port.
- Ship a deterministic Gregorian MVP calculator with documented limits; lunar conversion must return an explicit unsupported error until a verified calendar dataset is configured.
- Test date/time boundaries and known reference dates before implementation.

### Task 4: AI and safety
- Define `ReadingGenerator`, structured schemas, OpenAI adapter, demo adapter, risk classification, and safe fallback responses.
- Test schema parsing and high-risk routing before implementation.

### Task 5: Consent, persistence, and payments
- Add Supabase clients, SQL schema with RLS, consent recording, guest ownership transfer contract, Toss order approval/webhook verification, and idempotency rules.
- Test pure service contracts with injected repositories before implementation.

### Task 6: Mobile user journeys
- Build home, tarot wizard, saju wizard, result, login, and records pages in a modern East Asian mystical visual system.
- Support a complete local demo flow without credentials while clearly labeling demo output.

### Task 7: API integration and verification
- Add route handlers for free generation, paid generation, follow-ups, payment confirmation, and account deletion.
- Run unit tests, typecheck, lint, production build, and mobile browser smoke tests.
