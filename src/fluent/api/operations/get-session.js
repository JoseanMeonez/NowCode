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

        var sessionObj = {
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            model: gr.getValue('model') || '',
            model_endpoint: gr.getValue('model_endpoint') || '',
            status: gr.getValue('status'),
            sdd_phase: gr.getValue('sdd_phase') || 'none',
            sdd_active: gr.getValue('sdd_active') === 'true' || gr.getValue('sdd_active') === '1',
            context_scope: gr.getValue('context_scope') || '',
            total_tokens: parseInt(gr.getValue('total_tokens'), 10) || 0,
            user: gr.getValue('user'),
            created_on: gr.getValue('sys_created_on'),
            updated_on: gr.getValue('sys_updated_on')
        };

        // Include SDD status if SDD is active
        if (sessionObj.sdd_active) {
            var orchestrator = new NowCodeSDDOrchestrator(sessionId);
            var sddStatus = orchestrator.getSddStatus();
            sessionObj.sdd_status = sddStatus;
        }

        response.setStatus(200);
        response.setBody(sessionObj);
    } catch (ex) {
        gs.error('Now Code API - getSession error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
