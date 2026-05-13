import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';

export default function SettingsPanel({ user, onUserUpdated }) {
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatar_url || '');
    setAvatarPreview(user?.avatar_url || '');
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        username: username.trim(),
        avatar_url: avatarUrl.trim()
      };

      const response = await userService.updateProfile(user.id, payload);
      onUserUpdated(response.data.user);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.error ||
          'Failed to update settings'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-card">
        <div className="settings-header">
          <h2>Settings</h2>
          <p>Update your public profile details.</p>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled readOnly />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength="3"
              maxLength="20"
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar</label>
            {avatarPreview && (
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Avatar preview" />
              </div>
            )}
            <div className="avatar-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-file-input"
              />
              <p className="avatar-help">Max file size: 5MB. Formats: JPG, PNG, GIF, WebP</p>
            </div>
          </div>

          <div className="form-group">
            <label>Avatar URL (or upload file above)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
