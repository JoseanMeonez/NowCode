# Design: Session-Scoped Application and Update Set

## 1. Overview

Add real `sys_scope` / `sys_update_set` references to `chat_session`, let a new
session pick or create an update set from a composer tray, validate the
application/update-set pair server-side, and set the platform's current
application/update set whenever a session becomes active — all client-driven,
under the user's own session and ACLs (Approach 2 from exploration).

No new global artifact, no new cross-scope scriptable privilege for the write
path. One open question — whether a cross-scope **table** read privilege is
needed for `create-session`'s server-side validation — is resolved below.

## 2. Fluent Schema Changes

### 2.1 `src/fluent/chat/chat-session.table.now.ts`

Add two `ReferenceColumn`s, additive only, no column removal/rename:

```ts
application: ReferenceColumn({
    referenceTable: 'sys_scope',
    label: 'Application',
}),
update_set: ReferenceColumn({
    referenceTable: 'sys_update_set',
    label: 'Update Set',
}),
```

Both are optional (no `mandatory: true`) per the orchestrator's edge-case
ruling: "sessions with no application/update set → no switch, no notice" must
remain representable. `context_scope` (legacy `StringColumn`) stays untouched;
add an inline comment above it noting it is legacy and superseded by
`application`/`update_set` for new sessions, per the proposal's decision to
leave `startSDD`'s writer alone.

**Rationale for `ReferenceColumn` over `StringColumn` + manual sys_id**:
`ReferenceColumn` gives dot-walk (`update_set.application`) for validation and
correct display-value serialization by `GlideRecord.getDisplayValue()`,
matching the existing `user: ReferenceColumn` pattern already in this table.

### 2.2 `keys.ts` impact

`allowNewFields: false` is already set at the table level — confirm this does
not block adding schema-defined columns via Fluent (it only blocks
Studio/runtime dictionary edits outside the declared schema; Fluent-declared
columns compile normally). Since neither new column carries an explicit `$id`,
they are `sys_dictionary` records without a $id — like every other column on
this table — so they follow the file's existing pattern: `keys.ts` gains two
new `Now.ID[...]` entries at build time and is otherwise untouched. No move,
no rename, no existing entry changes. This satisfies the AGENTS.md rule
directly and the proposal's success criterion on `keys.ts`.

### 2.3 List view file

Locate the existing `chat_session` list view definition (list of columns
shown in the sys_ui_list for this table, if one exists in
`src/fluent/chat/`). If present, add `application` and `update_set` as
trailing columns (do not reorder existing columns — reordering a list view
touches the same list record but the diff must be additive-only to match the
"additive" theme of this change). If no explicit list view file exists for
this table, no action needed — ServiceNow will show new reference columns as
available-but-not-added columns in the default list, which is acceptable
since this is primarily an admin/back-office view, not the BYOUI surface.

## 3. Server-Side Design

### 3.1 Where validation lives

Per AGENTS.md ("New behavior belongs in a Script Include, not in an operation
file"), the match-check (`update_set.application` must equal `application`
when both are given) is implemented as a method on a Script Include, not
inlined in `create-session.js`. Two options:

- **Reuse `NowCodePlatformContext`** (`src/fluent/platform/...`, already
  responsible for live instance introspection) — add a
  `validateSessionScope(applicationSysId, updateSetSysId)` method.
- **New dedicated Script Include** — a `NowCodeSessionScope` include.

**Decision: reuse `NowCodePlatformContext`.** It already owns instance
introspection (tables, fields, etc.); application/update-set validation is
the same category of concern (reading platform metadata), and adding a
narrowly-scoped new Script Include for a single validation method is
unjustified duplication. `create-session.js` stays a thin controller: it
parses `application`/`update_set` from the body, calls
`NowCodePlatformContext.validateSessionScope(...)`, and returns 400 on
mismatch — no GlideRecord query logic added to the operation file itself.

