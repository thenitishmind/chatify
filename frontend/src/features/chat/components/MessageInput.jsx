import { useState } from 'react';

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-area">
      <form className="message-input-wrapper" onSubmit={handleSubmit}>
        <input
          id="message-input"
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          className="send-btn"
          type="submit"
          disabled={!text.trim() || sending}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
