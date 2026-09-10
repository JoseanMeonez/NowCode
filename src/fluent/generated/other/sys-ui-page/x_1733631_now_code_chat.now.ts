import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import htmlFile from '../../../../client/index.html'

UiPage({
    $id: Now.ID['135445b4a6924672a3ba35daf14f5b1f'],
    endpoint: 'x_1733631_now_code_chat.do',
    description: 'Now Code - AI Development Assistant Chat Interface',
    category: 'general',
    direct: true,
    html: htmlFile,
    clientScript: '',
    processingScript: '',
})