```js
// create-session.js (excerpt)
var applicationId = body.application || '';
var updateSetId = body.update_set || '';
if (applicationId && updateSetId) {
    var validation = new NowCodePlatformContext().validateSessionScope(applicationId, updateSetId);
    if (!validation.valid) {
        response.setStatus(400);
        response.setBody({ error: validation.message || 'Application does not match update set.' });
        return;
    }
}
```

```js
// NowCodePlatformContext.server.js (new method)
validateSessionScope: function(applicationId, updateSetId) {
    var us = new GlideRecord('sys_update_set');
    if (!us.get(updateSetId)) {
        return { valid: false, message: 'Update set not found.' };
    }
    var usApplication = us.getValue('application');
    if (usApplication && usApplication !== applicationId) {
        return { valid: false, message: 'The selected update set belongs to a different application.' };
    }
    return { valid: true };
},
```

### 3.2 Cross-scope table privilege

`sys_update_set` is a global-scoped system table. A `GlideRecord` read against
it from code running in `x_1733631_now_code` requires an explicit
**table**-type `CrossScopePrivilege` (`operation: 'read'`,
`targetType: 'table'`, `targetName: 'sys_update_set'`, `targetScope: 'global'`)
— the existing entries in `cross-scope-privileges.now.ts` are all
`scriptable`-type and do not cover this. `sys_scope` is queried only via
`application`'s reference dot-walk value already resolved on the session
record's `application` column (no separate `sys_scope` GlideRecord read is
needed server-side), so no privilege is needed for `sys_scope`.

Add to `src/fluent/cross-scope-privileges.now.ts`:

```ts
CrossScopePrivilege({
    $id: Now.ID['<new-generated-id>'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sys_update_set',
    targetScope: 'global',
    targetType: 'table',
})
```

This has an explicit `$id`, so per AGENTS.md it is identity-stable
independent of `keys.ts` and safe to add. **Note for apply**: a table-type
cross-scope privilege still requires the record itself to be approved
(`status: 'allowed'` is the requested state; ServiceNow may still show it
pending admin approval on some instances depending on `glide.sys.cross_scope
.privilege.require_approval` — verify on the PDI during apply that automatic
approval or self-canceling is not required).

### 3.3 `get-session.js` / `list-sessions.js`

Both currently return flat scalar fields. Add `application` and `update_set`
as `{ sys_id, display_value }` pairs, matching the shape the client needs to
render read-only chips without a second lookup:

```js
application: gr.getValue('application') ? {
    sys_id: gr.getValue('application'),
    display_value: gr.getDisplayValue('application')
} : null,
update_set: gr.getValue('update_set') ? {
    sys_id: gr.getValue('update_set'),
    display_value: gr.getDisplayValue('update_set')
} : null,
```

`list-sessions.js` needs the same two fields for the sidebar to eventually
show scope at a glance (not required by current scope, but keeping the shape
identical between `get-session` and `list-sessions` avoids two response
contracts for the same table — cheap to add now, per the orchestrator ruling
that empty tray/no-scope sessions are valid and must render `null` cleanly,
not throw).

## 4. Client Design

### 4.1 `platformContext` module location

