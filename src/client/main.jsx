import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */
var API = '/api/x_1733631_now_code/now_code_api';

/* Phase colors read from CSS custom properties so each theme (light/dark)
   supplies its own AA-safe value — see --nc-phase-* in styles.css. */
var SDD_PHASES = [
  { key: 'init', label: 'Initialize', color: 'var(--nc-phase-init)' },
  { key: 'explore', label: 'Explore', color: 'var(--nc-phase-explore)' },
  { key: 'propose', label: 'Propose', color: 'var(--nc-phase-propose)' },
  { key: 'spec', label: 'Specification', color: 'var(--nc-phase-spec)' },
  { key: 'design', label: 'Design', color: 'var(--nc-phase-design)' },
  { key: 'tasks', label: 'Tasks', color: 'var(--nc-phase-tasks)' },
  { key: 'apply', label: 'Apply', color: 'var(--nc-phase-apply)' },
  { key: 'verify', label: 'Verify', color: 'var(--nc-phase-verify)' },
  { key: 'archive', label: 'Archive', color: 'var(--nc-phase-archive)' },
  { key: 'onboard', label: 'Onboard', color: 'var(--nc-phase-onboard)' }
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
  return found || { key: key, label: key || 'None', color: 'var(--nc-phase-init)' };
}

/* Tinted background for a phase badge/pill, theme-safe (avoids string-
   concatenating an alpha suffix onto a var() reference). */
