import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logoutFirebase } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Sync profile with backend
          const res = await api.post('/auth/verify', {});
          setProfile(res.data.user);
          setIsNewUser(res.data.isNewUser);
        } catch (err) {
          console.error('Profile sync error:', err);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      setProfile(res.data.user);
      setIsNewUser(false);
      return res.data.user;
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    }
    await logoutFirebase();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    isNewUser,
    setIsNewUser,
    updateProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { useAuth, AuthProvider };
export default AuthProvider;
