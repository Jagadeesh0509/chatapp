import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
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
import '../styles/dashboard.css';
import '../styles/friendsPanel.css';
import '../styles/settingsPanel.css';

// Valid dashboard sections
const VALID_SECTIONS = ['chats', 'friends', 'settings'];
const DEFAULT_SECTION = 'chats';

export default function Dashboard() {
  const {
    user,
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');
  const [allUsers, setAllUsers] = useState([]);
  const [chatSearch, setChatSearch] = useState('');

  // Get activeSection from URL params, validate it
  const activeSection = useMemo(() => {
    const section = searchParams.get('section') || DEFAULT_SECTION;
    return VALID_SECTIONS.includes(section) ? section : DEFAULT_SECTION;
  }, [searchParams]);

  // Update URL when section changes
  const handleSectionChange = useCallback((section) => {
    if (VALID_SECTIONS.includes(section)) {
      setSearchParams({ section });
    }
  }, [setSearchParams]);

  const mergedUsers = useMemo(() => {
    return allUsers.map((listedUser) => {
      const onlineMatch = onlineUsers.find(
        (onlineUser) => Number(onlineUser.id) === Number(listedUser.id)
      );
      return onlineMatch ? { ...listedUser, ...onlineMatch } : listedUser;
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
      if (Number(listedUser.id) === Number(user.id) || listedUser.status !== 'online') {
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
  }, [chatSearch, mergedUsers, user.id]);

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
      console.error('Error loading data:', error);
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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await roomService.createRoom(
        newRoomName,
        newRoomDescription,
        newRoomIsPublic
      );
      setRooms([...rooms, response.data.room]);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomIsPublic(true);
      setShowRoomModal(false);
      await roomService.joinRoom(response.data.room.id).catch(() => {});
      joinRoom(response.data.room.id);
      setCurrentConversation(null);
      setCurrentRoom(response.data.room);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleSelectRoom = async (room) => {
    setCurrentRoom(room);
    setCurrentConversation(null);
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
          (conversation) =>
            Number(conversation.id) === Number(decoratedConversation.id)
        );
        if (exists) {
          return prev.map((conversation) =>
            Number(conversation.id) === Number(decoratedConversation.id)
              ? decoratedConversation
              : conversation
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

  return (
    <div className="dashboard">
      <Sidebar
        user={user}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
      />

      <div className="dashboard-content">
        {activeSection === 'chats' && (
          <>
            <div className="sidebar-panel">
              <div className="sidebar-header">
                <h2>Chat</h2>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowRoomModal(true)}
                >
                  +
                </button>
              </div>

              <RoomInvitations 
                notifications={notifications}
                onInviteHandled={loadInitialData}
              />

              <div className="sidebar-search">
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder={`Search ${activeTab === 'rooms' ? 'rooms' : 'users'}`}
                />
              </div>

              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rooms')}
                >
                  Rooms
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  Users
                </button>
              </div>

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

            <div className="main-panel">
              {currentRoom || currentConversation ? (
                <ChatWindow />
              ) : (
                <div className="empty-state">
                  <h3>Select a room or start a conversation</h3>
                  <p>
                    Choose a room from the sidebar or start a private
                    conversation with someone.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'friends' && (
          <>
            <div className="sidebar-panel">
              <div className="sidebar-header">
                <h2>Friends</h2>
              </div>
              <FriendsPanel
                conversations={conversations}
                users={mergedUsers.filter(
                  (listedUser) => Number(listedUser.id) !== Number(user.id)
                )}
                currentConversation={currentConversation}
                onSelectConversation={handleSelectConversation}
                onStartConversation={handleStartConversation}
              />
            </div>

            <div className="main-panel">
              {currentConversation ? (
                <ChatWindow />
              ) : (
                <div className="empty-state">
                  <h3>Open a direct message</h3>
                  <p>
                    Select an existing conversation or start one from the people
                    list.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'settings' && (
          <div className="main-panel">
            <SettingsPanel user={user} onUserUpdated={updateCurrentUser} />
          </div>
        )}
      </div>

      {showRoomModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRoomModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Room</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRoomModal(false)}
              >
                x
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Enter room description"
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
                  <span>Make this room public (anyone can discover and join)</span>
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-large">
                Create Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
