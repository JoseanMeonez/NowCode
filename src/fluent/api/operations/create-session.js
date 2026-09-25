(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var body = request.body ? JSON.parse(request.body.dataString) : {};

        // Validate required fields
        if (!body.name) {
            response.setStatus(400);
            response.setBody({ error: 'Missing required field: name' });
            return;
        }

        var client = new NowCodeLLMClient();
        var model = body.model || client.getDefaultModel();
        var contextScope = body.context_scope || '';

        // Wire format (chat / messages / responses) the model family is served on
        var modelEndpoint = client.describeModel(model).format;

        // Create session record
        var gr = new GlideRecord('x_1733631_now_code_chat_session');
        gr.initialize();
        gr.setValue('name', body.name);
        gr.setValue('model', model);
        gr.setValue('model_endpoint', modelEndpoint);
        gr.setValue('status', 'active');
        gr.setValue('sdd_phase', 'none');
        gr.setValue('sdd_active', false);
        gr.setValue('total_tokens', 0);
        gr.setValue('user', gs.getUserID());
        if (contextScope) {
            gr.setValue('context_scope', contextScope);
        }
        var sysId = gr.insert();

        if (!sysId) {
            response.setStatus(500);
            response.setBody({ error: 'Failed to create session' });
            return;
        }

        response.setStatus(201);
        response.setBody({
            sys_id: sysId,
            name: body.name,
            model: model,
            model_endpoint: modelEndpoint,
            status: 'active',
            sdd_phase: 'none',
            sdd_active: false,
            context_scope: contextScope,
            total_tokens: 0,
            user: gs.getUserID()
        });
    } catch (ex) {
        gs.error('Now Code API - createSession error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
