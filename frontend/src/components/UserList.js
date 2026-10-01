import React from 'react';
import { useCall } from '../context/CallContext';
import { IconMessageSquare, IconUsers, IconPhone } from './Icons';
import '../styles/userList.css';

export default function UserList({ users, onStartConversation }) {
  const { initiateCall } = useCall();

  if (users.length === 0) {
    return (
      <div className="user-list-empty">
        <div className="empty-icon-wrap">
          <IconUsers size={24} />
        </div>
        <h4>No other users online</h4>
        <p>When colleagues or teammates log in, they will appear here with active status indicators.</p>
      </div>
    );
  }

  return (
    <div className="user-list" role="list">
      {users.map((user) => (
        <div key={user.id} className="user-card-item" role="listitem">
          <div className="user-avatar-container">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="user-avatar-image" />
            ) : (
              <div className="user-avatar-fallback">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`user-status-dot ${user.status || 'offline'}`} />
          </div>

          <div className="user-meta">
            <span className="user-card-name">{user.username}</span>
            <span className="user-card-status">
              {user.status === 'online' ? 'Active now' : user.status || 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn-dm-action"
              title={`Start direct message with ${user.username}`}
              onClick={() => onStartConversation?.(user)}
            >
              <IconMessageSquare size={13} />
              <span>Chat</span>
            </button>

            <button
              type="button"
              className="btn-dm-action btn-call-action"
              title={`Audio call ${user.username}`}
              onClick={() => initiateCall(user, false)}
            >
              <IconPhone size={13} />
              <span>Call</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
