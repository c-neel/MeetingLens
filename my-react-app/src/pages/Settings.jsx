import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Save, 
  Loader2, 
  X,
  Zap,
  RefreshCw
} from 'lucide-react';
import { updateUserProfile, clearAllMeetings } from '../services/api';

export default function Settings() {
  const [savedUser, setSavedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Profile Form States
  const [name, setName] = useState(savedUser.name || 'Amit Shah');
  const [email, setEmail] = useState(savedUser.email || 'amit.shah@example.com');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Danger Zone / Clean All Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingMeetings, setIsDeletingMeetings] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (savedUser.name) setName(savedUser.name);
    if (savedUser.email) setEmail(savedUser.email);
  }, [savedUser]);

  // Handle Profile Update (Name & Email)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Name cannot be blank.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile({
        user_id: savedUser.id || 1,
        name: name.trim(),
        email: email.trim()
      });

      if (res.success && res.user) {
        const updated = { ...savedUser, ...res.user };
        localStorage.setItem('user', JSON.stringify(updated));
        setSavedUser(updated);
        window.dispatchEvent(new Event('userUpdated'));
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateUserProfile({
        user_id: savedUser.id || 1,
        current_password: currentPassword,
        new_password: newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Clean All Meetings
  const handleConfirmCleanMeetings = async () => {
    setIsDeletingMeetings(true);
    setDeleteError('');
    setDeleteSuccess('');

    try {
      const res = await clearAllMeetings();
      if (res.success) {
        setShowDeleteModal(false);
        setDeleteSuccess('All meetings and related tasks have been successfully erased.');
        setTimeout(() => setDeleteSuccess(''), 6000);
      } else {
        setDeleteError(res.message || 'Failed to clean meetings.');
      }
    } catch (err) {
      setDeleteError(err.message || 'Error clearing meetings.');
    } finally {
      setIsDeletingMeetings(false);
    }
  };

  const userRole = savedUser.role || 'lead';

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-title" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Settings</span>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage your account preferences, security credentials, and workspace data.
          </p>
        </div>
      </div>

      {/* Global notifications if any */}
      {deleteSuccess && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          backgroundColor: '#ecfdf5', 
          border: '1px solid #6ee7b7', 
          padding: '0.875rem 1rem', 
          borderRadius: '0.5rem', 
          color: '#065f46', 
          marginBottom: '1.5rem',
          fontSize: '0.875rem' 
        }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0 }} />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {deleteError && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fca5a5', 
          padding: '0.875rem 1rem', 
          borderRadius: '0.5rem', 
          color: '#991b1b', 
          marginBottom: '1.5rem',
          fontSize: '0.875rem' 
        }}>
          <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444', flexShrink: 0 }} />
          <span>{deleteError}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* SECTION 1: Profile Information */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), #6366f1)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.125rem'
            }}>
              {(name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Profile Details</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Update your display name, email, and view your role permissions
              </p>
            </div>
            <span className="badge" style={{ 
              marginLeft: 'auto', 
              backgroundColor: '#ede9fe', 
              color: '#6d28d9', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              fontSize: '0.6875rem',
              padding: '0.25rem 0.5rem'
            }}>
              {userRole}
            </span>
          </div>

          {profileSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 className="w-4 h-4" color="#10b981" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle className="w-4 h-4" color="#ef4444" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name" 
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem',
                    outline: 'none'
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem',
                    outline: 'none'
                  }} 
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSavingProfile}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: Security & Password */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#f1f5f9', 
              color: '#334155', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Security & Password</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Keep your account secure by using a strong password with at least 6 characters
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 className="w-4 h-4" color="#10b981" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle className="w-4 h-4" color="#ef4444" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (e.g. password123)" 
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem 2.25rem 0.5rem 2.25rem', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem',
                    outline: 'none'
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters" 
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem 2.25rem 0.5rem 2.25rem', 
                      border: '1px solid var(--border)', 
                      borderRadius: '0.375rem', 
                      fontSize: '0.875rem',
                      outline: 'none'
                    }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password" 
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem 0.75rem 0.5rem 2.25rem', 
                      border: '1px solid var(--border)', 
                      borderRadius: '0.375rem', 
                      fontSize: '0.875rem',
                      outline: 'none'
                    }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSavingPassword}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: Workspace Data & Clean All Meetings (Danger Zone) */}
        <div className="card" style={{ 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #fee2e2', 
          backgroundColor: '#fffaf0',
          boxShadow: '0 1px 3px rgba(239, 68, 68, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', marginBottom: '0.375rem' }}>
                <Trash2 className="w-5 h-5" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Clean All Meetings</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                Erase all meeting history, transcripts, AI summaries, decisions, and related action items from the database. 
                This is ideal when you want to clear test data and start testing with a clean slate.
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setShowDeleteModal(true)}
              style={{ 
                backgroundColor: '#dc2626', 
                color: 'white', 
                border: 'none', 
                padding: '0.625rem 1.25rem', 
                borderRadius: '0.375rem', 
                fontWeight: 600, 
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              <Trash2 className="w-4 h-4" />
              Clean All Meetings
            </button>
          </div>
        </div>

      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #fee2e2',
            position: 'relative'
          }}>
            {/* Close icon */}
            <button 
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingMeetings}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon & Heading */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Are you sure you want to delete all meetings?
              </h2>

              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                This action is <strong>permanent</strong> and cannot be undone. 
                All your meeting recordings, transcripts, AI summaries, decisions, documents, and associated task items will be completely deleted from the database.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={isDeletingMeetings}
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '0.625rem 1rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingMeetings}
                onClick={handleConfirmCleanMeetings}
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isDeletingMeetings ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem'
                }}
              >
                {isDeletingMeetings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete Everything
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
