# Theme Foundation Design

## Goal

Prepare MYEONGRO for a future light theme without changing the approved Celestial Dark presentation or adding a theme toggle.

## Scope

- Replace UI-facing literal colors in `src/app/globals.css` with semantic custom properties.
- Cover backgrounds, surfaces, text roles, borders, accents, status colors, gradients, shadows, focus rings, and decorative effects.
- Set the document contract to `<html data-theme="dark">`.
- Reserve `data-theme="light"` as the future override boundary without defining an unfinished light palette.
- Preserve fixed third-party brand colors for Kakao and Google through explicitly named brand tokens.
- Preserve Google logo SVG source colors because they are part of the provider mark.

## Token Model

The theme layer exposes semantic roles rather than component-specific colors:

- Background: canvas, elevated canvas, ambient glows, and star/noise effects.
- Surface: default, strong, interactive, selected, input, card, and result surfaces.
- Text: primary, secondary, muted, subtle, inverse, accent, editorial gold, and danger.
- Border: subtle, default, strong, input, divider, focus, and danger.
- Accent: primary, strong, soft interaction fills, and glow strengths.
- Elevation: panel, card, card hover, result, and interactive shadows.
- Gradient/effect: page background, panels, cards, tarot backs, revealed cards, separators, and focus rings.
- Brand: Kakao and Google button colors.

Raw palette values remain private to the theme declaration. Component selectors consume semantic roles only.

## Theme Contract

`src/app/layout.tsx` renders `data-theme="dark"` on the root `html` element. Dark tokens are declared for both the root fallback and `[data-theme="dark"]`, keeping server-rendered output deterministic.

`[data-theme="light"]` is intentionally not activated and does not receive placeholder colors. A later milestone will add its complete semantic token overrides and the client-side theme preference/toggle behavior together, avoiding a partially light interface.

## Non-goals

- No light palette.
- No theme switch UI or persistence.
- No component layout, typography, copy, route, or behavior changes.
- No alteration of OAuth provider artwork.

## Verification

- Existing focused UI tests remain green.
- CSS contains no UI-facing literal colors outside the theme declaration, data-URI texture, or provider SVG artwork.
- Typecheck, lint, tests, production build, and `git diff --check` pass once at milestone completion.
- Desktop and mobile browser checks confirm the approved dark presentation, focus visibility, and lack of horizontal overflow.
