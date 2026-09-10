import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['0bb03d9979c343358e374b9778ee2728'],
    name: 'NowCodePlatformContext',
    script: Now.include('./sys_script_include_0bb03d9979c343358e374b9778ee2728.server.js'),
    description:
        'Gathers deep platform context from the ServiceNow instance for LLM consumption. Provides methods to query table schemas, business rules, script includes, plugins, instance info, and documentation. Combines them into structured context strings.',
    apiName: 'x_1733631_now_code.NowCodePlatformContext',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
