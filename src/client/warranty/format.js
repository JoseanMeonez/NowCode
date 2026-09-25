/* Formatting helpers. Server timestamps are UTC "yyyy-MM-dd HH:mm:ss". */

export function parseUtc(value) {
  if (!value) return null;
  var d = new Date(String(value).replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, withTime) {
  var d = value instanceof Date ? value : parseUtc(value);
  if (!d) return '—';
  var opts = { day: '2-digit', month: 'short', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleString('es', opts);
}

export function daysAgo(value) {
  var d = parseUtc(value);
  if (!d) return '';
  var days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'hace 1 día';
  return 'hace ' + days + ' días';
}

export function plural(n, one, many) {
  return n + ' ' + (Math.abs(n) === 1 ? one : many);
}

/** Label, glyph and CSS modifier per SLA status — never color alone */
export var SLA_STATUS = {
  on_track: { label: 'En tiempo', icon: '●', mod: 'ok' },
  at_risk: { label: 'En riesgo', icon: '▲', mod: 'warn' },
  breached: { label: 'Vencido', icon: '✕', mod: 'crit' },
  paused: { label: 'Pausado', icon: '‖', mod: 'paused' },
  completed: { label: 'Cumplido', icon: '✓', mod: 'done' },
  cancelled: { label: 'Cancelado', icon: '–', mod: 'paused' },
};

export function statusInfo(status) {
  return SLA_STATUS[status] || { label: status || '—', icon: '·', mod: 'paused' };
}

/** "Día 7 de 15" style progress text */
export function dayProgress(sla) {
  if (!sla || !sla.current_day) return '';
  if (!sla.total_days) return 'Día ' + sla.current_day;
  // Past the planned end "Día 13 de 10" misreads; show the term instead
  if (sla.current_day > sla.total_days) {
    return 'Día ' + sla.current_day + ' \u00B7 plazo ' + plural(sla.total_days, 'día', 'días');
  }
  return 'Día ' + sla.current_day + ' de ' + sla.total_days;
}

/** "Quedan 3 días" / "Vencido hace 2 días" / "Vence hoy" */
export function remainingText(sla) {
  if (!sla) return '';
  if (sla.status === 'completed') return 'Cerrado ' + formatDate(sla.end_time);
  if (sla.status === 'cancelled') return 'Cancelado';
  if (sla.days_left === null || sla.days_left === undefined) return '';
  if (sla.days_left > 0) return 'Quedan ' + plural(sla.days_left, 'día', 'días');
  if (sla.days_left === 0) return 'Vence hoy';
  return 'Vencido hace ' + plural(-sla.days_left, 'día', 'días');
}

/** Fill for the meter: the SLA engine's business % when present, else calendar days */
export function meterPercent(sla) {
  if (!sla) return 0;
  var pct = sla.business_percentage;
  if (pct === null || pct === undefined) {
    pct = sla.total_days ? (sla.current_day / sla.total_days) * 100 : 0;
  }
  return Math.max(0, Math.min(100, pct));
}

export function recordUrl(table, sysId) {
  return '/' + table + '.do?sys_id=' + encodeURIComponent(sysId);
}
