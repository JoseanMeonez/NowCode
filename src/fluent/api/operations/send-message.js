(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var sessionId = request.pathParams['session_id'];
        if (!sessionId) {
            response.setStatus(400);
            response.setBody({ error: 'Missing path parameter: session_id' });
            return;
        }

        var body = request.body ? JSON.parse(request.body.dataString) : {};
        if (!body.content) {
            response.setStatus(400);
            response.setBody({ error: 'Missing required field: content' });
            return;
        }

        // Verify session exists
        var sessionGr = new GlideRecord('x_1733631_now_code_chat_session');
        if (!sessionGr.get(sessionId)) {
            response.setStatus(404);
            response.setBody({ error: 'Session not found' });
            return;
        }

        if (sessionGr.getValue('status') === 'archived') {
            response.setStatus(400);
            response.setBody({ error: 'Cannot send messages to an archived session' });
            return;
        }

        var orchestrator = new NowCodeSDDOrchestrator(sessionId);
        var sddCommand = body.sdd_command || null;
        var sddResult = null;

        // Handle SDD commands before processing the message
        if (sddCommand === 'start_sdd') {
            var targetTable = body.target_table || '';
            var targetScope = body.target_scope || '';
            sddResult = orchestrator.startSDD(targetTable, targetScope);
            if (!sddResult.success) {
                response.setStatus(400);
                response.setBody({ error: sddResult.message });
                return;
            }
        } else if (sddCommand === 'approve_proposal') {
            if (!body.artifact_id) {
                response.setStatus(400);
                response.setBody({ error: 'approve_proposal requires artifact_id in body' });
                return;
            }
            sddResult = orchestrator.approveProposal(body.artifact_id);
            if (!sddResult.success) {
                response.setStatus(400);
                response.setBody({ error: sddResult.message });
                return;
            }
        } else if (sddCommand === 'reject_proposal') {
            if (!body.artifact_id) {
                response.setStatus(400);
                response.setBody({ error: 'reject_proposal requires artifact_id in body' });
                return;
            }
            sddResult = orchestrator.rejectProposal(body.artifact_id, body.reason || '');
            if (!sddResult.success) {
                response.setStatus(400);
                response.setBody({ error: sddResult.message });
                return;
            }
        } else if (sddCommand === 'next_phase') {
            // Determine the next valid phase from possible transitions
            var currentPhase = orchestrator.session ? orchestrator.session.sdd_phase : 'none';
            var transitions = orchestrator.PHASE_TRANSITIONS[currentPhase] || [];
            if (transitions.length === 0) {
                response.setStatus(400);
                response.setBody({ error: 'No valid phase transitions from: ' + currentPhase });
                return;
            }
            // Pick the first valid transition (the primary forward path)
            var targetPhase = body.target_phase || transitions[0];
            sddResult = orchestrator.transitionPhase(targetPhase);
            if (!sddResult.success) {
                response.setStatus(400);
                response.setBody({ error: sddResult.message });
                return;
            }
        }

        // Process the chat message through the orchestrator
        var result = orchestrator.sendMessage(body.content);

        if (!result.success) {
            response.setStatus(500);
            response.setBody({ error: result.message });
            return;
        }

        var responseBody = {
            user_message: {
                content: body.content,
                role: 'user'
            },
            assistant_response: {
                content: result.content,
                tokens: result.tokens,
                model: result.model,
                sys_id: result.messageSysId,
                artifact: result.artifact || null
            }
        };

        // Include SDD status if active
        if (orchestrator.session && orchestrator.session.sdd_active) {
            responseBody.sdd_status = orchestrator.getSddStatus();
        }

        if (sddResult) {
            responseBody.sdd_command_result = sddResult;
        }

        response.setStatus(200);
        response.setBody(responseBody);
    } catch (ex) {
        gs.error('Now Code API - sendMessage error: ' + ex.getMessage());
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + ex.getMessage() });
    }
})(request, response);
