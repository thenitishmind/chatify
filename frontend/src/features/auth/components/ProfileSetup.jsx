import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import gsap from 'gsap';
import '../../../styles/auth.css';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.photoURL || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current.children, { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' });
    }
  }, []);

  // Debounced username check
  const checkUsername = useCallback(async (val) => {
    if (val.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus('checking');
    try {
      const res = await api.get(`/auth/check-username/${val}`);
      setUsernameStatus(res.data.available ? 'available' : 'taken');
    } catch { setUsernameStatus(null); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (username) checkUsername(username); }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarPreview;
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.avatar_url;
    } catch { return avatarPreview; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Name is required'); return; }
    if (!username.trim() || username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameStatus === 'taken') { setError('Username is taken'); return; }

    setLoading(true); setError('');
    try {
      const avatarUrl = await uploadAvatar();
      await updateProfile({
        display_name: displayName.trim(), username: username.toLowerCase().trim(),
        bio: bio.trim(), avatar_url: avatarUrl || null,
        status: 'Hey, I am using Chatify!'
      });
      navigate('/chat', { replace: true });
    } catch { setError('Failed to save. Please try again.'); }
    finally { setLoading(false); }
  };

  const statusOptions = ['👋 Hey there!', '📚 Busy studying', '🎮 Gaming', '🎵 Listening to music', '💼 At work', '😴 Sleeping', '🏋️ Working out'];

  return (
    <div className="auth-page">
      <div className="auth-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>
      <div className="auth-card setup-card">
        <div className="auth-logo">
          <h1>Chatify</h1>
          <p>Complete your profile</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} ref={formRef}>
          <div className="profile-setup-avatar" onClick={() => fileInputRef.current?.click()}>
            <div className="avatar-upload-circle">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <span>📷</span>}
              <div className="avatar-badge">✏️</div>
            </div>
            <span className="avatar-hint">Tap to add photo</span>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <div className="auth-input-group">
            <label>Display Name</label>
            <input className="auth-input" type="text" placeholder="Your name" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} maxLength={50} autoFocus />
          </div>

          <div className="auth-input-group">
            <label>Username</label>
            <div className="username-input-wrapper">
              <span className="username-prefix">@</span>
              <input className="auth-input username-input" type="text" placeholder="choose_username"
                value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} maxLength={30} />
              {usernameStatus && (
                <span className={`username-status ${usernameStatus}`}>
                  {usernameStatus === 'checking' ? '⏳' : usernameStatus === 'available' ? '✅' : '❌'}
                </span>
              )}
            </div>
          </div>

          <div className="auth-input-group">
            <label>Bio</label>
            <input className="auth-input" type="text" placeholder="Tell us about yourself" value={bio}
              onChange={(e) => setBio(e.target.value)} maxLength={100} />
          </div>

          <div className="bio-suggestions">
            {statusOptions.map(s => (
              <button type="button" key={s} className="bio-pill" onClick={() => setBio(s)}>{s}</button>
            ))}
          </div>

          <button type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading || usernameStatus === 'taken'}>
            Get Started 🚀
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
