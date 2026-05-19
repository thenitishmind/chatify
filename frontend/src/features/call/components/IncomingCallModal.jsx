import { useCall } from '../../../context/CallContext';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import '../../../styles/call.css';

const IncomingCallModal = () => {
  const { incomingCall, callState, acceptCall, rejectCall } = useCall();
  const [callerName, setCallerName] = useState('Unknown');

  useEffect(() => {
    if (incomingCall?.callerId) {
      api.get(`/users/${incomingCall.callerId}`)
        .then(res => setCallerName(res.data.user?.display_name || 'Unknown'))
        .catch(() => setCallerName('Unknown'));
    }
  }, [incomingCall?.callerId]);

  if (callState !== 'ringing' || !incomingCall) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        <div className="call-avatar">
          {getInitials(callerName)}
        </div>
        <h3>{callerName}</h3>
        <p>Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call...</p>
        <div className="incoming-call-actions">
          <button className="call-reject-btn" onClick={rejectCall} title="Reject">
            ✕
          </button>
          <button className="call-accept-btn" onClick={acceptCall} title="Accept">
            📞
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
