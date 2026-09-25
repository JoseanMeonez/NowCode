var NowCodeSDDOrchestrator = Class.create()
NowCodeSDDOrchestrator.prototype = {
    // ═══════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════

    /** Ordered SDD phases */
    PHASE_ORDER: [
        'init',
        'explore',
        'propose',
        'spec',
        'design',
        'tasks',
        'apply',
        'verify',
        'archive',
        'onboard',
    ],

    /** Valid transitions from each phase */
    PHASE_TRANSITIONS: {
        none: ['init'],
        init: ['explore'],
        explore: ['propose'],
        propose: ['explore', 'spec'], // spec requires approved proposal
        spec: ['design'],
        design: ['tasks'],
        tasks: ['apply'],
        apply: ['verify'],
        verify: ['archive', 'apply'], // fail loops back to apply
        archive: ['onboard'],
        onboard: [],
    },

    /** Default artifact type produced by each phase */
    PHASE_ARTIFACT_TYPES: {
        init: 'context_snapshot',
        explore: 'context_snapshot',
        propose: 'proposal',
        spec: 'specification',
        design: 'design_doc',
        tasks: 'task_list',
        apply: 'context_snapshot',
        verify: 'verification_report',
        archive: 'archive_summary',
        onboard: 'context_snapshot',
    },

    // ═══════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════

    /**
     * Loads session, config, and sets up context helpers.
     * @param {string} sessionId - sys_id of the chat_session record
     */
    initialize: function (sessionId) {
        this.sessionId = sessionId || ''
        this.session = null
        this.config = null
        this.platformContext = new NowCodePlatformContext()
        this.bestPractices = new NowCodeBestPractices()
        this.designSkills = new NowCodeDesignSkills()

        if (this.sessionId) {
            this._loadSession()
        }
    },

    /** @private Load the chat session record into this.session */
    _loadSession: function () {
        var gr = new GlideRecord('x_1733631_now_code_chat_session')
        if (gr.get(this.sessionId)) {
            this.session = {
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                model: gr.getValue('model') || '',
                model_endpoint: gr.getValue('model_endpoint') || '',
                sdd_phase: gr.getValue('sdd_phase') || 'none',
                sdd_active:
                    gr.getValue('sdd_active') === 'true' || gr.getValue('sdd_active') === '1',
                status: gr.getValue('status'),
                context_scope: gr.getValue('context_scope') || '',
                total_tokens: parseInt(gr.getValue('total_tokens'), 10) || 0,
                user: gr.getValue('user'),
            }
            this._loadConfig()
        } else {
            gs.error('NowCodeSDDOrchestrator: Session not found: ' + this.sessionId)
        }
    },

    /** @private Load the OpenSpec config for the current session */
    _loadConfig: function () {
        var gr = new GlideRecord('x_1733631_now_code_openspec_config')
        gr.addQuery('session', this.sessionId)
        gr.query()
        if (gr.next()) {
            this.config = {
                sys_id: gr.getUniqueValue(),
                project_context: gr.getValue('project_context') || '',
                strict_tdd:
                    gr.getValue('strict_tdd') === 'true' || gr.getValue('strict_tdd') === '1',
                rules_proposal: gr.getValue('rules_proposal') || '',
                rules_specs: gr.getValue('rules_specs') || '',
                rules_design: gr.getValue('rules_design') || '',
                rules_tasks: gr.getValue('rules_tasks') || '',
                rules_apply: gr.getValue('rules_apply') || '',
                rules_verify: gr.getValue('rules_verify') || '',
                rules_archive: gr.getValue('rules_archive') || '',
                target_table: gr.getValue('target_table') || '',
                target_scope: gr.getValue('target_scope') || '',
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // Phase Management
    // ═══════════════════════════════════════════════════════════

    /**
     * Returns the ordered array of SDD phases.
     * @returns {string[]}
     */
    getPhaseOrder: function () {
        return this.PHASE_ORDER.slice()
    },

    /**
     * Validates whether the session can transition to the target phase.
     * @param {string} targetPhase
     * @returns {{ allowed: boolean, reason: string }}
     */
    canTransitionTo: function (targetPhase) {
        if (!this.session) {
            return { allowed: false, reason: 'No session loaded' }
        }

        var currentPhase = this.session.sdd_phase || 'none'
        var allowed = this.PHASE_TRANSITIONS[currentPhase] || []

        if (allowed.indexOf(targetPhase) === -1) {
            return {
                allowed: false,
                reason:
                    'Cannot transition from ' +
                    currentPhase +
                    ' to ' +
                    targetPhase +
                    '. Allowed: ' +
                    allowed.join(', '),
            }
        }

        // Approval gate: cannot enter spec without an approved proposal
        if (targetPhase === 'spec') {
            var proposalGr = new GlideRecord('x_1733631_now_code_sdd_artifact')
            proposalGr.addQuery('session', this.sessionId)
            proposalGr.addQuery('phase', 'propose')
            proposalGr.addQuery('artifact_type', 'proposal')
            proposalGr.addQuery('status', 'approved')
            proposalGr.query()

            if (!proposalGr.hasNext()) {
                return {
                    allowed: false,
                    reason:
                        'Cannot transition to spec without an approved proposal. Please approve a proposal first.',
                }
            }
        }

        return { allowed: true, reason: '' }
    },

    /**
     * Transitions the session to a new SDD phase after validation.
     * @param {string} targetPhase
     * @returns {{ success: boolean, message: string }}
     */
    transitionPhase: function (targetPhase) {
        var check = this.canTransitionTo(targetPhase)
        if (!check.allowed) {
            return { success: false, message: check.reason }
        }

        var gr = new GlideRecord('x_1733631_now_code_chat_session')
        if (gr.get(this.sessionId)) {
            gr.setValue('sdd_phase', targetPhase)
            gr.update()
            this.session.sdd_phase = targetPhase

            this._createMessage(
                'system',
                'SDD Phase transitioned to: ' + targetPhase,
                targetPhase
            )

            return { success: true, message: 'Transitioned to ' + targetPhase }
        }

        return { success: false, message: 'Session not found' }
    },

    // ═══════════════════════════════════════════════════════════
    // Prompt Construction
    // ═══════════════════════════════════════════════════════════

    /**
     * Builds the full system prompt for the current (or specified) phase.
     * Injects SDD methodology, platform context, best practices,
     * OpenSpec rules, and previous phase artifacts.
     * @param {string} [phase] - Override phase (defaults to session phase)
     * @returns {string}
     */
    buildSystemPrompt: function (phase) {
        var activePhase = phase || (this.session ? this.session.sdd_phase : 'none')
        var lines = []

        // ── Core identity ────────────────────────────────────
        lines.push(
            'You are Now Code, a ServiceNow development assistant following the Spec Driven Development (SDD) methodology.'
        )
        lines.push('Current phase: ' + activePhase)
        lines.push(
            'You must produce structured artifacts for each phase. Mark artifact sections clearly so they can be extracted.'
        )
        lines.push('')

        // ── Phase-specific instructions ──────────────────────
        var phasePrompt = this._getPhasePrompt(activePhase)
        if (phasePrompt) {
            lines.push('## Phase Instructions')
            lines.push(phasePrompt)
            lines.push('')
        }

        // ── Platform context ─────────────────────────────────
        if (this.config && this.config.target_table) {
            try {
                var tableContext = this.platformContext.buildContextForTable(
                    this.config.target_table
                )
                if (tableContext) {
                    lines.push('## Platform Context — Target Table')
                    lines.push(tableContext)
                    lines.push('')
                }
            } catch (e) {
                gs.warn('NowCodeSDDOrchestrator: Could not load table context: ' + e.getMessage())
            }
        }

        if (this.config && this.config.target_scope) {
            try {
                var scopeContext = this.platformContext.buildScopeContext(this.config.target_scope)
                if (scopeContext) {
                    lines.push('## Platform Context — Target Scope')
                    lines.push(scopeContext)
                    lines.push('')
                }
            } catch (e) {
                gs.warn('NowCodeSDDOrchestrator: Could not load scope context: ' + e.getMessage())
            }
        }

        // ── Best practices ───────────────────────────────────
        try {
            var practices = this.bestPractices.formatForLLM()
            if (practices) {
                lines.push('## ServiceNow Best Practices')
                lines.push(practices)
                lines.push('')
            }
        } catch (e) {
            gs.warn('NowCodeSDDOrchestrator: Could not load best practices: ' + e.getMessage())
        }

        // ── Design skills (for UI phases: design, apply, spec) ──
        var uiPhases = ['design', 'apply', 'spec', 'propose', 'explore']
        if (uiPhases.indexOf(activePhase) !== -1) {
            try {
                var designContext = {
                    type: 'ui_page',
                    industry: '',
                    style_preference: '',
                }
                if (this.config && this.config.project_context) {
                    var ctx = this.config.project_context.toLowerCase()
                    if (ctx.indexOf('healthcare') !== -1 || ctx.indexOf('medical') !== -1) designContext.industry = 'healthcare'
                    else if (ctx.indexOf('finance') !== -1 || ctx.indexOf('banking') !== -1) designContext.industry = 'finance'
                    else if (ctx.indexOf('ecommerce') !== -1 || ctx.indexOf('shop') !== -1) designContext.industry = 'ecommerce'
                    else if (ctx.indexOf('saas') !== -1 || ctx.indexOf('tech') !== -1) designContext.industry = 'tech_saas'
                }
                var designKnowledge = this.designSkills.formatForLLM()
                if (designKnowledge) {
                    lines.push('## Design Skills (Frontend Design + UI UX Pro Max)')
                    lines.push(designKnowledge)
                    lines.push('')
                }
            } catch (e) {
                gs.warn('NowCodeSDDOrchestrator: Could not load design skills: ' + e.getMessage())
            }
        }

        // ── OpenSpec config rules for current phase ──────────
        if (this.config) {
            var phaseRules = this._getPhaseRules(activePhase)
            if (phaseRules) {
                lines.push('## OpenSpec Rules for This Phase')
                lines.push(phaseRules)
                lines.push('')
            }

            if (this.config.project_context) {
                lines.push('## Project Context')
                lines.push(this.config.project_context)
                lines.push('')
            }

            if (this.config.strict_tdd) {
                lines.push('## TDD Mode')
                lines.push(
                    'Strict TDD is enabled. All changes MUST have tests written BEFORE implementation.'
                )
                lines.push('')
            }
        }

        // ── Previous phase artifacts ─────────────────────────
        var artifacts = this._getPreviousArtifacts(activePhase)
        if (artifacts.length > 0) {
            lines.push('## Previous Phase Artifacts')
            for (var i = 0; i < artifacts.length; i++) {
                lines.push(
                    '### ' +
                        artifacts[i].title +
                        ' (' +
                        artifacts[i].phase +
                        ' — ' +
                        artifacts[i].status +
                        ')'
                )
                lines.push(artifacts[i].content)
                lines.push('')
            }
        }

        return lines.join('\n')
    },

    /** @private Phase-specific prompt instructions */
    _getPhasePrompt: function (phase) {
        var prompts = {
            init: 'Analyze the target ServiceNow scope and table. Identify the tech stack, existing customizations, and testing capabilities. Gather context about the instance, installed plugins, and relevant configurations. Produce a context snapshot artifact.',
            explore:
                'Investigate the codebase. Read existing business rules, script includes, and configurations. Report findings about the current state of the application, identifying patterns, dependencies, and potential areas of concern.',
            propose:
                'Create a change proposal with: Intent (what we want to achieve), Scope (what will be affected), Approach (how we will implement it), Risks (what could go wrong), and Rollback plan (how to undo if needed). The proposal must be approved before proceeding to the spec phase.',
            spec: 'Write specifications with: Requirements (functional + non-functional), Scenarios (Given/When/Then format), and Acceptance criteria. Specifications should be precise, testable, and complete.',
            design:
                'Document architecture decisions: Component design, Data model changes, Integration points, Security considerations. The design should map directly to the specification requirements.',
            tasks:
                'Break the change into ordered, implementable tasks. Each task should be completable in one session, have clear inputs and outputs, and reference specific spec requirements it fulfills.',
            apply:
                'Implement the tasks per the spec and design. Show code with explanations. Follow ServiceNow best practices. Each implementation should reference the task it completes.',
            verify:
                'Independently verify that the implementation matches the spec, design, and tasks. Check for gaps, untested scenarios, security issues, and performance concerns. Produce a verification report with pass/fail status.',
            archive:
                'Summarize what was done, merge delta-specs, and close the cycle. Document lessons learned, key decisions, and any technical debt created.',
            onboard:
                'Give a guided tour of the changes made in this session. Explain what was built, why decisions were made, and how to maintain or extend the work.',
        }

        return prompts[phase] || ''
    },

    /** @private Return the OpenSpec rules string for the given phase */
    _getPhaseRules: function (phase) {
        if (!this.config) return ''

        var rulesMap = {
            propose: this.config.rules_proposal,
            spec: this.config.rules_specs,
            design: this.config.rules_design,
            tasks: this.config.rules_tasks,
            apply: this.config.rules_apply,
            verify: this.config.rules_verify,
            archive: this.config.rules_archive,
        }

        return rulesMap[phase] || ''
    },

    /** @private Collect the latest artifact from each prior phase */
    _getPreviousArtifacts: function (currentPhase) {
        var artifacts = []
        var phaseIndex = this.PHASE_ORDER.indexOf(currentPhase)
        if (phaseIndex <= 0) return artifacts

        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        gr.addQuery('session', this.sessionId)
        gr.addQuery('status', 'IN', 'approved,implemented,draft')
        gr.orderBy('phase')
        gr.orderByDesc('version')
        gr.query()

        var seenPhases = {}
        while (gr.next()) {
            var artPhase = gr.getValue('phase')
            var artPhaseIndex = this.PHASE_ORDER.indexOf(artPhase)

            // Only include the latest artifact from previous phases
            if (artPhaseIndex >= 0 && artPhaseIndex < phaseIndex && !seenPhases[artPhase]) {
                artifacts.push({
                    phase: artPhase,
                    artifact_type: gr.getValue('artifact_type'),
                    title: gr.getValue('title'),
                    content: gr.getValue('content') || '',
                    status: gr.getValue('status'),
                    version: gr.getValue('version'),
                })
                seenPhases[artPhase] = true
            }
        }

        return artifacts
    },

    // ═══════════════════════════════════════════════════════════
    // Message Handling & LLM Integration
    // ═══════════════════════════════════════════════════════════

    /**
     * Main method: takes user input, builds prompt with context,
     * calls the LLM, stores the response, and extracts artifacts.
     * @param {string} userMessage
     * @returns {{ success: boolean, content?: string, tokens?: number,
     *             model?: string, messageSysId?: string, artifact?: object,
     *             message?: string }}
     */
    sendMessage: function (userMessage) {
        if (!this.session) {
            return { success: false, message: 'No session loaded' }
        }

        try {
            // 1. Store user message
            this._createMessage('user', userMessage, this.session.sdd_phase)

            // 2. Build prompt and gather history
            var systemPrompt = this.buildSystemPrompt(this.session.sdd_phase)
            var history = this.getSessionHistory()
            var model = this.session.model || this._getLLMClient().getDefaultModel()

            // 3. Call the LLM
            var llmResponse = this.callLLM(systemPrompt, history, model)

            if (!llmResponse.success) {
                return {
                    success: false,
                    message: llmResponse.error,
                    code: this._llmErrorCode(llmResponse),
                }
            }

            // 4. Store assistant response
            var assistantMsgId = this._createMessage(
                'assistant',
                llmResponse.content,
                this.session.sdd_phase,
                llmResponse.tokens || 0,
                model
            )

            // 5. Update session token count
            this._updateTokenCount(llmResponse.tokens || 0)

            // 6. Extract artifacts if SDD is active
            var artifact = null
            if (this.session.sdd_active && this.session.sdd_phase !== 'none') {
                artifact = this.extractArtifact(llmResponse.content, this.session.sdd_phase)
            }

            return {
                success: true,
                content: llmResponse.content,
                tokens: llmResponse.tokens || 0,
                model: model,
                messageSysId: assistantMsgId,
                artifact: artifact,
            }
        } catch (ex) {
            gs.error('NowCodeSDDOrchestrator.sendMessage error: ' + ex.getMessage())
            return { success: false, message: 'Error: ' + ex.getMessage() }
        }
    },

    /**
     * Sends the conversation to the user's configured provider (OpenCode Go
     * by default) through NowCodeLLMClient, which owns API key resolution and
     * picks the wire format each model family needs:
     *
     *   claude* / minimax* / qwen*   → /messages          (Anthropic shape)
     *   gpt* / grok* / muse-spark*   → /responses         (OpenAI Responses)
     *   everything else              → /chat/completions  (OpenAI shape)
     *
     * If the gateway reports a model is not served on that format, the client
     * retries on the remaining ones.
     *
     * @param {string} systemPrompt
     * @param {Array<{role:string, content:string}>} messages
     * @param {string} model
     * @returns {{ success: boolean, content?: string, tokens?: number,
     *             error?: string, status?: number }}
     */
    callLLM: function (systemPrompt, messages, model) {
        try {
            return this._getLLMClient().chat(systemPrompt, messages, model)
        } catch (ex) {
            gs.error('NowCodeSDDOrchestrator.callLLM exception: ' + ex.getMessage())
            return { success: false, error: ex.getMessage() }
        }
    },

    /** @private LLM client bound to the calling user's provider settings and key */
    _getLLMClient: function () {
        if (!this.llmClient) {
            this.llmClient = new NowCodeLLMClient()
        }
        return this.llmClient
    },

    // ═══════════════════════════════════════════════════════════
    // Artifact Extraction
    // ═══════════════════════════════════════════════════════════

    /**
     * Parses LLM responses to extract structured SDD artifacts.
     * Looks for explicit ```artifact markers or phase-specific headings.
     * @param {string} response - The raw LLM response text
     * @param {string} phase    - Current SDD phase
     * @returns {object|null}   - Stored artifact info or null
     */
    extractArtifact: function (response, phase) {
        if (!response || !phase) return null

        var artifactType = this.PHASE_ARTIFACT_TYPES[phase]
        if (!artifactType) return null

        var artifactContent = ''

        // Strategy 1: Explicit ```artifact fenced block
        var startMarker = '```artifact'
        var startIdx = response.indexOf(startMarker)
        if (startIdx !== -1) {
            var contentStart = response.indexOf('\n', startIdx) + 1
            var endIdx = response.indexOf('```', contentStart)
            if (endIdx !== -1) {
                artifactContent = response.substring(contentStart, endIdx).trim()
            }
        }

        // Strategy 2: Phase-specific heading patterns
        if (!artifactContent) {
            var patterns = {
                proposal: ['## Proposal', '## Change Proposal', '# Proposal'],
                specification: ['## Specification', '## Requirements', '# Specification'],
                design_doc: ['## Design', '## Architecture', '# Design Document'],
                task_list: ['## Tasks', '## Task List', '# Implementation Tasks'],
                verification_report: [
                    '## Verification',
                    '## Test Results',
                    '# Verification Report',
                ],
                archive_summary: ['## Summary', '## Archive', '# Archive Summary'],
                context_snapshot: ['## Context', '## Analysis', '# Context Snapshot'],
            }

            var typePatterns = patterns[artifactType] || []
            for (var p = 0; p < typePatterns.length; p++) {
                var patternIdx = response.indexOf(typePatterns[p])
                if (patternIdx !== -1) {
                    artifactContent = response.substring(patternIdx).trim()
                    break
                }
            }
        }

        // Strategy 3: Use full response if substantial
        if (!artifactContent && response.length > 100) {
            artifactContent = response
        }

        if (!artifactContent) return null

        // Generate a descriptive title
        var titleMap = {
            init: 'Context Analysis',
            explore: 'Codebase Exploration',
            propose: 'Change Proposal',
            spec: 'Specification Document',
            design: 'Architecture Design',
            tasks: 'Implementation Tasks',
            apply: 'Implementation Notes',
            verify: 'Verification Report',
            archive: 'Archive Summary',
            onboard: 'Onboarding Guide',
        }
        var artifactTitle =
            (titleMap[phase] || 'Artifact') + ' — ' + (this.session ? this.session.name : '')

        // Persist the artifact
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        gr.initialize()
        gr.setValue('session', this.sessionId)
        gr.setValue('phase', phase)
        gr.setValue('artifact_type', artifactType)
        gr.setValue('title', artifactTitle)
        gr.setValue('content', artifactContent)
        gr.setValue('status', phase === 'propose' ? 'pending_review' : 'draft')
        gr.setValue('version', this._getNextArtifactVersion(phase))
        var sysId = gr.insert()

        return {
            sys_id: sysId,
            title: artifactTitle,
            artifact_type: artifactType,
            phase: phase,
            status: phase === 'propose' ? 'pending_review' : 'draft',
        }
    },

    /** @private Get the next version number for an artifact in this phase */
    _getNextArtifactVersion: function (phase) {
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        gr.addQuery('session', this.sessionId)
        gr.addQuery('phase', phase)
        gr.orderByDesc('version')
        gr.setLimit(1)
        gr.query()

        if (gr.next()) {
            return parseInt(gr.getValue('version'), 10) + 1
        }
        return 1
    },

    // ═══════════════════════════════════════════════════════════
    // SDD Workflow Actions
    // ═══════════════════════════════════════════════════════════

    /**
     * Starts the SDD workflow for a session.
     * Creates an OpenSpec config and initialises at the init phase.
     * @param {string} targetTable - Table the SDD session targets
     * @param {string} targetScope - App scope the SDD session targets
     * @returns {{ success: boolean, message: string, phase?: string,
     *             targetTable?: string, targetScope?: string }}
     */
    startSDD: function (targetTable, targetScope) {
        if (!this.session) {
            return { success: false, message: 'No session loaded' }
        }

        // Activate SDD on the session
        var sessionGr = new GlideRecord('x_1733631_now_code_chat_session')
        if (sessionGr.get(this.sessionId)) {
            sessionGr.setValue('sdd_active', true)
            sessionGr.setValue('sdd_phase', 'init')
            if (targetScope) {
                sessionGr.setValue('context_scope', targetScope)
            }
            sessionGr.update()
            this.session.sdd_active = true
            this.session.sdd_phase = 'init'
        }

        // Create or update OpenSpec config
        var configGr = new GlideRecord('x_1733631_now_code_openspec_config')
        configGr.addQuery('session', this.sessionId)
        configGr.query()

        if (configGr.next()) {
            configGr.setValue('target_table', targetTable || '')
            configGr.setValue('target_scope', targetScope || '')
            configGr.update()
        } else {
            configGr.initialize()
            configGr.setValue('session', this.sessionId)
            configGr.setValue('target_table', targetTable || '')
            configGr.setValue('target_scope', targetScope || '')
            configGr.insert()
        }

        // Reload config into memory
        this._loadConfig()

        // Record the start as a system message
        this._createMessage(
            'system',
            'SDD workflow started. Target table: ' +
                (targetTable || 'N/A') +
                ', Target scope: ' +
                (targetScope || 'N/A') +
                '. Phase: init',
            'init'
        )

        return {
            success: true,
            message: 'SDD workflow started',
            phase: 'init',
            targetTable: targetTable || '',
            targetScope: targetScope || '',
        }
    },

    /**
     * User approves a proposal, allowing progression to spec phase.
     * @param {string} artifactId - sys_id of the proposal artifact
     * @returns {{ success: boolean, message: string }}
     */
    approveProposal: function (artifactId) {
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        if (!gr.get(artifactId)) {
            return { success: false, message: 'Artifact not found' }
        }

        if (gr.getValue('artifact_type') !== 'proposal') {
            return { success: false, message: 'Artifact is not a proposal' }
        }
        if (gr.getValue('session') !== this.sessionId) {
            return { success: false, message: 'Artifact does not belong to this session' }
        }

        gr.setValue('status', 'approved')
        gr.setValue('approved_by', gs.getUserID())
        gr.setValue('approved_on', new GlideDateTime())
        gr.update()

        this._createMessage(
            'system',
            'Proposal "' +
                gr.getValue('title') +
                '" has been approved. You may now proceed to the spec phase.',
            this.session.sdd_phase
        )

        return { success: true, message: 'Proposal approved' }
    },

    /**
     * User rejects a proposal, loops back to explore phase.
     * @param {string} artifactId - sys_id of the proposal artifact
     * @param {string} reason     - Rejection reason
     * @returns {{ success: boolean, message: string }}
     */
    rejectProposal: function (artifactId, reason) {
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        if (!gr.get(artifactId)) {
            return { success: false, message: 'Artifact not found' }
        }

        if (gr.getValue('artifact_type') !== 'proposal') {
            return { success: false, message: 'Artifact is not a proposal' }
        }
        if (gr.getValue('session') !== this.sessionId) {
            return { success: false, message: 'Artifact does not belong to this session' }
        }

        gr.setValue('status', 'rejected')
        gr.update()

        // Transition back to explore
        this.transitionPhase('explore')

        this._createMessage(
            'system',
            'Proposal "' +
                gr.getValue('title') +
                '" has been rejected. Reason: ' +
                (reason || 'No reason provided') +
                '. Returning to explore phase.',
            'explore'
        )

        return { success: true, message: 'Proposal rejected, returning to explore phase' }
    },

    // ═══════════════════════════════════════════════════════════
    // Session History & Status
    // ═══════════════════════════════════════════════════════════

    /**
     * Gets chat history formatted for LLM context.
     * @param {string} [sessionId] - Override session (defaults to current)
     * @returns {Array<{role:string, content:string, phase:string, model:string}>}
     */
    getSessionHistory: function (sessionId) {
        var sid = sessionId || this.sessionId
        var messages = []

        var gr = new GlideRecord('x_1733631_now_code_chat_message')
        gr.addQuery('session', sid)
        gr.orderBy('order_index')
        gr.query()

        while (gr.next()) {
            messages.push({
                role: gr.getValue('role'),
                content: gr.getValue('content') || '',
                phase: gr.getValue('sdd_phase') || 'none',
                model: gr.getValue('model_used') || '',
            })
        }

        return messages
    },

    /**
     * Returns current SDD status with phase, artifacts, and next possible actions.
     * @param {string} [sessionId] - Override session (defaults to current)
     * @returns {object}
     */
    getSddStatus: function (sessionId) {
        var sid = sessionId || this.sessionId

        // Reload if pointing at a different session
        if (sid !== this.sessionId) {
            var tempOrch = new NowCodeSDDOrchestrator(sid)
            return tempOrch.getSddStatus()
        }

        if (!this.session) {
            return { success: false, message: 'No session loaded' }
        }

        var currentPhase = this.session.sdd_phase || 'none'
        var possibleTransitions = this.PHASE_TRANSITIONS[currentPhase] || []

        // Collect artifacts
        var artifacts = []
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact')
        gr.addQuery('session', this.sessionId)
        gr.orderBy('phase')
        gr.orderByDesc('version')
        gr.query()

        while (gr.next()) {
            artifacts.push({
                sys_id: gr.getUniqueValue(),
                phase: gr.getValue('phase'),
                artifact_type: gr.getValue('artifact_type'),
                title: gr.getValue('title'),
                status: gr.getValue('status'),
                version: gr.getValue('version'),
            })
        }

        // Build next-actions list
        var nextActions = []

        // If in propose phase, check for pending proposals
        if (currentPhase === 'propose') {
            for (var i = 0; i < artifacts.length; i++) {
                if (
                    artifacts[i].phase === 'propose' &&
                    artifacts[i].status === 'pending_review'
                ) {
                    nextActions.push({
                        action: 'approve_proposal',
                        artifact_id: artifacts[i].sys_id,
                        label: 'Approve proposal',
                    })
                    nextActions.push({
                        action: 'reject_proposal',
                        artifact_id: artifacts[i].sys_id,
                        label: 'Reject proposal',
                    })
                    break
                }
            }
        }

        // Available phase transitions
        for (var j = 0; j < possibleTransitions.length; j++) {
            var transition = possibleTransitions[j]
            var canDo = this.canTransitionTo(transition)
            if (canDo.allowed) {
                nextActions.push({
                    action: 'transition',
                    target_phase: transition,
                    label: 'Move to ' + transition,
                })
            }
        }

        nextActions.push({
            action: 'send_message',
            label: 'Continue conversation in current phase',
        })

        return {
            success: true,
            session_id: this.sessionId,
            session_name: this.session.name,
            sdd_active: this.session.sdd_active,
            current_phase: currentPhase,
            phase_index: this.PHASE_ORDER.indexOf(currentPhase),
            total_phases: this.PHASE_ORDER.length,
            possible_transitions: possibleTransitions,
            artifacts: artifacts,
            next_actions: nextActions,
            target_table: this.config ? this.config.target_table : '',
            target_scope: this.config ? this.config.target_scope : '',
        }
    },

    // ═══════════════════════════════════════════════════════════
    // Internal Helpers
    // ═══════════════════════════════════════════════════════════

    /** @private Machine-readable reason for an LLM failure, used by the UI */
    _llmErrorCode: function (llmResponse) {
        if (!this._getLLMClient().getSettings().api_key) return 'no_api_key'
        if (llmResponse.status === 401 || llmResponse.status === 403) return 'auth_failed'
        if (llmResponse.status === 429) return 'rate_limited'
        return 'llm_error'
    },

    /** @private Persist a chat message record */
    _createMessage: function (role, content, phase, tokens, model) {
        var gr = new GlideRecord('x_1733631_now_code_chat_message')
        gr.initialize()
        gr.setValue('session', this.sessionId)
        gr.setValue('role', role)
        gr.setValue('content', content)
        gr.setValue('sdd_phase', phase || 'none')
        gr.setValue('tokens_used', tokens || 0)
        gr.setValue('model_used', model || '')
        gr.setValue('order_index', this._getNextMessageIndex())
        return gr.insert()
    },

    /** @private Get the next order_index for messages in this session */
    _getNextMessageIndex: function () {
        var gr = new GlideRecord('x_1733631_now_code_chat_message')
        gr.addQuery('session', this.sessionId)
        gr.orderByDesc('order_index')
        gr.setLimit(1)
        gr.query()

        if (gr.next()) {
            return parseInt(gr.getValue('order_index'), 10) + 1
        }
        return 0
    },

    /** @private Add tokens to the session total */
    _updateTokenCount: function (newTokens) {
        var gr = new GlideRecord('x_1733631_now_code_chat_session')
        if (gr.get(this.sessionId)) {
            var currentTotal = parseInt(gr.getValue('total_tokens'), 10) || 0
            gr.setValue('total_tokens', currentTotal + newTokens)
            gr.update()
            this.session.total_tokens = currentTotal + newTokens
        }
    },

    type: 'NowCodeSDDOrchestrator',
}
