(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sessionId = request.pathParams['session_id'];
        if (!sessionId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: session_id' });
            return;
        }

        var gr = new GlideRecord('x_1733631_now_code_chat_session');
        if (!gr.get(sessionId)) {
            response.setStatus(404);
            response.setBody({ error: 'Session not found' });
            return;
        }

        // Verify ownership
        if (gr.getValue('user') !== gs.getUserID()) {
            response.setStatus(403);
            response.setBody({ error: 'You do not own this session' });
            return;
        }

        if (gr.getValue('status') === 'archived') {
            response.setStatus(200);
            response.setBody({ message: 'Session is already archived', sys_id: sessionId });
            return;
        }

        gr.setValue('status', 'archived');
        gr.update();

        response.setStatus(200);
        response.setBody({ message: 'Session archived successfully', sys_id: sessionId });
    } catch (ex) {
        gs.error('Now Code API - archiveSession error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
