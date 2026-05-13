import React, { useMemo, useState } from 'react';

export default function FriendsPanel({
  conversations,
  users,
  currentConversation,
  onSelectConversation,
  onStartConversation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) =>
      conversation.title?.toLowerCase().includes(normalizedQuery)
    );
  }, [conversations, normalizedQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (listedUser) =>
        listedUser.username?.toLowerCase().includes(normalizedQuery) ||
        listedUser.email?.toLowerCase().includes(normalizedQuery)
    );
  }, [users, normalizedQuery]);

  return (
    <div className="friends-panel">
      <div className="friends-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people or conversations"
        />
      </div>

      <div className="friends-section">
        <div className="friends-section-header">
          <h3>Direct Messages</h3>
          <span>{filteredConversations.length}</span>
        </div>
        {filteredConversations.length === 0 ? (
          <div className="friends-empty">No conversations yet.</div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`friend-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="friend-avatar">
                {conversation.participant?.avatar_url ? (
                  <img
                    src={conversation.participant.avatar_url}
                    alt={conversation.title}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {conversation.title?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="friend-copy">
                <strong>{conversation.title}</strong>
                <span>{conversation.participant?.status || 'offline'}</span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="friends-section">
        <div className="friends-section-header">
          <h3>People</h3>
          <span>{filteredUsers.length}</span>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="friends-empty">No users match this search.</div>
        ) : (
          filteredUsers.map((listedUser) => (
            <div key={listedUser.id} className="friend-item">
              <div className="friend-avatar">
                {listedUser.avatar_url ? (
                  <img src={listedUser.avatar_url} alt={listedUser.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {listedUser.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="friend-copy">
                <strong>{listedUser.username}</strong>
                <span>{listedUser.status || 'offline'}</span>
              </div>
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={() => onStartConversation(listedUser)}
              >
                Message
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
