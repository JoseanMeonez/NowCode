(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sessionId = request.pathParams['session_id'];
        var artifactId = request.pathParams['artifact_id'];

        if (!sessionId || !artifactId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameters: session_id and artifact_id are required' });
            return;
        }

        var body = request.body ? JSON.parse(request.body.dataString) : {};
        var reason = body.reason || '';

        // Verify session exists
        var sessionGr = new GlideRecord('x_1733631_now_code_chat_session');
        if (!sessionGr.get(sessionId)) {
            response.setStatus(404);
            response.setBody({ error: 'Session not found' });
            return;
        }

        // Verify artifact exists and belongs to session
        var artifactGr = new GlideRecord('x_1733631_now_code_sdd_artifact');
        if (!artifactGr.get(artifactId)) {
            response.setStatus(404);
            response.setBody({ error: 'Artifact not found' });
            return;
        }
        if (artifactGr.getValue('session') !== sessionId) {
            response.setStatus(400);
            response.setBody({ error: 'Artifact does not belong to this session' });
            return;
        }

        var orchestrator = new NowCodeSDDOrchestrator(sessionId);
        var result = orchestrator.rejectProposal(artifactId, reason);

        if (!result.success) {
            response.setStatus(400);
            response.setBody({ error: result.message });
            return;
        }

        response.setStatus(200);
        response.setBody({
            message: result.message,
            artifact_id: artifactId,
            session_id: sessionId,
            reason: reason
        });
    } catch (ex) {
        gs.error('Now Code API - rejectArtifact error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
