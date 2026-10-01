import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import {
  conversationService,
  messageService,
  roomService,
  userService
} from '../services/api';
import ChatWindow from '../components/ChatWindow';
import FriendsPanel from '../components/FriendsPanel';
import RoomList from '../components/RoomList';
import RoomInvitations from '../components/RoomInvitations';
import SettingsPanel from '../components/SettingsPanel';
import Sidebar from '../components/Sidebar';
import UserList from '../components/UserList';
import CallModal from '../components/CallModal';
import {
  IconPlus,
  IconSearch,
  IconX,
  IconHash,
  IconUsers,
  IconMessageSquare,
  IconLogo
} from '../components/Icons';
import '../styles/dashboard.css';
import '../styles/friendsPanel.css';
import '../styles/settingsPanel.css';

const VALID_SECTIONS = ['chats', 'friends', 'settings'];
const DEFAULT_SECTION = 'chats';

export default function Dashboard() {
  const {
    user,
    socket,
    currentRoom,
    setCurrentRoom,
    currentConversation,
    setCurrentConversation,
    rooms,
    setRooms,
    onlineUsers,
    setOnlineUsers,
    setMessages,
    conversations,
    setConversations,
    notifications,
    setNotifications,
    joinRoom,
    joinConversation,
    updateCurrentUser,
    clearNotifications
  } = useChat();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'users'
  const [allUsers, setAllUsers] = useState([]);
  const [chatSearch, setChatSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Get activeSection from URL params
  const activeSection = useMemo(() => {
    const section = searchParams.get('section') || DEFAULT_SECTION;
    return VALID_SECTIONS.includes(section) ? section : DEFAULT_SECTION;
  }, [searchParams]);

  const handleSectionChange = useCallback((section) => {
    if (VALID_SECTIONS.includes(section)) {
      setSearchParams({ section });
      setMobileView('list');
    }
  }, [setSearchParams]);

  const mergedUsers = useMemo(() => {
    return allUsers.map((listedUser) => {
      const isOnline = onlineUsers.some(
        (onlineUser) => Number(onlineUser.id || onlineUser.userId) === Number(listedUser.id)
      );
      return {
        ...listedUser,
        status: isOnline ? 'online' : 'offline'
      };
    });
  }, [allUsers, onlineUsers]);

  const filteredRooms = useMemo(() => {
    const normalizedSearch = chatSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return rooms;
    }
    return rooms.filter(
      (room) =>
        room.name?.toLowerCase().includes(normalizedSearch) ||
        room.description?.toLowerCase().includes(normalizedSearch)
    );
  }, [chatSearch, rooms]);

  const filteredOnlineUsers = useMemo(() => {
    const normalizedSearch = chatSearch.trim().toLowerCase();
    return mergedUsers.filter((listedUser) => {
      if (Number(listedUser.id) === Number(user?.id) || listedUser.status !== 'online') {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        listedUser.username?.toLowerCase().includes(normalizedSearch) ||
        listedUser.email?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [chatSearch, mergedUsers, user?.id]);

  const decorateConversation = useCallback(
    (conversation, usersList) => {
      const isParticipantOne =
        Number(conversation.participant1_id) === Number(user?.id);
      const participantId = isParticipantOne
        ? conversation.participant2_id
        : conversation.participant1_id;
      const fallbackUser = usersList.find(
        (candidate) => Number(candidate.id) === Number(participantId)
      );

      const participant = {
        id: participantId,
        username: isParticipantOne
          ? conversation.participant2_username || fallbackUser?.username
          : conversation.participant1_username || fallbackUser?.username,
        avatar_url: isParticipantOne
          ? conversation.participant2_avatar || fallbackUser?.avatar_url
          : conversation.participant1_avatar || fallbackUser?.avatar_url,
        status: (isParticipantOne
          ? conversation.participant2_status
          : conversation.participant1_status) || fallbackUser?.status || 'offline',
        email: (isParticipantOne
          ? conversation.participant2_email
          : conversation.participant1_email) || fallbackUser?.email || ''
      };

      return {
        ...conversation,
        participant,
        title: participant.username || 'Conversation'
      };
    },
    [user?.id]
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [
        roomsRes,
        onlineUsersRes,
        allUsersRes,
        conversationsRes,
        notificationsRes
      ] = await Promise.all([
        roomService.getAllRooms(),
        userService.getOnlineUsers(),
        userService.getAllUsers(),
        conversationService.getAllConversations(),
        userService.getNotifications()
      ]);

      const combinedUsers = allUsersRes.data.map((listedUser) => {
        const onlineMatch = onlineUsersRes.data.find(
          (onlineUser) => Number(onlineUser.id) === Number(listedUser.id)
        );
        return onlineMatch ? { ...listedUser, ...onlineMatch } : listedUser;
      });

      setRooms(roomsRes.data);
      setOnlineUsers(onlineUsersRes.data);
      setAllUsers(combinedUsers);
      setConversations(
        conversationsRes.data.map((conversation) =>
          decorateConversation(conversation, combinedUsers)
        )
      );
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    decorateConversation,
    setConversations,
    setNotifications,
    setOnlineUsers,
    setRooms
  ]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusChanged = (data) => {
      const targetId = Number(data.userId || data.id);
      if (!targetId) return;

      setAllUsers((prev) => {
        const exists = prev.some((u) => Number(u.id) === targetId);
        if (exists) {
          return prev.map((u) =>
            Number(u.id) === targetId
              ? { ...u, ...data, id: targetId, status: data.status || 'offline' }
              : u
          );
        }
        if (data.status === 'online') {
          return [
            ...prev,
            {
              id: targetId,
              username: data.username || 'User',
              avatar_url: data.avatar_url || null,
              email: data.email || '',
              status: 'online'
            }
          ];
        }
        return prev;
      });
    };

    socket.on('user:status-changed', handleStatusChanged);
    return () => {
      socket.off('user:status-changed', handleStatusChanged);
    };
  }, [socket]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreatingRoom(true);

    try {
      const response = await roomService.createRoom(
        newRoomName.trim(),
        newRoomDescription.trim(),
        newRoomIsPublic
      );
      const created = response.data.room;
      setRooms([...rooms, created]);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomIsPublic(true);
      setShowRoomModal(false);

      await roomService.joinRoom(created.id).catch(() => {});
      joinRoom(created.id);
      setCurrentConversation(null);
      setCurrentRoom(created);
      setMobileView('chat');
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleSelectRoom = async (room) => {
    setCurrentRoom(room);
    setCurrentConversation(null);
    setMobileView('chat');

    try {
      await roomService.joinRoom(room.id).catch(() => {});
      joinRoom(room.id);
      const messagesRes = await messageService.getRoomMessages(room.id);
      setMessages(messagesRes.data.messages);
    } catch (error) {
      console.error('Error selecting room:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setCurrentRoom(null);
    setMobileView('chat');

    try {
      joinConversation(conversation.id);
      const messagesRes = await messageService.getConversationMessages(
        conversation.id
      );
      setMessages(messagesRes.data.messages);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  };

  const handleStartConversation = async (selectedUser) => {
    try {
      const response = await conversationService.getOrCreateConversation(
        selectedUser.id
      );
      const decoratedConversation = decorateConversation(
        response.data,
        mergedUsers
      );

      setConversations((prev) => {
        const exists = prev.some(
          (conv) => Number(conv.id) === Number(decoratedConversation.id)
        );
        if (exists) {
          return prev.map((conv) =>
            Number(conv.id) === Number(decoratedConversation.id)
              ? decoratedConversation
              : conv
          );
        }
        return [decoratedConversation, ...prev];
      });

      handleSectionChange('friends');
      await handleSelectConversation(decoratedConversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await userService.markNotificationsRead();
      clearNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasActiveChat = Boolean(currentRoom || currentConversation);

  return (
    <div className={`dashboard ${mobileView === 'chat' && hasActiveChat ? 'mobile-chat-active' : ''}`}>
      {/* 1. Left Primary Rail Navigation */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
      />

      {/* 2. Main Workspace Layout */}
      <div className="dashboard-content">
        {/* CHATS SECTION */}
        {activeSection === 'chats' && (
          <>
            <div className="conversations-panel">
              {/* Panel Header */}
              <div className="panel-header">
                <div className="panel-title-wrap">
                  <h2>Channels</h2>
                  <span className="panel-counter">{rooms.length}</span>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowRoomModal(true)}
                  title="Create new channel"
                  aria-label="Create Channel"
                >
                  <IconPlus size={16} />
                </button>
              </div>

              {/* Room Invitations Banner */}
              <RoomInvitations
                notifications={notifications}
                onInviteHandled={loadInitialData}
              />

              {/* Filter Tabs */}
              <div className="panel-tabs">
                <button
                  type="button"
                  className={`panel-tab ${activeTab === 'rooms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rooms')}
                >
                  <IconHash size={14} />
                  <span>Channels</span>
                </button>
                <button
                  type="button"
                  className={`panel-tab ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <IconUsers size={14} />
                  <span>Online ({filteredOnlineUsers.length})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="panel-search">
                <div className="panel-search-field">
                  <IconSearch size={14} className="panel-search-icon" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder={`Filter ${activeTab === 'rooms' ? 'channels' : 'online teammates'}...`}
                    className="panel-search-input"
                  />
                  {chatSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setChatSearch('')}
                    >
                      <IconX size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="panel-scroll-list">
                {activeTab === 'rooms' && (
                  <RoomList
                    rooms={filteredRooms}
                    currentRoom={currentRoom}
                    onSelectRoom={handleSelectRoom}
                  />
                )}

                {activeTab === 'users' && (
                  <UserList
                    users={filteredOnlineUsers}
                    onStartConversation={handleStartConversation}
                  />
                )}
              </div>
            </div>

            {/* Conversation Window Area */}
            <main className="main-chat-viewport">
              {currentRoom || currentConversation ? (
                <ChatWindow onBack={() => setMobileView('list')} />
              ) : (
                <div className="workspace-empty-hero">
                  <div className="empty-hero-emblem">
                    <IconLogo size={36} />
                  </div>
                  <h3>Select a Channel or Teammate</h3>
                  <p>
                    Choose a channel from the sidebar or click an active colleague
                    to start a direct conversation.
                  </p>
                  <div className="empty-hero-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowRoomModal(true)}
                    >
                      <IconPlus size={15} />
                      <span>New Channel</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('users')}
                    >
                      <IconUsers size={15} />
                      <span>Browse Teammates</span>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </>
        )}

        {/* FRIENDS SECTION */}
        {activeSection === 'friends' && (
          <>
            <div className="conversations-panel">
              <div className="panel-header">
                <div className="panel-title-wrap">
                  <h2>Direct Messages</h2>
                  <span className="panel-counter">{conversations.length}</span>
                </div>
              </div>

              <div className="panel-scroll-list">
                <FriendsPanel
                  conversations={conversations}
                  users={mergedUsers.filter(
                    (listedUser) => Number(listedUser.id) !== Number(user?.id)
                  )}
                  currentConversation={currentConversation}
                  onSelectConversation={handleSelectConversation}
                  onStartConversation={handleStartConversation}
                />
              </div>
            </div>

            <main className="main-chat-viewport">
              {currentConversation ? (
                <ChatWindow onBack={() => setMobileView('list')} />
              ) : (
                <div className="workspace-empty-hero">
                  <div className="empty-hero-emblem">
                    <IconMessageSquare size={36} />
                  </div>
                  <h3>Open a Direct Message</h3>
                  <p>
                    Select an existing private thread from the list or click
                    &ldquo;Message&rdquo; next to any user in the directory.
                  </p>
                </div>
              )}
            </main>
          </>
        )}

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <main className="main-chat-viewport settings-viewport">
            <SettingsPanel user={user} onUserUpdated={updateCurrentUser} />
          </main>
        )}
      </div>

      {/* CREATE CHANNEL MODAL */}
      {showRoomModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRoomModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Channel</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRoomModal(false)}
                aria-label="Close"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="create-room-form">
              <div className="form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. general, announcements, engineering"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Topic / Description (optional)</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newRoomIsPublic}
                    onChange={(e) => setNewRoomIsPublic(e.target.checked)}
                  />
                  <span>Public Channel (anyone in the workspace can view and join)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRoomModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingRoom || !newRoomName.trim()}
                >
                  {creatingRoom ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global WebRTC Audio/Video Call Modal */}
      <CallModal />
    </div>
  );
}
