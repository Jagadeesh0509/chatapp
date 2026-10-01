import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import {
  IconLogo,
  IconMessageSquare,
  IconUsers,
  IconSettings,
  IconBell,
  IconLogOut,
  IconCheck,
  IconMoon,
  IconSun,
  IconShield,
  IconAtSign
} from './Icons';
import LegalModals from './LegalModals';
import '../styles/sidebar.css';

export default function Sidebar({
  user,
  activeSection,
  onSectionChange,
  notifications = [],
  onClearNotifications
}) {
  const { logout } = useChat();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('aura_theme', nextTheme);
  };

  const openLegal = (tab) => {
    setLegalTab(tab);
    setShowLegal(true);
  };

  const mentionNotifications = notifications.filter((n) => n.type === 'mention');
  const roomInviteNotifications = notifications.filter((n) => n.type === 'room_invite');
  const otherNotifications = notifications.filter(
    (n) => n.type !== 'mention' && n.type !== 'room_invite'
  );

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-badge">
          <IconLogo size={24} className="brand-icon" />
          <span className="brand-name">Aura</span>
        </div>
        <div className="brand-status" title="Real-time network operational">
          <span className="status-dot online" />
          <span className="status-label">Live</span>
        </div>
      </div>

      {/* Main Workspace Navigation */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-item ${activeSection === 'chats' ? 'active' : ''}`}
          onClick={() => onSectionChange('chats')}
        >
          <div className="nav-item-content">
            <IconMessageSquare size={17} />
            <span>Channels &amp; Chats</span>
          </div>
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </button>

        <button
          type="button"
          className={`nav-item ${activeSection === 'friends' ? 'active' : ''}`}
          onClick={() => onSectionChange('friends')}
        >
          <div className="nav-item-content">
            <IconUsers size={17} />
            <span>Direct Messages</span>
          </div>
        </button>

        <button
          type="button"
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => onSectionChange('settings')}
        >
          <div className="nav-item-content">
            <IconSettings size={17} />
            <span>Preferences</span>
          </div>
        </button>
      </nav>

      {/* Notifications Drawer (if any exist) */}
      {notifications.length > 0 && (
        <div className="sidebar-notifications">
          <div className="notifications-header">
            <div className="notifications-title">
              <IconBell size={15} />
              <span>Activity</span>
              {unreadCount > 0 && <span className="unread-counter">{unreadCount}</span>}
            </div>
            <button
              type="button"
              className="notifications-clear-btn"
              onClick={onClearNotifications}
              title="Mark all as read"
            >
              <IconCheck size={13} />
              <span>Clear</span>
            </button>
          </div>

          <div className="notifications-scroll">
            {mentionNotifications.slice(0, 2).map((item, idx) => (
              <div
                key={item.id || `notif-m-${idx}`}
                className={`notif-card notif-mention ${item.is_read ? '' : 'unread'}`}
              >
                <IconAtSign size={14} className="notif-card-icon" />
                <div className="notif-card-body">
                  <p>
                    <strong>{item.related_username || 'Someone'}</strong> mentioned you
                  </p>
                </div>
              </div>
            ))}

            {roomInviteNotifications.slice(0, 2).map((item, idx) => (
              <div
                key={item.id || `notif-i-${idx}`}
                className={`notif-card notif-invite ${item.is_read ? '' : 'unread'}`}
              >
                <IconUsers size={14} className="notif-card-icon" />
                <div className="notif-card-body">
                  <p>
                    <strong>{item.related_username || 'Someone'}</strong> invited you to a room
                  </p>
                </div>
              </div>
            ))}

            {otherNotifications.slice(0, 2).map((item, idx) => (
              <div
                key={item.id || `notif-o-${idx}`}
                className={`notif-card ${item.is_read ? '' : 'unread'}`}
              >
                <IconBell size={14} className="notif-card-icon" />
                <div className="notif-card-body">
                  <p>{item.message || 'New notification'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile & Workspace Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-bar">
          <div className="user-avatar-wrap">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="user-avatar-img" />
            ) : (
              <div className="user-avatar-fallback">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="avatar-status-indicator online" />
          </div>

          <div className="user-text-info">
            <span className="user-display-name">{user?.username}</span>
            <span className="user-email-text">{user?.email}</span>
          </div>

          <button
            type="button"
            className="btn-icon theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
          </button>
        </div>

        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => openLegal('privacy')}
            title="Privacy Policy and Security"
          >
            <IconShield size={13} />
            <span>Privacy</span>
          </button>

          <span className="footer-dot">•</span>

          <button
            type="button"
            className="footer-link-btn"
            onClick={() => openLegal('terms')}
            title="Terms of Service"
          >
            <span>Terms</span>
          </button>

          <span className="footer-dot">•</span>

          <button
            type="button"
            className="footer-link-btn logout-link"
            onClick={handleLogout}
            title="Sign out of account"
          >
            <IconLogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {showLegal && (
        <LegalModals initialTab={legalTab} onClose={() => setShowLegal(false)} />
      )}
    </aside>
  );
}
