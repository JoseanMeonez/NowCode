# Tasks: Session-Scoped Application and Update Set

Ordered, dependency-aware work units. Each unit is one reviewable commit with
its own verification step. No test runner exists (`strict_tdd: false`) —
verification is `now-sdk build` / `now-sdk build --frozenKeys` plus manual
PDI checks on `https://dev312366.service-now.com` (credential alias `pdi`).

## 0. Apply-time spike — confirm concoursepicker contract (sequential, blocking)

- [ ] 0.1 Open the platform header's application picker and update-set picker
      once on the PDI with devtools Network tab open; capture the exact
      request method, URL, and body for switching current application and
      current update set.
  - Confirms/refutes design.md 4.3's assumed payload:
    `PUT /api/now/ui/concoursepicker/application` /
    `.../updateset` with `{ "sysparm_item": "<sys_id>" }`.
  - Record the observed shape (or divergence) before writing
    `platform-context.js`'s `setCurrent`.
- [ ] 0.2 Confirm whether the UI Page bundler resolves a second client module
      file (`src/client/platform-context.js` imported into `main.jsx`) or
      only serves `main.jsx` literally with no bundling step.
  - Determines whether task 4.1 uses a new file (design.md D5 preferred
    path) or the same-file-section fallback.
- Verification: both facts documented (inline code comment or commit
  message) before task 3 (client module) starts. No code changes in this
  unit besides recording findings as comments if useful.
- Maps to: design.md §4.3, §4.1; proposal.md Risks row 1.

## 1. Schema — additive reference columns (sequential)

- [ ] 1.1 Add `application` (→ `sys_scope`) and `update_set` (→
      `sys_update_set`) `ReferenceColumn`s to
      `src/fluent/chat/chat-session.table.now.ts`; add inline comment above
      `context_scope` marking it legacy/superseded, untouched otherwise.
- [ ] 1.2 Run `now-sdk build` — confirm `keys.ts` only gains two new
      `Now.ID[...]` entries, no existing entry moves or changes.
- [ ] 1.3 If a `chat_session` list view file exists in `src/fluent/chat/`,
      add `application`/`update_set` as trailing columns only (no reorder).
      If none exists, skip — document why in the commit message.
- Verification: `now-sdk build --frozenKeys` — expected to still pass since
  no existing `$id`-less artifact changed identity; diff `keys.ts` to
  confirm additive-only.
- Maps to: spec.md "Session persists application and update set references";
  design.md §2.
- Parallel with: none (must land before 2, 3, 6).

## 2. Server — cross-scope privilege (sequential, depends on 1)

- [ ] 2.1 Add one table-type `CrossScopePrivilege` entry (explicit `$id`) to
      `src/fluent/cross-scope-privileges.now.ts` for `sys_update_set` read
      from `global`.
- [ ] 2.2 Build and install to the PDI; manually confirm on the instance
      whether the privilege is auto-approved or requires admin approval
      (`glide.sys.cross_scope.privilege.require_approval`). Approve manually
      if needed and note the instance's default in the commit message.
