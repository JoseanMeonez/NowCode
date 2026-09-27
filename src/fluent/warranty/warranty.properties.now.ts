import { Property } from '@servicenow/sdk/core'

// Settings for the warranty tracking screen (x_1733631_now_code_warranty.do).
// The repo is the source of truth: change values here, not on the instance.

Property({
    $id: Now.ID['warranty_prop_catalog_items'],
    name: 'x_1733631_now_code.warranty.catalog_items',
    type: 'string',
    value: '',
    description:
        'Comma-separated sys_ids or exact names of the warranty catalog item(s). Empty = every active item whose name contains warranty.item_name_match.',
})

Property({
    $id: Now.ID['warranty_prop_item_name_match'],
    name: 'x_1733631_now_code.warranty.item_name_match',
    type: 'string',
    value: 'garant',
    description:
        'Text matched against catalog item names when warranty.catalog_items is empty (matches "Registro de garantía", "Registrar nueva garantía", ...).',
})

Property({
    $id: Now.ID['warranty_prop_primary_sla'],
    name: 'x_1733631_now_code.warranty.primary_sla',
    type: 'string',
    value: 'Garantía - SLA total',
    description:
        'SLA definition (contract_sla) sys_id or name fragment of the primary, whole-request SLA. Empty = the longest SLA attached to the requested item.',
})

Property({
    $id: Now.ID['warranty_prop_at_risk_percent'],
    name: 'x_1733631_now_code.warranty.at_risk_percent',
    type: 'integer',
    value: 75,
    description: 'Business elapsed percentage from which a running SLA is shown as at risk.',
})
