(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sessionId = request.pathParams['session_id'];
        if (!sessionId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: session_id' });
            return;
        }

        // Verify session exists
        var sessionGr = new GlideRecord('x_1733631_now_code_chat_session');
        if (!sessionGr.get(sessionId)) {
            response.setStatus(404);
            response.setBody({ error: 'Session not found' });
            return;
        }

        // Parse pagination params
        var limitParam = request.queryParams['limit'];
        var offsetParam = request.queryParams['offset'];
        var limit = limitParam ? parseInt(String(limitParam), 10) : 50;
        var offset = offsetParam ? parseInt(String(offsetParam), 10) : 0;

        if (isNaN(limit) || limit < 1) limit = 50;
        if (isNaN(offset) || offset < 0) offset = 0;

        var messages = [];
        var gr = new GlideRecord('x_1733631_now_code_chat_message');
        gr.addQuery('session', sessionId);
        gr.orderBy('order_index');
        gr.chooseWindow(offset, offset + limit);
        gr.query();

        while (gr.next()) {
            messages.push({
                sys_id: gr.getUniqueValue(),
                role: gr.getValue('role'),
                content: gr.getValue('content') || '',
                sdd_phase: gr.getValue('sdd_phase') || 'none',
                tokens_used: parseInt(gr.getValue('tokens_used'), 10) || 0,
                model_used: gr.getValue('model_used') || '',
                order_index: parseInt(gr.getValue('order_index'), 10) || 0,
                created_on: gr.getValue('sys_created_on')
            });
        }

        // Get total count for pagination metadata
        var countGr = new GlideRecord('x_1733631_now_code_chat_message');
        countGr.addQuery('session', sessionId);
        countGr.query();
        var total = countGr.getRowCount();

        response.setStatus(200);
        response.setBody({
            messages: messages,
            pagination: {
                limit: limit,
                offset: offset,
                total: total
            }
        });
    } catch (ex) {
        gs.error('Now Code API - getMessages error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
