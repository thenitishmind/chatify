import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import GroupCreate from './GroupCreate';
import ProfileSettings from './ProfileSettings';
import { useConversations } from '../../../hooks/useConversations';
import '../../../styles/chat.css';

const ChatLayout = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const { conversations, loading, createConversation, refetch } = useConversations();

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowMobileSidebar(false);
  };

  const handleStartChat = async (user) => {
    try {
      const conv = await createConversation(user.id);
      setActiveConversation(conv);
      setShowSearch(false);
      setShowMobileSidebar(false);
    } catch (err) { console.error('Start chat error:', err); }
  };

  const handleGroupCreated = (conv) => {
    setActiveConversation(conv);
    setShowGroup(false);
    setShowMobileSidebar(false);
    refetch();
  };

  return (
    <div className="chat-layout">
      <Sidebar conversations={conversations} loading={loading}
        activeId={activeConversation?.id} onSelect={handleSelectConversation}
        onNewChat={() => setShowSearch(true)} onNewGroup={() => setShowGroup(true)}
        onOpenProfile={() => setShowProfile(true)} className={showMobileSidebar ? '' : 'hidden'} />

      {activeConversation ? (
        <ChatWindow conversation={activeConversation} onBack={() => setShowMobileSidebar(true)} />
      ) : (
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <h3>Welcome to Chatify</h3>
          <p>Select a conversation or start a new chat</p>
        </div>
      )}

      {showSearch && <UserSearch onSelect={handleStartChat} onClose={() => setShowSearch(false)} />}
      {showGroup && <GroupCreate onClose={() => setShowGroup(false)} onCreated={handleGroupCreated} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default ChatLayout;
