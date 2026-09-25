(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var state = request.queryParams['state'] ? String(request.queryParams['state']) : 'open';
        var q = request.queryParams['q'] ? String(request.queryParams['q']) : '';
        var limit = request.queryParams['limit'] ? String(request.queryParams['limit']) : '';

        var tracker = new NowCodeWarrantyTracker();
        var result = tracker.listRequests({ state: state, q: q, limit: limit });

        response.setStatus(200);
        response.setBody(result);
    } catch (ex) {
        gs.error('Now Code API - listWarrantyRequests error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
