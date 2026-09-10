var NowCodeBestPractices = Class.create()
NowCodeBestPractices.prototype = {
    initialize: function () {
        this._practices = {
            tables: {
                category: 'Table Design',
                practices: [
                    {
                        id: 'table_naming',
                        title: 'Use scope prefix and naming conventions',
                        description:
                            'Always use the scope prefix for custom table names (e.g., x_myapp_tablename). Use lowercase with underscores. Keep names descriptive but concise.',
                        severity: 'critical',
                    },
                    {
                        id: 'table_extend_task',
                        title: 'Extend task table for workflow-driven records',
                        description:
                            'When records need assignment, approval, SLA tracking, or workflow, extend the task table rather than creating standalone tables. This gives you state, assignment_group, assigned_to, and other task fields for free.',
                        severity: 'high',
                    },
                    {
                        id: 'table_extend_vs_new',
                        title: 'Extend existing tables when appropriate',
                        description:
                            'Before creating a new table, check if an existing table (task, cmdb_ci, etc.) provides the base fields you need. Extending preserves platform functionality like notifications, SLAs, and reporting.',
                        severity: 'high',
                    },
                    {
                        id: 'table_documentation',
                        title: 'Document tables and fields',
                        description:
                            'Add labels, help text, and hints to all custom fields via sys_documentation. This helps users and AI assistants understand the data model.',
                        severity: 'medium',
                    },
                ],
            },
            business_rules: {
                category: 'Business Rules',
                practices: [
                    {
                        id: 'br_avoid_current_update',
                        title: 'Never call current.update() in a business rule',
                        description:
                            'Calling current.update() inside a business rule triggers the business rule to fire again, causing infinite loops or duplicate processing. Set field values directly on the current object instead; the platform saves them automatically.',
                        severity: 'critical',
                    },
                    {
                        id: 'br_async_when_possible',
                        title: 'Use async business rules for non-blocking operations',
                        description:
                            'For operations that do not need to complete before the user sees a response (email, logging, related record updates), use async business rules. This improves form response times.',
                        severity: 'high',
                    },
                    {
                        id: 'br_proper_when_order',
                        title: 'Choose correct timing and order',
                        description:
                            'Use "before" for validation and field manipulation, "after" for related record operations, and "async" for heavy processing. Set order values deliberately (100 = default) to control execution sequence.',
                        severity: 'high',
                    },
                    {
                        id: 'br_avoid_complex_client_callable',
                        title: 'Avoid complex client-callable business rules',
                        description:
                            'Client-callable business rules (Display rules) run on every form load. Keep them simple. For complex server lookups, use GlideAjax with Script Includes instead.',
                        severity: 'medium',
                    },
                    {
                        id: 'br_condition_filter',
                        title: 'Use conditions to limit execution',
                        description:
                            'Always set filter conditions on business rules so they only run when needed. Avoid running on every insert/update if only specific scenarios require action.',
                        severity: 'medium',
                    },
                ],
            },
            security: {
                category: 'Security',
                practices: [
                    {
                        id: 'sec_acl_first',
                        title: 'ACLs first, scripts second',
                        description:
                            'Always create ACL rules for custom tables before writing any scripts. ACLs are the platform-native security mechanism and are evaluated consistently across all access methods (form, list, API, import).',
                        severity: 'critical',
                    },
                    {
                        id: 'sec_role_layering',
                        title: 'Layer roles properly',
                        description:
                            'Create a base role for read access, elevated roles for write/admin. Use role inheritance. Never grant admin role to application users. Follow the pattern: x_myapp.user < x_myapp.manager < x_myapp.admin.',
                        severity: 'critical',
                    },
                    {
                        id: 'sec_no_hardcode_creds',
                        title: 'Never hardcode credentials',
                        description:
                            'Never store passwords, API keys, or tokens in scripts, properties, or table fields. Use Connection and Credential Aliases (sys_alias) managed through the Credentials table.',
                        severity: 'critical',
                    },
                    {
                        id: 'sec_cross_scope',
                        title: 'Use explicit cross-scope privileges',
                        description:
                            'When accessing resources from another scope, declare cross-scope privileges explicitly. Never bypass scope protections with workarounds.',
                        severity: 'high',
                    },
                    {
                        id: 'sec_input_validation',
                        title: 'Validate all inputs',
                        description:
                            'Validate and sanitize all user inputs in scripted REST APIs, processors, and UI pages. Never trust client-side data. Use server-side validation as the authoritative check.',
                        severity: 'high',
                    },
                ],
            },
            scripts: {
                category: 'Script Includes & Server Scripts',
                practices: [
                    {
                        id: 'si_class_prototype',
                        title: 'Use Class.create() prototype pattern',
                        description:
                            'Follow the standard ServiceNow Class.create() pattern for script includes. Ensure the type property matches the class name exactly. This is the platform convention and required for Object.extendsObject.',
                        severity: 'high',
                    },
                    {
                        id: 'si_focused',
                        title: 'Keep script includes focused',
                        description:
                            'Each script include should have a single responsibility. Create separate script includes for different domains (e.g., UserUtils, IncidentUtils) rather than one monolithic utility class.',
                        severity: 'high',
                    },
                    {
                        id: 'si_client_callable_sparingly',
                        title: 'Use client-callable only when needed',
                        description:
                            'Only set client_callable to true when the script include genuinely needs to be called from the browser via GlideAjax. Every client-callable script include is an attack surface.',
                        severity: 'medium',
                    },
                    {
                        id: 'si_error_handling',
                        title: 'Implement proper error handling',
                        description:
                            'Use try-catch blocks for operations that can fail. Log errors with gs.error() and return meaningful error objects rather than letting exceptions propagate silently.',
                        severity: 'medium',
                    },
                ],
            },
            performance: {
                category: 'Performance',
                practices: [
                    {
                        id: 'perf_no_gliderecord_client',
                        title: 'Never use GlideRecord in client scripts',
                        description:
                            'GlideRecord is a server-side API. Using it in client scripts via synchronous AJAX blocks the browser. Use GlideAjax for async server calls, or g_form.getReference() for simple lookups.',
                        severity: 'critical',
                    },
                    {
                        id: 'perf_dot_walking',
                        title: 'Limit dot-walking depth',
                        description:
                            'Each dot-walk level triggers additional database queries. Limit to 2-3 levels maximum. For deeper relationships, use explicit GlideRecord queries with addQuery instead.',
                        severity: 'high',
                    },
                    {
                        id: 'perf_indexing',
                        title: 'Index frequently queried fields',
                        description:
                            'Add database indexes to fields used in query conditions, especially on high-volume tables. Work with your DBA for composite indexes on multi-field queries.',
                        severity: 'high',
                    },
                    {
                        id: 'perf_batch_operations',
                        title: 'Use batch operations for bulk changes',
                        description:
                            'When updating many records, use GlideRecord.updateMultiple() or scheduled jobs instead of looping through records one at a time with individual updates.',
                        severity: 'medium',
                    },
                    {
                        id: 'perf_avoid_sync_ajax',
                        title: 'Avoid synchronous AJAX calls',
                        description:
                            'Always use asynchronous GlideAjax with getXMLAnswer callback. Synchronous calls freeze the UI and degrade user experience.',
                        severity: 'high',
                    },
                ],
            },
            client_scripts: {
                category: 'Client Scripts',
                practices: [
                    {
                        id: 'cs_use_g_form',
                        title: 'Use g_form API for field manipulation',
                        description:
                            'Always use g_form.setValue(), g_form.setVisible(), g_form.setMandatory() instead of direct DOM manipulation. g_form is the supported API and works across all ServiceNow UI frameworks.',
                        severity: 'critical',
                    },
                    {
                        id: 'cs_minimize_server_calls',
                        title: 'Minimize server round-trips',
                        description:
                            'Batch server calls when possible. Cache frequently used data in client-side variables. Use g_scratchpad for data passed from Display business rules.',
                        severity: 'high',
                    },
                    {
                        id: 'cs_ui_policy_preferred',
                        title: 'Prefer UI Policies over client scripts for simple tasks',
                        description:
                            'For showing/hiding fields, making fields mandatory, or making fields read-only based on conditions, use UI Policies. They are declarative, easier to maintain, and perform better than scripted client scripts.',
                        severity: 'high',
                    },
                    {
                        id: 'cs_avoid_onload_heavy',
                        title: 'Keep onLoad scripts lightweight',
                        description:
                            'Heavy onLoad scripts delay form rendering. Move complex logic to Display business rules (g_scratchpad) or lazy-load data after the form displays.',
                        severity: 'medium',
                    },
                ],
            },
            scoping: {
                category: 'Application Scoping',
                practices: [
                    {
                        id: 'scope_boundaries',
                        title: 'Respect scope boundaries',
                        description:
                            'Keep application logic within its own scope. Do not modify out-of-scope tables or records without explicit cross-scope privileges. Design for clean separation.',
                        severity: 'critical',
                    },
                    {
                        id: 'scope_explicit_access',
                        title: 'Declare cross-scope access explicitly',
                        description:
                            'When your app needs to access another scope, use Cross-Scope Privileges (sys_scope_privilege). Document why the access is needed.',
                        severity: 'high',
                    },
                    {
                        id: 'scope_update_sets',
                        title: 'One logical change per update set',
                        description:
                            'Group related changes in a single update set. Avoid mixing unrelated changes. Name update sets descriptively to make them traceable.',
                        severity: 'medium',
                    },
                ],
            },
            data_model: {
                category: 'Data Modeling',
                practices: [
                    {
                        id: 'dm_reference_integrity',
                        title: 'Maintain reference integrity',
                        description:
                            'Use reference fields (not string fields) to link records between tables. Set cascade rules for deletes. Validate references in business rules when needed.',
                        severity: 'high',
                    },
                    {
                        id: 'dm_choice_vs_table',
                        title: 'Choice fields vs reference tables',
                        description:
                            'Use choice fields for small, stable lists (< 20 items). Use reference tables for large, dynamic, or shared lookup lists that need their own fields or ACLs.',
                        severity: 'medium',
                    },
                    {
                        id: 'dm_field_types',
                        title: 'Choose appropriate field types',
                        description:
                            'Use the correct field type for content: string for short text, journal for append-only logs, html for rich content, integer for counts, decimal for currency. Avoid string fields for structured data.',
                        severity: 'medium',
                    },
                ],
            },
            integration: {
                category: 'Integration',
                practices: [
                    {
                        id: 'int_connection_aliases',
                        title: 'Use Connection Aliases for external connections',
                        description:
                            'Always use Connection and Credential Aliases (sys_alias) for external integrations. This enables environment-specific configuration without code changes and secure credential management.',
                        severity: 'critical',
                    },
                    {
                        id: 'int_rest_message_pattern',
                        title: 'Use REST Message definitions',
                        description:
                            'Define outbound integrations as REST Messages (sys_rest_message) with named HTTP methods. This provides reusability, environment-aware endpoint management, and MID Server routing.',
                        severity: 'high',
                    },
                    {
                        id: 'int_error_handling',
                        title: 'Implement robust error handling for integrations',
                        description:
                            'Always check HTTP status codes, handle timeouts, implement retry logic for transient failures, and log integration errors with sufficient detail for troubleshooting.',
                        severity: 'high',
                    },
                    {
                        id: 'int_idempotent',
                        title: 'Design idempotent integrations',
                        description:
                            'Ensure integrations can be safely retried without creating duplicates. Use correlation IDs and check for existing records before creating new ones.',
                        severity: 'medium',
                    },
                ],
            },
            testing: {
                category: 'Testing',
                practices: [
                    {
                        id: 'test_atf_patterns',
                        title: 'Use ATF for automated testing',
                        description:
                            'Create ATF test cases for critical business logic, business rules, and script includes. Run tests as part of your deployment pipeline. Cover happy paths and error scenarios.',
                        severity: 'high',
                    },
                    {
                        id: 'test_isolation',
                        title: 'Ensure test isolation',
                        description:
                            'Tests should not depend on each other or on specific instance data. Create test data within the test and clean up afterward. Use impersonation for role-based testing.',
                        severity: 'high',
                    },
                    {
                        id: 'test_cleanup',
                        title: 'Clean up test data',
                        description:
                            'Always clean up records created during testing. Use ATF test cleanup steps or afterTest methods. Leftover test data pollutes the instance and can cause false results.',
                        severity: 'medium',
                    },
                ],
            },
        }
    },

    /**
     * Returns all best practices as a structured object.
     * @returns {object} All practices organized by category
     */
    getAllPractices: function () {
        return this._practices
    },

    /**
     * Returns practices for a specific category.
     * @param {string} category - Category key (e.g., 'business_rules', 'security')
     * @returns {object|null} Category practices or null if not found
     */
    getPracticesForCategory: function (category) {
        if (this._practices[category]) {
            return this._practices[category]
        }
        return null
    },

    /**
     * Given a context object describing what the user is building,
     * returns the most relevant best practices.
     * @param {object} context - Object with type, table, etc.
     * @returns {object} Relevant practices with rationale
     */
    getPracticesForContext: function (context) {
        var relevant = []
        var contextType = (context && context.type) || ''
        var contextTable = (context && context.table) || ''

        // Always include security and scoping basics
        var secPractices = this._practices.security
        if (secPractices) {
            for (var s = 0; s < secPractices.practices.length; s++) {
                if (secPractices.practices[s].severity === 'critical') {
                    relevant.push({
                        practice: secPractices.practices[s],
                        reason: 'Security critical practice applies to all development',
                    })
                }
            }
        }

        // Type-specific practices
        if (contextType === 'business_rule' || contextType === 'sys_script') {
            var brPractices = this._practices.business_rules
            if (brPractices) {
                for (var b = 0; b < brPractices.practices.length; b++) {
                    relevant.push({
                        practice: brPractices.practices[b],
                        reason: 'Directly applicable to business rule development',
                    })
                }
            }
        }

        if (contextType === 'table' || contextType === 'sys_db_object') {
            var tblPractices = this._practices.tables
            if (tblPractices) {
                for (var t = 0; t < tblPractices.practices.length; t++) {
                    relevant.push({
                        practice: tblPractices.practices[t],
                        reason: 'Directly applicable to table design',
                    })
                }
            }
            var dmPractices = this._practices.data_model
            if (dmPractices) {
                for (var d = 0; d < dmPractices.practices.length; d++) {
                    relevant.push({
                        practice: dmPractices.practices[d],
                        reason: 'Data modeling best practices for table design',
                    })
                }
            }
        }

        if (contextType === 'script_include' || contextType === 'sys_script_include') {
            var siPractices = this._practices.scripts
            if (siPractices) {
                for (var si = 0; si < siPractices.practices.length; si++) {
                    relevant.push({
                        practice: siPractices.practices[si],
                        reason: 'Directly applicable to script include development',
                    })
                }
            }
        }

        if (contextType === 'client_script' || contextType === 'sys_script_client') {
            var csPractices = this._practices.client_scripts
            if (csPractices) {
                for (var c = 0; c < csPractices.practices.length; c++) {
                    relevant.push({
                        practice: csPractices.practices[c],
                        reason: 'Directly applicable to client script development',
                    })
                }
            }
            var perfPractices = this._practices.performance
            if (perfPractices) {
                for (var p = 0; p < perfPractices.practices.length; p++) {
                    if (
                        perfPractices.practices[p].id === 'perf_no_gliderecord_client' ||
                        perfPractices.practices[p].id === 'perf_avoid_sync_ajax'
                    ) {
                        relevant.push({
                            practice: perfPractices.practices[p],
                            reason: 'Performance practice critical for client-side code',
                        })
                    }
                }
            }
        }

        if (contextType === 'acl' || contextType === 'sys_security_acl') {
            var aclSecPractices = this._practices.security
            if (aclSecPractices) {
                for (var a = 0; a < aclSecPractices.practices.length; a++) {
                    relevant.push({
                        practice: aclSecPractices.practices[a],
                        reason: 'Directly applicable to ACL and security configuration',
                    })
                }
            }
        }

        if (contextType === 'integration' || contextType === 'rest_message') {
            var intPractices = this._practices.integration
            if (intPractices) {
                for (var i = 0; i < intPractices.practices.length; i++) {
                    relevant.push({
                        practice: intPractices.practices[i],
                        reason: 'Directly applicable to integration development',
                    })
                }
            }
        }

        // Task table specific advice
        if (
            contextTable === 'incident' ||
            contextTable === 'problem' ||
            contextTable === 'change_request' ||
            contextTable === 'task'
        ) {
            relevant.push({
                practice: {
                    id: 'task_table_awareness',
                    title: 'Task table inheritance awareness',
                    description:
                        'The ' +
                        contextTable +
                        ' table extends task. Business rules on task also fire for ' +
                        contextTable +
                        '. Be aware of inherited rules, ACLs, and workflows when customizing.',
                    severity: 'high',
                },
                reason: 'Table ' + contextTable + ' inherits from task',
            })
        }

        return {
            context: context,
            total_practices: relevant.length,
            practices: relevant,
        }
    },

    /**
     * Formats all best practices into a concise text block
     * suitable for injection into an LLM system prompt.
     * @returns {string} Formatted text block of all practices
     */
    formatForLLM: function () {
        var lines = []
        lines.push('=== SERVICENOW DEVELOPMENT BEST PRACTICES ===')
        lines.push('')

        var categories = Object.keys(this._practices)
        for (var i = 0; i < categories.length; i++) {
            var catKey = categories[i]
            var cat = this._practices[catKey]
            lines.push('### ' + cat.category)

            for (var j = 0; j < cat.practices.length; j++) {
                var p = cat.practices[j]
                var marker = p.severity === 'critical' ? '[CRITICAL] ' : p.severity === 'high' ? '[HIGH] ' : ''
                lines.push('- ' + marker + p.title + ': ' + p.description)
            }
            lines.push('')
        }

        return lines.join('\n')
    },

    type: 'NowCodeBestPractices',
}
