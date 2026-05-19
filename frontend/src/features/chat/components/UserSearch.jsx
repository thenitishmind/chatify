import { useState } from 'react';
import api from '../../../services/api';

const UserSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>New Chat</h3>
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="search-modal-input">
          <input type="text" placeholder="Search by @username or name..." value={query}
            onChange={e => handleSearch(e.target.value)} autoFocus />
        </div>
        <div className="search-results">
          {loading ? (
            <div className="list-empty"><div className="typing-dots"><span/><span/><span/></div></div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="list-empty"><p>No users found</p></div>
          ) : (
            results.map(user => (
              <div key={user.id} className="search-result-item" onClick={() => onSelect(user)}>
                <div className="conv-avatar" style={{ width: 44, height: 44 }}>
                  {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : <span>{getInitials(user.display_name)}</span>}
                  {user.is_online && <span className="online-dot" />}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{user.display_name}</div>
                  <div className="conv-last-msg">@{user.username || 'user'} • {user.status || ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
