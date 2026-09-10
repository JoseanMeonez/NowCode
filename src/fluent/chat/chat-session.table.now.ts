import { Table, StringColumn, ChoiceColumn, BooleanColumn, ReferenceColumn, IntegerColumn } from '@servicenow/sdk/core'

export const x_1733631_now_code_chat_session = Table({
    actions: {
        read: false,
        update: false,
        delete: false,
        create: false,
    },
    allowClientScripts: false,
    allowNewFields: false,
    allowUiActions: false,
    allowWebServiceAccess: true,
    display: 'name',
    index: [
        {
            name: 'index',
            unique: false,
            element: 'user',
        },
    ],
    label: 'Chat Session',
    name: 'x_1733631_now_code_chat_session',
    schema: {
        model_endpoint: StringColumn({
            maxLength: 200,
        }),
        sdd_phase: ChoiceColumn({
            default: 'none',
            choices: {
                none: {
                    label: 'None',
                    sequence: 1,
                },
                init: {
                    label: 'Initialize',
                    sequence: 2,
                },
                explore: {
                    label: 'Explore',
                    sequence: 3,
                },
                propose: {
                    label: 'Propose',
                    sequence: 4,
                },
                spec: {
                    label: 'Specification',
                    sequence: 5,
                },
                design: {
                    label: 'Design',
                    sequence: 6,
                },
                tasks: {
                    label: 'Tasks',
                    sequence: 7,
                },
                apply: {
                    label: 'Apply',
                    sequence: 8,
                },
                verify: {
                    label: 'Verify',
                    sequence: 9,
                },
                archive: {
                    label: 'Archive',
                    sequence: 10,
                },
                onboard: {
                    label: 'Onboard',
                    sequence: 11,
                },
            },
            label: 'SDD Phase',
        }),
        sdd_active: BooleanColumn({
            default: false,
            label: 'SDD Active',
        }),
        user: ReferenceColumn({
            mandatory: true,
            referenceTable: 'sys_user',
        }),
        model: StringColumn({
            maxLength: 100,
        }),
        total_tokens: IntegerColumn({
            default: '0',
        }),
        context_scope: StringColumn({
            maxLength: 200,
        }),
        status: ChoiceColumn({
            default: 'active',
            choices: {
                active: {
                    label: 'Active',
                    sequence: 1,
                },
                archived: {
                    label: 'Archived',
                    sequence: 2,
                },
            },
        }),
        name: StringColumn({
            mandatory: true,
            maxLength: 255,
        }),
    },
})
