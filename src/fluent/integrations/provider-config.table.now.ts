import {
    Table,
    StringColumn,
    ChoiceColumn,
    ReferenceColumn,
    IntegerColumn,
    Password2Column,
} from '@servicenow/sdk/core'

export const x_1733631_now_code_provider_config = Table({
    actions: {
        read: false,
        update: false,
        delete: false,
        create: false,
    },
    allowClientScripts: false,
    allowNewFields: false,
    allowUiActions: false,
    allowWebServiceAccess: false,
    display: 'provider',
    index: [
        {
            name: 'index',
            unique: false,
            element: 'user',
        },
    ],
    label: 'Provider Config',
    name: 'x_1733631_now_code_provider_config',
    schema: {
        user: ReferenceColumn({
            referenceTable: 'sys_user',
            label: 'User',
            hint: 'Owner of this key. Leave empty to share the key with every Now Code user.',
        }),
        provider: ChoiceColumn({
            default: 'opencode_go',
            label: 'Provider',
            choices: {
                opencode_go: {
                    label: 'OpenCode Go',
                    sequence: 1,
                },
                opencode_zen: {
                    label: 'OpenCode Zen',
                    sequence: 2,
                },
                custom: {
                    label: 'Custom (OpenAI-compatible)',
                    sequence: 3,
                },
            },
        }),
        base_url: StringColumn({
            label: 'Base URL',
            maxLength: 500,
            hint: 'Optional override of the provider base URL',
        }),
        api_key: Password2Column({
            label: 'API Key',
            maxLength: 1000,
        }),
        api_key_hint: StringColumn({
            label: 'API Key Hint',
            maxLength: 40,
            readOnly: true,
        }),
        default_model: StringColumn({
            label: 'Default Model',
            maxLength: 100,
        }),
        max_tokens: IntegerColumn({
            label: 'Max Output Tokens',
            default: '8192',
        }),
    },
})
