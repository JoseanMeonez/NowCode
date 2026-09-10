(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var models = [
            {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude Sonnet 4',
                provider: 'Anthropic',
                endpoint: 'sendAnthropicMessage',
                description: 'Anthropic Claude Sonnet 4 — balanced speed and intelligence',
                max_tokens: 8192
            },
            {
                id: 'claude-opus-4-20250514',
                name: 'Claude Opus 4',
                provider: 'Anthropic',
                endpoint: 'sendAnthropicMessage',
                description: 'Anthropic Claude Opus 4 — highest intelligence',
                max_tokens: 8192
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude 3.5 Haiku',
                provider: 'Anthropic',
                endpoint: 'sendAnthropicMessage',
                description: 'Anthropic Claude 3.5 Haiku — fastest responses',
                max_tokens: 8192
            },
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                provider: 'OpenAI',
                endpoint: 'sendChatCompletion',
                description: 'OpenAI GPT-4o — multimodal flagship',
                max_tokens: 8192
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                provider: 'OpenAI',
                endpoint: 'sendChatCompletion',
                description: 'OpenAI GPT-4o Mini — fast and cost-effective',
                max_tokens: 8192
            },
            {
                id: 'o3-mini',
                name: 'o3-mini',
                provider: 'OpenAI',
                endpoint: 'sendChatCompletion',
                description: 'OpenAI o3-mini — reasoning model',
                max_tokens: 8192
            },
            {
                id: 'qwen-max',
                name: 'Qwen Max',
                provider: 'Alibaba',
                endpoint: 'sendAnthropicMessage',
                description: 'Alibaba Qwen Max — large context reasoning',
                max_tokens: 8192
            },
            {
                id: 'qwen-plus',
                name: 'Qwen Plus',
                provider: 'Alibaba',
                endpoint: 'sendAnthropicMessage',
                description: 'Alibaba Qwen Plus — balanced performance',
                max_tokens: 8192
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                provider: 'DeepSeek',
                endpoint: 'sendChatCompletion',
                description: 'DeepSeek Chat — open-weight code and reasoning',
                max_tokens: 8192
            },
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                provider: 'DeepSeek',
                endpoint: 'sendChatCompletion',
                description: 'DeepSeek Reasoner — chain-of-thought reasoning',
                max_tokens: 8192
            }
        ];

        response.setStatus(200);
        response.setBody({ models: models });
    } catch (ex) {
        gs.error('Now Code API - listModels error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
