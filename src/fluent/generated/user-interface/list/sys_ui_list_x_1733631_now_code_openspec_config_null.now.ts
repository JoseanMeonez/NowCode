import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1733631_now_code_openspec_config',
    view: default_view,
    columns: [
        'project_context',
        'rules_apply',
        'rules_archive',
        'rules_design',
        'rules_proposal',
        'rules_specs',
        'rules_tasks',
        'rules_verify',
        'session',
        'strict_tdd',
    ],
})
