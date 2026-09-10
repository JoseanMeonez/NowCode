import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1733631_now_code_chat_message',
    view: default_view,
    columns: ['content', 'model_used', 'order_index', 'role', 'sdd_phase', 'session', 'tokens_used'],
})
