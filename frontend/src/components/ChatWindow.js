import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { roomService, userService } from '../services/api';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import '../styles/chatWindow.css';

export default function ChatWindow() {
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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) =>
          msg.sender_id !== user?.id &&
          !msg.readBy?.some((receipt) => receipt.userId === user?.id)
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
      const available = allUsersRes.data.filter((u) => !memberIds.has(u.id) && u.id !== user.id);
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
      alert('Invitations sent successfully!');
    } catch (error) {
      console.error('Error inviting users:', error);
      alert('Failed to send some invitations');
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

  const title = currentRoom
    ? currentRoom.name
    : currentConversation
      ? currentConversation.title ||
        currentConversation.participant?.username ||
        'Conversation'
      : 'Select a chat';

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">
          <h2>{title}</h2>
          {currentRoom && (
            <p className="chat-subtitle">{currentRoom.description}</p>
          )}
          {!currentRoom && currentConversation?.participant?.status && (
            <p className="chat-subtitle">
              {currentConversation.participant.status}
            </p>
          )}
        </div>
        <div className="chat-actions">
          {currentRoom && (
            <button
              type="button"
              className="btn btn-small btn-primary"
              onClick={loadAvailableUsers}
            >
              Invite Users
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        <MessageList messages={messages} />
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <span>{Array.from(typingUsers).join(', ')} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <MessageInput />
      </div>

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Users to Room</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="invite-users-list">
                {availableUsers.length === 0 ? (
                  <p className="empty-text">No users available to invite</p>
                ) : (
                  availableUsers.map((inviteUser) => (
                    <div key={inviteUser.id} className="invite-user-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(inviteUser.id)}
                          onChange={() => toggleUserSelection(inviteUser.id)}
                        />
                        <span className="invite-user-name">{inviteUser.username}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
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
