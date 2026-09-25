/* API layer for the warranty screen — Now Code Scripted REST API */
var API = '/api/x_1733631_now_code/now_code_api/warranty';

async function get(path) {
  var res = await fetch(API + path, {
    headers: {
      'Accept': 'application/json',
      'X-UserToken': window.g_ck,
    },
  });
  var json = {};
  try { json = await res.json(); } catch (e) { /* empty body */ }
  var payload = json.result !== undefined ? json.result : json;
  if (!res.ok) {
    var msg = payload && payload.error
      ? (typeof payload.error === 'string' ? payload.error : payload.error.message)
      : null;
    throw new Error(msg || ('Error ' + res.status));
  }
  return payload;
}

export function listRequests(params) {
  var qs = new URLSearchParams();
  if (params.state) qs.set('state', params.state);
  if (params.q) qs.set('q', params.q);
  if (params.limit) qs.set('limit', String(params.limit));
  return get('/requests?' + qs.toString());
}

export function getRequest(sysId) {
  return get('/requests/' + encodeURIComponent(sysId));
}
