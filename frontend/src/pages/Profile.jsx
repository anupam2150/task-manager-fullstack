import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import api from '../api/api';

export default function Profile() {
  const { user, login } = useAuth();
  const { push } = useNotif();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const handleAvatarClick = () => fileRef.current?.click();

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setProfile(data);
      setForm(f => ({ ...f, username: data.username }));
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      push('New passwords do not match', 'error'); return;
    }
    try {
      setSaving(true);
      const { data } = await api.put('/profile', {
        username: form.username !== profile.username ? form.username : null,
        currentPassword: form.currentPassword || null,
        newPassword: form.newPassword || null,
      });
      setProfile(data);
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      push('Profile updated!', 'success');
    } catch (err) {
      push(err.response?.data || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const { data } = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
      push('Avatar updated!', 'success');
    } catch (err) {
      push(err.response?.data || 'Failed to upload avatar', 'error');
    } finally { setUploading(false); }
  };

  if (!profile) return <div className="page"><p className="loading">Loading profile...</p></div>;

  const avatarSrc = profile.avatarUrl ? `http://localhost:5000${profile.avatarUrl}` : null;

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h2>👤 Profile</h2>
      </div>

      <div className="profile-layout">

        {/* Avatar Card */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-wrap" onClick={handleAvatarClick}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="profile-avatar-img" />
              : <div className="profile-avatar-initials">{profile.username?.charAt(0).toUpperCase()}</div>
            }
            <div className="profile-avatar-overlay">{uploading ? '⏳' : '📷'}</div>
          </div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          <p className="profile-avatar-hint">Click to change photo</p>
          <div className="profile-meta">
            <strong>{profile.username}</strong>
            <span>{profile.email}</span>
            <span className="profile-joined">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave} className="profile-form">
            <div className="profile-section-title">Account Details</div>

            <label className="profile-label">
              Username
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="profile-input" placeholder="Username" />
            </label>

            <label className="profile-label">
              Email
              <input value={profile.email} disabled className="profile-input profile-input--disabled" />
            </label>

            <div className="profile-divider" />
            <div className="profile-section-title">Change Password</div>

            <label className="profile-label">
              Current Password
              <input type="password" value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                className="profile-input" placeholder="Enter current password" />
            </label>

            <label className="profile-label">
              New Password
              <input type="password" value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                className="profile-input" placeholder="Min 8 chars, upper, lower, digit, special" />
            </label>

            <label className="profile-label">
              Confirm New Password
              <input type="password" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="profile-input" placeholder="Repeat new password" />
            </label>

            <button type="submit" className="btn-primary profile-save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
