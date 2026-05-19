import { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const ProfileSettings = ({ onClose }) => {
  const { profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState(profile?.status || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg({ type: 'error', text: 'Max 2MB' }); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setMsg({ type: 'error', text: 'Name required' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const res = await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatarUrl = res.data.avatar_url;
      }
      await updateProfile({ display_name: displayName.trim(), username, bio: bio.trim(), status: status.trim(), avatar_url: avatarUrl });
      setMsg({ type: 'success', text: 'Profile updated!' });
      setAvatarFile(null);
      setTimeout(() => setMsg({ type: '', text: '' }), 2000);
    } catch (err) { setMsg({ type: 'error', text: err.message || 'Failed to update' }); }
    finally { setLoading(false); }
  };

  const statusOptions = ['👋 Available', '📚 Busy', '🎮 Gaming', '🎵 Music', '💼 Working', '😴 Sleeping', '🏋️ Gym', '🎬 Watching'];

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal profile-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>Edit Profile</h3>
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          {msg.text && <div className={msg.type === 'error' ? 'auth-error' : 'profile-success'}>{msg.text}</div>}

          <div className="profile-avatar-section" onClick={() => fileRef.current?.click()}>
            <div className="profile-avatar-large">
              {avatarPreview ? <img src={avatarPreview} alt="" /> : <span>{displayName?.[0]?.toUpperCase() || '?'}</span>}
              <div className="avatar-edit-overlay">📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <div className="profile-field">
            <label>Name</label>
            <input className="auth-input" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} />
          </div>

          <div className="profile-field">
            <label>Username</label>
            <input className="auth-input" type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} maxLength={30} />
          </div>

          <div className="profile-field">
            <label>Bio</label>
            <input className="auth-input" type="text" value={bio} onChange={e => setBio(e.target.value)} placeholder="About you" maxLength={100} />
          </div>

          <div className="profile-field">
            <label>Status</label>
            <input className="auth-input" type="text" value={status} onChange={e => setStatus(e.target.value)} placeholder="What are you up to?" maxLength={100} />
            <div className="bio-suggestions compact">
              {statusOptions.map(s => <button type="button" key={s} className="bio-pill" onClick={() => setStatus(s)}>{s}</button>)}
            </div>
          </div>

          <div className="profile-field">
            <label>Email</label>
            <div className="profile-readonly">{profile?.email || 'Not set'}</div>
          </div>

          <div className="profile-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
