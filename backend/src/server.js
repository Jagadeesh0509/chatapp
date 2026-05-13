require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('./db/database');
const socketAuthMiddleware = require('./middleware/socketAuth');
const authMiddleware = require('./middleware/auth');
const createAuthRoutes = require('./routes/auth');
const createUserRoutes = require('./routes/users');
const createRoomRoutes = require('./routes/rooms');
const createMessageRoutes = require('./routes/messages');
const createConversationRoutes = require('./routes/conversations');
const createSocketHandlers = require('./handlers/socketHandlers');
const { initializeDatabase } = require('./db/init');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DATABASE_URL || './data/chat_app.db';

let db;

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    db = new Database(DB_PATH);
    await db.open();
    console.log('Database opened successfully');

    // Setup Socket.io authentication middleware
    io.use(socketAuthMiddleware);

    // Setup Socket.io handlers
    createSocketHandlers(io, db);

    // Routes - Register/login are public, remaining auth routes require a token.
    const authRoutes = createAuthRoutes(db);

    app.use('/api/auth', (req, res, next) => {
      // Register and login don't need auth
      if (req.path === '/register' || req.path === '/login') {
        return next();
      }
      authMiddleware(req, res, next);
    }, authRoutes);

    app.use('/api/users', authMiddleware, createUserRoutes(db));
    app.use('/api/rooms', authMiddleware, createRoomRoutes(db));
    app.use('/api/messages', authMiddleware, createMessageRoutes(db));
    app.use('/api/conversations', authMiddleware, createConversationRoutes(db));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    server.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Socket.io listening for connections`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (db) {
    await db.close();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