function phaseTint(color, pct) {
  return 'color-mix(in oklab, ' + color + ' ' + (pct || 13) + '%, transparent)';
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

/* Turns a raw identifier ("context_snapshot") or tag ("javascript") into a
   sentence-case display label ("Context snapshot" / "Javascript"). */
function toSentenceCase(raw) {
  if (!raw) return '';
  var s = String(raw).replace(/[_-]+/g, ' ').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* ═══════════════════════════════════════════════════════════
   Icon helper — inline SVG only (no icon library, CSP-safe)
   ═══════════════════════════════════════════════════════════ */
var ICON_PATHS = {
  plus: 'M12 4v16M4 12h16',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  skipForward: 'M5 4l10 8-10 8V4zM19 5v14',
  flag: 'M4 3v18M4 4h13l-2.5 4L17 12H4',
  cpu: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M7 6h10a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1zM10 10h4v4h-4z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  search: 'M19 11a8 8 0 11-8-8 8 8 0 018 8zM21 21l-4.35-4.35',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 108.5 10.5z'
};

function Icon(props) {
  var name = props.name;
  var size = props.size || 16;
  var d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
      style={props.style}
    >
      <path d={d} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Simple Markdown Renderer
   ═══════════════════════════════════════════════════════════ */
function formatInline(text) {
  var parts = [];
  var k = 0;
  var remaining = text;
  while (remaining.length > 0) {
    var codeMatch = /`([^`]+)`/.exec(remaining);
    var boldMatch = /\*\*([^*]+)\*\*/.exec(remaining);
    var italicMatch = /\*([^*]+)\*/.exec(remaining);

    var candidates = [];
    if (codeMatch) candidates.push({ type: 'code', match: codeMatch, index: codeMatch.index });
    if (boldMatch) candidates.push({ type: 'bold', match: boldMatch, index: boldMatch.index });
    if (italicMatch) candidates.push({ type: 'italic', match: italicMatch, index: italicMatch.index });

    if (candidates.length === 0) {
      parts.push(React.createElement('span', { key: k++ }, remaining));
      break;
    }

    /* Earliest match wins; bold wins over italic at the same start index. */
    candidates.sort(function(a, b) {
      if (a.index !== b.index) return a.index - b.index;
      if (a.type === 'bold') return -1;
      if (b.type === 'bold') return 1;
      return 0;
    });

    var winner = candidates[0];
    var before = remaining.slice(0, winner.index);
    if (before) parts.push(React.createElement('span', { key: k++ }, before));

    if (winner.type === 'code') {
      parts.push(React.createElement('code', { key: k++, className: 'nc-inline-code' }, winner.match[1]));
    } else if (winner.type === 'bold') {
      parts.push(React.createElement('strong', { key: k++ }, winner.match[1]));
    } else {
      parts.push(React.createElement('em', { key: k++ }, winner.match[1]));
    }

    remaining = remaining.slice(winner.index + winner.match[0].length);
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
          lang ? React.createElement('div', { className: 'nc-code-lang' }, toSentenceCase(lang)) : null,
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
  var activeIndex = SDD_PHASES.findIndex(function(p) { return p.key === currentPhase; });
  var activePhase = activeIndex >= 0 ? SDD_PHASES[activeIndex] : null;
  var trackLabel = activePhase
    ? 'SDD phase ' + (activeIndex + 1) + ' of ' + SDD_PHASES.length + ': ' + activePhase.label
    : 'SDD phase';
  return (
    <div className="nc-phase-dots" role="img" aria-label={trackLabel}>
      {SDD_PHASES.map(function(phase) {
        var isActive = phase.key === currentPhase;
        return (
          <span
            key={phase.key}
            className={'nc-phase-dot' + (isActive ? ' nc-phase-dot--active' : '')}
            style={isActive ? { backgroundColor: phase.color, color: phase.color } : undefined}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SDD Artifact Card
   ═══════════════════════════════════════════════════════════ */
function artifactStatusIcon(status) {
  if (status === 'approved') return 'check';
  if (status === 'rejected') return 'x';
  if (status === 'pending') return 'alert';
  return null;
}

function SDDArtifactCard(props) {
  var artifact = props.artifact;
  var onApprove = props.onApprove;
  var onReject = props.onReject;
  var expanded = useState(false);
  var isExpanded = expanded[0];
  var setExpanded = expanded[1];
  var phase = getPhaseInfo(artifact.phase);
  var status = artifact.status || 'draft';
  var statusIconName = artifactStatusIcon(status);

  return (
    <div className="nc-artifact-card" style={{ borderLeftColor: phase.color }}>
      <div className="nc-artifact-header" role="button" tabIndex={0}
        aria-expanded={isExpanded}
        onClick={function() { setExpanded(!isExpanded); }}
        onKeyDown={function(e) { if (e.key === 'Enter') setExpanded(!isExpanded); }}>
        <div className="nc-artifact-info">
          <span className="nc-artifact-title">{artifact.title}</span>
          <span className="nc-artifact-type">{toSentenceCase(artifact.artifact_type)}</span>
        </div>
        <div className="nc-artifact-meta">
          <span className="nc-badge" style={{ backgroundColor: phaseTint(phase.color), color: phase.color }}>
            {phase.label}
          </span>
          <span className={'nc-badge nc-badge--' + status}>
            {statusIconName && <Icon name={statusIconName} size={12} />}
            {toSentenceCase(status)}
          </span>
          <span className={'nc-artifact-chevron' + (isExpanded ? ' nc-artifact-chevron--open' : '')}>
            <Icon name="chevronRight" size={14} />
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="nc-artifact-body">
          <pre className="nc-artifact-content">{artifact.content}</pre>
          {artifact.status === 'pending' && (
            <div className="nc-artifact-actions">
              <button className="nc-btn nc-btn--approve"
                onClick={function() { onApprove(artifact.sys_id); }}>
                <Icon name="check" size={14} /> <span>Approve</span>
              </button>
              <button className="nc-btn nc-btn--reject"
                onClick={function() { onReject(artifact.sys_id); }}>
                <Icon name="x" size={14} /> <span>Reject</span>
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
          <span className="nc-badge" style={{ backgroundColor: phaseTint(phase.color), color: phase.color }}>
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
  var open = props.open;
  var onClose = props.onClose;
  var sidebarVisible = props.sidebarVisible;
  var onToggleSidebar = props.onToggleSidebar;

  var today = new Date().toDateString();
  var todaySessions = sessions.filter(function(s) {
    return new Date(s.sys_created_on).toDateString() === today;
  });
  var earlierSessions = sessions.filter(function(s) {
    return new Date(s.sys_created_on).toDateString() !== today;
  });

  var handleSelect = function(id) {
    onSelectSession(id);
    if (onClose) onClose();
  };

  return (
    <React.Fragment>
      {open && <div className="nc-scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={'nc-sidebar' + (open ? ' nc-sidebar--open' : '') + (props.collapsed ? ' nc-sidebar--collapsed' : '')}
        role="navigation" aria-label="Sessions"
        aria-hidden={props.hidden ? 'true' : undefined}
        inert={props.hidden ? '' : undefined}>
        <div className="nc-sidebar-header">
          <div className="nc-logo">
            <span className="nc-logo-icon" aria-hidden="true">{'\u27E8/\u27E9'}</span>
            <span className="nc-logo-text">Now Code</span>
          </div>
          <button className="nc-btn nc-btn--icon nc-menu-btn" onClick={onToggleSidebar}
            aria-label={sidebarVisible ? 'Hide sessions' : 'Show sessions'} aria-expanded={!!sidebarVisible}>
            <Icon name="menu" size={18} />
          </button>
        </div>
        <div className="nc-sidebar-sessions">
          <div className="nc-sessions-toolbar">
            <span className="nc-sessions-label">Sessions</span>
            <button className="nc-btn nc-btn--plus-ghost" onClick={onNewSession}
              aria-label="New session">
              <Icon name="plus" size={14} />
            </button>
          </div>
          {todaySessions.length > 0 && (
            <div className="nc-session-group">
              <div className="nc-session-group-label">Today</div>
              {todaySessions.map(function(s) {
                return (
                  <SessionItem key={s.sys_id} session={s}
                    active={s.sys_id === activeSessionId}
                    onClick={function() { handleSelect(s.sys_id); }} />
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
                    onClick={function() { handleSelect(s.sys_id); }} />
                );
              })}
            </div>
          )}
          {sessions.length === 0 && (
            <div className="nc-empty-state">
              No sessions yet. Click <strong>New</strong> to start a conversation.
            </div>
          )}
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ═══════════════════════════════════════════════════════════
   Top Bar
   ═══════════════════════════════════════════════════════════ */
function TopBar(props) {
  var session = props.session;
  var sidebarVisible = props.sidebarVisible;
  var onToggleSidebar = props.onToggleSidebar;
  var theme = props.theme;
  var onToggleTheme = props.onToggleTheme;

  var phase = (session && (session.sdd_active === 'true' || session.sdd_active === true))
    ? getPhaseInfo(session.sdd_phase)
    : null;

  return (
    <header className="nc-topbar" role="banner">
      <div className="nc-topbar-left">
        {!sidebarVisible && (
          <button className="nc-btn nc-btn--icon nc-menu-btn" onClick={onToggleSidebar}
            aria-label="Show sessions" aria-expanded={false}>
            <Icon name="menu" size={18} />
          </button>
        )}
        {session && (
          <React.Fragment>
            <span className="nc-topbar-title">{session.name}</span>
            {session.context_scope && (
              <span className="nc-badge nc-badge--scope">{session.context_scope}</span>
            )}
            {phase && (
              <div className="nc-topbar-sdd">
                <span className="nc-badge" style={{ backgroundColor: phaseTint(phase.color), color: phase.color }}>
                  SDD: {phase.label}
                </span>
                <SDDPhaseDots currentPhase={session.sdd_phase} />
              </div>
            )}
          </React.Fragment>
        )}
      </div>
      <div className="nc-topbar-right">
        <button className="nc-btn nc-btn--icon nc-btn--theme"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
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
      <span className="nc-sr-only">{isUser ? 'You said' : 'Now Code replied'}</span>
      <div className="nc-message-body">
        {phase && (
          <span className="nc-badge nc-badge--sm nc-message-phase"
            style={{ backgroundColor: phaseTint(phase.color), color: phase.color }}>
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
          <ul className="nc-welcome-hints">
            <li className="nc-hint"><Icon name="message" size={16} /><span>Chat about code and architecture</span></li>
            <li className="nc-hint"><Icon name="layers" size={16} /><span>Use SDD for structured development</span></li>
            <li className="nc-hint"><Icon name="search" size={16} /><span>Explore platform tables and schemas</span></li>
          </ul>
        </div>
      )}
      {messages.map(function(msg, idx) {
        return <ChatMessage key={msg.sys_id || idx} message={msg} />;
      })}
      {artifacts.length > 0 && (
        <div className="nc-artifacts-section">
          <div className="nc-artifacts-label">SDD artifacts</div>
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
          <span className="nc-sr-only">Now Code is replying</span>
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
  var models = props.models;
  var selectedModel = props.selectedModel;
  var onModelChange = props.onModelChange;
  var valueState = useState('');
  var value = valueState[0];
  var setValue = valueState[1];
  var textareaRef = useRef(null);
  var dropdownState = useState(false);
  var dropdownOpen = dropdownState[0];
  var setDropdownOpen = dropdownState[1];
  var selectorRef = useRef(null);

  useEffect(function() {
    if (!dropdownOpen) return undefined;
    function handleOutside(e) {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return function() {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [dropdownOpen]);

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
              <Icon name="skipForward" size={14} /> <span>Next phase</span>
            </button>
          )}
          {!sddActive && (
            <button className="nc-btn nc-btn--quick"
              onClick={function() { onSend('Start SDD process', 'start_sdd'); }}>
              <Icon name="flag" size={14} /> <span>Start SDD</span>
            </button>
          )}
          {hasPendingProposal && (
            <React.Fragment>
              <button className="nc-btn nc-btn--approve"
                onClick={function() { onSend('Approve proposal', 'approve_proposal'); }}>
                <Icon name="check" size={14} /> <span>Approve</span>
              </button>
              <button className="nc-btn nc-btn--reject"
                onClick={function() { onSend('Reject proposal', 'reject_proposal'); }}>
                <Icon name="x" size={14} /> <span>Reject</span>
              </button>
            </React.Fragment>
          )}
        </div>
      )}
      <div className="nc-composer-shell">
        <textarea ref={textareaRef} className="nc-textarea"
          placeholder="Ask anything..."
          value={value} onChange={handleInput} onKeyDown={handleKeyDown}
          onKeyUp={function(e) { e.stopPropagation(); }}
          onKeyPress={function(e) { e.stopPropagation(); }}
          onFocus={function(e) { e.stopPropagation(); }}
          disabled={disabled} rows={1}
          aria-label="Message input" />
        <div className="nc-composer-toolbar">
          <div className="nc-model-selector" ref={selectorRef}>
            <button className="nc-btn nc-btn--model-chip"
              onClick={function() { setDropdownOpen(!dropdownOpen); }}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox">
              <Icon name="cpu" size={14} />
              <span>{selectedModel || 'Select model'}</span>
              <Icon name="chevronDown" size={14} className={'nc-chevron' + (dropdownOpen ? ' nc-chevron--open' : '')} />
            </button>
            {dropdownOpen && (
              <div className="nc-dropdown nc-dropdown--up" role="listbox">
                {models.map(function(m) {
                  var id = m.id || m.name;
                  var isSelected = id === selectedModel;
                  return (
                    <div key={id} role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={'nc-dropdown-item' + (isSelected ? ' nc-dropdown-item--selected' : '')}
                      onClick={function() {
                        onModelChange(id);
                        setDropdownOpen(false);
                      }}>
                      <span className="nc-dropdown-item-main">
                        <span>{m.name || m.id}</span>
                        {m.provider && <span className="nc-dropdown-item-sub">{m.provider}</span>}
                      </span>
                      {isSelected && <Icon name="check" size={14} />}
                    </div>
                  );
                })}
                {models.length === 0 && (
                  <div className="nc-dropdown-item nc-dropdown-item--empty">No models available</div>
                )}
              </div>
            )}
          </div>
          <button className="nc-btn nc-btn--send" onClick={handleSend}
            disabled={disabled || !value.trim()} aria-label="Send message">
            <Icon name="arrowUp" size={18} />
          </button>
        </div>
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
      aria-modal="true" aria-label="New session">
      <div className="nc-modal" onClick={function(e) { e.stopPropagation(); }}>
        <div className="nc-modal-header">
          <span>New session</span>
          <button className="nc-btn nc-btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="nc-modal-body">
          <div className="nc-form-group">
            <label className="nc-label" htmlFor="nc-session-name">Session name</label>
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
            <label className="nc-label" htmlFor="nc-scope-input">Context scope (optional)</label>
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
            Create session
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

  var sidebarState = useState(false);
  var sidebarOpen = sidebarState[0];
  var setSidebarOpen = sidebarState[1];

  /* Desktop collapses the docked sidebar; mobile (≤860px, matches CSS) toggles the off-canvas sheet. */
  var collapsedState = useState(false);
  var sidebarCollapsed = collapsedState[0];
  var setSidebarCollapsed = collapsedState[1];
  var mobileState = useState(function() {
    return window.matchMedia('(max-width: 860px)').matches;
  });
  var isMobile = mobileState[0];
  var setIsMobile = mobileState[1];

  useEffect(function() {
    var mq = window.matchMedia('(max-width: 860px)');
    function handleChange(e) { setIsMobile(e.matches); }
    mq.addEventListener('change', handleChange);
    return function() { mq.removeEventListener('change', handleChange); };
  }, []);

  var sidebarVisible = isMobile ? sidebarOpen : !sidebarCollapsed;
  var toggleSidebar = function() {
    if (isMobile) {
      setSidebarOpen(function(v) { return !v; });
    } else {
      setSidebarCollapsed(function(v) { return !v; });
    }
  };

  var themeState = useState(function() {
    try {
      var saved = window.localStorage.getItem('nc-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* ignore */ }
    return null;
  });
  var theme = themeState[0];
  var setTheme = themeState[1];

  useEffect(function() {
    var root = document.documentElement;
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  var toggleTheme = useCallback(function() {
    setTheme(function(current) {
      var isDark = current === 'dark' || (!current && window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = isDark ? 'light' : 'dark';
      try { window.localStorage.setItem('nc-theme', next); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  var effectiveTheme = theme || (
    (typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
  );

  /* ── Close mobile sidebar sheet on Escape ── */
  useEffect(function() {
    if (!sidebarOpen) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return function() {
      document.removeEventListener('keydown', handleKey);
    };
  }, [sidebarOpen]);

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

  var phaseColor = isSddActive ? getPhaseInfo(activeSession.sdd_phase).color : 'var(--nc-accent)';

  return (
    <div className="nc-app" style={{ '--nc-phase': phaseColor }}>
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={function() { setShowModal(true); }}
        open={sidebarOpen}
        onClose={function() { setSidebarOpen(false); }}
        collapsed={sidebarCollapsed}
        hidden={!sidebarVisible}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={toggleSidebar}
      />
      <div className="nc-main">
        <TopBar
          session={activeSession}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={toggleSidebar}
          theme={effectiveTheme}
          onToggleTheme={toggleTheme}
        />
        {error && (
          <div className="nc-error-bar" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
            <button className="nc-btn nc-btn--icon" onClick={function() { setError(null); }}
              aria-label="Dismiss error">
              <Icon name="x" size={14} />
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
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
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
