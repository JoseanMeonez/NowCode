# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## What this is

Now Code is a ServiceNow custom scoped app (`x_1733631_now_code`) written as a
**Fluent** project — ServiceNow artifacts declared as TypeScript instead of
configured in Studio. It embeds an AI chat inside the platform that plans work
using Spec-Driven Development before generating anything.

The full product definition and project constitution live in
`openspec/config.yaml`. Read it before planning any change.

## Commands

```bash
now-sdk build                    # compile src/fluent -> dist/app (XML) + type check
now-sdk build --frozenKeys       # same, but FAILS if keys.ts changed — pre-merge check
now-sdk install -a dev440743     # deploy to the instance
npm run types                    # regenerate @types/servicenow from the instance schema

# read any table on the instance (read-only; the SDK has no write/delete)
now-sdk query <table> -q "<encoded query>" -f "field1,field2" -a dev440743

now-sdk explain <topic>          # local SDK docs; `now-sdk explain` lists all topics
```

There is **no test framework** — no jest, no vitest, no ATF suites. `now-sdk build`
is the only automated gate, and it verifies that code compiles and that record
identities are unchanged, *not* that logic is correct. Treat that gap as real when
assessing risk.

## The two things that will break the instance

**1. `src/fluent/generated/keys.ts` has a fixed canonical path and must always be committed.**

It maps `Now.ID['...']` identifiers to real ServiceNow sys_ids. Artifacts with an
explicit `$id` in their `.now.ts` (ScriptInclude, RestApi + routes,
CrossScopePrivilege, Alias, RestMessage) carry their identity inline and survive
file renames and moves. Everything else — Table, sys_dictionary, sys_choice, List,
UiPage assets, sys_rest_message_fn, sys_ws_query_parameter_map — depends on
keys.ts. Move it or drop it from a commit and the build mints fresh sys_ids, which
turns `install` from an update into an insert and duplicates every one of those
records on the target instance. See `now-sdk explain ci-integration`.

**2. Any structural refactor must be verified against the build output, not the type checker.**

```bash
now-sdk build && find dist/app -type f -exec md5sum {} \; | sort -k2 > before.txt
# ... refactor ...
now-sdk build && find dist/app -type f -exec md5sum {} \; | sort -k2 | diff before.txt -
```

The only acceptable difference is `dist/app/update/sys_module_2a10ba17bdd24b87804085479f46cb79.xml`,
which carries a fresh serialNumber UUID and timestamp on every build. A refactor
can pass the type check, produce a clean build, and still silently re-identify
every record — this diff is what catches it.

## Request flow

```
src/client/main.jsx  (React BYOUI, served as UI Page x_1733631_now_code_chat.do)
        |  fetch /api/x_1733631_now_code/now_code_api/...
        v
src/fluent/api/operations/*.js        16 Scripted REST operations, thin controllers
        |                              validate input, load GlideRecord, delegate
        v
NowCodeSDDOrchestrator                 src/fluent/sdd/sdd-orchestrator.server.js
        |                              owns the SDD state machine and all LLM calls
        |-- NowCodePlatformContext     live instance introspection (tables, fields,
        |                              business rules, script includes, plugins)
        |-- NowCodeBestPractices       ServiceNow platform standards
        |-- NowCodeDesignSkills        frontend/UX guidance for generated UI
        v
NowCodeLLMClient                       src/fluent/integrations/llm-client.server.js
        |                              per-user key, model listing, wire-format routing
        v
sn_ws.RESTMessageV2() (direct endpoint)
        v
OpenCode Go gateway (https://opencode.ai/zen/go/v1)   — or Zen / any OpenAI-compatible URL
```

The REST layer holds no business logic. `send-message.js` is the widest operation
and still only parses the request, guards session state, dispatches an optional
`sdd_command`, and hands off. **New behavior belongs in a Script Include, not in an
operation file.**

The API key is never in code. Each user pastes it once in the chat UI (Settings,
bottom-left of the sidebar); `PUT /settings` stores it in
`x_1733631_now_code_provider_config.api_key`, a **Password2** (encrypted) field,
and it is never returned to the browser — only a masked hint. Resolution order in
`NowCodeLLMClient.getSettings()`: the user's own record → a shared record with an
empty `user` (admins can create one from the list to give everyone a key) → the
legacy `x_1733631_now_code.zen.api_key` system property. The table's ACLs deny
everyone but admins; app code reaches it through `GlideRecord` server-side.

`NowCodeLLMClient` owns every provider call. `GET {base}/models` feeds the model
picker (static `FALLBACK_MODELS` when there is no key or the call fails).
`MODEL_FAMILIES` maps a model-id prefix to the wire format the OpenCode gateways
serve it on — `chat` (`/chat/completions`), `messages` (Anthropic `/messages`) or
`responses` (OpenAI `/responses`) — and `chat()` retries the other formats when the
gateway answers 400/404/405/415/422/501/503. New model families and providers are
added there (`PROVIDERS`, `MODEL_FAMILIES`), not in the orchestrator.

Synchronous outbound REST is capped by `glide.http.outbound.max_timeout` (30 s by
default). Long answers exceed that; the client turns the timeout into a message
asking an admin to set `glide.http.outbound.max_timeout.enabled = false` so the
client's own 180 s `setHttpTimeout` applies.

The `NowCode Zen API` REST message and the `NowCode OpenCode Zen` alias are legacy
records from the first import; nothing calls them any more. They are kept so
`install` does not have to delete instance records.

## The SDD state machine

`NowCodeSDDOrchestrator` defines `PHASE_ORDER`, `PHASE_TRANSITIONS` and
`PHASE_ARTIFACT_TYPES`. Phases advance only along declared edges:

```
none -> init -> explore -> propose -> spec -> design -> tasks -> apply -> verify -> archive -> onboard
                              ^                                              |
                              +--(back to explore)          (verify fails)---+--> apply
```

Two rules are enforced in code, not by convention: `propose -> spec` requires an
**approved** proposal artifact, and a failed `verify` loops back to `apply`. Each
phase writes a typed record into `x_1733631_now_code_sdd_artifact`.

## Careful: there are two OpenSpec configs

They are unrelated and easy to confuse.

| | Purpose |
|---|---|
| `openspec/config.yaml` (this repo) | Governs SDD for **developing this app**. Read by coding agents. |
| `x_1733631_now_code_openspec_config` (instance table) | Runtime rules the **shipped app** applies to *its* users' SDD sessions. Read by `NowCodeSDDOrchestrator._loadConfig()`. |

Changing one does not affect the other.

## Working rules

**The repo is the source of truth. Studio is read-only.** Fluent does not cover
Flow Designer or UI Builder, so if either is touched on the instance, pull it back
immediately with `now-sdk transform --table <table>` and commit. Otherwise the next
`install` silently overwrites it.

`src/fluent/` is organized **by feature** (`chat/`, `sdd/`, `platform/`, `api/`,
`integrations/`), not by artifact type. Files are named after what they define.
Follow that when adding artifacts.

Each Script Include is a pair: the `.now.ts` declares the record, the `.server.js`
holds the code, wired by `Now.include('./<name>.server.js')`. Edit the `.server.js`
for logic. If you move either file, update the relative path in the same commit.

**Known SDK 4.11 bug:** `ListPlugin failed to get update name for record:
sys_ui_list / Failed to cast UnresolvedShape to StringShape` on lists over *system*
tables. One such list exists on the instance and is deliberately absent from this
repo — do not try to "fix" the gap by adding it.

`now-sdk install --reinstall` uninstalls before reinstalling and destroys
instance-side data. Do not use it to clean up drift.
