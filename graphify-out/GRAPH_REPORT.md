# Graph Report - C:/Users/andym/Documents/GitHub/NowCode  (2026-09-09)

## Corpus Check
- 43 files · ~384,800 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 199 nodes · 230 edges · 39 communities (17 shown, 22 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 483,778 input · 0 output

## Community Hubs (Navigation)
- REST Operation Handlers
- Project Documentation Concepts
- React Chat Frontend
- LLM Context Providers
- Package Configuration
- Script Include Declarations
- SDD Orchestration Core
- Send Message and Create Session Flow
- Skill Registry
- LLM Gateway Integration
- Artifact Approval Flow
- Artifact Rejection Flow
- Model Listing Flow
- Session Detail Flow
- Session Listing Flow
- Design Skill Builders
- Session Archive Route
- Artifact Retrieval Route
- Message Retrieval Route
- Table Schema Route
- Table Search Route
- Context Filtering Pattern
- Plugin Introspection
- Client Artifact Loading
- Client Message Loading
- Practice Catalog
- Practice Category Lookup
- Best Practices Init
- Instance Info Lookup
- Design Skill Catalog
- Frontend Design Skill
- UI UX Pro Max Skill
- Phase Order Accessor

## God Nodes (most connected - your core abstractions)
1. `x_1733631_now_code_chat_session` - 18 edges
2. `x_1733631_now_code_sdd_artifact` - 12 edges
3. `openspec/config.yaml — Project Constitution` - 10 edges
4. `NowCodeSDDOrchestrator.buildSystemPrompt` - 8 edges
5. `NowCodeSDDOrchestrator._createMessage` - 8 edges
6. `x_1733631_now_code_chat_message` - 7 edges
7. `NowCodeSDDOrchestrator` - 7 edges
8. `x_1733631_now_code_sdd_artifact (table)` - 7 edges
9. `NowCodeSDDOrchestrator` - 6 edges
10. `NowCodeSDDOrchestrator.transitionPhase` - 6 edges

## Surprising Connections (you probably didn't know these)
- `SDD Phase State Machine (PHASE_ORDER / PHASE_TRANSITIONS)` --semantically_similar_to--> `Gentle AI SDD methodology`  [INFERRED] [semantically similar]
  AGENTS.md → openspec/config.yaml
- `NowCodeSDDOrchestrator` --references--> `NowCodeSDDOrchestrator (script_includes)`  [INFERRED]
  AGENTS.md → openspec/config.yaml
- `NowCodePlatformContext` --references--> `NowCodePlatformContext (script_includes)`  [INFERRED]
  AGENTS.md → openspec/config.yaml
- `NowCodeBestPractices` --references--> `NowCodeBestPractices (script_includes)`  [INFERRED]
  AGENTS.md → openspec/config.yaml
- `NowCodeDesignSkills` --references--> `NowCodeDesignSkills (script_includes)`  [INFERRED]
  AGENTS.md → openspec/config.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **NowCodeSDDOrchestrator composition (AGENTS.md request flow)** — agents_nowcodesddorchestrator, agents_nowcodeplatformcontext, agents_nowcodebestpractices, agents_nowcodedesignskills [EXTRACTED 1.00]
- **OpenCode Zen provider function extension point** — agents_opencode_zen_gateway, agents_sendchatcompletion, agents_sendanthropicmessage [EXTRACTED 1.00]
- **Now Code script includes documented in both AGENTS.md and openspec/config.yaml** — agents_nowcodesddorchestrator, openspec_config_nowcodesddorchestrator, agents_nowcodeplatformcontext, openspec_config_nowcodeplatformcontext [INFERRED 0.85]
- **SDD Message Send → LLM Call → Artifact Extraction Pipeline** — src_fluent_sdd_sdd_orchestrator_server_sendmessage, src_fluent_sdd_sdd_orchestrator_server_buildsystemprompt, src_fluent_sdd_sdd_orchestrator_server_calllm, src_fluent_sdd_sdd_orchestrator_server_extractartifact, nowcode_zen_api_restmessage [INFERRED 0.85]
- **SDD Phase Transition Control Flow** — src_fluent_sdd_sdd_orchestrator_server_cantransitionto, src_fluent_sdd_sdd_orchestrator_server_transitionphase, src_fluent_sdd_sdd_orchestrator_server_rejectproposal, src_fluent_sdd_sdd_orchestrator_server_approveproposal, src_fluent_sdd_sdd_orchestrator_server_phase_state_machine [INFERRED 0.85]
- **System Prompt Knowledge Assembly (Platform Context + Best Practices + Design Skills)** — src_fluent_sdd_sdd_orchestrator_server_buildsystemprompt, src_fluent_platform_platform_context_server_buildcontextfortable, src_fluent_platform_best_practices_server_formatforllm, src_fluent_sdd_design_skills_server_formatforllm [INFERRED 0.85]
- **SDD command handling flow (send message -> orchestrator -> sdd_artifact)** — src_fluent_api_operations_send_message_process, src_fluent_sdd_sdd_orchestrator_server_nowcodesddorchestrator, src_fluent_sdd_sdd_artifact_table_now_x_1733631_now_code_sdd_artifact [INFERRED 0.85]
- **Artifact review workflow (approve/reject via orchestrator)** — src_fluent_api_operations_approve_artifact_process, src_fluent_api_operations_reject_artifact_process, src_fluent_sdd_sdd_orchestrator_server_nowcodesddorchestrator [INFERRED 0.85]
- **Chat session lifecycle management (create, read, archive)** — src_fluent_api_operations_create_session_process, src_fluent_api_operations_get_session_process, src_fluent_api_operations_archive_session_process, src_fluent_chat_chat_session_table_now_x_1733631_now_code_chat_session [INFERRED 0.85]
- **SDD phase state flows across UI, session, message, artifact and orchestrator** — src_client_main_sdd_phases, src_fluent_chat_chat_session_table_now_x_1733631_now_code_chat_session, src_fluent_chat_chat_message_table_now_x_1733631_now_code_chat_message, src_fluent_sdd_sdd_artifact_table_now_x_1733631_now_code_sdd_artifact, src_fluent_sdd_sdd_orchestrator_now [INFERRED 0.85]
- **LLM gateway integration: orchestrator, credential alias, outbound REST message and cross-scope grants** — src_fluent_sdd_sdd_orchestrator_now, src_fluent_integrations_opencode_zen_alias_now, src_fluent_integrations_opencode_zen_rest_message_now, src_fluent_cross_scope_privileges_now [INFERRED 0.80]
- **Chat session lifecycle: React app, served UI page, session and message tables** — src_client_main_app, src_fluent_chat_chat_page_now, src_fluent_chat_chat_session_table_now_x_1733631_now_code_chat_session, src_fluent_chat_chat_message_table_now_x_1733631_now_code_chat_message [INFERRED 0.80]

## Communities (39 total, 22 thin omitted)

### Community 0 - "REST Operation Handlers"
Cohesion: 0.11
Nodes (13): SDD_PHASES constant, approveArtifact process(), createSession process(), getArtifacts process(), getMessages process(), getSession process(), rejectArtifact process(), sendMessage process() (+5 more)

### Community 1 - "Project Documentation Concepts"
Cohesion: 0.10
Nodes (26): src/fluent/api/operations (12 Scripted REST operations), AGENTS.md — Agent Guidance, src/fluent/generated/keys.ts, NowCodeBestPractices, NowCodeDesignSkills, NowCodePlatformContext, NowCodeSDDOrchestrator, OpenCode Zen gateway (sn_ws.RESTMessageV2) (+18 more)

### Community 2 - "React Chat Frontend"
Cohesion: 0.17
Nodes (11): react, apiCall(), App(), ChatMessage(), formatInline(), formatTime(), getPhaseInfo(), renderMarkdown() (+3 more)

### Community 3 - "LLM Context Providers"
Cohesion: 0.12
Nodes (18): NowCodeBestPractices.formatForLLM, NowCodePlatformContext.buildContextForTable, NowCodePlatformContext.buildScopeContext, NowCodePlatformContext.getBusinessRules, NowCodePlatformContext.getScriptIncludes, NowCodePlatformContext.getTableDocumentation, NowCodePlatformContext.getTableList, NowCodePlatformContext.getTableSchema (+10 more)

### Community 4 - "Package Configuration"
Cohesion: 0.12
Nodes (15): description, devDependencies, react-dom, @servicenow/glide, @servicenow/sdk, imports, #now:*, license (+7 more)

### Community 5 - "Script Include Declarations"
Cohesion: 0.16
Nodes (12): getTableSchema process(), sys_db_object (platform table, existence check), NowCodeBestPractices, NowCodePlatformContext, NowCodeDesignSkills, NowCodeSDDOrchestrator._loadConfig, NowCodeSDDOrchestrator._loadSession, NowCodeSDDOrchestrator._updateTokenCount (+4 more)

### Community 6 - "SDD Orchestration Core"
Cohesion: 0.30
Nodes (14): NowCodeSDDOrchestrator._createMessage, NowCodeSDDOrchestrator._getNextArtifactVersion, NowCodeSDDOrchestrator._getNextMessageIndex, NowCodeSDDOrchestrator.approveProposal, NowCodeSDDOrchestrator.canTransitionTo, NowCodeSDDOrchestrator.extractArtifact, NowCodeSDDOrchestrator.getSddStatus, NowCodeSDDOrchestrator.getSessionHistory (+6 more)

### Community 7 - "Send Message and Create Session Flow"
Cohesion: 0.33
Nodes (4): App.handleCreateSession, App.handleSendMessage, Route: POST /sessions (Create Session), Route: POST /sessions/{session_id}/messages (Send Message)

### Community 8 - "Skill Registry"
Cohesion: 0.40
Nodes (5): branch-pr skill, chained-pr skill, Skill Registry — NowCode, graphify skill, work-unit-commits skill

### Community 9 - "LLM Gateway Integration"
Cohesion: 0.67
Nodes (4): NowCode Zen API (sys_rest_message), NowCode Zen API — sendAnthropicMessage, NowCode Zen API — sendChatCompletion, NowCodeSDDOrchestrator.callLLM

### Community 15 - "Design Skill Builders"
Cohesion: 0.67
Nodes (3): NowCodeDesignSkills._buildFrontendDesignSkill, NowCodeDesignSkills._buildUiUxProMaxSkill, NowCodeDesignSkills.initialize

## Knowledge Gaps
- **61 isolated node(s):** `name`, `version`, `description`, `license`, `#now:*` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NowCodeSDDOrchestrator` connect `REST Operation Handlers` to `SDD Orchestration Core`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `NowCodeSDDOrchestrator.getSddStatus` connect `SDD Orchestration Core` to `REST Operation Handlers`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `x_1733631_now_code_sdd_artifact (table)` connect `SDD Orchestration Core` to `LLM Context Providers`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `x_1733631_now_code_chat_session` (e.g. with `SDD_PHASES constant` and `SessionItem()`) actually correct?**
  _`x_1733631_now_code_chat_session` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `x_1733631_now_code_sdd_artifact` (e.g. with `SDD_PHASES constant` and `SDDArtifactCard()`) actually correct?**
  _`x_1733631_now_code_sdd_artifact` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `REST Operation Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._