import { useState } from 'react';
import api from '../../../services/api';

const GroupCreate = ({ onClose, onCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (q) => {
    setSearchTerm(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers(prev => prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user]);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Group name required'); return; }
    if (selectedUsers.length === 0) { setError('Add at least 1 member'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/conversations/group', {
        name: groupName.trim(), participant_ids: selectedUsers.map(u => u.id)
      });
      onCreated?.(res.data.conversation);
      onClose();
    } catch { setError('Failed to create group'); }
    finally { setLoading(false); }
  };

  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>Create Group</h3>
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="search-modal-input">
          <input type="text" placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={50} />
        </div>

        {selectedUsers.length > 0 && (
          <div className="selected-users-bar">
            {selectedUsers.map(u => (
              <div key={u.id} className="selected-chip" onClick={() => toggleUser(u)}>
                {u.display_name?.split(' ')[0]} ✕
              </div>
            ))}
          </div>
        )}

        <div className="search-modal-input">
          <input type="text" placeholder="Search users to add..." value={searchTerm} onChange={e => handleSearch(e.target.value)} />
        </div>

        {error && <div className="auth-error" style={{ margin: '0 16px' }}>{error}</div>}

        <div className="search-results">
          {searchResults.map(user => (
            <div key={user.id} className={`search-result-item ${selectedUsers.find(u => u.id === user.id) ? 'selected' : ''}`}
              onClick={() => toggleUser(user)}>
              <div className="conv-avatar" style={{ width: 40, height: 40 }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : <span>{getInitials(user.display_name)}</span>}
              </div>
              <div className="conv-info">
                <div className="conv-name">{user.display_name}</div>
                <div className="conv-last-msg">@{user.username || 'user'}</div>
              </div>
              <div className="check-circle">{selectedUsers.find(u => u.id === user.id) ? '✓' : ''}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          <button className={`auth-btn ${loading ? 'loading' : ''}`} onClick={handleCreate} disabled={loading}>
            Create Group ({selectedUsers.length} members)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCreate;
