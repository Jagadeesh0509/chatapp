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

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://symmetrical-potato-qrvxwqg6p7c4xjr-3000.app.github.dev'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow tools like curl/Postman and same-origin requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // temporary allow-all for your deadline
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

// Socket.io
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    const logMessage = `[${level.toUpperCase()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;

    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage);
    }
  });

  next();
});

const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DATABASE_URL || './data/chat_app.db';

let db;

async function startServer() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialization completed successfully');

    db = new Database(DB_PATH);
    await db.open();
    console.log('Database opened successfully');

    io.use(socketAuthMiddleware);
    createSocketHandlers(io, db);

    const authRoutes = createAuthRoutes(db);

    app.use(
      '/api/auth',
      (req, res, next) => {
        if (req.path === '/register' || req.path === '/login') {
          return next();
        }
        authMiddleware(req, res, next);
      },
      authRoutes
    );

    app.use('/api/users', authMiddleware, createUserRoutes(db));
    app.use('/api/rooms', authMiddleware, createRoomRoutes(db));
    app.use('/api/messages', authMiddleware, createMessageRoutes(db));
    app.use('/api/conversations', authMiddleware, createConversationRoutes(db));

    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'Backend is running',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/', (req, res) => {
      res.send('Chat App Backend Running');
    });

    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl
      });
    });

    app.use(errorMiddleware);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log('✓ Socket.io listening for connections');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (db) await db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();