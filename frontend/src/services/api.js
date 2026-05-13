import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
};

// Authentication endpoints
export const authService = {
  register: (username, email, password) =>
    axios.post(`${API_URL}/auth/register`, { username, email, password }),
  login: (email, password) =>
    axios.post(`${API_URL}/auth/login`, { email, password }),
  logout: () =>
    axios.post(`${API_URL}/auth/logout`, {}, getHeaders())
};

// User endpoints
export const userService = {
  getAllUsers: () =>
    axios.get(`${API_URL}/users/all`, getHeaders()),
  getOnlineUsers: () =>
    axios.get(`${API_URL}/users/online`, getHeaders()),
  getUserProfile: (userId) =>
    axios.get(`${API_URL}/users/profile/${userId}`, getHeaders()),
  updateProfile: (userId, data) =>
    axios.put(`${API_URL}/users/profile/${userId}`, data, getHeaders()),
  searchUsers: (query) =>
    axios.get(`${API_URL}/users/search?q=${query}`, getHeaders()),
  getNotifications: () =>
    axios.get(`${API_URL}/users/notifications`, getHeaders()),
  markNotificationsRead: () =>
    axios.post(`${API_URL}/users/notifications/read-all`, {}, getHeaders())
};

// Room endpoints
export const roomService = {
  getAllRooms: () =>
    axios.get(`${API_URL}/rooms/all`, getHeaders()),
  getRoomDetails: (roomId) =>
    axios.get(`${API_URL}/rooms/${roomId}`, getHeaders()),
  getRoomMembers: (roomId) =>
    axios.get(`${API_URL}/rooms/${roomId}/members`, getHeaders()),
  createRoom: (name, description, is_public = true) =>
    axios.post(`${API_URL}/rooms/create`, { name, description, is_public }, getHeaders()),
  joinRoom: (roomId) =>
    axios.post(`${API_URL}/rooms/${roomId}/join`, {}, getHeaders()),
  leaveRoom: (roomId) =>
    axios.post(`${API_URL}/rooms/${roomId}/leave`, {}, getHeaders()),
  inviteUser: (roomId, userId) =>
    axios.post(`${API_URL}/rooms/${roomId}/invite`, { userId }, getHeaders()),
  acceptInvite: (roomId) =>
    axios.post(`${API_URL}/rooms/${roomId}/invite/accept`, {}, getHeaders()),
  declineInvite: (roomId) =>
    axios.post(`${API_URL}/rooms/${roomId}/invite/decline`, {}, getHeaders())
};

// Message endpoints
export const messageService = {
  getRoomMessages: (roomId, page = 1, limit = 50) =>
    axios.get(
      `${API_URL}/messages/room/${roomId}?page=${page}&limit=${limit}`,
      getHeaders()
    ),
  getConversationMessages: (conversationId, page = 1, limit = 50) =>
    axios.get(
      `${API_URL}/messages/conversation/${conversationId}?page=${page}&limit=${limit}`,
      getHeaders()
    ),
  markMessagesAsRead: (messageIds) =>
    axios.post(`${API_URL}/messages/mark-read`, { messageIds }, getHeaders())
};

export const conversationService = {
  getAllConversations: () =>
    axios.get(`${API_URL}/conversations`, getHeaders()),
  getOrCreateConversation: (userId) =>
    axios.post(`${API_URL}/conversations/with/${userId}`, {}, getHeaders())
};