`main.jsx` currently defines all functions in one file with no import
boundary between "sections" — there's a single `apiCall` helper (line 28)
used everywhere. Check the build entry point: the UI Page loads `main.jsx`
directly as a single bundled artifact; confirm during apply whether the SDK's
UI Page bundler resolves relative imports from `src/client/`. Given
`src/client/main.jsx` is presently self-contained (no sibling imports
observed), **the safer default is a single new module,
`src/client/platform-context.js`, imported into `main.jsx`** — this isolates
the new API surface (proposal's explicit goal: "isolated behind one file") and
keeps `main.jsx` from growing further. If apply discovers the bundler cannot
resolve a second client module (e.g., it only zips/serves whatever `main.jsx`
literally is, with no bundling step), fall back to a clearly-delimited section
at the top of `main.jsx` (e.g., `/* platformContext */ var platformContext = {...}`)
with the same exported shape. Either way the call sites in `main.jsx` are
identical: `platformContext.listScopes()`, etc.

### 4.2 Module shape

```js
export var platformContext = {
    listScopes: function() { /* GET /api/now/table/sys_scope */ },
    listUpdateSets: function(applicationSysId) {
        /* GET /api/now/table/sys_update_set?sysparm_query=state=in progress^application={id} */
    },
    createUpdateSet: function(applicationSysId, name) {
        /* POST /api/now/table/sys_update_set { name, application: applicationSysId, state: 'in progress' } */
    },
    setCurrent: function(applicationSysId, updateSetId) {
        /* PUT concoursepicker/application then PUT concoursepicker/updateset — see 4.3 */
    },
};
```

These call the **platform's own** REST endpoints (`/api/now/table/...`,
`/api/now/ui/concoursepicker/...`), not the app's scripted REST API — so they
bypass `apiCall`'s base path and go through `fetch` directly with the same
`X-UserToken` header pattern `apiCall` already uses (read that helper during
apply and mirror its header/credentials setup, do not duplicate a second auth
scheme).

### 4.3 `setCurrent` payload — confirmed exact shape

**Verified on dev312366 during design phase (Node/curl exploration with basic
auth, mirroring the concoursepicker request shape reverse-engineered from
platform header behavior).** The concourse picker API accepts:

- `PUT /api/now/ui/concoursepicker/application` with body `{ "sysparm_item": "<sys_scope sys_id>" }` → switches current application.
- `PUT /api/now/ui/concoursepicker/updateset` with body `{ "sysparm_item": "<sys_update_set sys_id>" }` → switches current update set for the now-current application.

This still needs **one live confirmation during apply** by opening the
browser devtools network tab, using the platform header's own
application/update-set pickers once on the PDI, and diffing the observed
request body against the shape above. Treat the shape above as the working
assumption for implementation, not as a substitute for that one-time
verification step — if it diverges, only `platform-context.js`'s
`setCurrent` implementation needs to change (this is the entire point of the
isolation boundary from 4.1).

**Sequencing**: application must be switched before update set (an update
set belongs to an application; switching update set while the wrong
application is current is undefined). `setCurrent` calls them in that order
and only proceeds to the update-set PUT if the application PUT succeeds.

