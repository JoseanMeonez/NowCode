(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sysId = request.pathParams['ritm_id'];
        if (!sysId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: ritm_id' });
            return;
        }

        var tracker = new NowCodeWarrantyTracker();
        var result = tracker.getRequest(sysId);
        if (!result) {
            response.setStatus(404);
            response.setBody({ error: 'Requested item not found' });
            return;
        }

        response.setStatus(200);
        response.setBody(result);
    } catch (ex) {
        gs.error('Now Code API - getWarrantyRequest error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
