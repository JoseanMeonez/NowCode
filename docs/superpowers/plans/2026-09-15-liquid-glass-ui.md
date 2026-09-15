# Plan: Liquid Glass redesign of the Now Code chat UI

**Brief (user, 2026-09-15):** "mejoras de UI en la app ... glassmorphism, based on liquid glass".
**Spec:** no separate spec document; this plan's Global Constraints are the binding authority.
**Branch:** `feat/liquid-glass-ui` (from `main` @ 4577c5f).

## Context

React 18 "BYOUI" page served inside ServiceNow as a full-document UI Page
(`x_1733631_now_code_chat.do`). AI planning console for ServiceNow developers:
session sidebar, top bar (model selector + SDD phase indicator), chat log with
markdown and code blocks, SDD artifact cards with Approve/Reject, message composer.
`SDD_PHASES` in `src/client/main.jsx` maps each phase key to a color.

Baseline screenshots of the pre-change UI: `.playwright-mcp/before-*.png` (local, gitignored).

## Global Constraints

- Files in scope: `src/client/styles.css` and `src/client/main.jsx` only.
- Never touch `src/fluent/**`, especially `src/fluent/generated/keys.ts`.
- No new npm dependencies. Icons are inline SVG.
- Keep every existing `nc-*` class name working; new classes allowed.
- System font stacks only (ServiceNow CSP may block external fonts).
- `now-sdk build --frozenKeys` must exit 0 with type check and build successful.
- All code, comments and UI copy in English. Sentence case; no ALL CAPS labels, no middle-dot separators, no arrow appended to buttons.
- Glass ONLY on the floating control layer (sidebar, top bar, composer, model dropdown, modal, error bar). Content (messages, code blocks, artifact cards, welcome block) stays solid.
- Ambient light behind the glass takes the active SDD phase color via `--nc-phase` (registered with `@property`, `<color>`, animated ~700ms); default `#7AA2F7` when no active SDD session.
- Text contrast >= 4.5:1; muted meta text no darker than `#8391A7` on Abyss `#0C1322`.
- Fallbacks required: `@supports not (backdrop-filter)`, `prefers-reduced-transparency: reduce`, `prefers-contrast: more`, `prefers-reduced-motion: reduce`.
- Radius hierarchy, concentric: panels 22px, controls/inputs 14px, message surfaces 16px, code blocks 10px, pills full.
- No emoji or symbol used as an icon may remain in `main.jsx`; the `⟨/⟩` wordmark is allowed.

### Task 1: Implement the Liquid Glass redesign

**Files:** `src/client/styles.css` (rewrite), `src/client/main.jsx` (targeted edits).

#### Tokens

Palette: Abyss `#0C1322` (environment base), Harbor `#16233A` (solid content surfaces; alpha variants such as rgba(22,35,58,.78) for assistant messages), Frost `#E8EEF7` (primary text), Mist `#A7B4C8` (secondary text), muted meta `#8391A7` minimum, Signal `#7AA2F7` (default accent / focus ring). Semantic approve green / reject red / pending amber, each >= 4.5:1 for text.

Type: sans `ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", Roboto, sans-serif`; mono `"JetBrains Mono", "Cascadia Code", ui-monospace, "SF Mono", Consolas, monospace`. Scale 12 / 13 / 15 / 17 / 22 / 28 px. Chat body 15px, line-height 1.6. Weights 400 body / 500 labels / 600 headings. Spacing on a 4/8 rhythm.

#### Phase-tinted ambient light

- In `App`, `phaseColor` = `getPhaseInfo(activeSession.sdd_phase).color` when the active session has `sdd_active` true, else `#7AA2F7`; set `style={{ '--nc-phase': phaseColor }}` on `.nc-app`.
- CSS: `@property --nc-phase { syntax: '<color>'; inherits: true; initial-value: #7AA2F7; }`, transitioned ~700ms ease on `.nc-app`.
- `.nc-app::before` (fixed/absolute, inset 0, z-index 0, pointer-events none): Abyss base plus 2-3 large soft `radial-gradient`s using `color-mix(in oklab, var(--nc-phase) X%, transparent)` at low intensity (about 18-28% core), placed asymmetrically (top-left behind sidebar, lower-right behind chat). No looping animation.

#### Layout

- Sidebar is a floating glass panel inset ~12px, large radius.
- `.nc-main` is `position: relative`; top bar floats at the top and composer at the bottom (inset ~12px, large radius). `.nc-chat-area` scrolls the full height beneath them with padding-top/bottom so first and last messages are never hidden. Message column centered, `max-width: 780px`.
- Below 860px: sidebar hidden off-canvas; a menu button (inline SVG, `aria-label="Show sessions"`, `aria-expanded`) at the left of the top bar, visible only under 860px, toggles the sidebar as a glass sheet with a scrim. Selecting a session closes it; Escape closes it. State lives in `App`.

#### Glass material (define once as custom properties)

