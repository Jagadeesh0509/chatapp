import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import '../styles/sidebar.css';

function getNotificationIcon(type) {
  switch (type) {
    case 'mention':
      return '💬';
    case 'room_invite':
      return '👥';
    case 'user_join':
      return '👋';
    case 'message':
      return '📬';
    default:
      return '🔔';
  }
}

function getNotificationLabel(type) {
  switch (type) {
    case 'mention':
      return 'Mention';
    case 'room_invite':
      return 'Room Invite';
    case 'user_join':
      return 'User Joined';
    case 'message':
      return 'New Message';
    default:
      return 'Notification';
  }
}

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

  const mentionNotifications = notifications.filter((n) => n.type === 'mention');
  const roomInviteNotifications = notifications.filter((n) => n.type === 'room_invite');
  const otherNotifications = notifications.filter(
    (n) => n.type !== 'mention' && n.type !== 'room_invite'
  );

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
            <div className="notifications-title">
              <span className="notif-icon">🔔</span>
              <strong>Notifications</strong>
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </div>
            <button
              type="button"
              className="notifications-clear"
              onClick={onClearNotifications}
              title="Mark all as read"
            >
              ✓
            </button>
          </div>

          <div className="notifications-content">
            {mentionNotifications.length > 0 && (
              <div className="notification-group">
                <div className="notification-group-label">Mentions</div>
                {mentionNotifications.slice(0, 2).map((notification, idx) => (
                  <div
                    key={notification.id || `mention-${idx}`}
                    className={`notification-item mention-item ${
                      notification.is_read ? '' : 'unread'
                    }`}
                  >
                    <span className="notification-icon">{getNotificationIcon('mention')}</span>
                    <div className="notification-content">
                      <p className="notification-text">
                        <strong>{notification.related_username || 'Someone'}</strong> mentioned you
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {roomInviteNotifications.length > 0 && (
              <div className="notification-group">
                <div className="notification-group-label">Room Invites</div>
                {roomInviteNotifications.slice(0, 2).map((notification, idx) => (
                  <div
                    key={notification.id || `invite-${idx}`}
                    className={`notification-item invite-item ${
                      notification.is_read ? '' : 'unread'
                    }`}
                  >
                    <span className="notification-icon">{getNotificationIcon('room_invite')}</span>
                    <div className="notification-content">
                      <p className="notification-text">
                        <strong>{notification.related_username || 'Someone'}</strong> invited you to a room
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {otherNotifications.length > 0 && (
              <div className="notification-group">
                <div className="notification-group-label">Other</div>
                {otherNotifications.slice(0, 1).map((notification, idx) => (
                  <div
                    key={notification.id || `other-${idx}`}
                    className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                  >
                    <span className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="notification-content">
                      <p className="notification-text">
                        {notification.message || `${getNotificationLabel(notification.type)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 5 && (
              <div className="notifications-more">
                +{notifications.length - 5} more notifications
              </div>
            )}
          </div>
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
