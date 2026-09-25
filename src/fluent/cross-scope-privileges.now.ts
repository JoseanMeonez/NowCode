import { CrossScopePrivilege } from '@servicenow/sdk/core'

CrossScopePrivilege({
    $id: Now.ID['05fdcea4c3978310022a3342b40131fa'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTResponse.getStatusCode',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['09fdcea4c3978310022a3342b40131f6'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.execute',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['0c5c86e0c3978310022a3342b4013112'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableServiceResultBuilder.setStatus',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['485c86e0c3978310022a3342b4013195'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableServiceResultBuilder.setBody',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['4dfdcea4c3978310022a3342b401319b'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setHttpTimeout',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['63edcea4c3978310022a3342b4013104'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'GlideRecord.setValue',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['8dfdcea4c3978310022a3342b40131fd'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTResponse.getBody',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['97ed8ea4c3978310022a3342b40131fc'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'RESTAPIRequest',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['c1fdcea4c3978310022a3342b4013194'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setStringParameterNoEscape',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['c1fdcea4c3978310022a3342b4013198'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'Glide API: properties',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['d7edcea4c3978310022a3342b4013100'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'RESTAPIRequestBody',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['ebedcea4c3978310022a3342b4013107'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'GlideRecord.insert',
    targetScope: 'global',
    targetType: 'scriptable',
})


// Direct-endpoint REST calls made by NowCodeLLMClient
CrossScopePrivilege({
    $id: Now.ID['csp_rest_set_endpoint'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setEndpoint',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['csp_rest_set_http_method'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setHttpMethod',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['csp_rest_set_request_header'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setRequestHeader',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['csp_rest_set_request_body'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTMessageClient.setRequestBody',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['csp_rest_have_error'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTResponse.haveError',
    targetScope: 'global',
    targetType: 'scriptable',
})

CrossScopePrivilege({
    $id: Now.ID['csp_rest_get_error_message'],
    operation: 'execute',
    status: 'allowed',
    targetName: 'ScriptableRESTResponse.getErrorMessage',
    targetScope: 'global',
    targetType: 'scriptable',
})

// Global tables read by NowCodeWarrantyTracker

CrossScopePrivilege({
    $id: Now.ID['csp_read_sc_req_item'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sc_req_item',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_sc_task'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sc_task',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_sc_cat_item'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sc_cat_item',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_task_sla'],
    operation: 'read',
    status: 'allowed',
    targetName: 'task_sla',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_contract_sla'],
    operation: 'read',
    status: 'allowed',
    targetName: 'contract_sla',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_sc_item_option_mtom'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sc_item_option_mtom',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_sc_item_option'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sc_item_option',
    targetScope: 'global',
    targetType: 'sys_db_object',
})

CrossScopePrivilege({
    $id: Now.ID['csp_read_item_option_new'],
    operation: 'read',
    status: 'allowed',
    targetName: 'item_option_new',
    targetScope: 'global',
    targetType: 'sys_db_object',
})
