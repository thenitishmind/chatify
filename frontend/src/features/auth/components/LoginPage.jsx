import { useEffect, useRef } from 'react';
import { signInWithGoogle } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import ProfileSetup from './ProfileSetup';
import gsap from 'gsap';
import '../../../styles/auth.css';

const LoginPage = () => {
  const { isNewUser } = useAuth();
  const cardRef = useRef(null);
  const logoRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(cardRef.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.8 })
      .fromTo(logoRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4')
      .fromTo(btnRef.current, { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5 }, '-=0.2');
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in error:', err);
      }
    }
  };

  if (isNewUser) {
    return <ProfileSetup />;
  }

  return (
    <div className="auth-page split-layout">
      <div className="auth-hero">
        <div className="hero-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-icon">✨</div>
          <h1>Welcome to Chatify</h1>
          <p>Experience the next generation of communication with our uniquely designed interface and lightning-fast performance.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card" ref={cardRef}>
          <div className="auth-logo" ref={logoRef}>
            <div className="auth-logo-icon">💬</div>
            <h2>Sign In</h2>
            <p>Connect, Chat & Call — All in One Place</p>
          </div>

          <div className="auth-features">
            <div className="feature-pill">🔒 Secure</div>
            <div className="feature-pill">📹 Video Calls</div>
            <div className="feature-pill">👥 Groups</div>
          </div>

          <button ref={btnRef} className="google-btn" onClick={handleGoogleSignIn} id="google-signin-btn">
            <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="auth-footer">By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
