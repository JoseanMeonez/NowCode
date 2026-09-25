import React from 'react';
import {
  statusInfo, dayProgress, remainingText, meterPercent, formatDate, daysAgo,
} from './format.js';

/* ═══════════════════════════════════════════════════════════
   SLA status chip — glyph + label, never color alone
   ═══════════════════════════════════════════════════════════ */
export function StatusChip(props) {
  var info = statusInfo(props.status);
  return (
    <span className={'wt-chip wt-chip--' + info.mod}>
      <span className="wt-chip-icon" aria-hidden="true">{info.icon}</span>
      {info.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SLA meter — fill carries severity, track is a lighter step
   ═══════════════════════════════════════════════════════════ */
export function SlaMeter(props) {
  var sla = props.sla;
  if (!sla) {
    return <div className="wt-meter-empty">{props.emptyLabel || 'Sin SLA'}</div>;
  }
  var info = statusInfo(sla.status);
  var pct = meterPercent(sla);
  var pctLabel = sla.business_percentage !== null && sla.business_percentage !== undefined
    ? Math.round(sla.business_percentage) + '%'
    : null;
  var tooltip = [
    sla.name,
    'Inicio: ' + formatDate(sla.start_time, true),
    'Vence: ' + formatDate(sla.planned_end_time, true),
    sla.business_elapsed ? 'Transcurrido (hábil): ' + sla.business_elapsed : null,
    sla.business_time_left ? 'Restante (hábil): ' + sla.business_time_left : null,
    'Tarea: ' + sla.task,
  ].filter(Boolean).join('\n');

  return (
    <div className="wt-meter" title={tooltip}>
      {props.showName && <div className="wt-meter-name">{sla.name}</div>}
      <div className="wt-meter-head">
        <span className="wt-meter-days">{dayProgress(sla) || '—'}</span>
        <StatusChip status={sla.status} />
      </div>
      <div className={'wt-meter-track wt-meter-track--' + info.mod}
        role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        aria-label={sla.name + ': ' + (pctLabel || dayProgress(sla))}>
        <div className="wt-meter-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="wt-meter-foot">
        <span>{remainingText(sla)}</span>
        {pctLabel && <span className="wt-num">{pctLabel}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat tiles
   ═══════════════════════════════════════════════════════════ */
export function StatTiles(props) {
  var s = props.summary;
  var tiles = [
    { key: 'all', label: 'Solicitudes', value: s.total, hint: s.open + ' abiertas' },
    { key: 'primary_breached', label: 'SLA primario vencido', value: s.primary_breached, mod: 'crit' },
    { key: 'primary_at_risk', label: 'SLA primario en riesgo', value: s.primary_at_risk, mod: 'warn' },
    { key: 'current_attention', label: 'SLA actual con alerta', value: s.current_breached + s.current_at_risk,
      hint: s.current_breached + ' vencidos · ' + s.current_at_risk + ' en riesgo',
      mod: s.current_breached > 0 ? 'crit' : 'warn' },
    { key: 'without_sla', label: 'Sin SLA', value: s.without_sla },
  ];
  return (
    <div className="wt-tiles">
      {tiles.map(function(t) {
        var active = props.activeFilter === t.key;
        return (
          <button key={t.key} type="button"
            className={'wt-tile' + (active ? ' wt-tile--active' : '')}
            onClick={function() { props.onFilter(active ? 'all' : t.key); }}
            aria-pressed={active}>
            <span className="wt-tile-label">
              {t.mod && t.value > 0 && <span className={'wt-dot wt-dot--' + t.mod} aria-hidden="true" />}
              {t.label}
            </span>
            <span className="wt-tile-value">{t.value.toLocaleString('es')}</span>
            {t.hint && <span className="wt-tile-hint">{t.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Filter bar
   ═══════════════════════════════════════════════════════════ */
var STATES = [
  { key: 'open', label: 'Abiertas' },
  { key: 'closed', label: 'Cerradas' },
  { key: 'all', label: 'Todas' },
];

var SORTS = [
  { key: 'risk', label: 'Mayor riesgo primero' },
  { key: 'newest', label: 'Más recientes' },
  { key: 'oldest', label: 'Más antiguas' },
  { key: 'due', label: 'Vencimiento más próximo' },
];

export function FilterBar(props) {
  return (
    <div className="wt-filters">
      <div className="wt-segmented" role="group" aria-label="Estado">
        {STATES.map(function(s) {
          return (
            <button key={s.key} type="button"
              className={'wt-segment' + (props.state === s.key ? ' wt-segment--active' : '')}
              aria-pressed={props.state === s.key}
              onClick={function() { props.onState(s.key); }}>
              {s.label}
            </button>
          );
        })}
      </div>
      <input className="wt-search" type="search" value={props.search}
        placeholder="Buscar RITM, REQ, solicitante..."
        aria-label="Buscar"
        onChange={function(e) { props.onSearch(e.target.value); }} />
      <select className="wt-select" value={props.sort} aria-label="Ordenar"
        onChange={function(e) { props.onSort(e.target.value); }}>
        {SORTS.map(function(s) { return <option key={s.key} value={s.key}>{s.label}</option>; })}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Requests table
   ═══════════════════════════════════════════════════════════ */
export function RequestTable(props) {
  var rows = props.rows;
  return (
    <div className="wt-table-wrap">
      <table className="wt-table">
        <thead>
          <tr>
            <th scope="col">Solicitud</th>
            <th scope="col">Estado</th>
            <th scope="col" className="wt-col-sla">SLA primario</th>
            <th scope="col" className="wt-col-sla">SLA actual</th>
            <th scope="col">Asignado a</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(function(r) {
            var selected = props.selectedId === r.sys_id;
            return (
              <tr key={r.sys_id} className={selected ? 'wt-row--selected' : ''}
                tabIndex={0}
                onClick={function() { props.onOpen(r.sys_id); }}
                onKeyDown={function(e) { if (e.key === 'Enter') props.onOpen(r.sys_id); }}>
                <td>
                  <div className="wt-cell-number">{r.number}</div>
                  <div className="wt-cell-title">{r.short_description || r.cat_item}</div>
                  <div className="wt-cell-sub">
                    {r.requested_for || '—'} · <span title={formatDate(r.opened_at, true)}>{daysAgo(r.opened_at)}</span>
                  </div>
                </td>
                <td>
                  <div className="wt-cell-state">{r.state_label || '—'}</div>
                  {r.stage_label && <div className="wt-cell-sub">{r.stage_label}</div>}
                </td>
                <td className="wt-col-sla"><SlaMeter sla={r.primary_sla} /></td>
                <td className="wt-col-sla">
                  <SlaMeter sla={r.current_sla} showName
                    emptyLabel={r.primary_sla ? 'Solo SLA primario' : 'Sin SLA'} />
                </td>
                <td>
                  <div>{r.assigned_to || <span className="wt-muted">Sin asignar</span>}</div>
                  {r.assignment_group && <div className="wt-cell-sub">{r.assignment_group}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
