import { useEffect, useState, useRef } from 'react';
import { useCall } from '../../../context/CallContext';
import CallControls from './CallControls';
import '../../../styles/call.css';

const CallScreen = () => {
  const { callState, callType, remoteUser, localStream, remoteStream, localVideoRef, remoteVideoRef, endCall, toggleMute, toggleCamera, isMuted, isCameraOff } = useCall();
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream.current) {
      remoteVideoRef.current.srcObject = remoteStream.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  if (callState === 'idle') return null;

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const statusText = {
    calling: 'Calling...',
    ringing: 'Ringing...',
    connected: formatDuration(duration),
    ended: 'Call Ended'
  };

  if (callType === 'video' && callState === 'connected') {
    return (
      <div className="video-container">
        <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
        <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />
        <div className="video-call-controls">
          <CallControls onEnd={endCall} onToggleMute={toggleMute} onToggleCamera={toggleCamera} isMuted={isMuted} isCameraOff={isCameraOff} showCamera={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="call-screen">
      <div className="call-bg-gradient" />
      <div className="call-content">
        <div className={`call-avatar ${callState === 'connected' ? 'connected' : ''}`}>
          {getInitials(remoteUser?.display_name)}
        </div>
        <div className="call-user-name">{remoteUser?.display_name || 'Unknown'}</div>
        <div className={`call-status ${callState}`}>{statusText[callState]}</div>
        {callState === 'connected' && <div className="call-timer">{formatDuration(duration)}</div>}
        <CallControls onEnd={endCall} onToggleMute={toggleMute} onToggleCamera={toggleCamera} isMuted={isMuted} isCameraOff={isCameraOff} showCamera={callType === 'video'} />
      </div>
    </div>
  );
};

export default CallScreen;
