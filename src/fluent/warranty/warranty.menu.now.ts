import { ApplicationMenu, Record } from '@servicenow/sdk/core'

export const warrantyMenu = ApplicationMenu({
    $id: Now.ID['warranty_app_menu'],
    title: 'Garantías',
    hint: 'Seguimiento de solicitudes de garantía y sus SLAs',
    description: 'Seguimiento de solicitudes de registro de garantía y sus SLAs',
    roles: ['itil', 'admin'],
    active: true,
})

Record({
    $id: Now.ID['warranty_app_module_tracking'],
    table: 'sys_app_module',
    data: {
        title: 'Seguimiento de garantías',
        application: warrantyMenu,
        link_type: 'DIRECT',
        query: 'x_1733631_now_code_warranty.do',
        hint: 'Solicitudes de garantía con el avance del SLA primario y el SLA actual',
        roles: ['itil', 'admin'],
        active: true,
        order: 100,
    },
})
