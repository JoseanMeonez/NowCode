# Proposal: Session-Scoped Application and Update Set

## Intent

Chat sessions today carry a free-text `context_scope` string with no link to a real
`sys_scope` or `sys_update_set` record, and no way to pick or create an update set
from the chat UI. Users must leave the chat to switch application/update set in the
platform header before continuing work, which breaks the "plan and build inside the
chat" experience this app promises. This change lets a new session declare its
target application scope and update set (existing in-progress or newly created) from
a tray under the composer, persists both as real references on the session, and — per
product decision B — makes the session's application and update set the user's
current ones in ServiceNow when the session is opened.

## Scope

### In Scope
- New reference columns on `chat_session`: `application` (→ `sys_scope`) and
  `update_set` (→ `sys_update_set`).
- Client `platformContext` module wrapping Table API reads (`sys_scope`,
  in-progress `sys_update_set`) and concourse picker calls (list/switch current
  application + update set), isolated behind one file.
- Composer tray, interactive only when creating a new session: pick an existing
  in-progress update set (auto-fills its scope) or enter a new update set name plus
  application scope.
- Read-only scope/update-set chips on the tray for existing sessions (no editing
  after creation).
- Server-side validation in `create-session`: when an update set is given, derive
  its application from `sys_update_set.application` and reject a mismatch against
  the chosen application.
- On session switch (open/select an existing session), call `platformContext` to set
  that session's application and update set as the user's current ones, with a
  visible non-blocking notice (success or failure) that never blocks the chat.

### Out of Scope
- Changing `startSDD`'s legacy `context_scope` writer in `sdd-orchestrator.server.js`.
- Migrating existing sessions' `context_scope` values to the new reference columns.
- A global-scope Script Include bridge (Approach 1) — noted as a future fallback if
  `concoursepicker` endpoints prove unreliable across releases.
- Editing scope/update set after a session is created.

## Capabilities

### New Capabilities
- `session-platform-context`: session-scoped application + update set selection,
  persistence, validation, and "set as current" switching behavior.

### Modified Capabilities
None.

## Approach

Approach 2 from exploration: client-side platform APIs running under the user's own
session (Table API for `sys_scope`/`sys_update_set` reads and update-set creation;
`concoursepicker` endpoints for switching current application/update set). No new
global artifact, no new cross-scope privileges; the user's own ACLs govern what they
can read, create, or switch. All calls go through one `platformContext` client
module so a future swap to a global-scope bridge (Approach 1) is a single-file
change. Server side stays additive: new reference columns alongside the legacy
`context_scope` string, with validation living in `create-session`, not spread
across operations (per AGENTS.md: new behavior belongs in a Script Include).

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `src/fluent/chat/chat-session.table.now.ts` | Modified | Add `application` (ref → `sys_scope`) and `update_set` (ref → `sys_update_set`) columns |
| `src/fluent/api/operations/create-session.js` | Modified | Accept `application`/`update_set`, validate match via `sys_update_set.application` |
| `src/fluent/api/operations/get-session.js`, `list-sessions.js` | Modified | Pass through the two new reference fields |
| `src/client/platformContext.js` (new) | New | Table API reads + `concoursepicker` list/switch, isolated client module |
| `src/client/main.jsx` (`NewSessionModal`, `TopBar`, composer tray) | Modified | New-session tray (interactive) + read-only chips for existing sessions; switch-session notice |
| `src/fluent/generated/keys.ts` | Unaffected | New columns are non-`$id` artifacts; keys.ts only gains entries, never moves |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `concoursepicker` switch payloads are undocumented and unverified in this exploration | Medium | Confirm exact PUT payload/response on the PDI during apply; wrap in `platformContext.setCurrent` with try/catch and a non-blocking UI notice on failure |
| Switching sessions changes the user's current update set/app across all their ServiceNow tabs | Medium (by design, decision B) | Always show a visible notice ("Update set switched to X") on switch, success or failure |
| Two sources of scope truth (`context_scope` legacy string vs. new reference columns) could confuse future readers | Low | Document legacy status inline in `chat-session.table.now.ts`; `startSDD` explicitly out of scope for this change |
| User lacks permission to create/switch update sets | Low | Rely on the user's own session and ACLs (Approach 2 pro); creation/switch calls fail gracefully with the same notice mechanism |

## Rollback Plan

Revert the `chat-session.table.now.ts` column additions, `create-session.js`
validation, and the new `platformContext.js` + UI tray changes in one commit; the
legacy `context_scope` writers (`create-session.js` prior behavior, `startSDD`) are
untouched and keep working. Because the new columns are additive (no column removal
or rename), reverting is a straight code revert with no data migration needed — no
production data depends on the new columns until this change ships.

## Dependencies

- Verified PDI facts from exploration (`sys_scope`, `sys_update_set`, and
  `concoursepicker` GET behavior on dev312366); the switch (PUT) call must still be
  exercised during apply.

## Success Criteria

- [ ] Creating a new session lets a user pick an existing in-progress update set
      (auto-filling scope) or create a new update set with an explicit scope.
- [ ] `create-session` rejects a request where the given update set's application
      does not match the given application.
- [ ] Opening/switching to an existing session sets that session's application and
      update set as the user's current ones in ServiceNow, with a visible notice.
- [ ] Existing sessions show read-only scope/update-set chips; no edit affordance.
- [ ] `now-sdk build --frozenKeys` passes; `keys.ts` is unchanged in path and only
      gains entries.
- [ ] `startSDD`'s legacy `context_scope` writer is untouched and still functions.
