import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Steps: 1 = Email Input, 2 = OTP Verification, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process request. Please try again.');
      }

      setSuccessMsg(data.message || 'OTP sent successfully!');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      setSuccessMsg('Email ownership verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password. Please try again.');
      }

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP helper
  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSuccessMsg('A new OTP has been dispatched to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          padding: '2.5rem 2rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Back to Login Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: 'none', background: 'none', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>

          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.25rem', height: '3.25rem', borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', marginBottom: '1rem', border: '1px solid #bfdbfe' }}>
                  <KeyRound size={26} />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Forgot password?</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Enter your registered account email and we'll send a 6-digit verification OTP.
                </p>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '14px', marginBottom: '1.25rem', border: '1px solid #fca5a5' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="email" 
                      id="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '10px 12px 10px 38px', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                    />
                    <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <button 
                  disabled={isLoading} 
                  type="submit" 
                  style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '11px', borderRadius: '0.5rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isLoading ? 'Verifying Account...' : 'Send Reset OTP'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.25rem', height: '3.25rem', borderRadius: '9999px', backgroundColor: '#f0fdf4', color: '#16a34a', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                  <ShieldCheck size={26} />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Enter Verification OTP</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  We sent a 6-digit OTP code to <strong style={{ color: '#0f172a' }}>{email}</strong>.
                </p>
              </div>

              {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '14px', marginBottom: '1.25rem', border: '1px solid #bbf7d0' }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '14px', marginBottom: '1.25rem', border: '1px solid #fca5a5' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="otp" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem', textAlign: 'center' }}>
                    6-Digit OTP Code
                  </label>
                  <input 
                    type="text" 
                    id="otp" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    style={{ width: '100%', backgroundColor: '#ffffff', border: '2px solid #cbd5e1', borderRadius: '0.5rem', padding: '12px', fontSize: '24px', fontWeight: 700, letterSpacing: '8px', textAlign: 'center', color: '#2563eb', outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>

                <button 
                  disabled={isLoading} 
                  type="submit" 
                  style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '11px', borderRadius: '0.5rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Verifying OTP...' : 'Verify OTP Code'}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <RefreshCw size={14} /> Didn't receive the code? Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 3 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.25rem', height: '3.25rem', borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', marginBottom: '1rem', border: '1px solid #bfdbfe' }}>
                  <KeyRound size={26} />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Set New Password</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Email verified. Create a new strong password for your account.
                </p>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '14px', marginBottom: '1.25rem', border: '1px solid #fca5a5' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="newPassword" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    New Password
                  </label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '10px 12px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Confirm New Password
                  </label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '10px 12px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                  />
                </div>

                <button 
                  disabled={isLoading} 
                  type="submit" 
                  style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '11px', borderRadius: '0.5rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.75rem', height: '3.75rem', borderRadius: '9999px', backgroundColor: '#f0fdf4', color: '#16a34a', marginBottom: '1.25rem', border: '1px solid #bbf7d0' }}>
                <CheckCircle2 size={32} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Password Reset Complete!</h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 1.75rem 0', lineHeight: 1.5 }}>
                Your account password has been updated successfully. You can now log in with your new password.
              </p>
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '11px', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
              >
                Sign In Now
              </button>
            </div>
          )}

        </div>
      </main>

      <footer style={{ width: '100%', padding: '1.25rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>© {new Date().getFullYear()} Meeting Lens. All rights reserved.</p>
      </footer>
    </div>
  );
}
