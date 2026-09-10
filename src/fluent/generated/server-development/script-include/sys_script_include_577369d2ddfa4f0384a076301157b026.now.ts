import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['577369d2ddfa4f0384a076301157b026'],
    name: 'NowCodeBestPractices',
    script: Now.include('./sys_script_include_577369d2ddfa4f0384a076301157b026.server.js'),
    description:
        'Provides ServiceNow development best practices as structured knowledge. Covers tables, business rules, security, scripts, performance, client scripts, scoping, data modeling, integration, and testing. Returns practices by category or context, with an LLM-ready formatted output.',
    apiName: 'x_1733631_now_code.NowCodeBestPractices',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
