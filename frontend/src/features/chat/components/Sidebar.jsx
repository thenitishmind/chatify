import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCalls } from '../../../hooks/useCalls';
import StatusBar from './StatusBar';

const Sidebar = ({ conversations, loading, activeId, onSelect, onNewChat, onNewGroup, onOpenProfile, className }) => {
  const { profile, logout } = useAuth();
  const { calls, loading: loadingCalls } = useCalls();
  const [tab, setTab] = useState('chats'); // chats, calls
  const [searchTerm, setSearchTerm] = useState('');

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderAvatar = (user, size = 48, isGroup = false) => {
    const url = isGroup ? null : user?.avatar_url;
    return (
      <div className="conv-avatar" style={{ width: size, height: size, fontSize: size > 40 ? '1rem' : '0.8rem' }}>
        {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : <span>{isGroup ? '👥' : getInitials(user?.display_name)}</span>}
        {!isGroup && user?.is_online && <span className="online-dot" />}
      </div>
    );
  };

  const filtered = conversations.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (c.is_group) return c.group_name?.toLowerCase().includes(term);
    return c.other_user?.display_name?.toLowerCase().includes(term) || c.other_user?.username?.toLowerCase().includes(term);
  });

  return (
    <div className={`sidebar ${className || ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <h2>Chatify</h2>
        <div className="sidebar-actions">
          <button className="sidebar-icon-btn" onClick={onNewGroup} title="New Group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button className="sidebar-icon-btn" onClick={onNewChat} title="New Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search by name or @username..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button className={`tab-btn ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>💬 Chats</button>
        <button className={`tab-btn ${tab === 'calls' ? 'active' : ''}`} onClick={() => setTab('calls')}>📞 Calls</button>
      </div>

      {/* Conversations / Calls List */}
      <div className="conversation-list">
        {tab === 'chats' ? (
          loading ? (
            <div className="list-empty"><div className="typing-dots"><span/><span/><span/></div></div>
          ) : filtered.length === 0 ? (
            <div className="list-empty">
              <p className="list-empty-icon">🗨️</p>
              <p>No conversations yet</p>
              <p className="list-empty-hint">Tap + to start chatting</p>
            </div>
          ) : (
            filtered.map(conv => (
              <div key={conv.id} className={`conversation-item ${activeId === conv.id ? 'active' : ''}`} onClick={() => onSelect(conv)}>
                {renderAvatar(conv.is_group ? null : conv.other_user, 48, conv.is_group)}
                <div className="conv-info">
                  <div className="conv-name">
                    {conv.is_group ? conv.group_name : (conv.other_user?.display_name || 'Unknown')}
                    {conv.is_group && <span className="group-badge">Group</span>}
                  </div>
                  <div className="conv-last-msg">{conv.last_message || 'No messages yet'}</div>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{formatTime(conv.last_message_at)}</span>
                </div>
              </div>
            ))
          )
        ) : (
          loadingCalls ? (
            <div className="list-empty"><div className="typing-dots"><span/><span/><span/></div></div>
          ) : calls.length === 0 ? (
            <div className="list-empty">
              <p className="list-empty-icon">📞</p>
              <p>No call history</p>
            </div>
          ) : (
            calls.map(call => (
              <div key={call.id} className="conversation-item" onClick={() => onSelect({ other_user: call.other_user })}>
                {renderAvatar(call.other_user, 48, false)}
                <div className="conv-info">
                  <div className="conv-name">{call.other_user?.display_name || 'Unknown'}</div>
                  <div className="conv-last-msg" style={{ color: call.status === 'missed' ? 'var(--error)' : 'var(--text-muted)' }}>
                    {call.is_outgoing ? '↗' : '↙'} {call.call_type === 'video' ? 'Video' : 'Audio'} • {call.status}
                    {call.duration > 0 && ` • ${Math.floor(call.duration/60)}:${(call.duration%60).toString().padStart(2,'0')}`}
                  </div>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{formatTime(call.started_at)}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Profile Footer */}
      <div className="sidebar-profile">
        <div className="sidebar-profile-left" onClick={onOpenProfile}>
          {renderAvatar(profile, 40)}
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{profile?.display_name || 'You'}</div>
            <div className="sidebar-profile-username">@{profile?.username || 'username'}</div>
          </div>
        </div>
        <div className="sidebar-profile-actions">
          <button className="sidebar-icon-btn" onClick={onOpenProfile} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button className="logout-btn" onClick={logout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
