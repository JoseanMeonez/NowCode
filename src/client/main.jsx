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
    throw new Error(errData.error ? errData.error.message : ('API Error ' + res.status));
  }
  if (res.status === 204) return null;
  var json = await res.json();
  return json.result !== undefined ? json.result : json;
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
function formatInline(text) {
  var parts = [];
  var remaining = text;
  var k = 0;
  while (remaining.length > 0) {
    var m;
    m = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    if (m) {
      if (m[1]) parts.push(React.createElement('span', { key: k++ }, m[1]));
      parts.push(React.createElement('code', { key: k++, className: 'nc-inline-code' }, m[2]));
      remaining = m[3];
      continue;
    }
    m = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/s);
    if (m) {
      if (m[1]) parts.push(React.createElement('span', { key: k++ }, m[1]));
      parts.push(React.createElement('strong', { key: k++ }, m[2]));
      remaining = m[3];
      continue;
    }
    m = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/s);
    if (m) {
      if (m[1]) parts.push(React.createElement('span', { key: k++ }, m[1]));
      parts.push(React.createElement('em', { key: k++ }, m[2]));
      remaining = m[3];
      continue;
    }
    parts.push(React.createElement('span', { key: k++ }, remaining));
    break;
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
          <span className={'nc-badge nc-badge--' + (artifact.status || 'draft')}>
            {artifact.status || 'draft'}
          </span>
          <span className="nc-artifact-chevron">{isExpanded ? '\u25BE' : '\u25B8'}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="nc-artifact-body">
          <pre className="nc-artifact-content">{artifact.content}</pre>
          {artifact.status === 'pending' && (
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
  var phase = (session.sdd_active === 'true' || session.sdd_active === true)
    ? getPhaseInfo(session.sdd_phase)
    : null;

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
        <span className="nc-session-time">{formatTime(session.sys_created_on)}</span>
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

  var today = new Date().toDateString();
  var todaySessions = sessions.filter(function(s) {
    return new Date(s.sys_created_on).toDateString() === today;
  });
  var earlierSessions = sessions.filter(function(s) {
    return new Date(s.sys_created_on).toDateString() !== today;
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
        {sessions.length === 0 && (
          <div className="nc-empty-state">
            No sessions yet. Click <strong>+ New</strong> to start a conversation.
          </div>
        )}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   Top Bar
   ═══════════════════════════════════════════════════════════ */
function TopBar(props) {
  var session = props.session;
  var models = props.models;
  var selectedModel = props.selectedModel;
  var onModelChange = props.onModelChange;
  var dropdownState = useState(false);
  var dropdownOpen = dropdownState[0];
  var setDropdownOpen = dropdownState[1];

  var phase = (session && (session.sdd_active === 'true' || session.sdd_active === true))
    ? getPhaseInfo(session.sdd_phase)
    : null;

  return (
    <header className="nc-topbar" role="banner">
      <div className="nc-topbar-left">
        <span className="nc-topbar-title">
          {session ? session.name : 'Select a session'}
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
        <div className="nc-model-selector">
          <button className="nc-btn nc-btn--model-select"
            onClick={function() { setDropdownOpen(!dropdownOpen); }}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox">
            {'\uD83E\uDD16'} {selectedModel || 'Select model'}
            <span className="nc-chevron">{'\u25BE'}</span>
          </button>
          {dropdownOpen && (
            <div className="nc-dropdown" role="listbox">
              {models.map(function(m) {
                var id = m.id || m.name;
                return (
                  <div key={id} role="option"
                    aria-selected={id === selectedModel}
                    className={'nc-dropdown-item' + (id === selectedModel ? ' nc-dropdown-item--selected' : '')}
                    onClick={function() {
                      onModelChange(id);
                      setDropdownOpen(false);
                    }}>
                    <span>{m.name || m.id}</span>
                    {m.provider && <span className="nc-dropdown-item-sub">{m.provider}</span>}
                  </div>
                );
              })}
              {models.length === 0 && (
                <div className="nc-dropdown-item nc-dropdown-item--empty">No models available</div>
              )}
            </div>
          )}
        </div>
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
  var phase = message.sdd_phase ? getPhaseInfo(message.sdd_phase) : null;

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
  var hasPendingProposal = props.hasPendingProposal;
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
      {(sddActive || hasPendingProposal) && (
        <div className="nc-quick-actions">
          {sddActive && (
            <button className="nc-btn nc-btn--quick"
              onClick={function() { onSend('Advance to next SDD phase', 'next_phase'); }}>
              {'\u23ED'} Next Phase
            </button>
          )}
          {!sddActive && (
            <button className="nc-btn nc-btn--quick"
              onClick={function() { onSend('Start SDD process', 'start_sdd'); }}>
              {'\uD83D\uDE80'} Start SDD
            </button>
          )}
          {hasPendingProposal && (
            <React.Fragment>
              <button className="nc-btn nc-btn--approve"
                onClick={function() { onSend('Approve proposal', 'approve_proposal'); }}>
                {'\u2713'} Approve
              </button>
              <button className="nc-btn nc-btn--reject"
                onClick={function() { onSend('Reject proposal', 'reject_proposal'); }}>
                {'\u2717'} Reject
              </button>
            </React.Fragment>
          )}
        </div>
      )}
      <div className="nc-input-row">
        <textarea ref={textareaRef} className="nc-textarea"
          placeholder="Ask anything... a session will be created automatically"
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
                var id = m.id || m.name;
                return <option key={id} value={id}>{m.name || m.id}</option>;
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

  var sendingState = useState(false);
  var sending = sendingState[0];
  var setSending = sendingState[1];

  var modalState = useState(false);
  var showModal = modalState[0];
  var setShowModal = modalState[1];

  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

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
    } catch (e) {
      console.error('Failed to load models:', e);
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
      var data = await apiCall('/sessions/' + sessionId + '/messages');
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

  /* ── Initial load ── */
  useEffect(function() {
    loadSessions();
    loadModels();
  }, [loadSessions, loadModels]);

  /* ── Session change ── */
  useEffect(function() {
    if (activeSessionId) {
      loadMessages(activeSessionId);
      loadArtifacts(activeSessionId);
      loadSessionDetails(activeSessionId);
    } else {
      setMessages([]);
      setArtifacts([]);
      setActiveSession(null);
    }
  }, [activeSessionId, loadMessages, loadArtifacts, loadSessionDetails]);

  /* ── Send message (auto-creates session if none active) ── */
  var handleSendMessage = useCallback(async function(content, sddCommand) {
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
        if (sessionId) {
          setActiveSessionId(sessionId);
          await loadSessions();
        }
      }

      if (!sessionId) {
        throw new Error('Could not create session');
      }

      var body = { content: content };
      if (sddCommand) body.sdd_command = sddCommand;
      await apiCall('/sessions/' + sessionId + '/messages', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      await loadMessages(sessionId);
      await loadArtifacts(sessionId);
      await loadSessionDetails(sessionId);
    } catch (e) {
      setError(e.message);
      setMessages(function(prev) {
        return prev.filter(function(m) { return m.sys_id !== tempId; });
      });
    } finally {
      setSending(false);
    }
  }, [activeSessionId, selectedModel, loadMessages, loadArtifacts, loadSessionDetails, loadSessions]);

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
      setError(e.message);
    }
  }, [loadSessions]);

  /* ── Artifact actions ── */
  var handleApproveArtifact = useCallback(async function(artifactId) {
    try {
      await apiCall('/sessions/' + activeSessionId + '/artifacts/' + artifactId + '/approve', {
        method: 'POST'
      });
      await loadArtifacts(activeSessionId);
    } catch (e) {
      setError(e.message);
    }
  }, [activeSessionId, loadArtifacts]);

  var handleRejectArtifact = useCallback(async function(artifactId) {
    try {
      await apiCall('/sessions/' + activeSessionId + '/artifacts/' + artifactId + '/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Rejected from UI' })
      });
      await loadArtifacts(activeSessionId);
    } catch (e) {
      setError(e.message);
    }
  }, [activeSessionId, loadArtifacts]);

  var hasPendingProposal = artifacts.some(function(a) {
    return a.status === 'pending' && a.phase === 'propose';
  });

  var isSddActive = activeSession
    && (activeSession.sdd_active === 'true' || activeSession.sdd_active === true);

  return (
    <div className="nc-app">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={function() { setShowModal(true); }}
      />
      <div className="nc-main">
        <TopBar
          session={activeSession}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        {error && (
          <div className="nc-error-bar" role="alert">
            <span>{error}</span>
            <button className="nc-btn nc-btn--icon" onClick={function() { setError(null); }}
              aria-label="Dismiss error">
              {'\u2715'}
            </button>
          </div>
        )}
        <ChatArea
          messages={messages}
          artifacts={artifacts}
          loading={sending}
          onApproveArtifact={handleApproveArtifact}
          onRejectArtifact={handleRejectArtifact}
        />
        <MessageInput
          onSend={handleSendMessage}
          disabled={sending}
          sddActive={isSddActive}
          hasPendingProposal={hasPendingProposal}
        />
      </div>
      <NewSessionModal
        open={showModal}
        models={models}
        onClose={function() { setShowModal(false); }}
        onCreate={handleCreateSession}
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
