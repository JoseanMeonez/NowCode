import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['78994cec91af4d759167271699a1b158'],
    name: 'NowCodeSDDOrchestrator',
    script: Now.include('./sys_script_include_78994cec91af4d759167271699a1b158.server.js'),
    description:
        'Core SDD orchestrator for Now Code. Manages phase transitions, builds context-rich system prompts, routes LLM calls to the correct OpenCode Zen endpoint, extracts structured artifacts, and provides the approval gate workflow for the propose→spec transition.',
    apiName: 'x_1733631_now_code.NowCodeSDDOrchestrator',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
