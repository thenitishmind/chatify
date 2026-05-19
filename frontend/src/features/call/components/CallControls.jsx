const CallControls = ({ onEnd, onToggleMute, onToggleCamera, isMuted, isCameraOff, showCamera }) => {
  return (
    <div className="call-controls">
      <button
        className={`call-control-btn mute ${isMuted ? 'active' : ''}`}
        onClick={onToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🎤'}
      </button>
      {showCamera && (
        <button
          className={`call-control-btn camera ${isCameraOff ? 'active' : ''}`}
          onClick={onToggleCamera}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? '📷' : '📹'}
        </button>
      )}
      <button className="call-control-btn end-call" onClick={onEnd} title="End Call">
        📵
      </button>
    </div>
  );
};

export default CallControls;
