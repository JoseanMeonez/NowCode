import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['now_code_llm_client_si'],
    name: 'NowCodeLLMClient',
    script: Now.include('./llm-client.server.js'),
    description:
        'LLM provider client for Now Code. Resolves the per-user OpenCode Go/Zen API key from the encrypted provider config, lists the models the gateway serves, and sends conversations on the wire format each model family needs (chat completions, Anthropic messages or OpenAI responses) with automatic fallback.',
    apiName: 'x_1733631_now_code.NowCodeLLMClient',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
