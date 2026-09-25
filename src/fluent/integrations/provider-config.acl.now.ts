import { Acl } from '@servicenow/sdk/core'

// Provider configs hold encrypted API keys. Now Code reads and writes them
// server-side through NowCodeLLMClient; direct access is admin-only: the
// scripts deny everyone and adminOverrides lets admins through.

Acl({
    $id: Now.ID['provider_config_read_acl'],
    type: 'record',
    table: 'x_1733631_now_code_provider_config',
    operation: 'read',
    decisionType: 'allow',
    script: 'answer = false;',
    adminOverrides: true,
    description: 'Only admins can read Now Code provider configs directly',
})

Acl({
    $id: Now.ID['provider_config_write_acl'],
    type: 'record',
    table: 'x_1733631_now_code_provider_config',
    operation: 'write',
    decisionType: 'allow',
    script: 'answer = false;',
    adminOverrides: true,
    description: 'Only admins can edit Now Code provider configs directly',
})

Acl({
    $id: Now.ID['provider_config_create_acl'],
    type: 'record',
    table: 'x_1733631_now_code_provider_config',
    operation: 'create',
    decisionType: 'allow',
    script: 'answer = false;',
    adminOverrides: true,
    description: 'Only admins can create Now Code provider configs directly',
})

Acl({
    $id: Now.ID['provider_config_delete_acl'],
    type: 'record',
    table: 'x_1733631_now_code_provider_config',
    operation: 'delete',
    decisionType: 'allow',
    script: 'answer = false;',
    adminOverrides: true,
    description: 'Only admins can delete Now Code provider configs directly',
})
