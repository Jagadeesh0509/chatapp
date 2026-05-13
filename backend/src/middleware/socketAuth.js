const TokenManager = require('../utils/tokenManager');

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('No token provided'));
    }

    const decoded = TokenManager.verifyToken(token);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

module.exports = socketAuthMiddleware;
