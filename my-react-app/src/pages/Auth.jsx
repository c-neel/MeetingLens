import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Info, UserPlus } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Social login modal state
  const [socialModal, setSocialModal] = useState(null); // 'google' | 'github' | null
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (isRegister) {
      if (!name || !confirmPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreeTerms) {
        setError('You must agree to the Terms and Conditions.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isRegister 
        ? 'http://localhost:8000/api/users/register.php' 
        : 'http://localhost:8000/api/users/login.php';
        
      const payload = isRegister 
        ? { name, email, password } 
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Store logged-in user in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/analyze');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider, customEmail = null, customName = null) => {
    setIsLoading(true);
    setError('');
    
    const emailToUse = customEmail || (provider === 'google' ? 'contractorneel7@gmail.com' : 'contractorneel7@github.com');
    const nameToUse = customName || (provider === 'google' ? 'Google User (Neel Contractor)' : 'GitHub User (Neel)');

    try {
      const response = await fetch('http://localhost:8000/api/users/social-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: emailToUse,
          name: nameToUse
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to sign in with ${provider}`);
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setSocialModal(null);
      navigate('/analyze');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openSocialModal = (provider) => {
    setSocialModal(provider);
    setSocialEmail(provider === 'google' ? 'contractorneel7@gmail.com' : 'contractorneel7@github.com');
    setSocialName(provider === 'google' ? 'Neel Contractor' : 'Neel Contractor');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9ff', color: '#0b1c30', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Social Login Modal */}
      {socialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '420px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {socialModal === 'google' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
              )}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                  Sign in with {socialModal === 'google' ? 'Google' : 'GitHub'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Choose or enter your account details
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={socialName} 
                  onChange={(e) => setSocialName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={socialEmail} 
                  onChange={(e) => setSocialEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setSocialModal(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isLoading}
                onClick={() => handleSocialLogin(socialModal, socialEmail, socialName)}
                style={{ padding: '8px 16px', background: socialModal === 'google' ? '#2563eb' : '#0f172a', border: 'none', borderRadius: '0.375rem', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#ffffff' }}
              >
                {isLoading ? 'Signing in...' : `Continue with ${socialModal === 'google' ? 'Google' : 'GitHub'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        
        {isRegister ? (
          // --- NEW REGISTRATION LAYOUT ---
          <div style={{ 
            width: '100%', 
            maxWidth: '28rem', 
            backgroundColor: '#ffffff', 
            borderRadius: '0.75rem', 
            border: '1px solid #c2c6d6', 
            padding: '2rem', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Link to="/" title="Go to Landing Page" style={{ display: 'inline-block' }}>
                <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '64px', margin: '0 auto 0.5rem auto', display: 'block', objectFit: 'contain', cursor: 'pointer' }} />
              </Link>
              <p style={{ fontSize: '15px', color: '#424754', margin: 0 }}>Create your MeetingLens account</p>
            </div>

            {error && (
              <div style={{ color: '#ba1a1a', backgroundColor: '#ffdad6', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '14px', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="fullName" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0b1c30', marginBottom: '0.25rem' }}>Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #c2c6d6', borderRadius: '0.125rem', padding: '8px 16px', fontSize: '16px', color: '#0b1c30', outline: 'none' }}
                />
              </div>
              
              <div>
                <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0b1c30', marginBottom: '0.25rem' }}>Email</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #c2c6d6', borderRadius: '0.125rem', padding: '8px 16px', fontSize: '16px', color: '#0b1c30', outline: 'none' }}
                />
              </div>
              
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0b1c30', marginBottom: '0.25rem' }}>Password</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #c2c6d6', borderRadius: '0.125rem', padding: '8px 16px', fontSize: '16px', color: '#0b1c30', outline: 'none' }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                  <div style={{ height: '4px', flex: 1, backgroundColor: '#c2c6d6', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#ba1a1a', width: '25%' }}></div>
                  </div>
                  <div style={{ height: '4px', flex: 1, backgroundColor: '#c2c6d6', borderRadius: '9999px' }}></div>
                  <div style={{ height: '4px', flex: 1, backgroundColor: '#c2c6d6', borderRadius: '9999px' }}></div>
                  <div style={{ height: '4px', flex: 1, backgroundColor: '#c2c6d6', borderRadius: '9999px' }}></div>
                </div>
                <p style={{ marginTop: '0.25rem', fontSize: '12px', fontWeight: 600, color: '#424754', margin: '4px 0 0 0' }}>Weak password</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0b1c30', marginBottom: '0.25rem' }}>Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #c2c6d6', borderRadius: '0.125rem', padding: '8px 16px', fontSize: '16px', color: '#0b1c30', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: '4px', width: '1rem', height: '1rem', borderRadius: '0.125rem', borderColor: '#c2c6d6', accentColor: '#0058be' }} 
                />
                <label htmlFor="terms" style={{ fontSize: '14px', color: '#424754' }}>
                  I agree to the <a href="#" style={{ color: '#0058be', textDecoration: 'none' }}>Terms and Conditions</a>
                </label>
              </div>

              <button disabled={isLoading} type="submit" style={{ width: '100%', backgroundColor: '#0058be', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '0.125rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: 'background-color 0.2s', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Loading...' : 'Get Started'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#424754', margin: 0 }}>
                Already have an account? <span style={{ color: '#0058be', fontWeight: 500, cursor: 'pointer' }} onClick={() => setIsRegister(false)}>Sign in</span>
              </p>
            </div>
          </div>
        ) : (
          // --- EXISTING LOGIN LAYOUT ---
          <div style={{ 
            width: '100%', 
            maxWidth: '440px', 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            border: '1px solid #e2e8f0', 
            padding: '2rem', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            
            {/* Alert */}
            <div style={{ backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6', padding: '0.5rem', borderRadius: '0 0.5rem 0.5rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Info size={20} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>
                New feature: You can now use biometric login on supported devices.
              </p>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', alignItems: 'center' }}>
              <Link to="/" title="Go to Landing Page">
                <img src="/logo.png" alt="MeetingLens Logo" style={{ height: '64px', objectFit: 'contain', marginBottom: '0.25rem', cursor: 'pointer' }} />
              </Link>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Welcome to MeetingLens
              </h1>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
                Please enter your details to sign in.
              </p>
            </div>

            {error && (
              <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '14px', border: '1px solid #ef4444' }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>Email</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '10px 8px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>Password</label>
                  <span onClick={() => navigate('/forgot-password')} style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', textDecoration: 'none', cursor: 'pointer' }}>Forgot password?</span>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '10px 8px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <button disabled={isLoading} type="submit" style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '0.5rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: 'background-color 0.2s', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Loading...' : 'Sign In'}
              </button>
            </form>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0.25rem 0' }}>
              <div style={{ flexGrow: 1, borderTop: '1px solid #e2e8f0' }}></div>
              <span style={{ margin: '0 0.5rem', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>OR</span>
              <div style={{ flexGrow: 1, borderTop: '1px solid #e2e8f0' }}></div>
            </div>

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => openSocialModal('google')}
                style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                Continue with Google
              </button>
              <button 
                type="button" 
                onClick={() => openSocialModal('github')}
                style={{ width: '100%', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '14px', fontWeight: 500, padding: '10px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                Continue with GitHub
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
                Don't have an account? 
                <span 
                  style={{ color: '#3b82f6', fontWeight: 500, cursor: 'pointer', marginLeft: '4px' }} 
                  onClick={() => setIsRegister(true)}
                >
                  Sign up
                </span>
              </p>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', backgroundColor: 'white', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontSize: '20px', fontWeight: 600, color: '#0b1c30' }}>AuthPortal</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="#" style={{ fontSize: '12px', color: '#424754', textDecoration: 'underline' }}>Privacy Policy</a>
          <a href="#" style={{ fontSize: '12px', color: '#424754', textDecoration: 'underline' }}>Terms of Service</a>
          <a href="#" style={{ fontSize: '12px', color: '#424754', textDecoration: 'underline' }}>Cookie Settings</a>
        </div>
        <p style={{ fontSize: '12px', color: '#565e74', margin: 0 }}>© 2024 AuthPortal Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
