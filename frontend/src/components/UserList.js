import React from 'react';
import '../styles/userList.css';

export default function UserList({ users, onStartConversation }) {
  return (
    <div className="user-list">
      {users.length === 0 ? (
        <div className="empty-list">
          <p>No users online</p>
        </div>
      ) : (
        users.map((user) => (
          <div key={user.id} className="user-item">
            <div className="user-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`status-indicator ${user.status}`}></div>
            </div>
            <div className="user-info">
              <h4>{user.username}</h4>
              <span className="user-status">{user.status}</span>
            </div>
            <button
              type="button"
              className="btn-message"
              title="Message"
              onClick={() => onStartConversation?.(user)}
            >
              DM
            </button>
          </div>
        ))
      )}
    </div>
  );
}
