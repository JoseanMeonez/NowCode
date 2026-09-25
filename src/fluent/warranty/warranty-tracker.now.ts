import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['now_code_warranty_tracker_si'],
    name: 'NowCodeWarrantyTracker',
    script: Now.include('./warranty-tracker.server.js'),
    description:
        'Lists requested items of the warranty registration catalog item and resolves, for each one, its primary (whole-request) SLA and its current stage SLA with calendar-day progress, business percentage and breach status.',
    apiName: 'x_1733631_now_code.NowCodeWarrantyTracker',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
