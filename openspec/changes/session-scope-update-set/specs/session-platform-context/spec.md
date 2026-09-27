# Spec Delta: session-platform-context

## ADDED Requirements

### Requirement: Session persists application and update set references
The `chat_session` table SHALL gain two nullable reference columns, `application`
(→ `sys_scope`) and `update_set` (→ `sys_update_set`), in addition to the existing
legacy `context_scope` string column, which MUST remain unchanged and untouched by
this change.

#### Scenario: New session created with application and update set
- **Given** a user creates a new session and selects application `x_acme_app` and
  update set `US0012345` in the tray
- **When** the session is created
- **Then** the `chat_session` record MUST store `application` referencing
  `x_acme_app`'s `sys_scope` record and `update_set` referencing `US0012345`'s
  `sys_update_set` record

#### Scenario: New session created without tray selection
- **Given** a user creates a new session without interacting with the tray
- **When** the session is created
- **Then** `application` and `update_set` MUST both be empty on the created session
  and session creation MUST succeed exactly as before this change

#### Scenario: Legacy context_scope writer unaffected
- **Given** `startSDD` in `sdd-orchestrator.server.js` writes `context_scope` as
  part of its existing flow
- **When** this change is applied
- **Then** `startSDD`'s write to `context_scope` MUST remain functionally
  unchanged, and no code path in this change MUST migrate or clear existing
  `context_scope` values

### Requirement: Selecting an existing update set switches ServiceNow's current context
When a user opens or selects an existing session that has a valid application and
update set, the client SHALL invoke `platformContext.setCurrent` to make that
session's application and update set the user's current ones in ServiceNow, and
SHALL show a non-blocking notice regardless of outcome.

#### Scenario: Switch succeeds
- **Given** a user selects an existing session whose `application` and
  `update_set` both reference valid, in-progress records
- **When** the session becomes active
- **Then** the client MUST call `platformContext.setCurrent` with that
  application and update set
- **And** on success, the client MUST show a brief non-blocking notice (for
  example, "Update set switched to US0012345") without blocking or delaying chat
  interaction

#### Scenario: Switch fails due to network or permission error
- **Given** a user selects an existing session with a valid application and
  update set
- **When** `platformContext.setCurrent` fails (network error or insufficient
  permission)
- **Then** the client MUST show a non-blocking error notice explaining the
  switch did not happen
- **And** the chat MUST remain fully usable; no action in the chat MUST be
  blocked or delayed by the failure

### Requirement: Auto-fill application scope from a selected existing update set
When creating a new session, selecting an existing in-progress update set from the
tray's picker SHALL auto-fill the application field with that update set's
`application` value, read via the Table API.

#### Scenario: Picking an existing update set auto-fills scope
- **Given** a user is in the new-session tray and opens the update set picker
- **When** the user selects an in-progress update set `US0012345` whose
  `application` is `x_acme_app`
- **Then** the tray's application field MUST be auto-filled with `x_acme_app`
- **And** the user MUST be able to proceed to create the session without any
  further manual application entry

### Requirement: Server-side rejection of application/update-set mismatch
`create-session` SHALL validate, when both an application and an update set are
provided, that the update set's `application` field matches the given
application, and SHALL reject the request otherwise.

#### Scenario: Mismatched application and update set rejected
- **Given** a request to create a session includes `application = x_acme_app`
  and `update_set = US0012345`
- **And** `US0012345.application` resolves to a different scope, `x_other_app`
- **When** `create-session` processes the request
- **Then** the operation MUST reject the request with an error identifying the
  mismatch
- **And** no `chat_session` record MUST be created

#### Scenario: Matching application and update set accepted
- **Given** a request to create a session includes `application = x_acme_app`
  and `update_set = US0012345`
- **And** `US0012345.application` resolves to `x_acme_app`
- **When** `create-session` processes the request
- **Then** the session MUST be created with both references persisted

