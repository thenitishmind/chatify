import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const StatusBar = () => {
  const { profile } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [viewingStatus, setViewingStatus] = useState(null);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/status');
        setStatuses(res.data.statuses || []);
      } catch (err) {
        console.error('Fetch status error:', err);
      }
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddStatus = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const caption = prompt('Add a caption (optional):') || '';
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      await api.post('/status', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get('/status');
      setStatuses(res.data.statuses || []);
    } catch (err) { console.error('Status upload error:', err); }
  };

  const openViewer = (statusGroup, idx = 0) => {
    setViewingStatus(statusGroup);
    setViewIndex(idx);
  };

  useEffect(() => {
    if (!viewingStatus) return;
    const timer = setTimeout(() => {
      if (viewIndex < viewingStatus.stories.length - 1) {
        setViewIndex(prev => prev + 1);
      } else { setViewingStatus(null); setViewIndex(0); }
    }, 5000);
    return () => clearTimeout(timer);
  }, [viewingStatus, viewIndex]);

  const hasMyStatus = statuses.find(s => s.user?.id === profile?.id);

  return (
    <>
      <div className="status-bar">
        {/* My status */}
        <div className="status-item" onClick={() => hasMyStatus ? openViewer(hasMyStatus) : document.getElementById('status-upload')?.click()}>
          <div className={`status-ring ${hasMyStatus ? 'has-story' : 'no-story'}`}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{profile?.display_name?.[0] || '+'}</span>}
            {!hasMyStatus && <div className="status-add-badge">+</div>}
          </div>
          <span className="status-name">My Status</span>
        </div>

        {statuses.filter(s => s.user?.id !== profile?.id).map((sg) => (
          <div key={sg.user.id} className="status-item" onClick={() => openViewer(sg)}>
            <div className="status-ring has-story">
              {sg.user.avatar_url ? <img src={sg.user.avatar_url} alt="" /> : <span>{sg.user.display_name?.[0]}</span>}
            </div>
            <span className="status-name">{sg.user.display_name?.split(' ')[0]}</span>
          </div>
        ))}

        <input id="status-upload" type="file" accept="image/*" onChange={handleAddStatus} hidden />
      </div>

      {/* Status Viewer */}
      {viewingStatus && (
        <div className="status-viewer" onClick={() => { setViewingStatus(null); setViewIndex(0); }}>
          <div className="status-viewer-inner" onClick={e => e.stopPropagation()}>
            <div className="status-progress-bar">
              {viewingStatus.stories.map((_, i) => (
                <div key={i} className={`progress-segment ${i < viewIndex ? 'done' : i === viewIndex ? 'active' : ''}`} />
              ))}
            </div>
            <div className="status-viewer-header">
              <div className="status-viewer-user">
                {viewingStatus.user.avatar_url ? <img src={viewingStatus.user.avatar_url} alt="" /> : <span>{viewingStatus.user.display_name?.[0]}</span>}
                <div>
                  <div className="status-viewer-name">{viewingStatus.user.display_name}</div>
                  <div className="status-viewer-time">{new Date(viewingStatus.stories[viewIndex]?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <button className="status-close" onClick={() => { setViewingStatus(null); setViewIndex(0); }}>✕</button>
            </div>
            <img className="status-viewer-image" src={viewingStatus.stories[viewIndex]?.media_url} alt="" />
            {viewingStatus.stories[viewIndex]?.caption && (
              <div className="status-caption">{viewingStatus.stories[viewIndex].caption}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StatusBar;
