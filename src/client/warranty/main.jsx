import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import '../warranty.css';
import { listRequests } from './api.js';
import { StatTiles, FilterBar, RequestTable } from './components.jsx';
import { DetailDrawer } from './detail.jsx';
import { formatDate } from './format.js';

var PAGE_TITLE = 'Seguimiento de garantías';

/* Severity order used by the "risk" sort and the tile filters */
var RISK = { breached: 5, at_risk: 4, paused: 2, on_track: 1, completed: 0, cancelled: 0 };

/* ═══════════════════════════════════════════════════════════
   URL state — ?state=open&q=...&sort=risk&filter=...&id=<ritm>
   ═══════════════════════════════════════════════════════════ */
function readUrl() {
  var p = new URLSearchParams(window.location.search);
  return {
    state: p.get('state') || 'open',
    q: p.get('q') || '',
    sort: p.get('sort') || 'risk',
    filter: p.get('filter') || 'all',
    id: p.get('id') || null,
  };
}

function writeUrl(view, title) {
  var p = new URLSearchParams();
  if (view.state !== 'open') p.set('state', view.state);
  if (view.q) p.set('q', view.q);
  if (view.sort !== 'risk') p.set('sort', view.sort);
  if (view.filter !== 'all') p.set('filter', view.filter);
  if (view.id) p.set('id', view.id);
  var qs = p.toString();
  var path = window.location.pathname + (qs ? '?' + qs : '');
  window.history.replaceState(view, '', path);
  document.title = title || PAGE_TITLE;
  if (window.self !== window.top && window.CustomEvent && window.CustomEvent.fireTop) {
    window.CustomEvent.fireTop('magellanNavigator.permalink.set', { relativePath: path, title: document.title });
  }
}

/* Primary SLA outranks the current one: it is the commitment to the customer */
function riskScore(r) {
  var p = r.primary_sla ? RISK[r.primary_sla.status] || 0 : 0;
  var c = r.current_sla ? RISK[r.current_sla.status] || 0 : 0;
  var pp = Math.min((r.primary_sla && r.primary_sla.business_percentage) || 0, 999);
  var cp = Math.min((r.current_sla && r.current_sla.business_percentage) || 0, 999);
  return p * 1e7 + c * 1e4 + pp * 10 + cp / 100;
}

function dueMs(r) {
  var candidates = [r.current_sla, r.primary_sla].filter(function(s) {
    return s && s.planned_end_ms && (s.status === 'on_track' || s.status === 'at_risk' || s.status === 'breached' || s.status === 'paused');
  });
  if (candidates.length === 0) return Infinity;
  return Math.min.apply(null, candidates.map(function(s) { return s.planned_end_ms; }));
}

function matchesFilter(r, filter) {
  var ps = r.primary_sla && r.primary_sla.status;
  var cs = r.current_sla && r.current_sla.status;
  if (filter === 'primary_breached') return ps === 'breached';
  if (filter === 'primary_at_risk') return ps === 'at_risk';
  if (filter === 'current_attention') return cs === 'breached' || cs === 'at_risk';
  if (filter === 'without_sla') return !r.primary_sla;
  return true;
}

/* ═══════════════════════════════════════════════════════════
   App
   ═══════════════════════════════════════════════════════════ */
