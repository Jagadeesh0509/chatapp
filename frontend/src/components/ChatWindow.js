import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { useCall } from '../context/CallContext';
import { roomService, userService } from '../services/api';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import {
  IconPhone,
  IconVideo,
  IconInfo,
  IconSearch,
  IconUsers,
  IconHash,
  IconLock,
  IconArrowLeft,
  IconX,
  IconCheck,
  IconShield
} from './Icons';
import '../styles/chatWindow.css';

export default function ChatWindow({ onBack }) {
  const {
    currentRoom,
    currentConversation,
    messages,
    typingUsers,
    user,
    markMessageAsRead
  } = useChat();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [inviting, setInviting] = useState(false);

  const { initiateCall } = useCall();

  // In-chat search state
  const [searchInChatOpen, setSearchInChatOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        (msg) =>
          msg.sender_id !== user.id &&
          !msg.readBy?.some((receipt) => receipt.userId === user.id)
      );

      unreadMessages.forEach((msg) => {
        if (currentConversation) {
          markMessageAsRead(msg.id, currentConversation.id);
        }
      });
    }
  }, [messages, user, currentConversation, markMessageAsRead]);

  const loadAvailableUsers = async () => {
    if (!currentRoom) return;
    try {
      const [allUsersRes, roomMembersRes] = await Promise.all([
        userService.getAllUsers(),
        roomService.getRoomMembers(currentRoom.id)
      ]);
      const memberIds = new Set(roomMembersRes.data.map((m) => m.id));
      const available = allUsersRes.data.filter(
        (u) => !memberIds.has(u.id) && u.id !== user.id
      );
      setAvailableUsers(available);
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.size === 0 || !currentRoom) return;
    setInviting(true);
    try {
      await Promise.all(
        Array.from(selectedUsers).map((userId) =>
          roomService.inviteUser(currentRoom.id, userId)
        )
      );
      setShowInviteModal(false);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Error inviting users:', error);
    } finally {
      setInviting(false);
    }
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Filter messages by search if search in chat is active
  const filteredMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    const query = chatSearchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(query) ||
        m.username?.toLowerCase().includes(query)
    );
  }, [messages, chatSearchQuery]);

  const title = currentRoom
    ? currentRoom.name
    : currentConversation
      ? currentConversation.title ||
        currentConversation.participant?.username ||
        'Direct Message'
      : 'Conversation';

  const isPrivate = currentRoom && (currentRoom.is_public === false || currentRoom.is_public === 0);
  const typingList = Array.from(typingUsers);

  return (
    <div className="chat-window-layout">
      <div className="chat-window-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {onBack && (
              <button
                type="button"
                className="btn-icon mobile-back-btn"
                onClick={onBack}
                aria-label="Back to conversations list"
              >
                <IconArrowLeft size={18} />
              </button>
            )}

            <div className="chat-header-avatar">
              {currentRoom ? (
                <div className="room-header-badge">
                  {isPrivate ? <IconLock size={16} /> : <IconHash size={16} />}
                </div>
              ) : currentConversation?.participant?.avatar_url ? (
                <img
                  src={currentConversation.participant.avatar_url}
                  alt={title}
                  className="user-header-avatar"
                />
              ) : (
                <div className="user-header-avatar-fallback">
                  {title.charAt(0).toUpperCase()}
                </div>
              )}
              {!currentRoom && currentConversation?.participant?.status && (
                <span
                  className={`avatar-presence-dot ${
                    currentConversation.participant.status === 'online' ? 'online' : 'offline'
                  }`}
                />
              )}
            </div>

            <div className="chat-header-meta">
              <div className="chat-header-title-row">
                <h2>{title}</h2>
                {currentRoom && (
                  <span className="room-type-tag">
                    {isPrivate ? 'Private Channel' : 'Public Channel'}
                  </span>
                )}
              </div>

              <div className="chat-header-subtitle">
                {typingList.length > 0 ? (
                  <span className="typing-text">
                    <span className="typing-pulse-dot" />
                    {typingList.join(', ')} is typing...
                  </span>
                ) : currentRoom ? (
                  <span>
                    {currentRoom.member_count || 1} members
                    {currentRoom.description ? ` • ${currentRoom.description}` : ''}
                  </span>
                ) : (
                  <span>
                    {currentConversation?.participant?.status === 'online'
                      ? 'Active now'
                      : 'Offline'}
                    {currentConversation?.participant?.email
                      ? ` • ${currentConversation.participant.email}`
                      : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="chat-header-actions">
            {/* Audio Call Button */}
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                if (currentConversation?.participant) {
                  initiateCall(currentConversation.participant, false);
                } else {
                  alert('Audio calls are direct peer-to-peer. Select a teammate from Chats or Teammates to initiate a call.');
                }
              }}
              title="Start encrypted audio call"
              aria-label="Voice Call"
            >
              <IconPhone size={17} />
            </button>

            {/* Video Call Button */}
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                if (currentConversation?.participant) {
                  initiateCall(currentConversation.participant, true);
                } else {
                  alert('Video calls are direct peer-to-peer. Select a teammate from Chats or Teammates to initiate a call.');
                }
              }}
              title="Start encrypted video call"
              aria-label="Video Call"
            >
              <IconVideo size={17} />
            </button>

            {/* In-Chat Search Button */}
            <button
              type="button"
              className={`btn-icon ${searchInChatOpen ? 'active' : ''}`}
              onClick={() => {
                setSearchInChatOpen(!searchInChatOpen);
                if (searchInChatOpen) setChatSearchQuery('');
              }}
              title="Search in this conversation"
              aria-label="Search conversation"
            >
              <IconSearch size={17} />
            </button>

            {/* Invite Button for Rooms */}
            {currentRoom && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={loadAvailableUsers}
                title="Invite people to this channel"
              >
                <IconUsers size={14} />
                <span>Invite</span>
              </button>
            )}

            {/* Info Drawer Toggle */}
            <button
              type="button"
              className={`btn-icon ${showInfoDrawer ? 'active' : ''}`}
              onClick={() => setShowInfoDrawer(!showInfoDrawer)}
              title="View conversation details"
              aria-label="Conversation details"
            >
              <IconInfo size={17} />
            </button>
          </div>
        </header>

        {/* Search in Chat Overlay Bar */}
        {searchInChatOpen && (
          <div className="chat-search-bar">
            <IconSearch size={15} className="chat-search-icon" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search messages by keyword or sender..."
              className="chat-search-input"
              autoFocus
            />
            {chatSearchQuery && (
              <span className="search-results-counter">
                {filteredMessages.length} match{filteredMessages.length === 1 ? '' : 'es'}
              </span>
            )}
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setSearchInChatOpen(false);
                setChatSearchQuery('');
              }}
            >
              <IconX size={15} />
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="chat-stream-container">
          <MessageList
            messages={filteredMessages}
            onReplyMessage={(msg) => setReplyingTo(msg)}
          />

          {/* Typing Indicator Bar */}
          {typingList.length > 0 && (
            <div className="live-typing-bar">
              <div className="typing-dots-animation">
                <span />
                <span />
                <span />
              </div>
              <span>{typingList.join(', ')} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Input Area */}
        <div className="chat-composer-bar">
          <MessageInput
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      </div>

      {/* Info / Details Drawer */}
      {showInfoDrawer && (
        <aside className="chat-details-drawer">
          <div className="drawer-header">
            <h3>Details</h3>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowInfoDrawer(false)}
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="drawer-content">
            <div className="drawer-hero">
              <div className="drawer-avatar-wrap">
                {currentRoom ? (
                  <div className="room-drawer-icon">
                    {isPrivate ? <IconLock size={24} /> : <IconHash size={24} />}
                  </div>
                ) : currentConversation?.participant?.avatar_url ? (
                  <img
                    src={currentConversation.participant.avatar_url}
                    alt={title}
                    className="drawer-avatar-img"
                  />
                ) : (
                  <div className="drawer-avatar-fallback">
                    {title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4>{title}</h4>
              <p className="drawer-sub">{currentRoom ? 'Channel' : 'Direct Message'}</p>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Security &amp; Encryption</div>
              <div className="security-badge-card">
                <IconShield size={16} className="security-icon" />
                <div className="security-text">
                  <strong>End-to-End Encrypted</strong>
                  <p>Messages and calls are secured with modern TLS and token verification.</p>
                </div>
              </div>
            </div>

            {currentRoom && (
              <div className="drawer-section">
                <div className="drawer-section-title">About Channel</div>
                <div className="drawer-info-grid">
                  <div className="info-grid-row">
                    <span className="grid-label">Visibility</span>
                    <span className="grid-value">{isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                  <div className="info-grid-row">
                    <span className="grid-label">Members</span>
                    <span className="grid-value">{currentRoom.member_count || 1}</span>
                  </div>
                  {currentRoom.description && (
                    <div className="info-grid-desc">
                      <span className="grid-label">Topic</span>
                      <p className="grid-value-desc">{currentRoom.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!currentRoom && currentConversation?.participant && (
              <div className="drawer-section">
                <div className="drawer-section-title">Contact Information</div>
                <div className="drawer-info-grid">
                  <div className="info-grid-row">
                    <span className="grid-label">Status</span>
                    <span className="grid-value">
                      {currentConversation.participant.status || 'Offline'}
                    </span>
                  </div>
                  <div className="info-grid-row">
                    <span className="grid-label">Email</span>
                    <span className="grid-value">
                      {currentConversation.participant.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      )}

      {/* Invite Users Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite People to #{currentRoom?.name}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowInviteModal(false)}
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="modal-content invite-modal-content">
              {availableUsers.length === 0 ? (
                <div className="invite-empty-state">
                  <IconUsers size={28} />
                  <p>All registered teammates are already members of this room.</p>
                </div>
              ) : (
                <div className="invite-user-selection-list">
                  {availableUsers.map((inviteUser) => {
                    const isSelected = selectedUsers.has(inviteUser.id);
                    return (
                      <div
                        key={inviteUser.id}
                        className={`invite-select-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(inviteUser.id)}
                      >
                        <div className="invite-checkbox">
                          {isSelected && <IconCheck size={12} />}
                        </div>
                        <div className="invite-user-info">
                          <span className="invite-user-name">{inviteUser.username}</span>
                          <span className="invite-user-email">{inviteUser.email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={selectedUsers.size === 0 || inviting}
              >
                {inviting ? 'Sending...' : `Send Invites (${selectedUsers.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
