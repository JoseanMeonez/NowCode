import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */
var API = '/api/x_1733631_now_code/now_code_api';

var SDD_PHASES = [
  { key: 'init', label: 'Initialize', color: '#7aa2f7' },
  { key: 'explore', label: 'Explore', color: '#7dcfff' },
  { key: 'propose', label: 'Propose', color: '#9ece6a' },
  { key: 'spec', label: 'Specification', color: '#e0af68' },
  { key: 'design', label: 'Design', color: '#bb9af7' },
  { key: 'tasks', label: 'Tasks', color: '#f7768e' },
  { key: 'apply', label: 'Apply', color: '#ff9e64' },
  { key: 'verify', label: 'Verify', color: '#73daca' },
  { key: 'archive', label: 'Archive', color: '#565f89' },
  { key: 'onboard', label: 'Onboard', color: '#c0caf5' }
];

/* ═══════════════════════════════════════════════════════════
   API Helper
   ═══════════════════════════════════════════════════════════ */
async function apiCall(path, opts) {
  var options = opts || {};
  var res = await fetch(API + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserToken': window.g_ck,
    },
    body: options.body || undefined,
  });
  if (!res.ok) {
    var errData = {};
    try { errData = await res.json(); } catch (e) { /* ignore */ }
    // Scripted REST wraps setBody() payloads in { result }; platform errors use { error: { message } }
    var payload = errData.result !== undefined ? errData.result : errData;
    var errMsg = payload && payload.error
      ? (typeof payload.error === 'string' ? payload.error : payload.error.message)
      : null;
    var err = new Error(errMsg || ('API Error ' + res.status));
    err.code = payload && payload.code;
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  var json = await res.json();
  return json.result !== undefined ? json.result : json;
}

function isSddActive(session) {
  return !!session && (session.sdd_active === 'true' || session.sdd_active === true);
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
function getPhaseInfo(key) {
  var found = SDD_PHASES.find(function(p) { return p.key === key; });
  return found || { key: key, label: key || 'None', color: '#565f89' };
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  var now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════
   Simple Markdown Renderer
   ═══════════════════════════════════════════════════════════ */
var INLINE_PATTERNS = [
  { re: /`([^`]+)`/, render: function(m, k) { return React.createElement('code', { key: k, className: 'nc-inline-code' }, m[1]); } },
  { re: /\*\*([^*]+)\*\*/, render: function(m, k) { return React.createElement('strong', { key: k }, formatInline(m[1])); } },
  { re: /\*([^*\s][^*]*)\*/, render: function(m, k) { return React.createElement('em', { key: k }, formatInline(m[1])); } }
];

function formatInline(text) {
  var parts = [];
  var remaining = text;
  var k = 0;
  while (remaining.length > 0) {
    // Take the earliest match so "**a** and `b`" renders both
    var best = null;
    INLINE_PATTERNS.forEach(function(p) {
      var m = p.re.exec(remaining);
      if (m && (!best || m.index < best.m.index)) best = { m: m, p: p };
    });
    if (!best) {
      parts.push(React.createElement('span', { key: k++ }, remaining));
      break;
    }
    if (best.m.index > 0) {
      parts.push(React.createElement('span', { key: k++ }, remaining.slice(0, best.m.index)));
    }
    parts.push(best.p.render(best.m, k++));
    remaining = remaining.slice(best.m.index + best.m[0].length);
  }
  return parts.length === 1 ? parts[0] : parts;
}

function renderMarkdown(text) {
  if (!text) return null;
  var blocks = [];
  var lines = text.split('\n');
  var i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('```')) {
      var lang = lines[i].slice(3).trim();
      var codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        React.createElement('div', { className: 'nc-code-block', key: blocks.length },
          lang ? React.createElement('div', { className: 'nc-code-lang' }, lang) : null,
          React.createElement('pre', null,
            React.createElement('code', null, codeLines.join('\n'))
          )
        )
      );
      continue;
    }
    if (lines[i].startsWith('### ')) {
      blocks.push(React.createElement('h3', { className: 'nc-md-h3', key: blocks.length }, formatInline(lines[i].slice(4))));
      i++; continue;
    }
    if (lines[i].startsWith('## ')) {
      blocks.push(React.createElement('h2', { className: 'nc-md-h2', key: blocks.length }, formatInline(lines[i].slice(3))));
      i++; continue;
    }
    if (lines[i].startsWith('# ')) {
      blocks.push(React.createElement('h1', { className: 'nc-md-h1', key: blocks.length }, formatInline(lines[i].slice(2))));
      i++; continue;
    }
    if (/^[-*]\s/.test(lines[i])) {
      var items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        React.createElement('ul', { className: 'nc-md-list', key: blocks.length },
          items.map(function(item, idx) {
            return React.createElement('li', { key: idx }, formatInline(item));
          })
        )
      );
      continue;
    }
    if (/^\d+\.\s/.test(lines[i])) {
      var olItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        olItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        React.createElement('ol', { className: 'nc-md-list', key: blocks.length },
          olItems.map(function(item, idx) {
            return React.createElement('li', { key: idx }, formatInline(item));
          })
        )
      );
      continue;
    }
    if (!lines[i].trim()) { i++; continue; }
    blocks.push(React.createElement('p', { className: 'nc-md-p', key: blocks.length }, formatInline(lines[i])));
    i++;
  }
  return blocks;
}

