import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1733631_now_code_sdd_artifact',
    view: default_view,
    columns: [
        'approved_by',
        'approved_on',
        'artifact_type',
        'content',
        'parent_artifact',
        'phase',
        'session',
        'status',
        'title',
        'version',
    ],
})
