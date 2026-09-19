# Archive report: chat UI redesign

**Archived:** 2026-09-19
**Branch:** `feat/liquid-glass-ui`
**Status:** Complete. Built and installed on the dev instance.

## Outcome

Two commits delivered this change:

| Commit | What shipped |
|---|---|
| `1a6fdbf` | Liquid glass redesign as described in `plan.md`: token system, floating chrome layout, off-canvas sidebar under 860px, inline SVG icons, restyled SDD phase indicator, `formatInline` precedence fix |
| `24145a3` | Nature distilled light and dark themes that replace the glass materials but keep the shapes; layout rework of the sidebar, top bar and composer |

## Deviations from `plan.md`

The second commit superseded these plan constraints on purpose:

- **Materials:** paper surfaces replace glass and `backdrop-filter`. Blur remains only on the modal and sidebar scrims. The palette is lichen, moss, olive, sepia and teal instead of Abyss, Harbor, Frost and Signal.
- **Themes:** there are light and dark themes. The theme follows `prefers-color-scheme`, a toggle persists the choice in `localStorage`, and a pre-hydration script in `index.html` applies it before React mounts.
- **Fonts:** Fraunces and Public Sans load from Google Fonts. System fallbacks cover the case where the instance CSP blocks them.
- **Files:** `src/client/index.html` was also modified.
- **Phase colors:** SDD phase colors are per-theme CSS variables, and `phaseTint()` builds tints with `color-mix`.
- **Sidebar:** the hamburger lives in the sidebar header. On desktop it collapses the docked sidebar. A top-bar hamburger appears only while the sidebar is hidden. New session is a plus button above the list.
- **Top bar:** transparent and not a container. It shows only the session name and the SDD phase.
- **Composer:** the textarea sits on top and a toolbar sits below. The toolbar holds a borderless model chip, whose dropdown opens upward, and the send button. The textarea shows no focus ring.

## Known operational gotcha

`styles.css` deploys as a separate `sys_ux_theme_asset` served from `/uxta/<sys_id>.assetx`, and the instance caches it on the server side. After `now-sdk install`, the new JS loads but the old CSS can persist until the instance cache is flushed with `cache.do`.

## Specs

There were no delta specs to merge. This change was planned as a plan document, not through the SDD proposal and spec flow.
