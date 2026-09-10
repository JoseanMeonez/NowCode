import { RestMessage } from '@servicenow/sdk/core'

RestMessage({
    $id: Now.ID['74e9c927225c46208938f847253904f8'],
    name: 'NowCode Zen API',
    endpoint: 'https://opencode.ai/zen/v1',
    description:
        'Outbound REST message for the OpenCode Zen unified LLM gateway. Routes to Anthropic messages or OpenAI chat completions endpoints based on model family.',
    functions: [
        {
            name: 'sendChatCompletion',
            httpMethod: 'POST',
            endpoint: 'https://opencode.ai/zen/v1/chat/completions',
            content: '${body}',
            headers: [
                {
                    $id: Now.ID['1a19228302244f298cdcd07689cbeed5'],
                    name: 'Authorization',
                    value: 'Bearer ${apiKey}',
                },
                {
                    $id: Now.ID['27d15c99c19a40fdb58ba67d4b0b33ea'],
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
            variables: [
                {
                    $id: Now.ID['9b9567f1b46745c0bf0cea3675b5cdbf'],
                    name: 'apiKey',
                },
                {
                    $id: Now.ID['cbeafeba35004352adc370980c008de2'],
                    name: 'body',
                },
            ],
        },
        {
            name: 'sendAnthropicMessage',
            httpMethod: 'POST',
            endpoint: 'https://opencode.ai/zen/v1/messages',
            content: '${body}',
            headers: [
                {
                    $id: Now.ID['c30bbc7ddb5b48e0aacff1ab6c44c9c8'],
                    name: 'Content-Type',
                    value: 'application/json',
                },
                {
                    $id: Now.ID['cfca6cd40a15405fb0a3bc771b398610'],
                    name: 'anthropic-version',
                    value: '2023-06-01',
                },
                {
                    $id: Now.ID['d59cac9810b346bbbf47d206e860082f'],
                    name: 'x-api-key',
                    value: '${apiKey}',
                },
            ],
            variables: [
                {
                    $id: Now.ID['24dae8ee1d6e4d458f0ff9fd0c237730'],
                    name: 'apiKey',
                },
                {
                    $id: Now.ID['d83c8e18e8824b09839b42e3d27cb4b6'],
                    name: 'body',
                },
            ],
        },
    ],
})
