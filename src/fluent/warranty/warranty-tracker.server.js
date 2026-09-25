var NowCodeWarrantyTracker = Class.create()
NowCodeWarrantyTracker.prototype = {
    // ═══════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════

    /** Comma-separated sc_cat_item sys_ids or names; empty = match by name */
    PROP_CATALOG_ITEMS: 'x_1733631_now_code.warranty.catalog_items',

    /** Text matched (CONTAINS) against sc_cat_item.name when no item is configured */
    PROP_ITEM_NAME_MATCH: 'x_1733631_now_code.warranty.item_name_match',

    /** SLA definition (contract_sla) sys_id or name fragment that is the primary SLA */
    PROP_PRIMARY_SLA: 'x_1733631_now_code.warranty.primary_sla',

    /** Business percentage from which an in-progress SLA is flagged at risk */
    PROP_AT_RISK_PERCENT: 'x_1733631_now_code.warranty.at_risk_percent',

    DAY_MS: 86400000,
    MAX_LIMIT: 500,
    DEFAULT_LIMIT: 200,

    // ═══════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════

    initialize: function () {
        this.nowMs = new GlideDateTime().getNumericValue()
        this.atRiskPercent =
            parseInt(gs.getProperty(this.PROP_AT_RISK_PERCENT, '75'), 10) || 75
        this.primarySla = String(gs.getProperty(this.PROP_PRIMARY_SLA, '') || '')
            .replace(/^\s+|\s+$/g, '')
            .toLowerCase()
    },

    // ═══════════════════════════════════════════════════════════
    // Public API
    // ═══════════════════════════════════════════════════════════

    /**
     * Catalog items whose requested items this screen tracks.
     * @returns {Array<{sys_id:string, name:string}>}
     */
    getCatalogItems: function () {
        var items = []
        var configured = String(gs.getProperty(this.PROP_CATALOG_ITEMS, '') || '')
        var tokens = configured.split(',')
        var gr = new GlideRecord('sc_cat_item')

        var condition = null
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i].replace(/^\s+|\s+$/g, '')
            if (!token) continue
            if (!condition) {
                condition = gr.addQuery('sys_id', token)
            } else {
                condition.addOrCondition('sys_id', token)
            }
            condition.addOrCondition('name', token)
        }

        if (!condition) {
            var match = gs.getProperty(this.PROP_ITEM_NAME_MATCH, 'garant') || 'garant'
            gr.addQuery('name', 'CONTAINS', match)
            gr.addActiveQuery()
        }

        gr.orderBy('name')
        gr.query()
        while (gr.next()) {
            items.push({ sys_id: gr.getUniqueValue(), name: gr.getValue('name') })
        }
        return items
    },

    /**
     * Requested items of the warranty catalog item(s), each with its primary
     * and current SLA resolved.
     * @param {{ state?: string, q?: string, limit?: number }} [opts]
     *        state: 'open' (default) | 'closed' | 'all'
     * @returns {object}
     */
    listRequests: function (opts) {
        opts = opts || {}
        var items = this.getCatalogItems()
        var result = {
            catalog_items: items,
            requests: [],
            summary: this._emptySummary(),
            at_risk_percent: this.atRiskPercent,
            primary_sla_configured: !!this.primarySla,
            generated_at: new GlideDateTime().getValue(),
            truncated: false,
        }
        if (items.length === 0) return result

        var limit = parseInt(opts.limit, 10) || this.DEFAULT_LIMIT
        limit = Math.max(1, Math.min(limit, this.MAX_LIMIT))

        var itemIds = []
        for (var i = 0; i < items.length; i++) itemIds.push(items[i].sys_id)

        // Secure: users only see requested items their ACLs allow
        var ritm = new GlideRecordSecure('sc_req_item')
        ritm.addQuery('cat_item', 'IN', itemIds.join(','))
        if (opts.state === 'closed') ritm.addQuery('active', false)
        else if (opts.state !== 'all') ritm.addActiveQuery()
        if (opts.q) {
            var q = String(opts.q)
            ritm.addQuery('number', 'CONTAINS', q)
                .addOrCondition('requested_for.name', 'CONTAINS', q)
                .addOrCondition('short_description', 'CONTAINS', q)
                .addOrCondition('request.number', 'CONTAINS', q)
        }
        ritm.orderByDesc('opened_at')
        ritm.setLimit(limit + 1)
        ritm.query()

        var requests = []
        var byId = {}
        while (ritm.next()) {
            if (requests.length === limit) {
                result.truncated = true
                break
            }
            var row = this._serializeRitm(ritm)
            requests.push(row)
            byId[row.sys_id] = row
        }

        this._attachSlas(requests, byId)

        for (var r = 0; r < requests.length; r++) {
            this._resolvePrimaryAndCurrent(requests[r])
            this._countSummary(result.summary, requests[r])
            delete requests[r]._slas
        }

        result.requests = requests
        return result
    },

    /**
     * Full detail of one requested item: every SLA, catalog tasks and variables.
     * @param {string} sysId
     * @returns {object|null} null when not found or not readable
     */
    getRequest: function (sysId) {
        var ritm = new GlideRecordSecure('sc_req_item')
        if (!ritm.get(sysId)) return null

        var row = this._serializeRitm(ritm)
        var byId = {}
        byId[row.sys_id] = row
        this._attachSlas([row], byId)
        this._resolvePrimaryAndCurrent(row)

        row.slas = row._slas
        delete row._slas
        row.slas.sort(function (a, b) {
            return (a.start_ms || 0) - (b.start_ms || 0)
        })
        row.tasks = this._getCatalogTasks(sysId)
        row.variables = this._getVariables(ritm)
        row.description = ritm.getValue('description') || ''
        return row
    },

    // ═══════════════════════════════════════════════════════════
    // Requested items
    // ═══════════════════════════════════════════════════════════

    /** @private Plain object for one sc_req_item row */
    _serializeRitm: function (gr) {
        return {
            sys_id: gr.getUniqueValue(),
            number: gr.getValue('number'),
            short_description: gr.getValue('short_description') || '',
            cat_item: gr.getDisplayValue('cat_item'),
            request: gr.getDisplayValue('request'),
            requested_for: gr.getDisplayValue('requested_for'),
            opened_by: gr.getDisplayValue('opened_by'),
            opened_at: gr.getValue('opened_at') || '',
            opened_at_ms: this._ms(gr.getValue('opened_at')),
            closed_at: gr.getValue('closed_at') || '',
            due_date: gr.getValue('due_date') || '',
            state: gr.getValue('state'),
            state_label: gr.getDisplayValue('state'),
            stage: gr.getValue('stage') || '',
            stage_label: gr.getDisplayValue('stage'),
            active: gr.getValue('active') === '1' || gr.getValue('active') === 'true',
            assignment_group: gr.getDisplayValue('assignment_group'),
            assigned_to: gr.getDisplayValue('assigned_to'),
            primary_sla: null,
            current_sla: null,
            sla_count: 0,
            _slas: [],
        }
    },

    /** @private Catalog tasks created for the requested item */
    _getCatalogTasks: function (ritmId) {
        var tasks = []
        var gr = new GlideRecord('sc_task')
        gr.addQuery('request_item', ritmId)
        gr.orderBy('sys_created_on')
        gr.query()
        while (gr.next()) {
            tasks.push({
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description') || '',
                state_label: gr.getDisplayValue('state'),
                active: gr.getValue('active') === '1' || gr.getValue('active') === 'true',
                assignment_group: gr.getDisplayValue('assignment_group'),
                assigned_to: gr.getDisplayValue('assigned_to'),
                opened_at: gr.getValue('opened_at') || '',
                closed_at: gr.getValue('closed_at') || '',
            })
        }
        return tasks
    },

    /** @private Answered catalog variables (label + display value) */
    _getVariables: function (gr) {
        var vars = []
        try {
            for (var name in gr.variables) {
                var v = gr.variables[name]
                if (!v) continue
                var value = String(v.getDisplayValue() || '')
                if (!value) continue
                var label = ''
                try {
                    label = v.getLabel() || name
                } catch (e) {
                    label = name
                }
                vars.push({ name: name, label: label, value: value })
            }
        } catch (ex) {
            gs.warn('NowCodeWarrantyTracker: could not read variables: ' + ex)
        }
        return vars
    },

    // ═══════════════════════════════════════════════════════════
    // SLAs
    // ═══════════════════════════════════════════════════════════

    /**
     * @private Load task_sla rows attached to each requested item and to its
     * catalog tasks (stage SLAs usually live on sc_task), in two queries.
     */
    _attachSlas: function (requests, byId) {
        if (requests.length === 0) return

        var ritmIds = []
        for (var i = 0; i < requests.length; i++) ritmIds.push(requests[i].sys_id)

        // task sys_id → owning requested item
        var owner = {}
        for (var r = 0; r < ritmIds.length; r++) owner[ritmIds[r]] = ritmIds[r]

        var tasks = new GlideRecord('sc_task')
        tasks.addQuery('request_item', 'IN', ritmIds.join(','))
        tasks.query()
        while (tasks.next()) {
            owner[tasks.getUniqueValue()] = tasks.getValue('request_item')
        }

        var taskIds = []
        for (var id in owner) {
            if (owner.hasOwnProperty(id)) taskIds.push(id)
        }

        var sla = new GlideRecord('task_sla')
        sla.addQuery('task', 'IN', taskIds.join(','))
        sla.orderBy('start_time')
        sla.query()
        while (sla.next()) {
            var ritmId = owner[sla.getValue('task')]
            if (!ritmId || !byId[ritmId]) continue
            var entry = this._serializeSla(sla, ritmId)
            byId[ritmId]._slas.push(entry)
            byId[ritmId].sla_count++
        }
    },

    /**
     * @private One task_sla, with calendar-day progress derived from its start and
     * planned end, and the SLA engine's business percentage.
     */
    _serializeSla: function (gr, ritmId) {
        var stage = gr.getValue('stage') || ''
        var startMs = this._ms(gr.getValue('start_time'))
        var plannedEndMs = this._ms(gr.getValue('planned_end_time'))
        var endMs = this._ms(gr.getValue('end_time'))
        var finished = stage === 'completed' || stage === 'cancelled'
        var refMs = finished && endMs ? endMs : this.nowMs
        var breached = gr.getValue('has_breached') === '1' || gr.getValue('has_breached') === 'true'
        var businessPct = this._num(gr.getValue('business_percentage'))
        var pct = this._num(gr.getValue('percentage'))

        var totalDays = null
        var currentDay = null
        var daysLeft = null
        if (startMs && plannedEndMs && plannedEndMs > startMs) {
            totalDays = Math.max(1, Math.ceil((plannedEndMs - startMs) / this.DAY_MS))
        }
        if (startMs) {
            currentDay = Math.max(1, Math.floor((refMs - startMs) / this.DAY_MS) + 1)
        }
        if (plannedEndMs && !finished) {
            daysLeft = (plannedEndMs - this.nowMs) / this.DAY_MS
            daysLeft = daysLeft >= 0 ? Math.ceil(daysLeft) : Math.floor(daysLeft)
        }

        return {
            sys_id: gr.getUniqueValue(),
            name: gr.getDisplayValue('sla'),
            definition: gr.getValue('sla'),
            task: gr.getDisplayValue('task'),
            on_ritm: gr.getValue('task') === ritmId,
            stage: stage,
            stage_label: gr.getDisplayValue('stage'),
            has_breached: breached,
            status: this._slaStatus(stage, breached, businessPct),
            start_time: gr.getValue('start_time') || '',
            start_ms: startMs,
            planned_end_time: gr.getValue('planned_end_time') || '',
            planned_end_ms: plannedEndMs,
            end_time: gr.getValue('end_time') || '',
            end_ms: endMs,
            business_percentage: businessPct,
            percentage: pct,
            business_elapsed: gr.getDisplayValue('business_duration') || '',
            business_time_left: gr.getDisplayValue('business_time_left') || '',
            current_day: currentDay,
            total_days: totalDays,
            days_left: daysLeft,
        }
    },

    /** @private on_track | at_risk | breached | paused | completed | cancelled */
    _slaStatus: function (stage, breached, businessPct) {
        if (stage === 'cancelled') return 'cancelled'
        if (breached || stage === 'breached') return 'breached'
        if (stage === 'completed' || stage === 'achieved') return 'completed'
        if (stage === 'paused') return 'paused'
        if (businessPct !== null && businessPct >= this.atRiskPercent) return 'at_risk'
        return 'on_track'
    },

    /**
     * @private The primary SLA spans the whole request: the configured definition,
     * otherwise the longest-running SLA on the requested item itself. The current
     * SLA is the latest-started one still running (or the latest finished) that is
     * not the primary.
     */
    _resolvePrimaryAndCurrent: function (row) {
        var slas = row._slas
        if (!slas || slas.length === 0) return

        var live = []
        for (var i = 0; i < slas.length; i++) {
            if (slas[i].stage !== 'cancelled') live.push(slas[i])
        }
        if (live.length === 0) live = slas

        var primary = null
        if (this.primarySla) {
            for (var p = 0; p < live.length; p++) {
                var def = String(live[p].definition || '').toLowerCase()
                var name = String(live[p].name || '').toLowerCase()
                if (def === this.primarySla || name.indexOf(this.primarySla) !== -1) {
                    if (!primary || (live[p].start_ms || 0) > (primary.start_ms || 0)) primary = live[p]
                }
            }
        }
        if (!primary) {
            var pool = []
            for (var k = 0; k < live.length; k++) if (live[k].on_ritm) pool.push(live[k])
            if (pool.length === 0) pool = live
            for (var j = 0; j < pool.length; j++) {
                if (!primary || this._span(pool[j]) > this._span(primary)) primary = pool[j]
            }
        }

        var current = null
        var running = function (s) {
            return s.status === 'on_track' || s.status === 'at_risk' || s.status === 'paused' ||
                (s.status === 'breached' && !s.end_ms)
        }
        for (var c = 0; c < live.length; c++) {
            var s = live[c]
            if (s === primary) continue
            if (!current) {
                current = s
                continue
            }
            var sRunning = running(s)
            var curRunning = running(current)
            if (sRunning && !curRunning) current = s
            else if (sRunning === curRunning && (s.start_ms || 0) > (current.start_ms || 0)) current = s
        }

        row.primary_sla = primary
        row.current_sla = current
    },

    /** @private Planned length of an SLA in ms (0 when unknown) */
    _span: function (s) {
        if (s.start_ms && s.planned_end_ms) return s.planned_end_ms - s.start_ms
        return 0
    },

    // ═══════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════

    _emptySummary: function () {
        return {
            total: 0,
            open: 0,
            primary_breached: 0,
            primary_at_risk: 0,
            current_breached: 0,
            current_at_risk: 0,
            without_sla: 0,
        }
    },

    _countSummary: function (summary, row) {
        summary.total++
        if (row.active) summary.open++
        if (!row.primary_sla) summary.without_sla++
        if (row.primary_sla && row.primary_sla.status === 'breached') summary.primary_breached++
        if (row.primary_sla && row.primary_sla.status === 'at_risk') summary.primary_at_risk++
        if (row.current_sla && row.current_sla.status === 'breached') summary.current_breached++
        if (row.current_sla && row.current_sla.status === 'at_risk') summary.current_at_risk++
    },

    // ═══════════════════════════════════════════════════════════
    // Internal Helpers
    // ═══════════════════════════════════════════════════════════

    /** @private UTC glide_date_time value → epoch ms (0 when empty) */
    _ms: function (value) {
        if (!value) return 0
        return new GlideDateTime(value).getNumericValue()
    },

    /** @private Decimal field → number, null when empty */
    _num: function (value) {
        if (value === null || value === undefined || value === '') return null
        var n = parseFloat(value)
        return isNaN(n) ? null : Math.round(n * 10) / 10
    },

    type: 'NowCodeWarrantyTracker',
}
