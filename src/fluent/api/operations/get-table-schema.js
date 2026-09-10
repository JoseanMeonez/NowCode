(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var tableName = request.pathParams['table_name'];
        if (!tableName) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: table_name' });
            return;
        }

        // Verify the table exists
        var tableGr = new GlideRecord('sys_db_object');
        tableGr.addQuery('name', tableName);
        tableGr.query();
        if (!tableGr.next()) {
            response.setStatus(404);
            response.setBody({ error: 'Table not found: ' + tableName });
            return;
        }

        var platformContext = new NowCodePlatformContext();
        var result = platformContext.getTableSchema(tableName);

        response.setStatus(200);
        response.setBody(result);
    } catch (ex) {
        gs.error('Now Code API - getTableSchema error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