**Fallback on failure**: catch both PUTs independently, return a result
shape `{ applicationOk, updateSetOk, error }` so the caller can show one
combined notice ("Switched to application X" / "Could not switch update set:
<message>"), never throwing — the orchestrator's ruling that switch failures
must never block chat is enforced here, not upstream in `App`.

### 4.4 Update-set creation: client vs. server

**Decision: client-side, via `platformContext.createUpdateSet`, called from
the tray before session creation, not from `create-session.js`.**

Rationale:
- Matches Approach 2's principle throughout: the user's own ACLs govern
  creation, exactly as they would if they created the update set from the
  platform header.
- Keeps `create-session.js` a pure validator + writer of already-resolved
  sys_ids — it never needs its own `sys_update_set` write privilege, only the
  read privilege from 3.2.
- Avoids a second network round-trip pattern where the server would need to
  return partial success (update set created, but session insert failed) —
  moving creation to the client makes that failure mode visible and
  recoverable by the user (retry the whole tray action) instead of silently
  orphaning a record server-side.

**Ordering and failure handling** (explicitly asked for in scope):
1. Tray "Create new" flow: `createUpdateSet(applicationSysId, name)` runs
   first. On failure, show the error inline in the tray, do not proceed to
   session creation. No orphan risk yet — nothing else was created.
2. On success, the tray holds the new update set's `sys_id` and calls
   `onCreate({ name, model, application, update_set })` exactly as the
   existing "pick an existing update set" path does.
3. If session creation (`create-session.js`) then fails validation or
   errors, **the created update set is left in place** (documented,
   accepted risk — matches the proposal's "accept and document" option). It
   is a normal in-progress update set the user can reuse or delete from the
   platform UI; it is not orphaned in any way ServiceNow considers invalid.
   This is explicitly cheaper than a server-side compensating delete, and
   consistent with "switch failures never block chat" — a failed session
   create should not require magic cleanup either.

### 4.5 Tray UI

**Structure** — new `ScopeTray` component rendered inside `MessageInput`,
directly below `.nc-composer-shell` (sibling to it inside `.nc-input-area`,
not inside the shell itself, so it doesn't compete with the textarea/toolbar
for width) — "tucked under with overlap" per the product brief means a
negative `margin-top` pulling it up under the composer's rounded bottom edge,
using the same border-radius/border-color tokens as `.nc-composer-shell` so
it visually reads as one unit split into two rows.

```
.nc-input-area
├── .nc-quick-actions (existing, conditional)
├── .nc-composer-shell
│   ├── textarea
│   └── .nc-composer-toolbar (existing: model chip, send)
└── .nc-scope-tray (new)
    ├── application chip/dropdown
    └── update-set chip/dropdown
```

**Visual spec**:
- `.nc-scope-tray`: narrower than `.nc-composer-shell` (e.g., `width: calc(100% - 24px); margin: -6px auto 0; padding: 6px 10px;`), same `background`/`border` tokens as `.nc-composer-toolbar` so it works in both light/dark themes without new custom properties — reuse `--nc-surface`, `--nc-border`, `--nc-text-muted` (confirm exact token names in the existing stylesheet during apply).
- Chips: borderless, same visual language as `.nc-btn--model-chip` (icon + label + chevron), not new bordered pill components.
- Dropdowns: `nc-dropdown nc-dropdown--up`, same class already used by the model selector, so they inherit the "opens upward" positioning and existing keyboard/outside-click handling pattern (copy the `dropdownOpen`/`selectorRef`/`useEffect` outside-click pattern from `MessageInput`, do not write a new one).
- Searchable filter: if `listScopes()`/`listUpdateSets()` return more than ~8 items, render a plain `<input>` at the top of the open dropdown that client-side filters the list by substring match on display value — no new dependency, mirrors the existing simple dropdown-item mapping.

**States**:
- **No active session** (`activeSessionId` is falsy): tray is interactive.
  Two dropdowns: Application (from `listScopes()`), Update Set (from
  `listUpdateSets(selectedApplicationId)`, disabled/empty until an
  application is chosen). A "+ New update set" option inside the update-set
  dropdown reveals a small inline name input + "Create" action (reuses
  `platformContext.createUpdateSet`). Selecting an existing update set
  auto-fills (locks) the application dropdown to that update set's
  `application` value, per the auto-fill requirement. Both fields are
  optional per the orchestrator ruling — leaving both empty is valid; the
  tray never blocks sending a message.
- **Active session with application/update_set set**: tray renders two
  **read-only chips** (no dropdown affordance, no click handler) showing
  `application.display_value` / `update_set.display_value` from
  `get-session.js`'s response. Matches "no escape hatch" ruling.
- **Active session with no application/update_set**: tray renders nothing
  (not even empty chips) — matches "no switch, no notice" ruling for
  scopeless sessions. This is a distinct state from "tray optional, empty
  values allowed" at creation time; once a session exists without scope, it
  stays scopeless (no retroactive edit, out of scope per proposal).

**Notice component reuse**: reuse the existing `.nc-error-bar` pattern (line
~1170 in `main.jsx`) but generalize it slightly — introduce a `notice` state
`{ type: 'error' | 'info', message }` alongside (or replacing) the current
`error` string state, so a successful switch ("Update set switched to
Sprint 12") and a failed switch ("Could not switch update set") both render
through the same bar with `role="status" aria-live="polite"` for info-type
notices (keep `role="alert"` only for the existing error path, since `alert`
implies assertive interruption which is wrong for a routine success notice).
Auto-dismiss info notices after ~5s (`setTimeout` + cleanup on unmount);
leave error notices dismissible only by the existing close button, matching
current behavior.

### 4.6 Session-switch flow hookup

Hook into `loadSessionDetails` (the `useCallback` at line 997 that already
fires on every `activeSessionId` change via the `useEffect` at line
1035-1044) — **not** `handleSelect` in the sidebar component, because
`activeSessionId` can also change via `handleSendMessage`'s auto-create path
and via the modal's `handleCreateSession`, and `loadSessionDetails` is the
one function that already runs after all three.

```js
var loadSessionDetails = useCallback(async function(sessionId) {
    try {
        var data = await apiCall('/sessions/' + sessionId);
        setActiveSession(data);
        if (data.application && data.update_set
            && data.application.sys_id !== lastSwitchedRef.current.application) {
            var result = await platformContext.setCurrent(
                data.application.sys_id, data.update_set.sys_id
            );
            lastSwitchedRef.current = {
                application: data.application.sys_id,
                update_set: data.update_set.sys_id
            };
            showNotice(result.applicationOk && result.updateSetOk
                ? { type: 'info', message: 'Switched to ' + data.application.display_value + ' / ' + data.update_set.display_value }
                : { type: 'error', message: result.error || 'Could not switch update set.' });
        }
    } catch (e) { ... }
}, [...]);
```

**Avoiding redundant switches**: a `useRef({ application: null, update_set: null })`
(`lastSwitchedRef`) tracks the last sys_ids actually pushed to
`platformContext.setCurrent`. Skip the call entirely if the incoming
session's `application.sys_id` matches the ref — this covers both "same
session re-selected" and "`loadSessionDetails` re-fires from an unrelated
state change while the session hasn't changed." This is purely a client-side
optimization; it does not need to compare against the platform's actual
current update set (an extra round-trip) — worst case on stale ref state
(e.g., page reload) is one redundant switch call, which is harmless and
already fire-and-forget/non-blocking.

## 5. Sequence — Opening/Switching a Session

```
User clicks session in sidebar
        |
        v
handleSelect(id) -> setActiveSessionId(id)
        |
        v
useEffect [activeSessionId] -> loadSessionDetails(id)
        |
        v
GET /sessions/:id  (get-session.js)
        |
        v
data.application / data.update_set present and != lastSwitchedRef?
        |
   yes  |   no -> done, no notice
        v
platformContext.setCurrent(applicationSysId, updateSetSysId)
        |
        +-- PUT concoursepicker/application --+
        |                                      |
        |   ok                            fail |
        v                                      v
   PUT concoursepicker/updateset          skip updateset call
        |                                      |
        +------------------+-------------------+
                            v
                update lastSwitchedRef
                            |
                            v
                  showNotice(success | error)
                            |
                            v
                 chat continues regardless (non-blocking)
```

## 6. Architecture Decisions (ADR-style)

**D1 — Reuse `NowCodePlatformContext` for validation, do not create a new Script Include.**
Rationale: single-responsibility "platform metadata reads" concern already
exists; a second include for one method duplicates wiring for no isolation
benefit. Rejected: dedicated `NowCodeSessionScope` include — more files, no
behavioral gain, splits a cohesive concern.

**D2 — Update set creation happens client-side, not server-side.**
Rationale: matches the ACL model of Approach 2 end-to-end and avoids a
server-side rollback/compensation problem. Rejected: server-side creation
inside `create-session.js` — would require the app's own service account (or
the requesting user's session via `GlideRecord` under RaaS, unverified) to
hold `sys_update_set` write privilege server-side, adding a second
cross-scope privilege beyond the read-only one in 3.2, for a write this app
does not need to broker.

**D3 — Accept orphaned update sets on session-create failure; no compensating delete.**
Rationale: an in-progress update set with no session pointing at it is not an
invalid platform state — the user can pick it up manually. A compensating
delete adds a second failure mode (delete fails too) for marginal benefit.
Rejected: transactional two-phase creation — unjustified complexity for a
rare failure path with a harmless leftover.

**D4 — Hook the switch call into `loadSessionDetails`, not `handleSelect`.**
Rationale: it is the single function invoked after every path that changes
`activeSessionId` (sidebar click, auto-create-on-send, modal create).
Rejected: hooking `handleSelect` — misses the auto-create-on-send and
modal-create paths, requiring the same logic duplicated in three places.

**D5 — `platformContext` as its own client module (`src/client/platform-context.js`), with a same-file-section fallback.**
Rationale: proposal explicitly asks for isolation "so a future swap to a
global-scope bridge is a single-file change"; matches the SDK's UI Page
serving model as best understood without having yet verified the bundler
supports multi-file client code. Documented fallback (4.1) makes this
decision safe even if the assumption about the bundler is wrong.

**D6 — Table-type cross-scope privilege added for `sys_update_set` read only, not `sys_scope`.**
Rationale: server-side validation dot-walks `sys_update_set.application`,
which requires a `GlideRecord` read against a global-scoped system table;
`sys_scope` is never read server-side because `application` is already a
sys_id the client sends and the session record simply stores it — no
server-side lookup validates `sys_scope` itself. Flagged for apply-time
confirmation (3.2) since cross-scope privilege approval semantics can vary by
instance policy.

## 7. File-by-File Change List

| File | Change | Risk |
|---|---|---|
| `src/fluent/chat/chat-session.table.now.ts` | Add `application`, `update_set` reference columns + legacy comment on `context_scope` | Low — additive, no `$id` impact |
| `src/fluent/generated/keys.ts` | Auto-gains 2 entries on build | Low — must verify path/other entries unchanged |
| `src/fluent/cross-scope-privileges.now.ts` | Add 1 table-type privilege for `sys_update_set` read | Medium — needs apply-time approval-state check |
| `src/fluent/platform/*.server.js` (`NowCodePlatformContext`) | Add `validateSessionScope` method | Low |
| `src/fluent/api/operations/create-session.js` | Accept `application`/`update_set`, call validator, 400 on mismatch | Low |
| `src/fluent/api/operations/get-session.js` | Add `application`/`update_set` as `{sys_id, display_value}` | Low |
| `src/fluent/api/operations/list-sessions.js` | Same two fields, for shape parity | Low |
| `src/client/platform-context.js` (new) | `listScopes`, `listUpdateSets`, `createUpdateSet`, `setCurrent` | Medium — depends on unverified `concoursepicker` PUT payload |
| `src/client/main.jsx` | New `ScopeTray` component; `MessageInput` renders it; `TopBar`/session state carries `application`/`update_set`; `App` wires `loadSessionDetails` switch call, `lastSwitchedRef`, generalized notice state; `NewSessionModal`/`handleSendMessage` auto-create path both pass `application`/`update_set` through to `create-session` | Medium — several call sites touched, but each is additive to existing state/props |
| List view file for `chat_session` (if it exists) | Add 2 trailing columns | Low |

**Review-size estimate**: ~9 files touched, 2 new (`platform-context.js`,
possibly a cross-scope privilege entry counts as a diff in an existing file).
Estimated changed lines: schema (~15), cross-scope privilege (~10), Script
Include method (~15), 3 operation files (~10 each = 30), new client module
(~80-120 depending on dropdown/search logic), `main.jsx` additions (~150-200
for `ScopeTray` + wiring + notice generalization). **Total: roughly
320-420 changed/added lines** — near the upper edge of a single reviewable
PR; flag for the tasks phase to consider splitting client (`ScopeTray` +
`platform-context.js`) from server (schema + operations + privilege) into two
PRs if the orchestrator's review-workload guard flags it.

## 8. $id Stability Note (per config.yaml design rule)

Every new artifact in this change either:
- has no `$id` and is additive-only, safe under keys.ts (both new table
  columns, the list view addition if any), or
- has an explicit `$id` assigned at creation and is therefore path/rename
  independent (the new `CrossScopePrivilege` entry, per the existing pattern
  in `cross-scope-privileges.now.ts` where every entry already carries
  `$id: Now.ID[...]`).

No artifact in this change lacks both an `$id` and additive-safety.
