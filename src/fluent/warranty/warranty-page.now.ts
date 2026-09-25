import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import htmlFile from '../../client/warranty/index.html'

UiPage({
    $id: Now.ID['warranty_tracking_page'],
    endpoint: 'x_1733631_now_code_warranty.do',
    description:
        'Seguimiento de garantías — requested items of the warranty registration catalog item with primary and current SLA progress',
    category: 'general',
    direct: true,
    html: htmlFile,
    clientScript: '',
    processingScript: '',
})
