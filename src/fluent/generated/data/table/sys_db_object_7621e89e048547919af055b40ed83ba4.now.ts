import { Table, IntegerColumn, ChoiceColumn, ReferenceColumn, StringColumn, DateTimeColumn } from '@servicenow/sdk/core'

export const x_1733631_now_code_sdd_artifact = Table({
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
    display: 'title',
    index: [
        {
            name: 'index',
            unique: false,
            element: 'approved_by',
        },
        {
            name: 'index2',
            unique: false,
            element: 'parent_artifact',
        },
        {
            name: 'index3',
            unique: false,
            element: 'session',
        },
    ],
    label: 'SDD Artifact',
    name: 'x_1733631_now_code_sdd_artifact',
    schema: {
        version: IntegerColumn({
            default: '1',
        }),
        phase: ChoiceColumn({
            choices: {
                init: {
                    label: 'Initialize',
                    sequence: 1,
                },
                explore: {
                    label: 'Explore',
                    sequence: 2,
                },
                propose: {
                    label: 'Propose',
                    sequence: 3,
                },
                spec: {
                    label: 'Specification',
                    sequence: 4,
                },
                design: {
                    label: 'Design',
                    sequence: 5,
                },
                tasks: {
                    label: 'Tasks',
                    sequence: 6,
                },
                apply: {
                    label: 'Apply',
                    sequence: 7,
                },
                verify: {
                    label: 'Verify',
                    sequence: 8,
                },
                archive: {
                    label: 'Archive',
                    sequence: 9,
                },
                onboard: {
                    label: 'Onboard',
                    sequence: 10,
                },
            },
            mandatory: true,
        }),
        artifact_type: ChoiceColumn({
            choices: {
                proposal: {
                    label: 'Proposal',
                    sequence: 1,
                },
                specification: {
                    label: 'Specification',
                    sequence: 2,
                },
                design_doc: {
                    label: 'Design Document',
                    sequence: 3,
                },
                task_list: {
                    label: 'Task List',
                    sequence: 4,
                },
                verification_report: {
                    label: 'Verification Report',
                    sequence: 5,
                },
                archive_summary: {
                    label: 'Archive Summary',
                    sequence: 6,
                },
                context_snapshot: {
                    label: 'Context Snapshot',
                    sequence: 7,
                },
            },
            mandatory: true,
        }),
        approved_by: ReferenceColumn({
            referenceTable: 'sys_user',
        }),
        content: StringColumn({
            maxLength: 65000,
        }),
        session: ReferenceColumn({
            cascadeRule: 'cascade',
            mandatory: true,
            referenceTable: 'x_1733631_now_code_chat_session',
        }),
        title: StringColumn({
            mandatory: true,
            maxLength: 200,
        }),
        parent_artifact: ReferenceColumn({
            cascadeRule: 'none',
            referenceTable: 'x_1733631_now_code_sdd_artifact',
        }),
        approved_on: DateTimeColumn({}),
        status: ChoiceColumn({
            default: 'draft',
            choices: {
                draft: {
                    label: 'Draft',
                    sequence: 1,
                },
                pending_review: {
                    label: 'Pending Review',
                    sequence: 2,
                },
                approved: {
                    label: 'Approved',
                    sequence: 3,
                },
                rejected: {
                    label: 'Rejected',
                    sequence: 4,
                },
                implemented: {
                    label: 'Implemented',
                    sequence: 5,
                },
                archived: {
                    label: 'Archived',
                    sequence: 6,
                },
            },
        }),
    },
})
