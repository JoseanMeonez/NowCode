(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var client = new NowCodeLLMClient();
        var result = client.listModels();
        var settings = client.getPublicSettings();

        response.setStatus(200);
        response.setBody({
            models: result.models,
            source: result.source,
            error: result.error || '',
            provider: settings.provider,
            provider_label: settings.provider_label,
            default_model: client.getDefaultModel(),
            has_api_key: settings.has_api_key
        });
    } catch (ex) {
        gs.error('Now Code API - listModels error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
