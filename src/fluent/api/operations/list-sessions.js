(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var userId = gs.getUserID();
        var sessions = [];

        var gr = new GlideRecord('x_1733631_now_code_chat_session');
        gr.addQuery('user', userId);
        gr.orderBy('status');          // active before archived (alphabetical)
        gr.orderByDesc('sys_updated_on');
        gr.query();

        while (gr.next()) {
            sessions.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                model: gr.getValue('model') || '',
                status: gr.getValue('status'),
                sdd_phase: gr.getValue('sdd_phase') || 'none',
                sdd_active: gr.getValue('sdd_active') === 'true' || gr.getValue('sdd_active') === '1',
                context_scope: gr.getValue('context_scope') || '',
                total_tokens: parseInt(gr.getValue('total_tokens'), 10) || 0,
                created_on: gr.getValue('sys_created_on'),
                updated_on: gr.getValue('sys_updated_on')
            });
        }

        response.setStatus(200);
        response.setBody({ sessions: sessions });
    } catch (ex) {
        gs.error('Now Code API - listSessions error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
