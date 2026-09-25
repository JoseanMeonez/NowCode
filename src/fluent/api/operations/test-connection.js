(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var body = request.body && request.body.dataString ? JSON.parse(request.body.dataString) : {};

        var client = new NowCodeLLMClient();
        var result = client.testConnection(body.model || '');

        // A failed connection test is a valid answer, not a server error
        response.setStatus(200);
        response.setBody(result);
    } catch (ex) {
        gs.error('Now Code API - testConnection error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
