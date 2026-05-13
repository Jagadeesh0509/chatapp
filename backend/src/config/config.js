// Configuration for backend
module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || './data/chat_app.db',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // API Configuration
  API_PREFIX: '/api',
  API_VERSION: 'v1',

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,

  // Socket.io Configuration
  SOCKET_TRANSPORTS: ['websocket', 'polling'],
  SOCKET_PING_INTERVAL: 25000,
  SOCKET_PING_TIMEOUT: 60000,

  // Message Configuration
  MAX_MESSAGE_LENGTH: 5000,
  TYPING_TIMEOUT: 3000,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug'
};
