import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
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

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>ChatApp</h1>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h4>{user?.username}</h4>
          <p>{user?.email}</p>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="sidebar-notifications">
          <div className="notifications-header">
            <strong>Notifications</strong>
            <button
              type="button"
              className="notifications-clear"
              onClick={onClearNotifications}
            >
              Clear
            </button>
          </div>
          {notifications.slice(0, 3).map((notification, index) => (
            <div
              key={notification.id || `${notification.type}-${index}`}
              className={`notification-item ${notification.is_read ? '' : 'unread'}`}
            >
              <span className="notification-text">
                {notification.message ||
                  `${notification.related_username || 'Someone'} mentioned you`}
              </span>
            </div>
          ))}
        </div>
      )}

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${activeSection === 'chats' ? 'active' : ''}`}
          onClick={() => onSectionChange('chats')}
        >
          Chats
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'friends' ? 'active' : ''}`}
          onClick={() => onSectionChange('friends')}
        >
          Friends
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => onSectionChange('settings')}
        >
          Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
