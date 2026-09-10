import { Table, StringColumn, BooleanColumn, ReferenceColumn } from '@servicenow/sdk/core'

export const x_1733631_now_code_openspec_config = Table({
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
            unique: true,
            element: 'session',
        },
    ],
    label: 'OpenSpec Config',
    name: 'x_1733631_now_code_openspec_config',
    schema: {
        target_table: StringColumn({
            maxLength: 200,
        }),
        project_context: StringColumn({
            maxLength: 65000,
        }),
        rules_verify: StringColumn({
            label: 'Rules - Verify',
            maxLength: 4000,
        }),
        rules_apply: StringColumn({
            label: 'Rules - Apply',
            maxLength: 4000,
        }),
        target_scope: StringColumn({
            maxLength: 200,
        }),
        rules_specs: StringColumn({
            label: 'Rules - Specs',
            maxLength: 4000,
        }),
        rules_tasks: StringColumn({
            label: 'Rules - Tasks',
            maxLength: 4000,
        }),
        strict_tdd: BooleanColumn({
            default: false,
            label: 'Strict TDD',
        }),
        rules_proposal: StringColumn({
            label: 'Rules - Proposal',
            maxLength: 4000,
        }),
        rules_design: StringColumn({
            label: 'Rules - Design',
            maxLength: 4000,
        }),
        session: ReferenceColumn({
            cascadeRule: 'cascade',
            mandatory: true,
            referenceTable: 'x_1733631_now_code_chat_session',
            unique: true,
        }),
        rules_archive: StringColumn({
            label: 'Rules - Archive',
            maxLength: 4000,
        }),
    },
})
