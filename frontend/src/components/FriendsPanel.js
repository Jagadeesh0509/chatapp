import React, { useMemo, useState } from 'react';
import { IconSearch, IconMessageSquare, IconX } from './Icons';
import '../styles/friendsPanel.css';

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
      {/* Search Input */}
      <div className="friends-search-wrap">
        <div className="search-field">
          <IconSearch size={15} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations or people..."
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="friends-scroll-content">
        {/* Direct Conversations Section */}
        <div className="friends-section">
          <div className="friends-section-header">
            <h4>Conversations</h4>
            <span className="count-pill">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="friends-empty-note">
              No conversations {searchQuery ? 'matched your search' : 'yet'}. Select a person below to start a chat.
            </div>
          ) : (
            <div className="friends-list" role="list">
              {filteredConversations.map((conversation) => {
                const isActive = currentConversation?.id === conversation.id;
                const status = conversation.participant?.status || 'offline';

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectConversation(conversation)}
                    role="listitem"
                  >
                    <div className="conversation-avatar-wrap">
                      {conversation.participant?.avatar_url ? (
                        <img
                          src={conversation.participant.avatar_url}
                          alt={conversation.title}
                          className="conv-avatar-img"
                        />
                      ) : (
                        <div className="conv-avatar-fallback">
                          {conversation.title?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className={`conv-status-dot ${status}`} />
                    </div>

                    <div className="conversation-meta">
                      <div className="conv-title-row">
                        <span className="conv-title">{conversation.title}</span>
                        {conversation.updated_at && (
                          <span className="conv-time">
                            {new Date(conversation.updated_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <span className="conv-status-text">
                        {status === 'online' ? 'Active now' : 'Offline'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Teammates & People Directory Section */}
        <div className="friends-section">
          <div className="friends-section-header">
            <h4>People Directory</h4>
            <span className="count-pill">{filteredUsers.length}</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="friends-empty-note">No colleagues found.</div>
          ) : (
            <div className="friends-list" role="list">
              {filteredUsers.map((listedUser) => (
                <div key={listedUser.id} className="directory-user-row" role="listitem">
                  <div className="conversation-avatar-wrap">
                    {listedUser.avatar_url ? (
                      <img
                        src={listedUser.avatar_url}
                        alt={listedUser.username}
                        className="conv-avatar-img"
                      />
                    ) : (
                      <div className="conv-avatar-fallback">
                        {listedUser.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className={`conv-status-dot ${listedUser.status || 'offline'}`} />
                  </div>

                  <div className="conversation-meta">
                    <span className="conv-title">{listedUser.username}</span>
                    <span className="conv-status-text">{listedUser.email}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-dm-action"
                    onClick={() => onStartConversation(listedUser)}
                    title={`Message ${listedUser.username}`}
                  >
                    <IconMessageSquare size={13} />
                    <span>Message</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
