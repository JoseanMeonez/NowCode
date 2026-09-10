class NowCodeSDDOrchestrator {
    initialize(sessionId?: any);
    getPhaseOrder();
    canTransitionTo(targetPhase?: any);
    transitionPhase(targetPhase?: any);
    buildSystemPrompt(phase?: any);
    sendMessage(userMessage?: any);
    callLLM(systemPrompt?: any, messages?: any, model?: any);
    extractArtifact(response?: any, phase?: any);
    startSDD(targetTable?: any, targetScope?: any);
    approveProposal(artifactId?: any);
    rejectProposal(artifactId?: any, reason?: any);
    getSessionHistory(sessionId?: any);
    getSddStatus(sessionId?: any);
}

class NowCodeBestPractices {
    initialize();
    getAllPractices();
    getPracticesForCategory(category?: any);
    getPracticesForContext(context?: any);
    formatForLLM();
}

class NowCodePlatformContext {
    initialize();
    getTableSchema(tableName?: any);
    getTableList(scopeName?: any);
    getBusinessRules(tableName?: any);
    getScriptIncludes(scopeName?: any);
    getInstalledPlugins();
    getInstanceInfo();
    getTableDocumentation(tableName?: any);
    buildContextForTable(tableName?: any);
    buildScopeContext(scopeName?: any);
}

class NowCodeDesignSkills {
    initialize();
    getFrontendDesignSkill();
    getUiUxProMaxSkill();
    getAllDesignSkills();
    formatForLLM();
    getDesignSkillsForContext(context?: any);
}