### Requirement: Create a new update set from the tray
The tray SHALL let a user creating a new session enter a new update set name
together with an application scope, and this pair SHALL be required
(non-empty, trimmed) before the new update set is created. Creation of the
update set record SHALL happen when the session is created (on first send or
via the New session modal's create action), not while the user is still typing.

#### Scenario: Creating a new update set with valid inputs
- **Given** a user in the new-session tray chooses "create new update set"
- **And** enters application `x_acme_app` and update set name `Sprint 42`
  (both non-empty after trimming whitespace)
- **When** the session is created (first send or modal confirmation)
- **Then** a new `sys_update_set` record named `Sprint 42` MUST be created
  under `x_acme_app`
- **And** the new session's `application` and `update_set` MUST reference the
  newly created records

#### Scenario: Empty name or application blocks creation
- **Given** a user in the new-session tray chooses "create new update set"
- **And** leaves the update set name blank, or enters only whitespace, or
  leaves the application unselected
- **When** the user attempts to proceed
- **Then** the tray MUST NOT create an update set or submit the session with
  an incomplete new-update-set selection
- **And** the user MUST see a validation indication identifying the missing
  field

#### Scenario: No update set record created while typing
- **Given** a user is typing a new update set name in the tray
- **When** each keystroke occurs, before the session is created
- **Then** no `sys_update_set` record MUST be created as a side effect of
  typing

### Requirement: Existing sessions show read-only scope chips
For a session that already exists, the tray SHALL render read-only chips
showing the session's application and update set, with no control to switch,
edit, or clear either value from this UI in this change.

#### Scenario: Existing session displays read-only chips
- **Given** a session already exists with `application = x_acme_app` and
  `update_set = US0012345` (both currently in progress)
- **When** the user opens that session
- **Then** the tray MUST show a chip with the application name and a chip with
  the update set name, both non-interactive for editing
- **And** no "switch update set" or "change application" control MUST be
  rendered

### Requirement: Non-current or deleted update set is surfaced without silently switching
If a session's stored update set is no longer in progress (for example,
completed or ignored) or its record no longer exists, the tray SHALL reflect
that state on the chip, and selecting that session SHALL NOT change the user's
current update set.

#### Scenario: Update set no longer in progress
- **Given** a session's `update_set` reference points to a `sys_update_set`
  record whose state is `complete` or `ignore`
- **When** the user opens that session
- **Then** the update set chip MUST show the update set's name with a
  "not in progress" indicator
- **And** selecting the session MUST NOT call `platformContext.setCurrent` for
  the update set
- **And** the client MUST still attempt to set the application as current, if
  the application reference is still valid
- **And** the client MUST show a non-blocking notice explaining that the
  update set was not applied because it is not in progress

#### Scenario: Update set record deleted
- **Given** a session's `update_set` reference points to a `sys_update_set`
  sys_id that no longer resolves to any record
- **When** the user opens that session
- **Then** the update set chip MUST show "Update set unavailable"
- **And** selecting the session MUST NOT call `platformContext.setCurrent` for
  the update set
- **And** the client MUST show a non-blocking notice explaining the update set
  is unavailable

### Requirement: Sessions without application or update set do not alter platform context
Legacy sessions or sessions created without picking an application or update
set SHALL NOT trigger any call to `platformContext.setCurrent` when selected.

#### Scenario: Legacy session has neither reference
- **Given** a session has empty `application` and empty `update_set` (created
  before this change, or created without using the tray)
- **When** the user opens that session
- **Then** the client MUST NOT call `platformContext.setCurrent`
- **And** the client MUST NOT show any switch-related notice
- **And** the tray MUST NOT render application or update set chips for that
  session, or MUST render them in an empty/neutral state with no switch
  attempt

### Requirement: Tray pickers are keyboard-operable and labelled
All interactive tray controls (application picker, update set picker, new
update set name field, mode toggle between "existing" and "new") SHALL be
operable via keyboard alone and SHALL expose accessible labels.

#### Scenario: Keyboard-only interaction completes session creation
- **Given** a user navigates the new-session tray using only Tab, Shift+Tab,
  arrow keys, and Enter/Space
- **When** the user selects an existing update set, or switches to "create
  new" and fills in name and application
- **Then** the user MUST be able to complete the selection and submit session
  creation without using a pointing device
- **And** each control MUST expose a programmatically determinable label
  (for example, `aria-label` or an associated `<label>`) describing its
  purpose

#### Scenario: Read-only chips are announced correctly
- **Given** a screen reader user opens an existing session
- **When** the tray's read-only chips render
- **Then** each chip MUST expose its state (in progress, not in progress,
  unavailable) as accessible text, not conveyed by color alone
