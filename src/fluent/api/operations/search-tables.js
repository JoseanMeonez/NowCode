(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var scopeParam = request.queryParams['scope'];
        var scope = scopeParam ? String(scopeParam) : '';

        var platformContext = new NowCodePlatformContext();
        var result = platformContext.getTableList(scope);

        response.setStatus(200);
        response.setBody(result);
    } catch (ex) {
        gs.error('Now Code API - searchTables error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
