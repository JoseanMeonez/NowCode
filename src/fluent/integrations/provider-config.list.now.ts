import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1733631_now_code_provider_config',
    view: default_view,
    columns: ['user', 'provider', 'base_url', 'api_key_hint', 'default_model', 'max_tokens'],
})
