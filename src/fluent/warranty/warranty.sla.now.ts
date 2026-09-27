import { Record } from '@servicenow/sdk/core'

// SLA definitions for the "Registrar Nueva Garantía" catalog item. The item does not
// create catalog tasks, so every SLA lives on the requested item itself:
//   - SLA total: the primary, whole-request commitment (warranty.primary_sla).
//   - Revisión / Resolución: stage SLAs that follow the RITM state; the tracker shows
//     the one currently running as the "current" SLA.
// No schedule (24x7) so the screen's calendar "Día X de Y" matches the SLA percentage.
// Install loads these without running the "Clear SLA table cache" business rule, so
// after the first install on an instance flush caches (/cache.do) or new RITMs get no SLA.
// ponytail: catalog item sys_id f9c648602bdfc3905a61fca24291bf62 is hardcoded in the
// start conditions; move it to a property if the item is recreated on another instance.

Record({
    $id: Now.ID['warranty_sla_total'],
    table: 'contract_sla',
    data: {
        name: 'Garantía - SLA total (15 días)',
        collection: 'sc_req_item',
        type: 'SLA',
        target: 'resolution',
        duration: '1970-01-16 00:00:00',
        schedule_source: 'no_schedule',
        timezone_source: 'task.caller_id.time_zone',
        relative_duration_works_on: 'Task record',
        retroactive: true,
        set_start_to: 'sys_created_on',
        retroactive_pause: true,
        when_to_cancel: 'no_match',
        when_to_resume: 'no_match',
        start_condition: 'cat_item=f9c648602bdfc3905a61fca24291bf62^active=true^EQ',
        stop_condition: 'active=false^EQ',
        flow: '828f267973333300e289235f04f6a7a3', // Default SLA flow
        active: true,
    },
})

Record({
    $id: Now.ID['warranty_sla_review'],
    table: 'contract_sla',
    data: {
        name: 'Garantía - Revisión (2 días)',
        collection: 'sc_req_item',
        type: 'SLA',
        target: 'response',
        duration: '1970-01-03 00:00:00',
        schedule_source: 'no_schedule',
        timezone_source: 'task.caller_id.time_zone',
        relative_duration_works_on: 'Task record',
        retroactive: true,
        set_start_to: 'sys_created_on',
        retroactive_pause: true,
        when_to_cancel: 'no_match',
        when_to_resume: 'no_match',
        start_condition: 'cat_item=f9c648602bdfc3905a61fca24291bf62^state=1^EQ',
        stop_condition: 'state!=1^EQ',
        flow: '828f267973333300e289235f04f6a7a3', // Default SLA flow
        active: true,
    },
})

Record({
    $id: Now.ID['warranty_sla_resolution'],
    table: 'contract_sla',
    data: {
        name: 'Garantía - Resolución (10 días)',
        collection: 'sc_req_item',
        type: 'SLA',
        target: 'resolution',
        duration: '1970-01-11 00:00:00',
        schedule_source: 'no_schedule',
        timezone_source: 'task.caller_id.time_zone',
        relative_duration_works_on: 'Task record',
        // Stage SLA: starts when the RITM enters Work in Progress, not at creation
        retroactive: false,
        retroactive_pause: true,
        when_to_cancel: 'no_match',
        when_to_resume: 'no_match',
        start_condition: 'cat_item=f9c648602bdfc3905a61fca24291bf62^state=2^EQ',
        stop_condition: 'active=false^EQ',
        flow: '828f267973333300e289235f04f6a7a3', // Default SLA flow
        active: true,
    },
})
