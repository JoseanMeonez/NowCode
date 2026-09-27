# Exploration: session-scope-update-set

## Request

A tray tucked under the composer. For a new session it lets the user pick an application scope and an update set, either an existing in-progress set or a new one. Picking an existing update set auto-fills its scope.

User decisions:
- **A:** persist the scope and update set on the chat session.
- **B:** when the user switches to a session, make its update set and application the user's current ones in ServiceNow.

## Current state

- `src/fluent/chat/chat-session.table.now.ts`: `context_scope` is a free-text `StringColumn(200)`. No update set column exists.
- Two writers set `context_scope`:
  - `create-session.js`, from `body.context_scope`;
  - `sdd-orchestrator.server.js` `startSDD()`, around line 748.
- Readers: `get-session.js` and `list-sessions.js` pass the value through unchanged.
- Client (`main.jsx`):
  - `NewSessionModal` has a raw text input for the scope.
  - `TopBar` shows `context_scope` as a read-only badge.
  - The tray will sit under `MessageInput`, which holds `.nc-composer-shell` and `.nc-composer-toolbar`.
- `src/fluent/cross-scope-privileges.now.ts` has only `scriptable` privileges targeting global. It has none of the table type.
- `keys.ts`: the `context_scope` entries appear three times. New columns only add entries, which is safe. The file must not be moved or renamed.

## Platform facts

- `GlideUpdateSet` has no scoped equivalent. Community guidance for driving it from a scoped app is a global-scope Script Include passthrough, called through a cross-scope privilege.
- The current update set and current application are stored as `sys_user_preference` records (`sys_update_set`, `apps.current_app`).
- **Verified on dev312366 (2026-09-19, as admin, from the app page with `X-UserToken`):**
  - `GET /api/now/ui/concoursepicker/application` returns 200 with `{ current, list[] }`. This is the Next Experience application picker; the list includes Global and store apps.
  - `GET /api/now/ui/concoursepicker/updateset` returns 200 with `{ updateSet[], current }` for the current application.
  - `GET /api/now/table/sys_scope` returns 200.
  - `GET /api/now/table/sys_update_set?sysparm_query=state=in progress` returns 200, and each set's `application` is included.
  - These are the endpoints the platform's own header pickers use. Switching is done with `PUT` on the same paths. The switching call was **not** exercised during exploration, because it changes the user's session.

## Approaches

### 1. Global passthrough Script Include

A `NowCodeUpdateSetBridge` in global scope wraps `GlideUpdateSet().set()` and `savePreference('apps.current_app')`. The app calls it through scriptable cross-scope privileges.

- **Pro:** it is the documented community pattern.
- **Con:** a Fluent scoped app ships records in its own scope only. A global Script Include cannot be part of this app's package, so it would need a separate global app or a manual update set. That adds a second deployable outside source control of this repo.

### 2. Client-side platform APIs, using the user's session

- Reads use the Table API for `sys_scope` and in-progress `sys_update_set` with their `application`.
- Creating an update set uses `POST /api/now/table/sys_update_set`.
- Switching uses the concourse picker endpoints: first the application, then the update set.
- **Pros:**
  - No global artifact and no new cross-scope privileges.
  - The user's own ACLs apply, so a user who cannot switch update sets in the UI cannot switch them here either.
  - The mechanism is the same one the platform header uses.
- **Cons:**
  - `concoursepicker` is an internal UI API, not a documented public contract, and may change between releases.
  - It introduces a second API surface in the client. Today `apiCall` only calls the app's own scripted REST API.

### 3. Scoped app REST operations plus direct cross-scope table privileges

Scripted REST operations read `sys_scope` and `sys_update_set` using table read privileges. The app writes preferences with `gs.getUser().savePreference()`.

- **Con:** writing the preference does not refresh the user's session cache of the current update set the way `GlideUpdateSet.set()` does, so it is likely unreliable. It also adds table-level cross-scope privileges.

## Recommendation (orchestrator synthesis)

**Approach 2**, isolated behind one client module, for example a `platformContext` helper with `listScopes`, `listUpdateSets(scope)`, `createUpdateSet(scope, name)` and `setCurrent(scope, updateSet)`. That way, a later swap to approach 1 touches one file.

Server side stays additive:
- **Session data:** add reference columns on `chat_session`, `application` to `sys_scope` and `update_set` to `sys_update_set`. Keep `context_scope` as a legacy string and do not migrate it.
- **Validation:** a server-side check in `create-session`. When an update set is given, it derives the application from `sys_update_set.application`, which the session record can read through the reference, and rejects a mismatch.
- **Tray behavior:** the tray is interactive only when there is no active session; for existing sessions it shows read-only chips.
- **Switching sessions:** it calls `setCurrent`. On failure it shows a non-blocking notice and never blocks the chat.

## Risks

- `concoursepicker` PUT payloads must be confirmed on the PDI during apply, because they are not documented. A failure must degrade gracefully.
- Switching sessions changes the user's current update set and application across all their ServiceNow tabs. This is the intended behavior (decision B), but the UI must make it visible, for example with a brief notice such as "Update set switched to X".
- Both writers of `context_scope` stay as they are. The new columns become the source of truth for new sessions, and `startSDD` keeps writing the legacy string.
- There is no automated test runner. Verification is `now-sdk build` plus a manual check on the PDI.