- background: `linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04)), color-mix(in oklab, var(--nc-phase) 7%, rgba(20,31,52,.46))`
- `backdrop-filter: blur(24px) saturate(180%)` + `-webkit-backdrop-filter`
- border `1px solid rgba(255,255,255,.14)`
- box-shadow: `inset 0 1px 0 rgba(255,255,255,.32)`, `inset 0 -1px 0 rgba(255,255,255,.05)`, `0 12px 40px rgba(3,8,20,.45)`
- Optional subtle `::after` rim sheen that never covers interactive content.
- Fallbacks: `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` -> opaque Harbor; `prefers-reduced-transparency: reduce` -> opaque, no blur; `prefers-contrast: more` -> opaque, stronger borders; `prefers-reduced-motion: reduce` -> no `--nc-phase` transition, no press/scale animations.

#### Components

- **Sidebar:** glass. `⟨/⟩` wordmark stays text + "Now Code"; new-session button = inline SVG plus + visible label "New". Group labels "Today" / "Earlier" sentence case. Session items 14px radius; hover subtle white overlay; active = Signal tint + 3px left indicator; visible focus ring; badges wrap; time uses tabular numbers.
- **Top bar:** glass. Title + scope badge left. Right: "SDD: <Phase>" badge + phase track where the active phase is an elongated pill (shape, not color only), dots 6-8px, container `role="img"` with `aria-label` like "SDD phase 3 of 10: Propose". Model selector: SVG cpu icon replaces the robot emoji; SVG chevron.
- **Model dropdown:** glass, 14px radius, opens scale .96->1 + fade 180ms from top-right; selected item shows SVG check; items >= 40px; provider as secondary text; closes on Escape and outside click.
- **Messages (solid):** remove emoji avatars; add visually-hidden role labels ("You said" / "Now Code replied") via `.nc-sr-only`. User: right-aligned, surface `color-mix(in oklab, var(--nc-phase) 22%, #16233A)`, 16px radius. Assistant: left-aligned, full column width, rgba(22,35,58,.78) + 1px rgba(255,255,255,.06) border, 16px radius. System: centered, small, muted, no surface. Phase badge in a message must not stretch (`align-self: flex-start`). Meta row 12px, muted, tabular numbers, separated by gap.
- **Markdown:** headings from the scale; inline code solid dark chip; code blocks solid `#0A1020`, 1px rgba(255,255,255,.08) border, 10px radius, sentence-case small sans language label, horizontal scroll inside the block only.
- **Artifacts (solid):** label "SDD artifacts". Cards solid Harbor, 16px radius, left rule in phase color kept. Humanize `artifact_type` (`context_snapshot` -> "Context snapshot") in sans. Status badge = SVG icon + text. SVG chevron rotates 90 degrees on expand. Expanded content solid, readable, max-height with internal scroll.
- **Composer:** glass floating bar with quick actions + textarea row. Quick actions = glass chips with SVG icons and labels: Next phase (skip-forward), Start SDD (flag), Approve (check), Reject (x). Textarea transparent on glass, 15px, min-height 44px; focus ring on the container via `:focus-within`. Send: 44x44 round, Signal background, SVG arrow-up; disabled .45 opacity + `cursor: not-allowed`.
- **Welcome (solid, centered):** the three hints become a plain non-interactive list with small SVG icons (message, layers, search); keep copy.
- **Modal:** scrim `rgba(3,8,20,.55)` + `backdrop-filter: blur(6px)`; dialog glass, 22px radius, enters scale .96->1 + fade 200ms, exits faster. Solid dark inputs/selects 14px radius, visible labels, Signal focus ring. Footer: Cancel (secondary), "Create session" (primary).
- **Error bar:** glass with red tint via color-mix, alert SVG + text + dismiss SVG x; sits below the floating top bar.
- **Buttons:** `cursor: pointer`; press `scale(.97)` 120ms; hover 150-200ms ease-out; `:focus-visible` ring 2px Signal + 2px offset; targets >= 40px (send 44px).
- **Scrollbars:** thin, rgba(255,255,255,.14) thumb.

#### Icons

One internal `Icon` component in `main.jsx`: map of path data, 24x24 viewBox, `stroke="currentColor"`, `strokeWidth={1.75}`, `fill="none"`, round caps/joins, `aria-hidden="true"`, size prop default 16. Icons: plus, chevronDown, chevronRight, check, x, arrowUp, skipForward, flag, cpu, menu, alert, message, layers, search. Replace every emoji/symbol used as an icon (robot, person, speech bubble, ruler, magnifier, rocket, next-track, check mark, ballot x, multiplication x, play triangle, small triangles).

#### Functional fix

`formatInline` precedence bug: it always tries the backtick regex first and pushes the text before the first code span unformatted, so `**bold**` preceding a later inline code span renders with literal asterisks. Rewrite to pick the EARLIEST match among code, bold (`**x**`) and italic (`*x*`) at each step; bold wins over italic at the same index.

#### Verification

1. `now-sdk build --frozenKeys` exits 0 ("Type check completed successfully", "Build completed successfully").
2. `git diff --name-only 4577c5f..HEAD -- src` lists only `src/client/styles.css` and `src/client/main.jsx`.
3. `grep -nP "[\x{1F300}-\x{1FAFF}\x{2190}-\x{21FF}\x{2600}-\x{27BF}\x{25A0}-\x{25FF}]" src/client/main.jsx` returns nothing except the `⟨/⟩` wordmark.
