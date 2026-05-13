import axios from 'axios';

const hostname = window.location.hostname;

const API_URL = hostname.includes("github.dev")
  ? `https://${hostname.replace("-3000", "-5000")}/api`
  : "http://localhost:5000/api";
  
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

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

// Request interceptor to add auth token
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

// Response interceptor for error handling and logging
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
      // Server responded with error status
      const errorData = {
        status: response.status,
        message: response.data?.message || message,
        url: response.config?.url,
        timestamp: new Date().toISOString()
      };
      logger.error('Response error:', errorData);

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (request) {
      // Request made but no response
      logger.error('No response from server:', {
        url: error.config?.url,
        message: 'Network error or server unreachable'
      });
    } else {
      // Error in request setup
      logger.error('Request setup error:', message);
    }

    return Promise.reject(error);
  }
);


// Authentication endpoints
export const authService = {
  register: (username, email, password) =>
    axiosInstance.post('/auth/register', { username, email, password }).catch(error => {
      const message = error.response?.data?.message || 'Registration failed';
      logger.error('Register failed:', message);
      throw new Error(message);
    }),
  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }).catch(error => {
      const message = error.response?.data?.message || 'Login failed';
      logger.error('Login failed:', message);
      throw new Error(message);
    }),
  logout: () =>
    axiosInstance.post('/auth/logout', {}).catch(error => {
      logger.error('Logout error:', error);
      // Don't throw - always clear local storage
      return Promise.resolve();
    })
};

// User endpoints
export const userService = {
  getAllUsers: () =>
    axiosInstance.get('/users/all').catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch users';
      logger.error('Get all users failed:', message);
      throw error;
    }),
  getOnlineUsers: () =>
    axiosInstance.get('/users/online').catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch online users';
      logger.error('Get online users failed:', message);
      throw error;
    }),
  getUserProfile: (userId) =>
    axiosInstance.get(`/users/profile/${userId}`).catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch user profile';
      logger.error('Get user profile failed:', message);
      throw error;
    }),
  updateProfile: (userId, data) =>
    axiosInstance.put(`/users/profile/${userId}`, data).catch(error => {
      const message = error.response?.data?.message || 'Failed to update profile';
      logger.error('Update profile failed:', message);
      throw error;
    }),
  searchUsers: (query) =>
    axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}`).catch(error => {
      const message = error.response?.data?.message || 'Failed to search users';
      logger.error('Search users failed:', message);
      throw error;
    }),
  getNotifications: () =>
    axiosInstance.get('/users/notifications').catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch notifications';
      logger.error('Get notifications failed:', message);
      throw error;
    }),
  markNotificationsRead: () =>
    axiosInstance.post('/users/notifications/read-all', {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to mark notifications as read';
      logger.error('Mark notifications read failed:', message);
      throw error;
    })
};

// Room endpoints
export const roomService = {
  getAllRooms: () =>
    axiosInstance.get('/rooms/all').catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch rooms';
      logger.error('Get all rooms failed:', message);
      throw error;
    }),
  getRoomDetails: (roomId) =>
    axiosInstance.get(`/rooms/${roomId}`).catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch room details';
      logger.error('Get room details failed:', message);
      throw error;
    }),
  getRoomMembers: (roomId) =>
    axiosInstance.get(`/rooms/${roomId}/members`).catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch room members';
      logger.error('Get room members failed:', message);
      throw error;
    }),
  createRoom: (name, description, is_public = true) =>
    axiosInstance.post('/rooms/create', { name, description, is_public }).catch(error => {
      const message = error.response?.data?.message || 'Failed to create room';
      logger.error('Create room failed:', message);
      throw error;
    }),
  joinRoom: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/join`, {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to join room';
      logger.error('Join room failed:', message);
      throw error;
    }),
  leaveRoom: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/leave`, {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to leave room';
      logger.error('Leave room failed:', message);
      throw error;
    }),
  inviteUser: (roomId, userId) =>
    axiosInstance.post(`/rooms/${roomId}/invite`, { userId }).catch(error => {
      const message = error.response?.data?.message || 'Failed to invite user';
      logger.error('Invite user failed:', message);
      throw error;
    }),
  acceptInvite: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/invite/accept`, {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to accept invite';
      logger.error('Accept invite failed:', message);
      throw error;
    }),
  declineInvite: (roomId) =>
    axiosInstance.post(`/rooms/${roomId}/invite/decline`, {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to decline invite';
      logger.error('Decline invite failed:', message);
      throw error;
    })
};

// Message endpoints
export const messageService = {
  getRoomMessages: (roomId, page = 1, limit = 50) =>
    axiosInstance.get(`/messages/room/${roomId}?page=${page}&limit=${limit}`).catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch room messages';
      logger.error('Get room messages failed:', message);
      throw error;
    }),
  getConversationMessages: (conversationId, page = 1, limit = 50) =>
    axiosInstance.get(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`).catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch conversation messages';
      logger.error('Get conversation messages failed:', message);
      throw error;
    }),
  markMessagesAsRead: (messageIds) =>
    axiosInstance.post('/messages/mark-read', { messageIds }).catch(error => {
      const message = error.response?.data?.message || 'Failed to mark messages as read';
      logger.error('Mark messages read failed:', message);
      throw error;
    })
};

export const conversationService = {
  getAllConversations: () =>
    axiosInstance.get('/conversations').catch(error => {
      const message = error.response?.data?.message || 'Failed to fetch conversations';
      logger.error('Get all conversations failed:', message);
      throw error;
    }),
  getOrCreateConversation: (userId) =>
    axiosInstance.post(`/conversations/with/${userId}`, {}).catch(error => {
      const message = error.response?.data?.message || 'Failed to get or create conversation';
      logger.error('Get or create conversation failed:', message);
      throw error;
    })
};
