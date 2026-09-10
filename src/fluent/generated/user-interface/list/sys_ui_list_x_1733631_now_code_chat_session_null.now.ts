import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1733631_now_code_chat_session',
    view: default_view,
    columns: [
        'name',
        'context_scope',
        'model',
        'model_endpoint',
        'sdd_active',
        'sdd_phase',
        'status',
        'total_tokens',
        'user',
    ],
})