/* ═══════════════════════════════════════════════════════════
   SDD Phase Dots
   ═══════════════════════════════════════════════════════════ */
function SDDPhaseDots(props) {
  var currentPhase = props.currentPhase;
  return (
    <div className="nc-phase-dots">
      {SDD_PHASES.map(function(phase) {
        var isActive = phase.key === currentPhase;
        return (
          <div
            key={phase.key}
            className={'nc-phase-dot' + (isActive ? ' nc-phase-dot--active' : '')}
            style={isActive ? { backgroundColor: phase.color } : undefined}
            title={phase.label}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SDD Artifact Card
   ═══════════════════════════════════════════════════════════ */
function SDDArtifactCard(props) {
  var artifact = props.artifact;
  var onApprove = props.onApprove;
  var onReject = props.onReject;
  var expanded = useState(false);
  var isExpanded = expanded[0];
  var setExpanded = expanded[1];
  var phase = getPhaseInfo(artifact.phase);

  return (
    <div className="nc-artifact-card" style={{ borderLeftColor: phase.color }}>
      <div className="nc-artifact-header" role="button" tabIndex={0}
        onClick={function() { setExpanded(!isExpanded); }}
        onKeyDown={function(e) { if (e.key === 'Enter') setExpanded(!isExpanded); }}>
        <div className="nc-artifact-info">
          <span className="nc-artifact-title">{artifact.title}</span>
          <span className="nc-artifact-type">{artifact.artifact_type}</span>
        </div>
        <div className="nc-artifact-meta">
          <span className="nc-badge" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
            {phase.label}
          </span>
          <span className={'nc-badge nc-badge--' + (artifact.status === 'pending_review' ? 'pending' : (artifact.status || 'draft'))}>
            {(artifact.status || 'draft').replace('_', ' ')}
          </span>
          <span className="nc-artifact-chevron">{isExpanded ? '\u25BE' : '\u25B8'}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="nc-artifact-body">
          <pre className="nc-artifact-content">{artifact.content}</pre>
          {artifact.status === 'pending_review' && (
            <div className="nc-artifact-actions">
              <button className="nc-btn nc-btn--approve"
                onClick={function() { onApprove(artifact.sys_id); }}>
                {'\u2713'} Approve
              </button>
              <button className="nc-btn nc-btn--reject"
                onClick={function() { onReject(artifact.sys_id); }}>
                {'\u2717'} Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Session Item
   ═══════════════════════════════════════════════════════════ */
function SessionItem(props) {
  var session = props.session;
  var active = props.active;
  var onClick = props.onClick;
  var phase = isSddActive(session) ? getPhaseInfo(session.sdd_phase) : null;

  return (
    <div className={'nc-session-item' + (active ? ' nc-session-item--active' : '')}
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={function(e) { if (e.key === 'Enter') onClick(); }}>
      <div className="nc-session-item-name">{session.name}</div>
      <div className="nc-session-item-meta">
        <span className="nc-badge nc-badge--model">{session.model || 'default'}</span>
        {phase && (
          <span className="nc-badge" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
            {phase.label}
          </span>
        )}
        <span className="nc-session-time">{formatTime(session.updated_on || session.created_on)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Session Sidebar
   ═══════════════════════════════════════════════════════════ */
function SessionSidebar(props) {
  var sessions = props.sessions;
  var activeSessionId = props.activeSessionId;
  var onSelectSession = props.onSelectSession;
  var onNewSession = props.onNewSession;
  var onOpenSettings = props.onOpenSettings;
  var settings = props.settings;

  var today = new Date().toDateString();
  var activeSessions = sessions.filter(function(s) { return s.status !== 'archived'; });
  var todaySessions = activeSessions.filter(function(s) {
    return new Date(s.updated_on || s.created_on).toDateString() === today;
  });
  var earlierSessions = activeSessions.filter(function(s) {
    return new Date(s.updated_on || s.created_on).toDateString() !== today;
  });

  return (
    <aside className="nc-sidebar" role="navigation" aria-label="Sessions">
      <div className="nc-sidebar-header">
        <div className="nc-logo">
          <span className="nc-logo-icon" aria-hidden="true">{'\u27E8/\u27E9'}</span>
          <span className="nc-logo-text">Now Code</span>
        </div>
        <button className="nc-btn nc-btn--new" onClick={onNewSession}
          aria-label="Create new session">
          + New
        </button>
      </div>
      <div className="nc-sidebar-sessions">
        {todaySessions.length > 0 && (
          <div className="nc-session-group">
            <div className="nc-session-group-label">Today</div>
            {todaySessions.map(function(s) {
              return (
                <SessionItem key={s.sys_id} session={s}
                  active={s.sys_id === activeSessionId}
                  onClick={function() { onSelectSession(s.sys_id); }} />
              );
            })}
          </div>
        )}
        {earlierSessions.length > 0 && (
          <div className="nc-session-group">
            <div className="nc-session-group-label">Earlier</div>
            {earlierSessions.map(function(s) {
              return (
                <SessionItem key={s.sys_id} session={s}
                  active={s.sys_id === activeSessionId}
                  onClick={function() { onSelectSession(s.sys_id); }} />
              );
            })}
          </div>
        )}
        {activeSessions.length === 0 && (
          <div className="nc-empty-state">
            No sessions yet. Click <strong>+ New</strong> to start a conversation.
          </div>
        )}
      </div>
      <div className="nc-sidebar-footer">
        <button className="nc-provider-status" onClick={onOpenSettings}
          aria-label="Open provider settings">
          <span className={'nc-status-dot' + (settings && settings.has_api_key ? ' nc-status-dot--ok' : '')}
            aria-hidden="true"></span>
          <span className="nc-provider-status-text">
            <span className="nc-provider-status-name">
              {settings ? settings.provider_label : 'Provider'}
            </span>
            <span className="nc-provider-status-sub">
              {settings && settings.has_api_key
                ? 'API key ' + (settings.api_key_hint || 'configured')
                : 'No API key — click to connect'}
            </span>
          </span>
          <span className="nc-provider-status-gear" aria-hidden="true">{'\u2699'}</span>
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   Model Picker
   ═══════════════════════════════════════════════════════════ */
function ModelPicker(props) {
  var models = props.models;
  var selectedModel = props.selectedModel;
  var onModelChange = props.onModelChange;
  var disabled = props.disabled;
  var openState = useState(false);
  var open = openState[0];
  var setOpen = openState[1];
  var filterState = useState('');
  var filter = filterState[0];
  var setFilter = filterState[1];
  var rootRef = useRef(null);

  useEffect(function() {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return function() { document.removeEventListener('mousedown', onDocClick); };
  }, [open]);

  var needle = filter.trim().toLowerCase();
  var visible = models.filter(function(m) {
    if (!needle) return true;
    return (m.id + ' ' + (m.name || '') + ' ' + (m.provider || '')).toLowerCase().indexOf(needle) !== -1;
  });

  // Group by vendor, keeping first-seen order
  var groups = [];
  var byVendor = {};
  visible.forEach(function(m) {
    var vendor = m.provider || 'Other';
    if (!byVendor[vendor]) {
      byVendor[vendor] = { vendor: vendor, models: [] };
      groups.push(byVendor[vendor]);
    }
    byVendor[vendor].models.push(m);
  });

  var selected = models.find(function(m) { return m.id === selectedModel; });
  var label = selected ? (selected.name || selected.id) : (selectedModel || 'Select model');

  function choose(id) {
    onModelChange(id);
    setOpen(false);
    setFilter('');
  }

  return (
    <div className="nc-model-selector" ref={rootRef}>
      <button className="nc-btn nc-btn--model-select"
        onClick={function() { setOpen(!open); }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={selectedModel}>
        <span className="nc-model-select-label">{label}</span>
        <span className="nc-chevron">{'▾'}</span>
      </button>
      {open && (
        <div className="nc-dropdown nc-dropdown--models">
          <input className="nc-input nc-dropdown-search" type="text" autoFocus
            placeholder="Search models..."
            value={filter}
            onChange={function(e) { setFilter(e.target.value); }}
            onKeyDown={function(e) {
              e.stopPropagation();
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && visible.length > 0) choose(visible[0].id);
            }}
            onKeyUp={function(e) { e.stopPropagation(); }}
            onKeyPress={function(e) { e.stopPropagation(); }} />
          <div className="nc-dropdown-list" role="listbox">
            {groups.map(function(g) {
              return (
                <div key={g.vendor} className="nc-dropdown-group">
                  <div className="nc-dropdown-group-label">{g.vendor}</div>
                  {g.models.map(function(m) {
                    return (
                      <div key={m.id} role="option"
                        aria-selected={m.id === selectedModel}
                        className={'nc-dropdown-item' + (m.id === selectedModel ? ' nc-dropdown-item--selected' : '')}
                        onClick={function() { choose(m.id); }}>
                        <span>{m.name || m.id}</span>
                        <span className="nc-dropdown-item-sub">{m.id}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {visible.length === 0 && (
              <div className="nc-dropdown-item nc-dropdown-item--empty">
                {models.length === 0 ? 'No models available' : 'No matches'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Top Bar
   ═══════════════════════════════════════════════════════════ */
function TopBar(props) {
  var session = props.session;
  var phase = isSddActive(session) ? getPhaseInfo(session.sdd_phase) : null;

  return (
    <header className="nc-topbar" role="banner">
      <div className="nc-topbar-left">
        <span className="nc-topbar-title">
          {session ? session.name : 'New conversation'}
        </span>
        {session && session.context_scope && (
          <span className="nc-badge nc-badge--scope">{session.context_scope}</span>
        )}
      </div>
      <div className="nc-topbar-right">
        {phase && (
          <div className="nc-topbar-sdd">
            <span className="nc-badge" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
              SDD: {phase.label}
            </span>
            <SDDPhaseDots currentPhase={session.sdd_phase} />
          </div>
        )}
        {session && session.total_tokens > 0 && (
          <span className="nc-topbar-tokens" title="Tokens used in this session">
            {session.total_tokens.toLocaleString()} tok
          </span>
        )}
        <ModelPicker
          models={props.models}
          selectedModel={props.selectedModel}
          onModelChange={props.onModelChange}
          disabled={props.busy}
        />
        {session && (
          <button className="nc-btn nc-btn--icon" onClick={props.onArchive}
            title="Archive session" aria-label="Archive session" disabled={props.busy}>
            {'🗄'}
          </button>
        )}
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Chat Message
   ═══════════════════════════════════════════════════════════ */
function ChatMessage(props) {
  var message = props.message;
  var role = message.role || 'user';

  if (role === 'system') {
    return (
      <div className="nc-message nc-message--system">
        <div className="nc-message-content">{message.content}</div>
      </div>
    );
  }

  var isUser = role === 'user';
  var phase = message.sdd_phase && message.sdd_phase !== 'none' ? getPhaseInfo(message.sdd_phase) : null;

  return (
    <div className={'nc-message nc-message--' + role}>
      <div className="nc-message-avatar" aria-hidden="true">
        {isUser ? '\uD83D\uDC64' : '\uD83E\uDD16'}
      </div>
      <div className="nc-message-body">
        {phase && (
          <span className="nc-badge nc-badge--sm"
            style={{ backgroundColor: phase.color + '22', color: phase.color }}>
            {phase.label}
          </span>
        )}
        <div className="nc-message-content">
          {isUser ? message.content : renderMarkdown(message.content)}
        </div>
        {message.model_used && (
          <div className="nc-message-meta">
            <span className="nc-meta-model">{message.model_used}</span>
            {message.tokens_used > 0 && (
              <span className="nc-meta-tokens">{message.tokens_used} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Chat Area
   ═══════════════════════════════════════════════════════════ */
function ChatArea(props) {
  var messages = props.messages;
  var artifacts = props.artifacts;
  var loading = props.loading;
  var onApproveArtifact = props.onApproveArtifact;
  var onRejectArtifact = props.onRejectArtifact;
  var needsSetup = props.needsSetup;
  var onOpenSettings = props.onOpenSettings;
  var scrollRef = useRef(null);

  useEffect(function() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="nc-chat-area" ref={scrollRef} role="log" aria-label="Chat messages">
      {messages.length === 0 && !loading && (
        <div className="nc-welcome">
          <div className="nc-welcome-icon" aria-hidden="true">{'\u27E8/\u27E9'}</div>
          <h2>Welcome to Now Code</h2>
          <p>Your AI development assistant for ServiceNow</p>
          {needsSetup && (
            <div className="nc-setup-card">
              <div className="nc-setup-card-title">Connect your OpenCode Go subscription</div>
              <div className="nc-setup-card-text">
                Paste your API key once and every model in your plan becomes available here.
                The key is stored encrypted on this instance and never sent to the browser.
              </div>
              <button className="nc-btn nc-btn--primary" onClick={onOpenSettings}>
                Add API key
              </button>
            </div>
          )}
          <div className="nc-welcome-hints">
            <div className="nc-hint">{'\uD83D\uDCAC'} Chat about code and architecture</div>
            <div className="nc-hint">{'\uD83D\uDCD0'} Use SDD for structured development</div>
            <div className="nc-hint">{'\uD83D\uDD0D'} Explore platform tables and schemas</div>
          </div>
        </div>
      )}
      {messages.map(function(msg, idx) {
        return <ChatMessage key={msg.sys_id || idx} message={msg} />;
      })}
      {artifacts.length > 0 && (
        <div className="nc-artifacts-section">
          <div className="nc-artifacts-label">SDD Artifacts</div>
          {artifacts.map(function(a) {
            return (
              <SDDArtifactCard key={a.sys_id} artifact={a}
                onApprove={onApproveArtifact}
                onReject={onRejectArtifact} />
            );
          })}
        </div>
      )}
      {loading && (
        <div className="nc-message nc-message--assistant">
          <div className="nc-message-avatar" aria-hidden="true">{'\uD83E\uDD16'}</div>
          <div className="nc-message-body">
            <div className="nc-message-content">
              <div className="nc-loading-dots" aria-label="Loading">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Message Input
   ═══════════════════════════════════════════════════════════ */
function MessageInput(props) {
  var onSend = props.onSend;
  var disabled = props.disabled;
  var sddActive = props.sddActive;
  var hasSession = props.hasSession;
  var canAdvance = props.canAdvance;
  var pendingProposalId = props.pendingProposalId;
  var onApprove = props.onApprove;
  var onReject = props.onReject;
  var valueState = useState('');
  var value = valueState[0];
  var setValue = valueState[1];
  var textareaRef = useRef(null);

  var handleSend = useCallback(function() {
    var trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, null);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  var handleKeyDown = useCallback(function(e) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  var handleInput = useCallback(function(e) {
    e.stopPropagation();
    setValue(e.target.value);
    var ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  return (
    <div className="nc-input-area">
      {hasSession && (
        <div className="nc-quick-actions">
          {!sddActive && (
            <button className="nc-btn nc-btn--quick" disabled={disabled}
              onClick={function() { onSend('Start the SDD process for this conversation.', 'start_sdd'); }}>
              {'\uD83D\uDE80'} Start SDD
            </button>
          )}
          {sddActive && !pendingProposalId && canAdvance && (
            <button className="nc-btn nc-btn--quick" disabled={disabled}
              onClick={function() { onSend('Advance to the next SDD phase and produce its artifact.', 'next_phase'); }}>
              {'\u23ED'} Next Phase
            </button>
          )}
          {pendingProposalId && (
            <React.Fragment>
              <button className="nc-btn nc-btn--approve" disabled={disabled}
                onClick={function() { onApprove(pendingProposalId); }}>
                {'\u2713'} Approve proposal
              </button>
              <button className="nc-btn nc-btn--reject" disabled={disabled}
                onClick={function() { onReject(pendingProposalId); }}>
                {'\u2717'} Reject proposal
              </button>
            </React.Fragment>
          )}
        </div>
      )}
      <div className="nc-input-row">
        <textarea ref={textareaRef} className="nc-textarea"
          placeholder={props.placeholder || 'Ask anything... a session will be created automatically'}
          value={value} onChange={handleInput} onKeyDown={handleKeyDown}
          onKeyUp={function(e) { e.stopPropagation(); }}
          onKeyPress={function(e) { e.stopPropagation(); }}
          onFocus={function(e) { e.stopPropagation(); }}
          disabled={disabled} rows={1}
          aria-label="Message input" />
        <button className="nc-btn nc-btn--send" onClick={handleSend}
          disabled={disabled || !value.trim()} aria-label="Send message">
          {'\u25B6'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   New Session Modal
   ═══════════════════════════════════════════════════════════ */
function NewSessionModal(props) {
  var open = props.open;
  var models = props.models;
  var onClose = props.onClose;
  var onCreate = props.onCreate;
  var defaultModel = props.defaultModel;
  var nameState = useState('');
  var name = nameState[0];
  var setName = nameState[1];
  var modelState = useState('');
  var model = modelState[0];
  var setModel = modelState[1];
  var scopeState = useState('');
  var scope = scopeState[0];
  var setScope = scopeState[1];

  var handleCreate = function() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      model: model || undefined,
      context_scope: scope || undefined
    });
    setName('');
    setModel('');
    setScope('');
  };

  var handleKeyDown = function(e) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') onClose();
  };

  var stopProp = function(e) { e.stopPropagation(); };

  useEffect(function() {
    if (open) setModel(defaultModel || '');
  }, [open, defaultModel]);

  if (!open) return null;

  return (
    <div className="nc-modal-overlay" onClick={onClose} role="dialog"
      aria-modal="true" aria-label="New Session">
      <div className="nc-modal" onClick={function(e) { e.stopPropagation(); }}>
        <div className="nc-modal-header">
          <span>New Session</span>
          <button className="nc-btn nc-btn--icon" onClick={onClose} aria-label="Close">
            {'\u2715'}
          </button>
        </div>
        <div className="nc-modal-body">
          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-session-name">Session Name</label>
            <input id="nc-session-name" className="nc-input" type="text"
              value={name} onChange={function(e) { setName(e.target.value); }}
              onKeyDown={handleKeyDown} onKeyUp={stopProp} onKeyPress={stopProp}
              placeholder="e.g., Build incident handler" autoFocus />
          </div>
          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-model-select">Model</label>
            <select id="nc-model-select" className="nc-select" value={model}
              onChange={function(e) { setModel(e.target.value); }}>
              <option value="">Default</option>
              {models.map(function(m) {
                return <option key={m.id} value={m.id}>{(m.provider ? m.provider + ' \u00B7 ' : '') + (m.name || m.id)}</option>;
              })}
            </select>
          </div>
          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-scope-input">Context Scope (optional)</label>
            <input id="nc-scope-input" className="nc-input" type="text"
              value={scope} onChange={function(e) { setScope(e.target.value); }}
              onKeyDown={handleKeyDown} onKeyUp={stopProp} onKeyPress={stopProp}
              placeholder="e.g., x_myapp_scope" />
          </div>
        </div>
        <div className="nc-modal-footer">
          <button className="nc-btn nc-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="nc-btn nc-btn--primary" onClick={handleCreate}
            disabled={!name.trim()}>
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Settings Modal — provider + API key
   ═══════════════════════════════════════════════════════════ */
function SettingsModal(props) {
  var open = props.open;
  var settings = props.settings;
  var models = props.models;
  var onClose = props.onClose;
  var onSaved = props.onSaved;
  var reason = props.reason;

  var providerState = useState('opencode_go');
  var provider = providerState[0];
  var setProvider = providerState[1];
  var keyState = useState('');
  var apiKey = keyState[0];
  var setApiKey = keyState[1];
  var baseUrlState = useState('');
  var baseUrl = baseUrlState[0];
  var setBaseUrl = baseUrlState[1];
  var modelState = useState('');
  var defaultModel = modelState[0];
  var setDefaultModel = modelState[1];
  var maxTokensState = useState(8192);
  var maxTokens = maxTokensState[0];
  var setMaxTokens = maxTokensState[1];
  var busyState = useState(null);
  var busy = busyState[0];
  var setBusy = busyState[1];
  var statusState = useState(null);
  var status = statusState[0];
  var setStatus = statusState[1];

  useEffect(function() {
    if (!open) return;
    setApiKey('');
    setStatus(reason ? { ok: false, text: reason } : null);
    if (settings) {
      setProvider(settings.provider || 'opencode_go');
      setBaseUrl(settings.base_url || '');
      setDefaultModel(settings.default_model || '');
      setMaxTokens(settings.max_tokens || 8192);
    }
    // Only reset the form when the modal opens, not when a save refreshes settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reason]);

  if (!open) return null;

  var providers = (settings && settings.providers) || [
    { id: 'opencode_go', label: 'OpenCode Go', key_url: 'https://opencode.ai/auth' }
  ];
  var providerInfo = providers.find(function(p) { return p.id === provider; }) || providers[0];
  var hasStoredKey = settings && settings.has_api_key && settings.key_source === 'user';

  async function save(andTest) {
    setBusy(andTest ? 'test' : 'save');
    setStatus(null);
    try {
      var body = {
        provider: provider,
        base_url: baseUrl.trim(),
        default_model: defaultModel,
        max_tokens: parseInt(maxTokens, 10) || 8192
      };
      if (apiKey.trim()) body.api_key = apiKey.trim();
      var saved = await apiCall('/settings', { method: 'PUT', body: JSON.stringify(body) });
      setApiKey('');
      await onSaved(saved);
      if (!andTest) {
        setStatus({ ok: true, text: 'Settings saved.' });
        return;
      }
      var result = await apiCall('/settings/test', {
        method: 'POST',
        body: JSON.stringify({ model: defaultModel || undefined })
      });
      setStatus({
        ok: !!result.success,
        text: result.message + (result.success && result.model_count
          ? ' — ' + result.model_count + ' models available.'
          : '')
      });
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function clearKey() {
    setBusy('clear');
    setStatus(null);
    try {
      var saved = await apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify({ clear_api_key: true })
      });
      await onSaved(saved);
      setStatus({ ok: true, text: 'API key removed.' });
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  var stopProp = function(e) { e.stopPropagation(); };
  var onKeyDown = function(e) {
    e.stopPropagation();
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && !busy) { e.preventDefault(); save(true); }
  };

  return (
    <div className="nc-modal-overlay" onClick={onClose} role="dialog"
      aria-modal="true" aria-label="Provider settings">
      <div className="nc-modal nc-modal--wide" onClick={stopProp}>
        <div className="nc-modal-header">
          <span>Model provider</span>
          <button className="nc-btn nc-btn--icon" onClick={onClose} aria-label="Close">
            {'✕'}
          </button>
        </div>
        <div className="nc-modal-body">
          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-provider">Provider</label>
            <select id="nc-provider" className="nc-select" value={provider}
              onChange={function(e) { setProvider(e.target.value); }}>
              {providers.map(function(p) {
                return <option key={p.id} value={p.id}>{p.label}</option>;
              })}
            </select>
          </div>

          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-api-key">API key</label>
            <input id="nc-api-key" className="nc-input nc-input--mono" type="password"
              autoComplete="off" spellCheck={false} autoFocus
              value={apiKey}
              onChange={function(e) { setApiKey(e.target.value); }}
              onKeyDown={onKeyDown} onKeyUp={stopProp} onKeyPress={stopProp}
              placeholder={hasStoredKey
                ? 'Stored: ' + settings.api_key_hint + ' — paste a new key to replace it'
                : 'sk-...'} />
            <span className="nc-help">
              {providerInfo && providerInfo.key_url
                ? <React.Fragment>
                    Get it from <a href={providerInfo.key_url} target="_blank" rel="noopener noreferrer">{providerInfo.key_url.replace('https://', '')}</a>.{' '}
                  </React.Fragment>
                : null}
              Stored encrypted (Password2) on this instance, per user. It is never returned to the browser.
              {settings && settings.key_source === 'shared' && ' You are currently using a key shared by your admin.'}
            </span>
          </div>

          {provider === 'custom' && (
            <div className="nc-form-group">
              <label className="nc-label" htmlFor="nc-base-url">Base URL</label>
              <input id="nc-base-url" className="nc-input nc-input--mono" type="text"
                value={baseUrl}
                onChange={function(e) { setBaseUrl(e.target.value); }}
                onKeyDown={onKeyDown} onKeyUp={stopProp} onKeyPress={stopProp}
                placeholder="https://api.example.com/v1" />
            </div>
          )}

          <div className="nc-form-row">
            <div className="nc-form-group nc-form-group--grow">
              <label className="nc-label" htmlFor="nc-default-model">Default model</label>
              <select id="nc-default-model" className="nc-select" value={defaultModel}
                onChange={function(e) { setDefaultModel(e.target.value); }}>
                <option value="">Automatic</option>
                {defaultModel && !models.some(function(m) { return m.id === defaultModel; }) && (
                  <option value={defaultModel}>{defaultModel}</option>
                )}
                {models.map(function(m) {
                  return <option key={m.id} value={m.id}>{(m.provider ? m.provider + ' · ' : '') + (m.name || m.id)}</option>;
                })}
              </select>
            </div>
            <div className="nc-form-group nc-form-group--narrow">
              <label className="nc-label" htmlFor="nc-max-tokens">Max output tokens</label>
              <input id="nc-max-tokens" className="nc-input" type="number" min="256" max="128000" step="256"
                value={maxTokens}
                onChange={function(e) { setMaxTokens(e.target.value); }}
                onKeyDown={onKeyDown} onKeyUp={stopProp} onKeyPress={stopProp} />
            </div>
          </div>

          {status && (
            <div className={'nc-status-box ' + (status.ok ? 'nc-status-box--ok' : 'nc-status-box--error')}
              role="status">
              {status.text}
            </div>
          )}
        </div>
        <div className="nc-modal-footer">
          {hasStoredKey && (
            <button className="nc-btn nc-btn--secondary nc-btn--danger-text" onClick={clearKey}
              disabled={!!busy}>
              {busy === 'clear' ? 'Removing...' : 'Remove key'}
            </button>
          )}
          <span className="nc-footer-spacer"></span>
          <button className="nc-btn nc-btn--secondary" onClick={function() { save(false); }}
            disabled={!!busy}>
            {busy === 'save' ? 'Saving...' : 'Save'}
          </button>
          <button className="nc-btn nc-btn--primary" onClick={function() { save(true); }}
            disabled={!!busy || (!apiKey.trim() && !(settings && settings.has_api_key))}>
            {busy === 'test' ? 'Testing...' : 'Save & test'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════════════════════ */
function App() {
  var sessionsState = useState([]);
  var sessions = sessionsState[0];
  var setSessions = sessionsState[1];

  var activeIdState = useState(null);
  var activeSessionId = activeIdState[0];
  var setActiveSessionId = activeIdState[1];

  var sessionState = useState(null);
  var activeSession = sessionState[0];
  var setActiveSession = sessionState[1];

  var msgsState = useState([]);
  var messages = msgsState[0];
  var setMessages = msgsState[1];

  var artifactsState = useState([]);
  var artifacts = artifactsState[0];
  var setArtifacts = artifactsState[1];

  var modelsState = useState([]);
  var models = modelsState[0];
  var setModels = modelsState[1];

  var modelState = useState('');
  var selectedModel = modelState[0];
  var setSelectedModel = modelState[1];

  var settingsState = useState(null);
  var settings = settingsState[0];
  var setSettings = settingsState[1];

  var settingsModalState = useState({ open: false, reason: null });
  var settingsModal = settingsModalState[0];
  var setSettingsModal = settingsModalState[1];

  var sendingState = useState(false);
  var sending = sendingState[0];
  var setSending = sendingState[1];

  var modalState = useState(false);
  var showModal = modalState[0];
  var setShowModal = modalState[1];

  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

  var openSettings = useCallback(function(reason) {
    setSettingsModal({ open: true, reason: typeof reason === 'string' ? reason : null });
  }, []);

  /* ── Loaders ── */
  var loadSessions = useCallback(async function() {
    try {
      var data = await apiCall('/sessions');
      var list = Array.isArray(data) ? data : (data && data.sessions ? data.sessions : []);
      setSessions(list);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  var loadModels = useCallback(async function() {
    try {
      var data = await apiCall('/models');
      var list = Array.isArray(data) ? data : (data && data.models ? data.models : []);
      setModels(list);
      // Only fill in a default when nothing has been chosen yet
      setSelectedModel(function(current) { return current || (data && data.default_model) || ''; });
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  }, []);

  var loadSettings = useCallback(async function() {
    try {
      var data = await apiCall('/settings');
      setSettings(data);
      return data;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return null;
    }
  }, []);

  var loadSessionDetails = useCallback(async function(sessionId) {
    try {
      var data = await apiCall('/sessions/' + sessionId);
      setActiveSession(data);
      if (data && data.model) setSelectedModel(data.model);
    } catch (e) {
      console.error('Failed to load session details:', e);
    }
  }, []);

  var loadMessages = useCallback(async function(sessionId) {
    try {
      var data = await apiCall('/sessions/' + sessionId + '/messages?limit=500');
      var list = Array.isArray(data) ? data : (data && data.messages ? data.messages : []);
      setMessages(list);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, []);

  var loadArtifacts = useCallback(async function(sessionId) {
    try {
      var data = await apiCall('/sessions/' + sessionId + '/artifacts');
      var list = Array.isArray(data) ? data : (data && data.artifacts ? data.artifacts : []);
      setArtifacts(list);
    } catch (e) {
      console.error('Failed to load artifacts:', e);
    }
  }, []);

  var refreshSession = useCallback(async function(sessionId) {
    await Promise.all([
      loadMessages(sessionId),
      loadArtifacts(sessionId),
      loadSessionDetails(sessionId),
    ]);
  }, [loadMessages, loadArtifacts, loadSessionDetails]);

  /* ── Initial load: prompt for a key on first visit ── */
  useEffect(function() {
    loadSessions();
    loadModels();
    loadSettings().then(function(data) {
      if (data && !data.has_api_key) openSettings();
    });
  }, [loadSessions, loadModels, loadSettings, openSettings]);

  /* ── Session change ── */
  useEffect(function() {
    if (activeSessionId) {
      refreshSession(activeSessionId);
    } else {
      setMessages([]);
      setArtifacts([]);
      setActiveSession(null);
    }
  }, [activeSessionId, refreshSession]);

  /* ── Surface provider errors, opening settings when the key is the problem ── */
  var handleError = useCallback(function(e) {
    if (e && (e.code === 'no_api_key' || e.code === 'auth_failed')) {
      openSettings(e.message);
    }
    setError(e ? e.message : 'Unknown error');
  }, [openSettings]);

  /* ── Send message (auto-creates session if none active) ── */
  var handleSendMessage = useCallback(async function(content, sddCommand) {
    if (settings && !settings.has_api_key) {
      openSettings('Add your API key to start chatting.');
      return;
    }
    setSending(true);
    setError(null);
    var tempId = 'temp-' + Date.now();
    setMessages(function(prev) {
      return prev.concat([{ role: 'user', content: content, sys_id: tempId }]);
    });

    var sessionId = activeSessionId;

    try {
      // Auto-create a session if none exists
      if (!sessionId) {
        var sessionName = content.length > 50 ? content.substring(0, 47) + '...' : content;
        var newSession = await apiCall('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            name: sessionName,
            model: selectedModel || undefined,
          })
        });
        sessionId = newSession && (newSession.sys_id || (newSession.session && newSession.session.sys_id));
        if (!sessionId) {
          throw new Error('Could not create session');
        }
        setActiveSessionId(sessionId);
        loadSessions();
      }

      var body = { content: content };
      if (sddCommand) body.sdd_command = sddCommand;
      await apiCall('/sessions/' + sessionId + '/messages', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      await refreshSession(sessionId);
      loadSessions();
    } catch (e) {
      handleError(e);
      if (sessionId) {
        // The server keeps the user message even when the model call fails
        await refreshSession(sessionId);
      } else {
        setMessages(function(prev) {
          return prev.filter(function(m) { return m.sys_id !== tempId; });
        });
      }
    } finally {
      setSending(false);
    }
  }, [activeSessionId, selectedModel, settings, refreshSession, loadSessions, handleError, openSettings]);

  /* ── Model change: persists on the active session ── */
  var handleModelChange = useCallback(async function(modelId) {
    setSelectedModel(modelId);
    if (!activeSessionId) return;
    try {
      await apiCall('/sessions/' + activeSessionId, {
        method: 'PATCH',
        body: JSON.stringify({ model: modelId })
      });
      await loadSessionDetails(activeSessionId);
      loadSessions();
    } catch (e) {
      handleError(e);
    }
  }, [activeSessionId, loadSessionDetails, loadSessions, handleError]);

  /* ── Create session ── */
  var handleCreateSession = useCallback(async function(params) {
    try {
      var data = await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      setShowModal(false);
      await loadSessions();
      var newId = data && (data.sys_id || (data.session && data.session.sys_id));
      if (newId) setActiveSessionId(newId);
    } catch (e) {
      handleError(e);
    }
  }, [loadSessions, handleError]);

  var handleArchiveSession = useCallback(async function() {
    if (!activeSessionId) return;
    if (!window.confirm('Archive this session? It will be hidden from the sidebar.')) return;
    try {
      await apiCall('/sessions/' + activeSessionId, { method: 'DELETE' });
      setActiveSessionId(null);
      await loadSessions();
    } catch (e) {
      handleError(e);
    }
  }, [activeSessionId, loadSessions, handleError]);

  /* ── Artifact actions ── */
  var handleApproveArtifact = useCallback(async function(artifactId) {
    setSending(true);
    try {
      await apiCall('/sessions/' + activeSessionId + '/artifacts/' + artifactId + '/approve', {
        method: 'POST'
      });
      await refreshSession(activeSessionId);
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  }, [activeSessionId, refreshSession, handleError]);

  var handleRejectArtifact = useCallback(async function(artifactId) {
    var reason = window.prompt('Why are you rejecting this proposal? (optional)', '');
    if (reason === null) return;
    setSending(true);
    try {
      await apiCall('/sessions/' + activeSessionId + '/artifacts/' + artifactId + '/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Rejected from UI' })
      });
      await refreshSession(activeSessionId);
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  }, [activeSessionId, refreshSession, handleError]);

  /* ── Settings saved: models and default model depend on the key ── */
  var handleSettingsSaved = useCallback(async function(saved) {
    if (saved) setSettings(saved);
    else await loadSettings();
    await loadModels();
    if (saved && saved.default_model && !activeSessionId) setSelectedModel(saved.default_model);
  }, [loadSettings, loadModels, activeSessionId]);

  var pendingProposal = artifacts.find(function(a) {
    return a.status === 'pending_review' && a.phase === 'propose';
  });

  var sddActive = isSddActive(activeSession);
  var sddStatus = activeSession && activeSession.sdd_status;
  var phaseIndex = SDD_PHASES.findIndex(function(p) { return activeSession && p.key === activeSession.sdd_phase; });
  var canAdvance = !!(sddStatus && sddStatus.next_actions && sddStatus.next_actions.some(function(a) {
    if (a.action !== 'transition') return false;
    return SDD_PHASES.findIndex(function(p) { return p.key === a.target_phase; }) > phaseIndex;
  }));
  var needsSetup = !!settings && !settings.has_api_key;

  return (
    <div className="nc-app">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={function() { setShowModal(true); }}
        onOpenSettings={function() { openSettings(); }}
        settings={settings}
      />
      <div className="nc-main">
        <TopBar
          session={activeSession}
          models={models}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onArchive={handleArchiveSession}
          busy={sending}
        />
        {error && (
          <div className="nc-error-bar" role="alert">
            <span>{error}</span>
            <button className="nc-btn nc-btn--icon" onClick={function() { setError(null); }}
              aria-label="Dismiss error">
              {'✕'}
            </button>
          </div>
        )}
        <ChatArea
          messages={messages}
          artifacts={artifacts}
          loading={sending}
          onApproveArtifact={handleApproveArtifact}
          onRejectArtifact={handleRejectArtifact}
          needsSetup={needsSetup}
          onOpenSettings={function() { openSettings(); }}
        />
        <MessageInput
          onSend={handleSendMessage}
          disabled={sending}
          hasSession={!!activeSessionId}
          sddActive={sddActive}
          canAdvance={canAdvance}
          pendingProposalId={pendingProposal ? pendingProposal.sys_id : null}
          onApprove={handleApproveArtifact}
          onReject={handleRejectArtifact}
          placeholder={needsSetup
            ? 'Add your API key to start chatting...'
            : (activeSessionId ? 'Message Now Code... (Shift+Enter for a new line)' : undefined)}
        />
      </div>
      <NewSessionModal
        open={showModal}
        models={models}
        defaultModel={selectedModel}
        onClose={function() { setShowModal(false); }}
        onCreate={handleCreateSession}
      />
      <SettingsModal
        open={settingsModal.open}
        reason={settingsModal.reason}
        settings={settings}
        models={models}
        onClose={function() { setSettingsModal({ open: false, reason: null }); }}
        onSaved={handleSettingsSaved}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Mount
   ═══════════════════════════════════════════════════════════ */
ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
);
