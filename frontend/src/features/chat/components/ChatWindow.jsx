import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMessages } from '../../../hooks/useMessages';
import api from '../../../services/api';
import { useCall } from '../../../context/CallContext';
import MessageContextMenu from './MessageContextMenu';

const ChatWindow = ({ conversation, onBack }) => {
  const { profile } = useAuth();
  const { initiateCall } = useCall();
  const { messages, loading, sendMessage } = useMessages(conversation?.id);
  const [inputValue, setInputValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherUser = conversation?.other_user;
  const isGroup = conversation?.is_group;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !imageFile) || sending) return;
    setSending(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('media', imageFile);
        if (inputValue.trim()) formData.append('content', inputValue.trim());
        await api.post(`/messages/${conversation.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImageFile(null); setImagePreview(null);
      } else {
        await sendMessage(inputValue.trim());
      }
      setInputValue('');
    } catch (err) { console.error('Send error:', err); }
    finally { setSending(false); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  };

  const handleDelete = async (type) => {
    if (!contextMenu?.message) return;
    try {
      await api.delete(`/messages/${contextMenu.message.id}/${type}`);
    } catch (err) { console.error('Delete error:', err); }
    setContextMenu(null);
  };

  const emojiList = ['😀','😂','❤️','🔥','👍','😊','🎉','😎','😍','🤔','👋','💯','✨','🙏','💪','😢','😡','🥺','🤣','😘','🥰','😭','🙄','😤','🤯','🤗','😴','🤮','👀','💀','🫡','🫶'];

  const insertEmoji = (emoji) => {
    setInputValue(prev => prev + emoji);
    setShowEmoji(false);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn mobile-only" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              {(isGroup ? conversation.group_avatar : otherUser?.avatar_url) ? (
                <img src={isGroup ? conversation.group_avatar : otherUser.avatar_url} alt="" />
              ) : (
                <span>{isGroup ? conversation.group_name?.[0] : getInitials(otherUser?.display_name)}</span>
              )}
            </div>
            <div>
              <div className="chat-header-name">{isGroup ? conversation.group_name : (otherUser?.display_name || 'Unknown')}</div>
              <div className={`chat-header-status ${otherUser?.is_online ? '' : 'offline'}`}>
                {isGroup ? `${conversation.member_count || 0} members` : (otherUser?.is_online ? 'Online' : 'Offline')}
              </div>
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          {!isGroup && (
            <>
              <button className="chat-action-btn" title="Voice Call" onClick={() => initiateCall(otherUser, 'audio')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
              <button className="chat-action-btn" title="Video Call" onClick={() => initiateCall(otherUser, 'video')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {loading ? (
          <div className="messages-loading"><div className="typing-dots"><span/><span/><span/></div></div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <span className="messages-empty-icon">👋</span>
            <p>Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender_id === profile?.id;
            const isSystem = msg.message_type === 'system';
            const isDeleted = msg.deleted_for_everyone;

            if (isSystem) {
              return <div key={msg.id} className="system-message">{msg.content}</div>;
            }

            return (
              <div key={msg.id} className={`message-bubble ${isSent ? 'sent' : 'received'} ${isDeleted ? 'deleted' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}>
                {isDeleted ? (
                  <span className="deleted-text">🚫 This message was deleted</span>
                ) : (
                  <>
                    {msg.media_url && (
                      <div className="message-image">
                        <img src={msg.media_url} alt="" onClick={() => window.open(msg.media_url, '_blank')} />
                      </div>
                    )}
                    {msg.content && <div className="message-text">{msg.content}</div>}
                  </>
                )}
                <div className="message-meta">
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                  {isSent && !isDeleted && <span className="message-read">{msg.is_read ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="image-preview-bar">
          <img src={imagePreview} alt="Preview" />
          <button onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="emoji-picker">
          {emojiList.map(e => <button key={e} className="emoji-btn" onClick={() => insertEmoji(e)}>{e}</button>)}
        </div>
      )}

      {/* Input */}
      <div className="message-input-area">
        <form className="message-input-wrapper" onSubmit={handleSend}>
          <button type="button" className="input-icon-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😊</button>
          <button type="button" className="input-icon-btn" onClick={() => fileInputRef.current?.click()} title="Attach Image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <input type="text" placeholder="Type a message..." value={inputValue}
            onChange={(e) => setInputValue(e.target.value)} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} hidden />
          <button type="submit" className="send-btn" disabled={!inputValue.trim() && !imageFile}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>

      {contextMenu && (
        <MessageContextMenu x={contextMenu.x} y={contextMenu.y} message={contextMenu.message}
          isSent={contextMenu.message.sender_id === profile?.id}
          onDeleteForMe={() => handleDelete('for-me')}
          onDeleteForEveryone={() => handleDelete('for-everyone')}
          onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
};

export default ChatWindow;
