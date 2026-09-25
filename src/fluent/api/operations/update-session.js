(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sessionId = request.pathParams['session_id'];
        if (!sessionId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: session_id' });
            return;
        }

        var body = request.body ? JSON.parse(request.body.dataString) : {};

        var gr = new GlideRecord('x_1733631_now_code_chat_session');
        if (!gr.get(sessionId) || gr.getValue('user') !== gs.getUserID()) {
            response.setStatus(404);
            response.setBody({ error: 'Session not found' });
            return;
        }

        if (body.name !== undefined) {
            var name = String(body.name || '').trim();
            if (!name) {
                response.setStatus(400);
                response.setBody({ error: 'name cannot be empty' });
                return;
            }
            gr.setValue('name', name.substring(0, 255));
        }

        if (body.model) {
            var client = new NowCodeLLMClient();
            gr.setValue('model', String(body.model));
            gr.setValue('model_endpoint', client.describeModel(body.model).format);
        }

        if (body.context_scope !== undefined) {
            gr.setValue('context_scope', String(body.context_scope || ''));
        }

        gr.update();

        response.setStatus(200);
        response.setBody({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            model: gr.getValue('model') || '',
            model_endpoint: gr.getValue('model_endpoint') || '',
            context_scope: gr.getValue('context_scope') || ''
        });
    } catch (ex) {
        gs.error('Now Code API - updateSession error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
