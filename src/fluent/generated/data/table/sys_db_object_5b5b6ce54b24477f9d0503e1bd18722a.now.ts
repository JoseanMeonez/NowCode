import { Table, IntegerColumn, ChoiceColumn, StringColumn, ReferenceColumn } from '@servicenow/sdk/core'

export const x_1733631_now_code_chat_message = Table({
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
    index: [
        {
            name: 'index',
            unique: false,
            element: 'session',
        },
    ],
    label: 'Chat Message',
    name: 'x_1733631_now_code_chat_message',
    schema: {
        order_index: IntegerColumn({}),
        role: ChoiceColumn({
            choices: {
                user: {
                    label: 'User',
                    sequence: 1,
                },
                assistant: {
                    label: 'Assistant',
                    sequence: 2,
                },
                system: {
                    label: 'System',
                    sequence: 3,
                },
            },
            mandatory: true,
        }),
        model_used: StringColumn({
            maxLength: 100,
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
        tokens_used: IntegerColumn({
            default: '0',
        }),
        session: ReferenceColumn({
            cascadeRule: 'cascade',
            mandatory: true,
            referenceTable: 'x_1733631_now_code_chat_session',
        }),
        content: StringColumn({
            maxLength: 65000,
        }),
    },
})
