import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import LoginPage from './features/auth/components/LoginPage';
import ProfileSetup from './features/auth/components/ProfileSetup';
import ChatLayout from './features/chat/components/ChatLayout';
import CallScreen from './features/call/components/CallScreen';
import IncomingCallModal from './features/call/components/IncomingCallModal';
import './styles/index.css';
import './styles/auth.css';
import './styles/chat.css';
import './styles/call.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isNewUser } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
        <div className="loader-text">Loading Chatify...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isNewUser && window.location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading, isNewUser } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
        <div className="loader-text">Loading Chatify...</div>
      </div>
    );
  }

  if (user && !isNewUser) return <Navigate to="/chat" replace />;
  if (user) return <Navigate to="/profile-setup" replace />;
  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <AuthRoute><LoginPage /></AuthRoute>
        } />
        <Route path="/profile-setup" element={
          <ProtectedRoute><ProfileSetup /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <CallProvider>
              <ChatLayout />
              <CallScreen />
              <IncomingCallModal />
            </CallProvider>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
