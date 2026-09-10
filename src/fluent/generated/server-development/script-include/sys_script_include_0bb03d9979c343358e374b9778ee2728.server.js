var NowCodePlatformContext = Class.create()
NowCodePlatformContext.prototype = {
    initialize: function () {},

    /**
     * Gets the full schema for a table including all fields, types, max lengths,
     * reference targets, mandatory flags, and default values.
     * @param {string} tableName - The table name (e.g. 'incident')
     * @returns {object} Structured schema object
     */
    getTableSchema: function (tableName) {
        var result = {
            table: tableName,
            fields: [],
        }

        var gr = new GlideRecord('sys_dictionary')
        gr.addQuery('name', tableName)
        gr.addNotNullQuery('element')
        gr.orderBy('element')
        gr.query()

        while (gr.next()) {
            var field = {
                name: gr.getValue('element'),
                label: gr.getDisplayValue('column_label'),
                type: gr.getValue('internal_type'),
                max_length: parseInt(gr.getValue('max_length'), 10) || 0,
                mandatory: gr.getValue('mandatory') === 'true',
                read_only: gr.getValue('read_only') === 'true',
                active: gr.getValue('active') === 'true',
                default_value: gr.getValue('default_value') || '',
                reference: gr.getValue('reference') || '',
                reference_qual: gr.getValue('reference_qual') || '',
                choice: parseInt(gr.getValue('choice'), 10) || 0,
                comments: gr.getValue('comments') || '',
            }
            result.fields.push(field)
        }

        return result
    },

    /**
     * Lists all tables in a given scope, or all custom tables if no scope provided.
     * @param {string} [scopeName] - Optional scope name (e.g. 'x_myapp')
     * @returns {object} Object containing array of table info
     */
    getTableList: function (scopeName) {
        var result = {
            scope: scopeName || 'all_custom',
            tables: [],
        }

        var gr = new GlideRecord('sys_db_object')
        if (scopeName) {
            gr.addQuery('sys_scope.scope', scopeName)
        } else {
            gr.addQuery('name', 'STARTSWITH', 'x_')
        }
        gr.orderBy('name')
        gr.query()

        while (gr.next()) {
            result.tables.push({
                name: gr.getValue('name'),
                label: gr.getValue('label'),
                super_class: gr.getDisplayValue('super_class') || '',
                is_extendable: gr.getValue('is_extendable') === 'true',
                number_ref: gr.getValue('number_ref') || '',
                sys_id: gr.getUniqueValue(),
            })
        }

        return result
    },

    /**
     * Gets all business rules on a given table.
     * @param {string} tableName - The table name
     * @returns {object} Object containing array of business rule info
     */
    getBusinessRules: function (tableName) {
        var result = {
            table: tableName,
            business_rules: [],
        }

        var gr = new GlideRecord('sys_script')
        gr.addQuery('collection', tableName)
        gr.orderBy('order')
        gr.query()

        while (gr.next()) {
            var br = {
                name: gr.getValue('name'),
                when: gr.getValue('when'),
                order: parseInt(gr.getValue('order'), 10) || 0,
                active: gr.getValue('active') === 'true',
                action_insert: gr.getValue('action_insert') === 'true',
                action_update: gr.getValue('action_update') === 'true',
                action_delete: gr.getValue('action_delete') === 'true',
                action_query: gr.getValue('action_query') === 'true',
                filter_condition: gr.getValue('filter_condition') || '',
                script_length: (gr.getValue('script') || '').length,
                sys_id: gr.getUniqueValue(),
            }
            result.business_rules.push(br)
        }

        return result
    },

    /**
     * Gets all script includes in a given scope.
     * @param {string} scopeName - The scope name
     * @returns {object} Object containing array of script include info
     */
    getScriptIncludes: function (scopeName) {
        var result = {
            scope: scopeName,
            script_includes: [],
        }

        var gr = new GlideRecord('sys_script_include')
        if (scopeName) {
            gr.addQuery('sys_scope.scope', scopeName)
        }
        gr.orderBy('name')
        gr.query()

        while (gr.next()) {
            result.script_includes.push({
                name: gr.getValue('name'),
                api_name: gr.getValue('api_name') || '',
                active: gr.getValue('active') === 'true',
                client_callable: gr.getValue('client_callable') === 'true',
                description: gr.getValue('description') || '',
                access: gr.getValue('access') || '',
                sys_id: gr.getUniqueValue(),
            })
        }

        return result
    },

    /**
     * Gets all active plugins on the instance.
     * @returns {object} Object containing array of active plugin info
     */
    getInstalledPlugins: function () {
        var result = {
            plugins: [],
        }

        var gr = new GlideRecord('sys_plugins')
        gr.addQuery('active', 'active')
        gr.orderBy('name')
        gr.query()

        while (gr.next()) {
            result.plugins.push({
                id: gr.getValue('source'),
                name: gr.getValue('name'),
                version: gr.getValue('version') || '',
            })
        }

        return result
    },

    /**
     * Gets instance-level information: version, name, and key properties.
     * @returns {object} Instance info object
     */
    getInstanceInfo: function () {
        var result = {
            instance_name: gs.getProperty('instance_name') || '',
            build_tag: gs.getProperty('glide.buildtag') || '',
            build_name: gs.getProperty('glide.buildname') || '',
            system_id: gs.getProperty('glide.installation.id') || '',
        }

        return result
    },

    /**
     * Gets field documentation (help text, descriptions) for a table.
     * @param {string} tableName - The table name
     * @returns {object} Object containing field documentation
     */
    getTableDocumentation: function (tableName) {
        var result = {
            table: tableName,
            documentation: [],
        }

        var gr = new GlideRecord('sys_documentation')
        gr.addQuery('name', tableName)
        gr.addQuery('language', 'en')
        gr.orderBy('element')
        gr.query()

        while (gr.next()) {
            result.documentation.push({
                element: gr.getValue('element') || '(table-level)',
                label: gr.getValue('label') || '',
                help: gr.getValue('help') || '',
                hint: gr.getValue('hint') || '',
                plural: gr.getValue('plural') || '',
            })
        }

        return result
    },

    /**
     * Builds a comprehensive context string for a table combining
     * schema, business rules, and documentation.
     * @param {string} tableName - The table name
     * @returns {string} Formatted context string for LLM consumption
     */
    buildContextForTable: function (tableName) {
        var schema = this.getTableSchema(tableName)
        var brs = this.getBusinessRules(tableName)
        var docs = this.getTableDocumentation(tableName)

        var lines = []
        lines.push('=== TABLE CONTEXT: ' + tableName + ' ===')
        lines.push('')

        // Schema section
        lines.push('## Fields (' + schema.fields.length + ' total)')
        for (var i = 0; i < schema.fields.length; i++) {
            var f = schema.fields[i]
            var fieldLine = '- ' + f.name + ' (' + f.type + ')'
            if (f.mandatory) fieldLine += ' [MANDATORY]'
            if (f.read_only) fieldLine += ' [READ-ONLY]'
            if (f.reference) fieldLine += ' -> ' + f.reference
            if (f.default_value) fieldLine += ' default=' + f.default_value
            lines.push(fieldLine)
        }
        lines.push('')

        // Business rules section
        lines.push('## Business Rules (' + brs.business_rules.length + ' total)')
        for (var j = 0; j < brs.business_rules.length; j++) {
            var br = brs.business_rules[j]
            var ops = []
            if (br.action_insert) ops.push('insert')
            if (br.action_update) ops.push('update')
            if (br.action_delete) ops.push('delete')
            if (br.action_query) ops.push('query')
            lines.push(
                '- ' +
                    br.name +
                    ' [' +
                    br.when +
                    ', order=' +
                    br.order +
                    ', ops=' +
                    ops.join('/') +
                    ']' +
                    (br.active ? '' : ' (INACTIVE)')
            )
        }
        lines.push('')

        // Documentation section
        lines.push('## Field Documentation')
        for (var k = 0; k < docs.documentation.length; k++) {
            var d = docs.documentation[k]
            if (d.help || d.hint) {
                lines.push('- ' + d.element + ': ' + (d.help || d.hint))
            }
        }

        return lines.join('\n')
    },

    /**
     * Builds full context for an application scope: tables, script includes,
     * and business rules across all tables in the scope.
     * @param {string} scopeName - The scope name (e.g. 'x_myapp')
     * @returns {string} Formatted scope context string for LLM consumption
     */
    buildScopeContext: function (scopeName) {
        var lines = []
        lines.push('=== SCOPE CONTEXT: ' + scopeName + ' ===')
        lines.push('')

        // Tables in scope
        var tables = this.getTableList(scopeName)
        lines.push('## Tables (' + tables.tables.length + ' total)')
        for (var i = 0; i < tables.tables.length; i++) {
            var t = tables.tables[i]
            lines.push('- ' + t.name + ' (' + t.label + ')')
            if (t.super_class) lines.push('  extends: ' + t.super_class)
        }
        lines.push('')

        // Script includes in scope
        var sis = this.getScriptIncludes(scopeName)
        lines.push('## Script Includes (' + sis.script_includes.length + ' total)')
        for (var j = 0; j < sis.script_includes.length; j++) {
            var si = sis.script_includes[j]
            lines.push(
                '- ' +
                    si.name +
                    (si.client_callable ? ' [client-callable]' : '') +
                    (si.description ? ': ' + si.description : '')
            )
        }
        lines.push('')

        // Business rules per table
        lines.push('## Business Rules by Table')
        for (var k = 0; k < tables.tables.length; k++) {
            var tableName = tables.tables[k].name
            var brs = this.getBusinessRules(tableName)
            if (brs.business_rules.length > 0) {
                lines.push('### ' + tableName)
                for (var m = 0; m < brs.business_rules.length; m++) {
                    var br = brs.business_rules[m]
                    lines.push('  - ' + br.name + ' [' + br.when + ', order=' + br.order + ']')
                }
            }
        }

        return lines.join('\n')
    },

    type: 'NowCodePlatformContext',
}