function App() {
  var viewHook = useState(readUrl);
  var view = viewHook[0];
  var setView = viewHook[1];
  var searchHook = useState(view.q);
  var search = searchHook[0];
  var setSearch = searchHook[1];
  var dataHook = useState({ loading: true, error: null, data: null });
  var result = dataHook[0];
  var setResult = dataHook[1];
  var reloadHook = useState(0);
  var reloadKey = reloadHook[0];
  var setReloadKey = reloadHook[1];

  var update = useCallback(function(patch) {
    setView(function(prev) { return Object.assign({}, prev, patch); });
  }, []);

  useEffect(function() { writeUrl(view); }, [view]);

  useEffect(function() {
    function onPop() { var v = readUrl(); setView(v); setSearch(v.q); }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, []);

  // Debounce the search box into the URL/view
  useEffect(function() {
    var t = setTimeout(function() { if (search !== view.q) update({ q: search }); }, 350);
    return function() { clearTimeout(t); };
  }, [search, view.q, update]);

  useEffect(function() {
    var cancelled = false;
    setResult(function(prev) { return { loading: true, error: null, data: prev.data }; });
    listRequests({ state: view.state, q: view.q, limit: 500 })
      .then(function(data) { if (!cancelled) setResult({ loading: false, error: null, data: data }); })
      .catch(function(e) { if (!cancelled) setResult({ loading: false, error: e.message, data: null }); });
    return function() { cancelled = true; };
  }, [view.state, view.q, reloadKey]);

  var data = result.data;
  var rows = useMemo(function() {
    if (!data) return [];
    var list = data.requests.filter(function(r) { return matchesFilter(r, view.filter); });
    var sorters = {
      risk: function(a, b) { return riskScore(b) - riskScore(a) || b.opened_at_ms - a.opened_at_ms; },
      newest: function(a, b) { return b.opened_at_ms - a.opened_at_ms; },
      oldest: function(a, b) { return a.opened_at_ms - b.opened_at_ms; },
      due: function(a, b) { return dueMs(a) - dueMs(b); },
    };
    return list.slice().sort(sorters[view.sort] || sorters.risk);
  }, [data, view.filter, view.sort]);

  var closeDetail = useCallback(function() { update({ id: null }); }, [update]);
  var itemNames = data ? data.catalog_items.map(function(i) { return i.name; }).join(', ') : '';

  return (
    <div className="wt-app">
      <header className="wt-header">
        <div>
          <h1>{PAGE_TITLE}</h1>
          <p className="wt-subtitle">
            {data
              ? (itemNames ? 'Solicitudes de: ' + itemNames : 'No se encontró el ítem de catálogo de garantías')
              : 'Cargando...'}
          </p>
        </div>
        <div className="wt-header-actions">
          {data && <span className="wt-updated">Actualizado {formatDate(data.generated_at, true)}</span>}
          <button type="button" className="wt-btn" disabled={result.loading}
            onClick={function() { setReloadKey(reloadKey + 1); }}>
            {result.loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </header>

      {result.error && <div className="wt-alert" role="alert">{result.error}</div>}

      {data && (
        <StatTiles summary={data.summary} activeFilter={view.filter}
          onFilter={function(f) { update({ filter: f }); }} />
      )}

      <FilterBar state={view.state} search={search} sort={view.sort}
        onState={function(s) { update({ state: s }); }}
        onSearch={setSearch}
        onSort={function(s) { update({ sort: s }); }} />

      {data && data.truncated && (
        <div className="wt-note">Se muestran las 500 solicitudes más recientes. Usa la búsqueda para acotar.</div>
      )}
      {data && !data.primary_sla_configured && data.requests.length > 0 && (
        <div className="wt-note">
          SLA primario detectado automáticamente (el SLA más largo del RITM). Configura
          {' '}<code>x_1733631_now_code.warranty.primary_sla</code> para fijarlo.
        </div>
      )}

      {data && rows.length > 0 && (
        <RequestTable rows={rows} selectedId={view.id}
          onOpen={function(id) { update({ id: id }); }} />
      )}

      {data && rows.length === 0 && !result.loading && (
        <div className="wt-empty">
          {data.catalog_items.length === 0
            ? 'Configura x_1733631_now_code.warranty.catalog_items con el ítem de catálogo de garantías.'
            : 'No hay solicitudes que coincidan con los filtros.'}
        </div>
      )}

      {!data && result.loading && <div className="wt-skeleton wt-skeleton--table" aria-busy="true" />}

      {view.id && <DetailDrawer sysId={view.id} onClose={closeDetail} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
