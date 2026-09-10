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

        var artifacts = [];
        var gr = new GlideRecord('x_1733631_now_code_sdd_artifact');
        gr.addQuery('session', sessionId);
        gr.orderBy('phase');
        gr.orderByDesc('version');
        gr.query();

        while (gr.next()) {
            artifacts.push({
                sys_id: gr.getUniqueValue(),
                phase: gr.getValue('phase'),
                artifact_type: gr.getValue('artifact_type'),
                title: gr.getValue('title'),
                content: gr.getValue('content') || '',
                status: gr.getValue('status'),
                version: parseInt(gr.getValue('version'), 10) || 1,
                parent_artifact: gr.getValue('parent_artifact') || '',
                approved_by: gr.getDisplayValue('approved_by') || '',
                approved_on: gr.getValue('approved_on') || '',
                created_on: gr.getValue('sys_created_on'),
                updated_on: gr.getValue('sys_updated_on')
            });
        }

        response.setStatus(200);
        response.setBody({ artifacts: artifacts });
    } catch (ex) {
        gs.error('Now Code API - getArtifacts error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
