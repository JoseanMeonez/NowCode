import React, { useEffect, useState } from 'react';
import { getRequest } from './api.js';
import { SlaMeter, StatusChip } from './components.jsx';
import { formatDate, statusInfo, dayProgress, remainingText, recordUrl } from './format.js';

var DAY = 86400000;

/* ═══════════════════════════════════════════════════════════
   SLA timeline — every SLA on one shared calendar axis
   ═══════════════════════════════════════════════════════════ */
function SlaTimeline(props) {
  var slas = props.slas.filter(function(s) { return s.start_ms; });
  if (slas.length === 0) return null;

  var now = Date.now();
  var min = Math.min.apply(null, slas.map(function(s) { return s.start_ms; }));
  var max = Math.max.apply(null, slas.map(function(s) {
    return Math.max(s.planned_end_ms || 0, s.end_ms || 0);
  }).concat([now]));
  var span = Math.max(max - min, DAY);
  var pos = function(ms) { return ((ms - min) / span) * 100; };

  // Day ticks: at most ~8 labels whatever the span
  var totalDays = Math.ceil(span / DAY);
  var step = Math.max(1, Math.ceil(totalDays / 8));
  var ticks = [];
  for (var d = 0; d <= totalDays; d += step) ticks.push(d);

  var nowPos = pos(now);

  return (
    <div className="wt-timeline" role="img"
      aria-label={'Línea de tiempo de ' + slas.length + ' SLAs'}>
      <div className="wt-timeline-row">
        <div className="wt-timeline-label" />
        <div className="wt-timeline-lane wt-timeline-axis">
          {ticks.filter(function(t) {
            // Leave room for the "Hoy" marker and keep the last label inside the lane
            var x = pos(min + t * DAY);
            return x <= 94 && Math.abs(x - nowPos) > 6;
          }).map(function(t) {
            return (
              <span key={t} className="wt-timeline-tick" style={{ left: pos(min + t * DAY) + '%' }}>
                {'Día ' + (t + 1)}
              </span>
            );
          })}
          <span className="wt-timeline-now-label"
            style={{ left: nowPos + '%', transform: nowPos > 92 ? 'translateX(-100%)' : 'translateX(-50%)' }}>Hoy</span>
        </div>
      </div>
      {slas.map(function(s) {
        var info = statusInfo(s.status);
        var planned = s.planned_end_ms || s.end_ms || now;
        var reached = s.end_ms || now;
        var left = pos(s.start_ms);
        var width = Math.max(pos(planned) - left, 0.8);
        var filled = Math.max(0, Math.min(1, (reached - s.start_ms) / Math.max(planned - s.start_ms, 1)));
        var overrun = reached > planned ? pos(reached) - pos(planned) : 0;
        return (
          <div key={s.sys_id} className="wt-timeline-row">
            <div className="wt-timeline-label" title={s.name}>
              <span className="wt-timeline-name">{s.name}</span>
              {props.primaryId === s.sys_id && <span className="wt-tag">Primario</span>}
              {props.currentId === s.sys_id && <span className="wt-tag wt-tag--alt">Actual</span>}
            </div>
            <div className="wt-timeline-lane">
              <div className={'wt-timeline-bar wt-meter-track--' + info.mod}
                style={{ left: left + '%', width: width + '%' }}
                title={s.name + '\n' + formatDate(s.start_time, true) + ' \u2192 ' + formatDate(s.planned_end_time, true)}>
                <div className="wt-meter-fill" style={{ width: filled * 100 + '%' }} />
              </div>
              {overrun > 0 && (
                <div className="wt-timeline-overrun" title="Tiempo fuera del SLA"
                  style={{ left: pos(planned) + '%', width: overrun + '%' }} />
              )}
              <div className="wt-timeline-now" style={{ left: nowPos + '%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Detail drawer
   ═══════════════════════════════════════════════════════════ */
export function DetailDrawer(props) {
  var stateHook = useState({ loading: true, data: null, error: null });
  var state = stateHook[0];
  var setState = stateHook[1];

  useEffect(function() {
    var cancelled = false;
    setState({ loading: true, data: null, error: null });
    getRequest(props.sysId)
      .then(function(data) { if (!cancelled) setState({ loading: false, data: data, error: null }); })
      .catch(function(e) { if (!cancelled) setState({ loading: false, data: null, error: e.message }); });
    return function() { cancelled = true; };
  }, [props.sysId]);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') props.onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [props.onClose]);

  var r = state.data;

  return (
    <div className="wt-drawer-overlay" onClick={props.onClose}>
      <aside className="wt-drawer" role="dialog" aria-modal="true"
        aria-label={r ? r.number : 'Detalle'} onClick={function(e) { e.stopPropagation(); }}>
        <header className="wt-drawer-header">
          <div>
            <div className="wt-drawer-number">{r ? r.number : 'Cargando...'}</div>
            {r && <div className="wt-drawer-title">{r.short_description || r.cat_item}</div>}
          </div>
          <div className="wt-drawer-actions">
            {r && (
              <a className="wt-btn" href={recordUrl('sc_req_item', r.sys_id)} target="_blank" rel="noopener noreferrer">
                Abrir en ServiceNow
              </a>
            )}
            <button type="button" className="wt-btn wt-btn--icon" onClick={props.onClose} aria-label="Cerrar">
              {'✕'}
            </button>
          </div>
        </header>

        <div className="wt-drawer-body">
          {state.loading && <div className="wt-skeleton" aria-busy="true" />}
          {state.error && <div className="wt-alert">{state.error}</div>}
          {r && (
            <React.Fragment>
              <dl className="wt-facts">
                <div><dt>Solicitado para</dt><dd>{r.requested_for || '—'}</dd></div>
                <div><dt>Solicitud</dt><dd>{r.request || '—'}</dd></div>
                <div><dt>Abierto</dt><dd>{formatDate(r.opened_at, true)}</dd></div>
                <div><dt>Estado</dt><dd>{r.state_label}{r.stage_label ? ' · ' + r.stage_label : ''}</dd></div>
                <div><dt>Grupo</dt><dd>{r.assignment_group || '—'}</dd></div>
                <div><dt>Asignado a</dt><dd>{r.assigned_to || '—'}</dd></div>
              </dl>

              <section className="wt-section">
                <h3>SLAs</h3>
                <div className="wt-sla-pair">
                  <div className="wt-sla-card">
                    <div className="wt-sla-card-label">SLA primario</div>
                    <SlaMeter sla={r.primary_sla} showName />
                  </div>
                  <div className="wt-sla-card">
                    <div className="wt-sla-card-label">SLA actual</div>
                    <SlaMeter sla={r.current_sla} showName
                      emptyLabel={r.primary_sla ? 'No hay otro SLA en curso' : 'Sin SLA'} />
                  </div>
                </div>
                <SlaTimeline slas={r.slas}
                  primaryId={r.primary_sla && r.primary_sla.sys_id}
                  currentId={r.current_sla && r.current_sla.sys_id} />
                {r.slas.length > 0 && (
                  <table className="wt-mini-table">
                    <thead>
                      <tr><th>SLA</th><th>Tarea</th><th>Progreso</th><th>Inicio</th><th>Vence</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                      {r.slas.map(function(s) {
                        return (
                          <tr key={s.sys_id}>
                            <td>{s.name}</td>
                            <td>{s.task}</td>
                            <td className="wt-num">
                              {dayProgress(s) || '—'}
                              {s.business_percentage !== null ? ' · ' + Math.round(s.business_percentage) + '%' : ''}
                              <div className="wt-cell-sub">{remainingText(s)}</div>
                            </td>
                            <td>{formatDate(s.start_time, true)}</td>
                            <td>{formatDate(s.planned_end_time, true)}</td>
                            <td><StatusChip status={s.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>

              {r.variables.length > 0 && (
                <section className="wt-section">
                  <h3>Datos de la garantía</h3>
                  <dl className="wt-facts wt-facts--vars">
                    {r.variables.map(function(v) {
                      return <div key={v.name}><dt>{v.label}</dt><dd>{v.value}</dd></div>;
                    })}
                  </dl>
                </section>
              )}

              {r.tasks.length > 0 && (
                <section className="wt-section">
                  <h3>Tareas de catálogo</h3>
                  <ul className="wt-tasks">
                    {r.tasks.map(function(t) {
                      return (
                        <li key={t.sys_id}>
                          <a href={recordUrl('sc_task', t.sys_id)} target="_blank" rel="noopener noreferrer">{t.number}</a>
                          <span className="wt-task-desc">{t.short_description}</span>
                          <span className="wt-cell-sub">
                            {t.state_label}{t.assigned_to ? ' · ' + t.assigned_to : (t.assignment_group ? ' · ' + t.assignment_group : '')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </React.Fragment>
          )}
        </div>
      </aside>
    </div>
  );
}
