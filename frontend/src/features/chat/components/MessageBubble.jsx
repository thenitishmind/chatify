const MessageBubble = ({ message, isSent }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-time">
        {formatTime(message.created_at)}
        {isSent && (
          <span className="message-read" style={{ marginLeft: '4px' }}>
            {message.is_read ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
