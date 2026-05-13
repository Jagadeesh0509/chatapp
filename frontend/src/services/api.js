import axios from 'axios';

// API URL
const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Logger utility for debugging
const logger = {
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Debug] ${message}`, data);
    }
  },

  error: (message, error) => {
    console.error(`[API Error] ${message}`, error);
  },

  info: (message, data) => {
    console.info(`[API Info] ${message}`, data);
  }
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';

    logger.debug('Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      timestamp: new Date().toISOString()
    });

    return config;
  },

  (error) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    logger.debug('Response success:', {
      status: response.status,
      url: response.config.url,
      timestamp: new Date().toISOString()
    });

    return response;
  },

  (error) => {
    const { response, request, message } = error;

    if (response) {
      const errorData = {
        status: response.status,
        message: response.data?.message || message,
        url: response.config?.url,
        timestamp: new Date().toISOString()
      };

      logger.error('Response error:', errorData);

      // Auto logout if token expired
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        window.location.href = '/login';
      }
    } else if (request) {
      logger.error('No response from server:', {
        url: error.config?.url,
        message: 'Network error or server unreachable'
      });
    } else {
      logger.error('Request setup error:', message);
    }

    return Promise.reject(error);
  }
);

// ================= AUTH =================

export const authService = {
  register: (username, email, password) =>
    axiosInstance
      .post('/auth/register', {
        username,
        email,
        password
      })
      .catch((error) => {
        const message =
          error.response?.data?.message || 'Registration failed';

        logger.error('Register failed:', message);

        throw new Error(message);
      }),

  login: (email, password) =>
    axiosInstance
      .post('/auth/login', {
        email,
        password
      })
      .catch((error) => {
        const message =
          error.response?.data?.message || 'Login failed';

        logger.error('Login failed:', message);

        throw new Error(message);
      }),

  logout: () =>
    axiosInstance.post('/auth/logout', {}).catch((error) => {
      logger.error('Logout error:', error);

      return Promise.resolve();
    })
};

// ================= USERS =================

export const userService = {
  getAllUsers: () =>
    axiosInstance.get('/users/all'),

  getOnlineUsers: () =>
    axiosInstance.get('/users/online'),

  getUserProfile: (userId) =>
    axiosInstance.get(`/users/profile/${userId}`),

  updateProfile: (userId, data) =>
    axiosInstance.put(`/users/profile/${userId}`, data),

  searchUsers: (query) =>
    axiosInstance.get(
      `/users/search?q=${encodeURIComponent(query)}`
    ),

  getNotifications: () =>
    axiosInstance.get('/users/notifications'),

  markNotificationsRead: () =>
    axiosInstance.post('/users/notifications/read-all', {})
};

// ================= ROOMS =================

export const roomService = {
  getAllRooms: () =>
    axiosInstance.get('/rooms/all'),

  getRoomDetails: (roomId) =>
    axiosInstance.get(`/rooms/${roomId}`),

  getRoomMembers: (roomId) =>
    axiosInstance.get(`/rooms/${roomId}/members`),

  createRoom: (name, description, is_public = true) =>
    axiosInstance.post('/rooms/create', {
      name,
      description,
      is_public
    }),

  joinRoom: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/join`, {}),

  leaveRoom: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/leave`, {}),

  inviteUser: (roomId, userId) =>
    axiosInstance.post(`/rooms/${roomId}/invite`, {
      userId
    }),

  acceptInvite: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/invite/accept`, {}),

  declineInvite: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/invite/decline`, {})
};

// ================= MESSAGES =================

export const messageService = {
  getRoomMessages: (roomId, page = 1, limit = 50) =>
    axiosInstance.get(
      `/messages/room/${roomId}?page=${page}&limit=${limit}`
    ),

  getConversationMessages: (
    conversationId,
    page = 1,
    limit = 50
  ) =>
    axiosInstance.get(
      `/messages/conversation/${conversationId}?page=${page}&limit=${limit}`
    ),

  markMessagesAsRead: (messageIds) =>
    axiosInstance.post('/messages/mark-read', {
      messageIds
    })
};

// ================= CONVERSATIONS =================

export const conversationService = {
  getAllConversations: () =>
    axiosInstance.get('/conversations'),

  getOrCreateConversation: (userId) =>
    axiosInstance.post(
      `/conversations/with/${userId}`,
      {}
    )
};

export default axiosInstance;