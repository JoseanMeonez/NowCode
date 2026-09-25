var NowCodeLLMClient = Class.create()
NowCodeLLMClient.prototype = {
    // ═══════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════

    CONFIG_TABLE: 'x_1733631_now_code_provider_config',

    /** Legacy instance-wide key, still honoured as a last resort */
    LEGACY_KEY_PROPERTY: 'x_1733631_now_code.zen.api_key',

    DEFAULT_PROVIDER: 'opencode_go',
    DEFAULT_MAX_TOKENS: 8192,
    HTTP_TIMEOUT_MS: 180000,

    /**
     * Supported providers. Every provider is OpenAI-compatible at
     * {baseUrl}/chat/completions and lists its models at {baseUrl}/models.
     * OpenCode gateways additionally serve /messages (Anthropic shape)
     * and /responses (OpenAI Responses shape) for the models that need them.
     */
    PROVIDERS: {
        opencode_go: {
            label: 'OpenCode Go',
            baseUrl: 'https://opencode.ai/zen/go/v1',
            keyUrl: 'https://opencode.ai/auth',
            multiFormat: true,
        },
        opencode_zen: {
            label: 'OpenCode Zen',
            baseUrl: 'https://opencode.ai/zen/v1',
            keyUrl: 'https://opencode.ai/auth',
            multiFormat: true,
        },
        custom: {
            label: 'Custom (OpenAI-compatible)',
            baseUrl: '',
            keyUrl: '',
            multiFormat: false,
        },
    },

    /**
     * Used when the provider's /models endpoint cannot be reached
     * (no key yet, network error). IDs follow OpenCode Go naming.
     */
    FALLBACK_MODELS: [
        'kimi-k3',
        'kimi-k2.7-code',
        'glm-5.3',
        'glm-5.3-flash',
        'deepseek-v4-pro',
        'deepseek-v4-flash',
        'qwen3.8-max',
        'qwen3.8-flash',
        'minimax-m3',
        'mimo-v2.6-pro',
    ],

    /**
     * Model family → preferred wire format. Order matters: first prefix match wins.
     * Formats: 'chat' (OpenAI chat completions), 'messages' (Anthropic),
     * 'responses' (OpenAI Responses API).
     */
    MODEL_FAMILIES: [
        { prefix: 'claude', vendor: 'Anthropic', format: 'messages' },
        { prefix: 'minimax', vendor: 'MiniMax', format: 'messages' },
        { prefix: 'qwen', vendor: 'Alibaba Qwen', format: 'messages' },
        { prefix: 'gpt', vendor: 'OpenAI', format: 'responses' },
        { prefix: 'grok', vendor: 'xAI', format: 'responses' },
        { prefix: 'muse-spark', vendor: 'Muse', format: 'responses' },
        { prefix: 'kimi', vendor: 'Moonshot Kimi', format: 'chat' },
        { prefix: 'glm', vendor: 'Zhipu GLM', format: 'chat' },
        { prefix: 'deepseek', vendor: 'DeepSeek', format: 'chat' },
        { prefix: 'mimo', vendor: 'Xiaomi MiMo', format: 'chat' },
        { prefix: 'longcat', vendor: 'Meituan LongCat', format: 'chat' },
        { prefix: 'hy', vendor: 'Tencent Hunyuan', format: 'chat' },
        { prefix: 'gemini', vendor: 'Google', format: 'chat' },
    ],

    /** Endpoint path for each wire format */
    FORMAT_PATHS: {
        chat: '/chat/completions',
        messages: '/messages',
        responses: '/responses',
    },

    /** HTTP statuses that mean "this model is not served on this format" */
    FORMAT_FALLBACK_STATUSES: [400, 404, 405, 415, 422, 501, 503],

    // ═══════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════

    /**
     * @param {string} [userId] - sys_user sys_id whose settings apply (defaults to current user)
     */
    initialize: function (userId) {
        this.userId = userId || gs.getUserID()
        this._settings = null
    },

    // ═══════════════════════════════════════════════════════════
    // Settings
    // ═══════════════════════════════════════════════════════════

    /**
     * Resolves the effective provider settings for the user.
     * Lookup order: the user's own record → a shared record (empty user)
     * → the legacy system property for the key.
     * @returns {{ provider: string, base_url: string, default_model: string,
     *             max_tokens: number, api_key: string, api_key_hint: string,
     *             key_source: string }}
     */
    getSettings: function () {
        if (this._settings) return this._settings

        var settings = {
            provider: this.DEFAULT_PROVIDER,
            base_url: '',
            default_model: '',
            max_tokens: this.DEFAULT_MAX_TOKENS,
            api_key: '',
            api_key_hint: '',
            key_source: 'none',
        }

        var own = this._getConfigRecord(this.userId)
        var shared = own ? null : this._getConfigRecord('')
        var gr = own || shared

        if (gr) {
            settings.provider = gr.getValue('provider') || this.DEFAULT_PROVIDER
            settings.base_url = gr.getValue('base_url') || ''
            settings.default_model = gr.getValue('default_model') || ''
            settings.max_tokens =
                parseInt(gr.getValue('max_tokens'), 10) || this.DEFAULT_MAX_TOKENS
            var key = this._decryptKey(gr)
            if (key) {
                settings.api_key = key
                settings.api_key_hint = gr.getValue('api_key_hint') || ''
                settings.key_source = own ? 'user' : 'shared'
            }
        }

        if (!settings.api_key) {
            var legacyKey = gs.getProperty(this.LEGACY_KEY_PROPERTY, '')
            if (legacyKey) {
                settings.api_key = legacyKey
                settings.api_key_hint = this._hint(legacyKey)
                settings.key_source = 'legacy_property'
            }
        }

        this._settings = settings
        return settings
    },

    /**
     * Settings safe to return to the browser — never includes the key itself.
     * @returns {object}
     */
    getPublicSettings: function () {
        var s = this.getSettings()
        var providers = []
        for (var id in this.PROVIDERS) {
            if (this.PROVIDERS.hasOwnProperty(id)) {
                providers.push({
                    id: id,
                    label: this.PROVIDERS[id].label,
                    base_url: this.PROVIDERS[id].baseUrl,
                    key_url: this.PROVIDERS[id].keyUrl,
                })
            }
        }
        return {
            provider: s.provider,
            provider_label: this._provider(s.provider).label,
            base_url: s.base_url,
            effective_base_url: this.getBaseUrl(),
            default_model: s.default_model,
            max_tokens: s.max_tokens,
            has_api_key: !!s.api_key,
            api_key_hint: s.api_key_hint,
            key_source: s.key_source,
            providers: providers,
        }
    },

    /**
     * Creates or updates the current user's provider settings.
     * @param {{ provider?: string, base_url?: string, api_key?: string,
     *           clear_api_key?: boolean, default_model?: string,
     *           max_tokens?: number }} input
     * @returns {{ success: boolean, message: string }}
     */
    saveSettings: function (input) {
        input = input || {}

        if (input.provider && !this.PROVIDERS[input.provider]) {
            return { success: false, message: 'Unknown provider: ' + input.provider }
        }
        if (input.base_url && !/^https:\/\/[^\s]+$/i.test(input.base_url)) {
            return { success: false, message: 'Base URL must be an https:// URL' }
        }
        if (input.provider === 'custom' && !input.base_url) {
            var existingCustom = this._getConfigRecord(this.userId)
            if (!existingCustom || !existingCustom.getValue('base_url')) {
                return { success: false, message: 'A custom provider requires a base URL' }
            }
        }

        var gr = this._getConfigRecord(this.userId)
        var isNew = !gr
        if (isNew) {
            gr = new GlideRecord(this.CONFIG_TABLE)
            gr.initialize()
            gr.setValue('user', this.userId)
            gr.setValue('provider', this.DEFAULT_PROVIDER)
        }

        if (input.provider) gr.setValue('provider', input.provider)
        if (input.base_url !== undefined) {
            gr.setValue('base_url', String(input.base_url || '').replace(/\/+$/, ''))
        }
        if (input.default_model !== undefined) {
            gr.setValue('default_model', String(input.default_model || ''))
        }
        if (input.max_tokens !== undefined) {
            var maxTokens = parseInt(input.max_tokens, 10)
            if (isNaN(maxTokens) || maxTokens < 256 || maxTokens > 128000) {
                return { success: false, message: 'max_tokens must be between 256 and 128000' }
            }
            gr.setValue('max_tokens', maxTokens)
        }

        if (input.clear_api_key) {
            gr.api_key.setDisplayValue('')
            gr.setValue('api_key_hint', '')
        } else if (input.api_key) {
            var key = String(input.api_key).replace(/^\s+|\s+$/g, '')
            if (key.length < 8) {
                return { success: false, message: 'API key looks too short' }
            }
            // setDisplayValue encrypts Password2 fields; setValue would store clear text
            gr.api_key.setDisplayValue(key)
            gr.setValue('api_key_hint', this._hint(key))
        }

        var ok = isNew ? gr.insert() : gr.update()
        if (!ok) {
            return { success: false, message: 'Could not save provider settings' }
        }

        this._settings = null
        return { success: true, message: 'Settings saved' }
    },

    /** @returns {string} Base URL without trailing slash */
    getBaseUrl: function () {
        var s = this.getSettings()
        var url = s.base_url || this._provider(s.provider).baseUrl || ''
        return url.replace(/\/+$/, '')
    },

    // ═══════════════════════════════════════════════════════════
    // Models
    // ═══════════════════════════════════════════════════════════

    /**
     * Lists the models the configured provider serves.
     * Falls back to a static catalog when the provider cannot be reached.
     * @returns {{ models: object[], source: string, error?: string }}
     */
    listModels: function () {
        var s = this.getSettings()
        var result = { models: [], source: 'fallback' }

        if (s.api_key && this.getBaseUrl()) {
            var res = this._request('GET', this.getBaseUrl() + '/models', null, 30000)
            if (res.ok) {
                var data = this._parse(res.body)
                var list = (data && (data.data || data.models)) || []
                var ids = []
                for (var i = 0; i < list.length; i++) {
                    var id = typeof list[i] === 'string' ? list[i] : list[i] && list[i].id
                    if (id && ids.indexOf(id) === -1) ids.push(id)
                }
                if (ids.length > 0) {
                    ids.sort()
                    result.source = 'provider'
                    result.models = this._describeModels(ids)
                    return result
                }
                result.error = 'Provider returned no models'
            } else {
                result.error = res.error
            }
        }

        result.models = this._describeModels(this.FALLBACK_MODELS)
        return result
    },

    /**
     * Returns the model to use when none was chosen explicitly.
     * @returns {string}
     */
    getDefaultModel: function () {
        var s = this.getSettings()
        return s.default_model || this.FALLBACK_MODELS[0]
    },

    /**
     * Classifies a model id into vendor and preferred wire format.
     * @param {string} modelId
     * @returns {{ vendor: string, format: string }}
     */
    describeModel: function (modelId) {
        var lower = String(modelId || '').toLowerCase()
        for (var i = 0; i < this.MODEL_FAMILIES.length; i++) {
            if (lower.indexOf(this.MODEL_FAMILIES[i].prefix) === 0) {
                return {
                    vendor: this.MODEL_FAMILIES[i].vendor,
                    format: this._supportsMultiFormat() ? this.MODEL_FAMILIES[i].format : 'chat',
                }
            }
        }
        return { vendor: 'Other', format: 'chat' }
    },

    // ═══════════════════════════════════════════════════════════
    // Completions
    // ═══════════════════════════════════════════════════════════

    /**
     * Sends a conversation to the model and returns the assistant reply.
     * Picks the wire format from the model family; when the gateway says the
     * model is not served on that format, retries on the remaining formats.
     *
     * @param {string} systemPrompt
     * @param {Array<{role:string, content:string}>} messages - user/assistant turns
     * @param {string} model
     * @param {{ maxTokens?: number, timeoutMs?: number }} [opts]
     * @returns {{ success: boolean, content?: string, tokens?: number,
     *             format?: string, error?: string, status?: number }}
     */
    chat: function (systemPrompt, messages, model, opts) {
        opts = opts || {}
        var s = this.getSettings()

        if (!s.api_key) {
            return {
                success: false,
                status: 401,
                error: 'No API key configured. Open Settings in Now Code and paste your OpenCode Go API key.',
            }
        }
        if (!model) {
            return { success: false, error: 'No model selected' }
        }

        var turns = this._normalizeTurns(messages)
        if (turns.length === 0) {
            return { success: false, error: 'Nothing to send: the conversation is empty' }
        }

        var maxTokens = opts.maxTokens || s.max_tokens || this.DEFAULT_MAX_TOKENS
        var formats = this._formatChain(model)
        var last = null
        var attempts = []

        for (var i = 0; i < formats.length; i++) {
            var format = formats[i]
            var body = this._buildBody(format, systemPrompt, turns, model, maxTokens)
            var res = this._request(
                'POST',
                this.getBaseUrl() + this.FORMAT_PATHS[format],
                body,
                opts.timeoutMs || this.HTTP_TIMEOUT_MS
            )

            if (res.ok) {
                var parsed = this._parse(res.body)
                if (!parsed) {
                    return { success: false, status: res.status, error: 'Invalid JSON from provider' }
                }
                var out = this._readResponse(format, parsed)
                if (!out.content) {
                    return {
                        success: false,
                        status: res.status,
                        error: 'The model returned an empty response' +
                            (out.finishReason ? ' (finish reason: ' + out.finishReason + ')' : ''),
                    }
                }
                return { success: true, content: out.content, tokens: out.tokens, format: format }
            }

            last = res
            attempts.push(format + ' → HTTP ' + res.status)
            // Auth, quota and timeout failures will not improve on another format
            if (this.FORMAT_FALLBACK_STATUSES.indexOf(res.status) === -1) break
        }

        var error = last ? last.error : 'Request failed'
        if (attempts.length > 1) error += ' (tried ' + attempts.join(', ') + ')'
        return { success: false, status: last ? last.status : 0, error: error }
    },

    /**
     * Verifies the stored key end to end: lists models, then sends a tiny prompt.
     * @param {string} [model] - Model to ping (defaults to the user default)
     * @returns {{ success: boolean, message: string, model_count?: number,
     *             models_source?: string, model?: string, reply?: string }}
     */
    testConnection: function (model) {
        var s = this.getSettings()
        if (!s.api_key) {
            return { success: false, message: 'No API key configured' }
        }

        var models = this.listModels()
        var target = model || s.default_model
        if (!target && models.source === 'provider') {
            // Prefer a chat-format model for the ping: it is the most widely served path
            for (var i = 0; i < models.models.length; i++) {
                if (models.models[i].format === 'chat') {
                    target = models.models[i].id
                    break
                }
            }
        }
        target = target || this.getDefaultModel()

        var ping = this.chat(
            'You are a connectivity check. Reply with the single word: pong',
            [{ role: 'user', content: 'ping' }],
            target,
            { maxTokens: 256, timeoutMs: 60000 }
        )

        if (!ping.success) {
            return {
                success: false,
                message: 'Could not reach ' + target + ': ' + ping.error,
                model_count: models.models.length,
                models_source: models.source,
                model: target,
            }
        }

        return {
            success: true,
            message: 'Connected to ' + this._provider(s.provider).label + ' using ' + target,
            model_count: models.models.length,
            models_source: models.source,
            model: target,
            reply: String(ping.content).substring(0, 200),
        }
    },

    // ═══════════════════════════════════════════════════════════
    // Internal Helpers
    // ═══════════════════════════════════════════════════════════

    /** @private Load the provider config record for a user ('' = shared record) */
    _getConfigRecord: function (userId) {
        var gr = new GlideRecord(this.CONFIG_TABLE)
        if (userId) {
            gr.addQuery('user', userId)
        } else {
            gr.addNullQuery('user')
        }
        gr.orderByDesc('sys_updated_on')
        gr.setLimit(1)
        gr.query()
        return gr.next() ? gr : null
    },

    /** @private Read the Password2 key field in clear text */
    _decryptKey: function (gr) {
        try {
            if (gr.api_key.nil()) return ''
            return String(gr.api_key.getDecryptedValue() || '')
        } catch (e) {
            gs.error('NowCodeLLMClient: could not decrypt API key: ' + e)
            return ''
        }
    },

    /** @private Masked hint, e.g. "sk-…a1b2" */
    _hint: function (key) {
        key = String(key || '')
        if (key.length <= 8) return '…'
        return key.substring(0, 3) + '…' + key.substring(key.length - 4)
    },

    /** @private Provider definition, defaulting to OpenCode Go */
    _provider: function (id) {
        return this.PROVIDERS[id] || this.PROVIDERS[this.DEFAULT_PROVIDER]
    },

    /** @private Whether the gateway serves /messages and /responses as well as /chat */
    _supportsMultiFormat: function () {
        var s = this.getSettings()
        return !!this._provider(s.provider).multiFormat
    },

    /** @private Preferred format first, then the others as fallbacks */
    _formatChain: function (model) {
        var preferred = this.describeModel(model).format
        if (!this._supportsMultiFormat()) return ['chat']
        var chain = [preferred]
        var all = ['chat', 'messages', 'responses']
        for (var i = 0; i < all.length; i++) {
            if (chain.indexOf(all[i]) === -1) chain.push(all[i])
        }
        return chain
    },

    /** @private Turn a list of ids into UI-ready descriptors */
    _describeModels: function (ids) {
        var models = []
        for (var i = 0; i < ids.length; i++) {
            var info = this.describeModel(ids[i])
            models.push({
                id: ids[i],
                name: this._prettyName(ids[i]),
                provider: info.vendor,
                format: info.format,
            })
        }
        return models
    },

    /** @private "kimi-k2.7-code" → "Kimi K2.7 Code" */
    _prettyName: function (id) {
        var special = { glm: 'GLM', gpt: 'GPT', mimo: 'MiMo', deepseek: 'DeepSeek', minimax: 'MiniMax' }
        var parts = String(id).split('-')
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i]
            if (special[p.toLowerCase()]) {
                parts[i] = special[p.toLowerCase()]
            } else if (/^[a-z]\d/i.test(p)) {
                parts[i] = p.toUpperCase()
            } else {
                parts[i] = p.charAt(0).toUpperCase() + p.substring(1)
            }
        }
        return parts.join(' ')
    },

    /**
     * @private Keep only user/assistant turns with content, merge consecutive
     * same-role turns and make sure the conversation starts with a user turn.
     */
    _normalizeTurns: function (messages) {
        var turns = []
        for (var i = 0; i < (messages || []).length; i++) {
            var role = messages[i].role
            var content = String(messages[i].content || '')
            if ((role !== 'user' && role !== 'assistant') || !content) continue
            if (turns.length > 0 && turns[turns.length - 1].role === role) {
                turns[turns.length - 1].content += '\n\n' + content
            } else {
                turns.push({ role: role, content: content })
            }
        }
        while (turns.length > 0 && turns[0].role !== 'user') turns.shift()
        return turns
    },

    /** @private Request body for each wire format */
    _buildBody: function (format, systemPrompt, turns, model, maxTokens) {
        if (format === 'messages') {
            return {
                model: model,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: turns,
            }
        }

        if (format === 'responses') {
            var input = []
            for (var i = 0; i < turns.length; i++) {
                input.push({ role: turns[i].role, content: turns[i].content })
            }
            return {
                model: model,
                instructions: systemPrompt,
                input: input,
                max_output_tokens: maxTokens,
            }
        }

        var chatMessages = []
        if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt })
        for (var j = 0; j < turns.length; j++) chatMessages.push(turns[j])
        return {
            model: model,
            messages: chatMessages,
            max_tokens: maxTokens,
        }
    },

    /** @private Extract text, token usage and finish reason from a provider response */
    _readResponse: function (format, parsed) {
        var content = ''
        var tokens = 0
        var finishReason = ''
        var usage = parsed.usage || {}

        if (format === 'messages') {
            var blocks = parsed.content || []
            for (var i = 0; i < blocks.length; i++) {
                if (blocks[i].type === 'text' && blocks[i].text) content += blocks[i].text
            }
            tokens = (usage.input_tokens || 0) + (usage.output_tokens || 0)
            finishReason = parsed.stop_reason || ''
        } else if (format === 'responses') {
            if (typeof parsed.output_text === 'string') {
                content = parsed.output_text
            } else {
                var output = parsed.output || []
                for (var o = 0; o < output.length; o++) {
                    var parts = output[o].type === 'message' ? output[o].content || [] : []
                    for (var p = 0; p < parts.length; p++) {
                        if (parts[p].type === 'output_text' && parts[p].text) content += parts[p].text
                    }
                }
            }
            tokens = usage.total_tokens || (usage.input_tokens || 0) + (usage.output_tokens || 0)
            finishReason = parsed.status || ''
        } else {
            var choice = parsed.choices && parsed.choices[0]
            if (choice) {
                var msg = choice.message || {}
                if (typeof msg.content === 'string') {
                    content = msg.content
                } else if (msg.content && msg.content.length) {
                    for (var c = 0; c < msg.content.length; c++) {
                        if (msg.content[c].text) content += msg.content[c].text
                    }
                }
                finishReason = choice.finish_reason || ''
            }
            tokens =
                usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
        }

        return { content: content, tokens: tokens, finishReason: finishReason }
    },

    /**
     * @private Execute an HTTP call against the provider.
     * @returns {{ ok: boolean, status: number, body: string, error?: string }}
     */
    _request: function (method, url, body, timeoutMs) {
        var s = this.getSettings()
        try {
            var rm = new sn_ws.RESTMessageV2()
            rm.setEndpoint(url)
            rm.setHttpMethod(method.toLowerCase())
            rm.setRequestHeader('Accept', 'application/json')
            rm.setRequestHeader('Authorization', 'Bearer ' + s.api_key)
            // Anthropic-shaped endpoints authenticate with x-api-key
            rm.setRequestHeader('x-api-key', s.api_key)
            rm.setRequestHeader('anthropic-version', '2023-06-01')
            if (body) {
                rm.setRequestHeader('Content-Type', 'application/json')
                rm.setRequestBody(JSON.stringify(body))
            }
            rm.setHttpTimeout(timeoutMs || this.HTTP_TIMEOUT_MS)

            var response = rm.execute()
            var status = parseInt(response.getStatusCode(), 10) || 0
            var text = String(response.getBody() || '')

            if (status >= 200 && status < 300) {
                return { ok: true, status: status, body: text }
            }

            var error = this._errorMessage(status, text)
            if (status === 0 && response.haveError()) {
                error = this._connectionError(response.getErrorMessage())
            }
            gs.warn('NowCodeLLMClient: ' + method + ' ' + url + ' → HTTP ' + status + ' ' + text.substring(0, 500))
            return { ok: false, status: status, body: text, error: error }
        } catch (ex) {
            var msg = ex && ex.getMessage ? ex.getMessage() : String(ex)
            gs.error('NowCodeLLMClient: ' + method + ' ' + url + ' failed: ' + msg)
            return { ok: false, status: 0, body: '', error: this._connectionError(msg) }
        }
    },

    /**
     * @private Explain transport failures. Synchronous outbound REST is capped at
     * glide.http.outbound.max_timeout (30s by default), which long LLM answers exceed.
     */
    _connectionError: function (msg) {
        msg = String(msg || '')
        if (/timed?\s?out|timeout/i.test(msg)) {
            return (
                'The model did not answer within the instance outbound HTTP limit (' + msg + '). ' +
                'Ask an admin to set the system property glide.http.outbound.max_timeout.enabled ' +
                'to false, or choose a faster model / lower max output tokens.'
            )
        }
        return 'Connection failed: ' + msg
    },

    /** @private Human-readable error from a provider error payload */
    _errorMessage: function (status, text) {
        var parsed = this._parse(text)
        var detail = ''
        if (parsed) {
            if (parsed.error && typeof parsed.error === 'object') {
                detail = parsed.error.message || parsed.error.type || ''
            } else if (typeof parsed.error === 'string') {
                detail = parsed.error
            } else if (parsed.message) {
                detail = parsed.message
            }
        }
        if (!detail) detail = String(text || '').substring(0, 300)

        var prefix = 'HTTP ' + status
        if (status === 401 || status === 403) {
            prefix = 'The provider rejected the API key (HTTP ' + status + ')'
        } else if (status === 429) {
            prefix = 'Rate limit or subscription usage limit reached (HTTP 429)'
        }
        return detail ? prefix + ': ' + detail : prefix
    },

    /** @private JSON.parse that returns null instead of throwing */
    _parse: function (text) {
        try {
            return JSON.parse(text)
        } catch (e) {
            return null
        }
    },

    type: 'NowCodeLLMClient',
}
