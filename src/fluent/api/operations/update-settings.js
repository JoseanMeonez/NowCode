(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var body = request.body ? JSON.parse(request.body.dataString) : {};

        var client = new NowCodeLLMClient();
        var result = client.saveSettings({
            provider: body.provider,
            base_url: body.base_url,
            api_key: body.api_key,
            clear_api_key: body.clear_api_key === true,
            default_model: body.default_model,
            max_tokens: body.max_tokens
        });

        if (!result.success) {
            response.setStatus(400);
            response.setBody({ error: result.message });
            return;
        }

        response.setStatus(200);
        response.setBody(new NowCodeLLMClient().getPublicSettings());
    } catch (ex) {
        gs.error('Now Code API - updateSettings error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
