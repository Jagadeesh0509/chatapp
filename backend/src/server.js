require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const Database = require('./db/database');
const socketAuthMiddleware = require('./middleware/socketAuth');
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/errorHandler');

const createAuthRoutes = require('./routes/auth');
const createUserRoutes = require('./routes/users');
const createRoomRoutes = require('./routes/rooms');
const createMessageRoutes = require('./routes/messages');
const createConversationRoutes = require('./routes/conversations');

const createSocketHandlers = require('./handlers/socketHandlers');
const { initializeDatabase } = require('./db/init');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.CORS_ORIGIN;

// CORS
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://chatapp-alpha-peach.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },

  transports: ['websocket', 'polling']
});

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DATABASE_URL || './data/chat_app.db';

let db;

async function startServer() {
  try {
    console.log('Initializing database...');

    await initializeDatabase();

    db = new Database(DB_PATH);

    await db.open();

    console.log('Database opened successfully');

    // Socket middleware
    io.use(socketAuthMiddleware);

    // Socket handlers
    createSocketHandlers(io, db);

    // Auth routes
    const authRoutes = createAuthRoutes(db);

    app.use(
      '/api/auth',
      (req, res, next) => {
        if (
          req.path === '/register' ||
          req.path === '/login'
        ) {
          return next();
        }

        authMiddleware(req, res, next);
      },
      authRoutes
    );

    // Protected routes
    app.use('/api/users', authMiddleware, createUserRoutes(db));

    app.use('/api/rooms', authMiddleware, createRoomRoutes(db));

    app.use('/api/messages', authMiddleware, createMessageRoutes(db));

    app.use(
      '/api/conversations',
      authMiddleware,
      createConversationRoutes(db)
    );

    // Health route
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'Backend running'
      });
    });

    // Root route
    app.get('/', (req, res) => {
      res.send('Chat backend running');
    });

    // 404
    app.use((req, res) => {
      res.status(404).json({
        error: 'Route not found'
      });
    });

    // Error middleware
    app.use(errorMiddleware);

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();