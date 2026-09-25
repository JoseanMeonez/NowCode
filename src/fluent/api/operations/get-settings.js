(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var client = new NowCodeLLMClient();
        response.setStatus(200);
        response.setBody(client.getPublicSettings());
    } catch (ex) {
        gs.error('Now Code API - getSettings error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