- Verification: `now-sdk build`; manual PDI check that a GlideRecord read
  against `sys_update_set` from the app scope succeeds (exercised indirectly
  by task 3's validator once deployed).
- Maps to: spec.md "Server-side rejection of application/update-set
  mismatch"; design.md §3.2, D6.

## 3. Server — validation Script Include + operations (sequential, depends on 1, 2)

- [ ] 3.1 Add `validateSessionScope(applicationSysId, updateSetSysId)` to
      `NowCodePlatformContext` (`.server.js`), per design.md §3.1's
      implementation.
- [ ] 3.2 Update `create-session.js` to parse `application`/`update_set`
      from the body, call the validator when both are present, return 400
      with an error message on mismatch, and pass through the sys_ids on
      success.
- [ ] 3.3 Update `get-session.js` and `list-sessions.js` to return
      `application`/`update_set` as `{ sys_id, display_value }` (or `null`),
      per design.md §3.3.
- Verification: `now-sdk build`; manual PDI checks — create a session via
  the API (or curl) with a mismatched application/update_set pair and
  confirm 400 + no `chat_session` record created; then with a matching pair
  and confirm the record persists both references; call `get-session` and
  `list-sessions` and confirm the new fields render correctly for a scoped
  and a scopeless session.
- Maps to: spec.md "Server-side rejection of application/update-set
  mismatch", "Session persists application and update set references".

## 4. Client — platformContext module (sequential, depends on 0)

- [ ] 4.1 Create `src/client/platform-context.js` (or the same-file-section
      fallback per task 0.2's finding) exporting `listScopes`,
      `listUpdateSets`, `createUpdateSet`, `setCurrent`, mirroring
      `apiCall`'s header/credential pattern from `main.jsx` (read it first,
      do not duplicate a second auth scheme).
- [ ] 4.2 Implement `setCurrent` using the confirmed payload from task 0.1:
      sequential PUT application then PUT update set, only proceeding to
      update set on application success; return
      `{ applicationOk, updateSetOk, error }`, never throwing.
- Verification: `now-sdk build`; manual PDI check via the browser console
  invoking each function directly (`listScopes()`, `listUpdateSets(appId)`,
  `createUpdateSet(appId, 'test')`, `setCurrent(appId, usId)`) and observing
  the platform header actually switches application/update set.
- Maps to: spec.md "Selecting an existing update set switches ServiceNow's
  current context", "Auto-fill application scope from a selected existing
  update set", "Create a new update set from the tray"; design.md §4.1-4.4.

## 5. Client — ScopeTray UI (sequential, depends on 4; parallel-eligible with 3)

- [ ] 5.1 Build `ScopeTray` component: interactive mode (application +
      update-set dropdowns, "+ New update set" inline create, auto-fill
      application on existing-update-set pick, keyboard operable, labelled
      controls, optional substring filter when >~8 items) per design.md
      §4.5.
- [ ] 5.2 Read-only chip mode for existing sessions with scope (application
      + update-set display values, no edit affordance, "not in progress" /
      "unavailable" indicators per spec.md's non-current/deleted scenarios).
- [ ] 5.3 Empty/neutral state for existing sessions with no scope (render
      nothing, no switch attempt).
- [ ] 5.4 Wire `NewSessionModal` and `handleSendMessage`'s auto-create path
      to pass `application`/`update_set` through to `create-session`, and
      surface the server-side mismatch error inline in the tray.
- Verification: `now-sdk build`; manual PDI keyboard-only walkthrough
  (Tab/Shift+Tab/arrows/Enter) creating a session with an existing update
  set and with a newly created one; manual check of chip states for
  in-progress, not-in-progress, deleted, and scopeless sessions; screen
  reader spot-check that chip state is exposed as text, not color alone.
- Maps to: spec.md "Auto-fill...", "Create a new update set from the tray",
  "Existing sessions show read-only scope chips", "Non-current or deleted
  update set is surfaced...", "Sessions without application or update set
  do not alter platform context", "Tray pickers are keyboard-operable and
  labelled".

## 6. Client — session switch flow + notices (sequential, depends on 4, 5)

- [ ] 6.1 Generalize the existing `.nc-error-bar` into a `notice` state
      (`{ type: 'error' | 'info', message }`), `role="status"
      aria-live="polite"` for info, `role="alert"` retained for error,
      auto-dismiss info after ~5s.
- [ ] 6.2 Hook `loadSessionDetails` to call `platformContext.setCurrent`
      when the loaded session has both `application` and `update_set` and
      the application differs from `lastSwitchedRef.current.application`;
      update the ref; show the combined success/error notice. Skip entirely
      for scopeless sessions (no notice, no call).
- [ ] 6.3 Handle the "not in progress" and "deleted update set" cases: still
      attempt to set the application as current if valid, show the
      specific non-blocking notice text from spec.md, never call
      `setCurrent` for the invalid update set.
- Verification: `now-sdk build`; manual PDI walkthrough — open a session
  with a valid scope (confirm platform header updates + success notice),
  simulate a switch failure (e.g., revoke permission or use an invalid
  sys_id) and confirm the error notice appears with chat still usable,
  open a session with a non-current update set and confirm the app-only
  switch + specific notice, open a legacy/scopeless session and confirm no
  call and no notice.
- Maps to: spec.md "Selecting an existing update set switches ServiceNow's
  current context", "Non-current or deleted update set is surfaced...",
  "Sessions without application or update set do not alter platform
  context"; design.md §4.6, §5, D4.

## 7. Build verification and full-flow PDI QA (sequential, depends on 1-6)

- [ ] 7.1 Run `now-sdk build --frozenKeys` on the final combined tree —
      must pass; if it fails, task 1's schema additions are not truly
      additive and need investigation before proceeding.
- [ ] 7.2 Run the AGENTS.md dist md5sum parity check if any structural
      refactor occurred beyond additive changes (expected: not needed for
      this change, but confirm).
- [ ] 7.3 Manual PDI QA checklist:
  - Create session with existing update set → scope auto-filled, session
    created, references persisted.
  - Create session with new update set (valid name + application) →
    update set created under the chosen application, session references it.
  - Attempt new update set with blank name or unselected application →
    blocked with inline validation, no `sys_update_set` created.
  - Attempt mismatched application/update_set pair directly against the
    API → 400, no session created.
  - Open existing session with valid scope → platform header switches,
    success notice shown.
  - Open existing session with non-current update set → app switches only,
    specific notice shown, no update-set switch attempted.
  - Open existing session with deleted update set reference → "Update set
    unavailable" chip, specific notice, no switch attempted.
  - Open legacy/scopeless session → no call, no notice, no chips (or
    neutral empty state).
  - **Orphan update set note**: if any QA step intentionally fails session
    creation after a new update set was already created (task 3.2's 400
    path following task 4's client-side create), confirm the update set is
    left behind as a normal in-progress record (per design.md D3, an
    accepted, non-invalid state) — visible and reusable/deletable from the
    platform UI, not orphaned in an invalid way. Document this in the QA
    notes; no cleanup action is required by this change.
  - Confirm `startSDD`'s legacy `context_scope` write path is unaffected
    (create a session via that flow if reachable, or code-review confirm
    no call sites in `sdd-orchestrator.server.js` changed).
- Verification: all checklist items pass on dev312366; failures block
  archive.
- Maps to: proposal.md Success Criteria (all items); spec.md all
  requirements collectively.

---

## Review Workload Forecast

- **Estimated changed lines**: ~320-420 (per design.md §7: schema ~15,
  cross-scope privilege ~10, Script Include method ~15, 3 operation files
  ~30, new client module ~80-120, `main.jsx` additions ~150-200).
- **400-line budget risk**: High — upper estimate meets/exceeds the 400-line
  single-PR guideline.
- **Chained PRs recommended**: Yes — natural split along the server/client
  boundary already used above:
  - **PR 1 (server)**: work units 1, 2, 3 — schema, cross-scope privilege,
    validator, operation updates. Self-contained, independently verifiable
    via `now-sdk build` + curl/API checks, ~70-90 lines.
  - **PR 2 (client)**: work units 0 (spike, informs PR 2 only), 4, 5, 6 —
    `platformContext` module, `ScopeTray`, switch flow, notices. Depends on
    PR 1 being merged (needs the new fields in `get-session`/
    `create-session` responses), ~230-320 lines.
  - **PR 3 (verification)**: work unit 7 — full-flow PDI QA and build
    parity, thin, can be its own final PR or folded into PR 2's tail commit
    if the team prefers one merge event for QA sign-off.
- **Decision needed before apply**: Yes — per `delivery_strategy:
  ask-on-risk`, confirm with the user whether to split into PR 1 (server)
  and PR 2 (client) — chain-strategy choice (`stacked-to-main` vs
  `feature-branch-chain`) is also not yet cached and should be resolved at
  the same time — or proceed as a single PR under a recorded
  `size:exception`.
