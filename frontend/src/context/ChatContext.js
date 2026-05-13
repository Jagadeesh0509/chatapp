import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { io } from 'socket.io-client';

const ChatContext = createContext();

function decodeTokenPayload(token) {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');

    const decodedPayload = atob(normalizedPayload);

    return JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
}

function parseMentions(rawMentions) {
  if (Array.isArray(rawMentions)) {
    return rawMentions;
  }

  try {
    return rawMentions ? JSON.parse(rawMentions) : [];
  } catch (error) {
    return [];
  }
}

function normalizeMessage(message) {
  return {
    ...message,
    mentions: parseMentions(message.mentions),
    readBy: Array.isArray(message.readBy)
      ? message.readBy
      : []
  };
}

export function ChatProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [socket, setSocket] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  const [messages, setMessages] = useState([]);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] =
    useState(null);

  const [typingUsers, setTypingUsers] = useState(
    new Set()
  );

  const [notifications, setNotifications] = useState([]);

  const [error, setError] = useState(null);

  // ================= AUTH CHECK =================

  useEffect(() => {
    const storedToken =
      sessionStorage.getItem('token');

    const storedUser =
      sessionStorage.getItem('user');

    if (!storedToken) {
      setAuthReady(true);
      return;
    }

    const tokenPayload =
      decodeTokenPayload(storedToken);

    const isTokenExpired =
      !tokenPayload?.exp ||
      tokenPayload.exp <=
        Math.floor(Date.now() / 1000);

    if (isTokenExpired) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      setAuthReady(true);

      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setAuthReady(true);
        return;
      } catch (error) {
        sessionStorage.removeItem('user');
      }
    }

    if (
      tokenPayload?.id &&
      tokenPayload?.username &&
      tokenPayload?.email
    ) {
      setUser({
        id: tokenPayload.id,
        username: tokenPayload.username,
        email: tokenPayload.email
      });
    }

    setAuthReady(true);
  }, []);

  // ================= SOCKET =================

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const token =
      sessionStorage.getItem('token');

    const SOCKET_URL =
      process.env.REACT_APP_SOCKET_URL ||
      'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: {
        token
      },

      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,

      transports: ['websocket', 'polling']
    });

    // ================= DEBUG =================

    newSocket.on('connect', () => {
      console.log(
        '✅ Socket connected:',
        newSocket.id
      );
    });

    newSocket.on('connect_error', (err) => {
      console.log(
        '❌ Socket connection error:',
        err.message
      );
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    // ================= MESSAGE EVENTS =================

    newSocket.on(
      'message:received',
      (message) => {
        setMessages((prev) => [
          ...prev,
          normalizeMessage(message)
        ]);
      }
    );

    newSocket.on(
      'message:edited',
      (updatedMessage) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === updatedMessage.id
              ? normalizeMessage(updatedMessage)
              : message
          )
        );
      }
    );

    newSocket.on(
      'message:deleted',
      ({ messageId }) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  is_deleted: 1,
                  deleted_at:
                    new Date().toISOString()
                }
              : message
          )
        );
      }
    );

    // ================= TYPING =================

    newSocket.on(
      'user:typing',
      ({ username }) => {
        setTypingUsers(
          (prev) => new Set(prev).add(username)
        );
      }
    );

    newSocket.on(
      'user:stopped-typing',
      ({ username, userId }) => {
        setTypingUsers((prev) => {
          const updated = new Set(prev);

          updated.delete(username || userId);

          return updated;
        });
      }
    );

    // ================= ONLINE STATUS =================

    newSocket.on(
      'user:status-changed',
      ({ userId, status }) => {
        setOnlineUsers((prev) =>
          prev.map((listedUser) =>
            listedUser.id === userId
              ? {
                  ...listedUser,
                  status
                }
              : listedUser
          )
        );

        setConversations((prev) =>
          prev.map((conversation) =>
            Number(
              conversation.participant?.id
            ) === Number(userId)
              ? {
                  ...conversation,
                  participant: {
                    ...conversation.participant,
                    status
                  }
                }
              : conversation
          )
        );
      }
    );

    // ================= READ RECEIPTS =================

    newSocket.on(
      'message:read-receipt',
      ({
        messageId,
        userId,
        username,
        readAt
      }) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  readBy: [
                    ...(message.readBy || []).filter(
                      (receipt) =>
                        receipt.userId !== userId
                    ),

                    {
                      userId,
                      username,
                      readAt
                    }
                  ]
                }
              : message
          )
        );
      }
    );

    // ================= NOTIFICATIONS =================

    newSocket.on(
      'notification:received',
      (notification) => {
        setNotifications((prev) => [
          notification,
          ...prev
        ]);
      }
    );

    // ================= ERRORS =================

    newSocket.on('error', (errorData) => {
      setError(errorData.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // ================= LOGIN =================

  const login = useCallback(
    (userData, token) => {
      setUser(userData);

      sessionStorage.setItem(
        'token',
        token
      );

      sessionStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      setAuthReady(true);
    },
    []
  );

  // ================= LOGOUT =================

  const logout = useCallback(() => {
    setUser(null);

    setMessages([]);

    setCurrentRoom(null);

    setCurrentConversation(null);

    setNotifications([]);

    sessionStorage.removeItem('token');

    sessionStorage.removeItem('user');

    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  // ================= UPDATE USER =================

  const updateCurrentUser = useCallback(
    (userData) => {
      setUser((prev) => {
        const nextUser = {
          ...prev,
          ...userData
        };

        sessionStorage.setItem(
          'user',
          JSON.stringify(nextUser)
        );

        return nextUser;
      });
    },
    []
  );

  // ================= ROOM =================

  const joinRoom = useCallback(
    (roomId) => {
      if (socket && roomId) {
        socket.emit('room:join', {
          roomId
        });
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (roomId) => {
      if (socket && roomId) {
        socket.emit('room:leave', {
          roomId
        });
      }
    },
    [socket]
  );

  // ================= MESSAGE =================

  const sendMessage = useCallback(
    (
      content,
      roomId,
      conversationId,
      mentions = []
    ) => {
      if (socket) {
        socket.emit('message:send', {
          content,
          roomId,
          conversationId,
          mentions
        });
      }
    },
    [socket]
  );

  const editMessage = useCallback(
    (messageId, newContent) => {
      if (socket) {
        socket.emit('message:edit', {
          messageId,
          newContent
        });
      }
    },
    [socket]
  );

  const deleteMessage = useCallback(
    (messageId) => {
      if (socket) {
        socket.emit('message:delete', {
          messageId
        });
      }
    },
    [socket]
  );

  // ================= TYPING =================

  const startTyping = useCallback(
    (roomId, conversationId) => {
      if (socket) {
        socket.emit('typing:start', {
          roomId,
          conversationId
        });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (roomId, conversationId) => {
      if (socket) {
        socket.emit('typing:stop', {
          roomId,
          conversationId
        });
      }
    },
    [socket]
  );

  // ================= READ =================

  const markMessageAsRead = useCallback(
    (messageId, conversationId) => {
      if (socket) {
        socket.emit('message:read', {
          messageId,
          conversationId
        });
      }
    },
    [socket]
  );

  // ================= CONVERSATION =================

  const joinConversation = useCallback(
    (conversationId) => {
      if (socket && conversationId) {
        socket.emit(
          'conversation:join',
          {
            conversationId
          }
        );
      }
    },
    [socket]
  );

  const leaveConversation = useCallback(
    (conversationId) => {
      if (socket && conversationId) {
        socket.emit(
          'conversation:leave',
          {
            conversationId
          }
        );
      }
    },
    [socket]
  );

  // ================= NOTIFICATIONS =================

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ================= CONTEXT VALUE =================

  const value = {
    authReady,

    user,

    socket,

    rooms,
    setRooms,

    currentRoom,
    setCurrentRoom,

    messages,
    setMessages,

    onlineUsers,
    setOnlineUsers,

    conversations,
    setConversations,

    currentConversation,
    setCurrentConversation,

    typingUsers,

    notifications,
    setNotifications,

    error,
    setError,

    login,
    logout,

    updateCurrentUser,

    joinRoom,
    leaveRoom,

    sendMessage,
    editMessage,
    deleteMessage,

    startTyping,
    stopTyping,

    markMessageAsRead,

    joinConversation,
    leaveConversation,

    clearNotifications
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error(
      'useChat must be used within ChatProvider'
    );
  }

  return context;
}