import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { userService } from '../services/api';
import {
  IconSettings,
  IconShield,
  IconFileText,
  IconCheck,
  IconSun,
  IconMoon,
  IconImage,
  IconLogOut
} from './Icons';
import LegalModals from './LegalModals';
import '../styles/settingsPanel.css';

export default function SettingsPanel({ user, onUserUpdated }) {
  const { logout } = useChat();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatar_url || '');
    setAvatarPreview(user?.avatar_url || '');
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be under 5MB');
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

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aura_theme', newTheme);
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
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.error ||
          'Failed to update profile settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const openLegalModal = (tab) => {
    setLegalTab(tab);
    setShowLegal(true);
  };

  return (
    <div className="settings-panel-container">
      <div className="settings-panel-card">
        {/* Settings Header */}
        <div className="settings-header">
          <div className="settings-header-icon">
            <IconSettings size={22} />
          </div>
          <div>
            <h2>Preferences &amp; Account</h2>
            <p>Manage your account identity, security preferences, and display options.</p>
          </div>
        </div>

        {error && <div className="settings-alert alert-error">{error}</div>}
        {success && <div className="settings-alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Identity Section */}
          <div className="settings-section">
            <h3 className="section-title">Public Identity</h3>

            {/* Avatar Row */}
            <div className="settings-avatar-row">
              <div className="settings-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="avatar-img-preview" />
                ) : (
                  <div className="avatar-initials-preview">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <div className="avatar-controls">
                <label className="btn btn-secondary btn-small avatar-upload-label">
                  <IconImage size={14} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <p className="avatar-hint">JPG, PNG, WebP up to 5MB.</p>
              </div>
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
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={user?.email || ''} disabled readOnly />
              <span className="field-hint">Email address is managed by organization administrator.</span>
            </div>

            <div className="form-group">
              <label>Custom Avatar URL (optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setAvatarPreview(e.target.value);
                }}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="settings-section">
            <h3 className="section-title">Interface Appearance</h3>
            <div className="theme-selector-grid">
              <button
                type="button"
                className={`theme-option-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <IconMoon size={16} />
                <span>Dark Theme (Default)</span>
              </button>
              <button
                type="button"
                className={`theme-option-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <IconSun size={16} />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* Compliance & Legal Section */}
          <div className="settings-section">
            <h3 className="section-title">Compliance &amp; Data Rights</h3>
            <div className="legal-links-row">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => openLegalModal('privacy')}
              >
                <IconShield size={14} />
                <span>Privacy Policy</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => openLegalModal('terms')}
              >
                <IconFileText size={14} />
                <span>Terms of Service</span>
              </button>
            </div>
          </div>

          {/* Account & Session Section */}
          <div className="settings-section">
            <h3 className="section-title">Account &amp; Session</h3>
            <div className="account-session-card">
              <div className="account-user-meta">
                <span className="account-user-label">Signed in as</span>
                <span className="account-user-val">{user?.username}</span>
                <span className="account-user-email">{user?.email}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary account-logout-btn"
                onClick={handleLogout}
                title="Sign out of Aura"
              >
                <IconLogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="settings-footer-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <IconCheck size={16} />
              <span>{saving ? 'Saving changes...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {showLegal && (
        <LegalModals initialTab={legalTab} onClose={() => setShowLegal(false)} />
      )}
    </div>
  );
}
