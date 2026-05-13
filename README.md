# Chat Application - MERN Stack

A real-time chat application built with React.js, Node.js, Express.js, Socket.io, and SQLite.

## Features

### Core Features
- **User Authentication**: JWT-based registration and login system
- **Public Chat Rooms**: Create, join, and chat in public rooms
- **Private Messaging**: One-on-one private conversations
- **Real-time Updates**: Instant message delivery via Socket.io
- **Typing Indicators**: See when others are typing
- **Online Status**: Track user online/offline status
- **Message Read Receipts**: Know when messages have been read
- **Message Editing & Deletion**: Edit or delete sent messages
- **@Mentions**: Mention other users with notifications
- **User Presence**: Real-time user presence tracking
- **Search**: Search for users and rooms

### Technical Features
- RESTful API for initial data loading
- Socket.io for real-time communication
- Secure password hashing with bcryptjs
- JWT token-based authentication
- SQLite database with normalized schema
- Message pagination
- Edit history tracking
- Soft delete messages

## Project Structure

```
ChatApp/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js      # Database connection management
│   │   │   ├── init.js          # Database initialization
│   │   │   └── schema.sql       # Database schema
│   │   ├── middleware/
│   │   │   ├── auth.js          # Express auth middleware
│   │   │   └── socketAuth.js    # Socket.io auth middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Authentication routes
│   │   │   ├── users.js         # User routes
│   │   │   ├── rooms.js         # Room routes
│   │   │   └── messages.js      # Message routes
│   │   ├── handlers/
│   │   │   └── socketHandlers.js # Socket.io event handlers
│   │   ├── utils/
│   │   │   ├── tokenManager.js  # JWT token management
│   │   │   └── passwordManager.js # Password hashing
│   │   └── server.js            # Main server file
│   ├── data/                    # SQLite database file (created on init)
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.js    # Main chat display
│   │   │   ├── MessageList.js   # Message rendering
│   │   │   ├── MessageInput.js  # Message input form
│   │   │   ├── RoomList.js      # Room list sidebar
│   │   │   ├── UserList.js      # Online users display
│   │   │   └── Sidebar.js       # Navigation sidebar
│   │   ├── pages/
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   └── Dashboard.js     # Main dashboard
│   │   ├── context/
│   │   │   └── ChatContext.js   # Global chat state management
│   │   ├── services/
│   │   │   └── api.js           # API client and Socket.io setup
│   │   ├── styles/
│   │   │   ├── global.css       # Global styles
│   │   │   ├── auth.css         # Auth pages styles
│   │   │   ├── dashboard.css    # Dashboard styles
│   │   │   ├── sidebar.css      # Sidebar styles
│   │   │   ├── chatWindow.css   # Chat window styles
│   │   │   ├── messageList.css  # Message list styles
│   │   │   ├── messageInput.css # Message input styles
│   │   │   ├── roomList.css     # Room list styles
│   │   │   └── userList.css     # User list styles
│   │   ├── App.js               # Main App component
│   │   └── index.js             # React entry point
│   ├── public/
│   │   └── index.html           # HTML template
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

## Database Schema

### Tables
- **users**: User accounts with authentication data
- **chat_rooms**: Public chat rooms
- **room_members**: Many-to-many relationship between users and rooms
- **private_conversations**: Private conversation pairs
- **messages**: Chat messages (polymorphic - for rooms OR conversations)
- **message_read_receipts**: Read status for private messages
- **user_presence**: Real-time user presence tracking
- **message_edit_history**: Track message edits
- **notifications**: User notifications for mentions and other events

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Initialize database
npm run db:init

# Start server (development)
npm run dev

# Start server (production)
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

## Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=./data/chat_app.db
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/all` - Get all users
- `GET /api/users/online` - Get online users
- `GET /api/users/profile/:userId` - Get user profile
- `PUT /api/users/profile/:userId` - Update profile
- `GET /api/users/search?q=query` - Search users

### Rooms
- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/all` - Get all public rooms
- `GET /api/rooms/:roomId` - Get room details
- `GET /api/rooms/:roomId/members` - Get room members
- `POST /api/rooms/:roomId/join` - Join room
- `POST /api/rooms/:roomId/leave` - Leave room

### Messages
- `GET /api/messages/room/:roomId` - Get room messages
- `GET /api/messages/conversation/:conversationId` - Get conversation messages
- `POST /api/messages/mark-read` - Mark messages as read

## Socket.io Events

### Room Events
- `room:join` - Join a room
- `room:leave` - Leave a room
- `room:user-joined` - User joined notification
- `room:user-left` - User left notification

### Message Events
- `message:send` - Send a message
- `message:received` - Receive a message
- `message:edit` - Edit a message
- `message:edited` - Message edited notification
- `message:delete` - Delete a message
- `message:deleted` - Message deleted notification
- `message:read` - Mark message as read
- `message:read-receipt` - Read receipt notification

### Typing Events
- `typing:start` - User started typing
- `user:typing` - User typing notification
- `typing:stop` - User stopped typing
- `user:stopped-typing` - User stopped typing notification

### Conversation Events
- `conversation:join` - Join a conversation
- `conversation:leave` - Leave a conversation

### User Events
- `user:status-changed` - User status changed

### Notification Events
- `notification:received` - Receive notification

## Development

### Running Both Servers

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Future Enhancements

- [ ] File upload support (images, documents)
- [ ] Message reactions/emojis
- [ ] Voice/Video calls integration
- [ ] Message search
- [ ] User roles and permissions
- [ ] Message encryption
- [ ] Notification preferences
- [ ] Do not disturb mode
- [ ] User blocking
- [ ] Message forwarding
- [ ] Pin important messages
- [ ] Threaded conversations
- [ ] Group direct messages

## Security Considerations

- Passwords are hashed using bcryptjs with salt rounds of 10
- JWT tokens expire after 7 days (configurable)
- Socket.io connections require valid JWT authentication
- API endpoints require Bearer token authentication
- CORS is configured to only allow specified origin
- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- XSS protection through React's automatic escaping

## Performance Optimization

- Message pagination (50 messages per page by default)
- Indexed database queries for fast lookups
- Socket.io room-based broadcasting (no unnecessary global broadcasts)
- Typing indicator debouncing
- Lazy loading of message history
- Efficient status update throttling

## Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use
- Check if `.env` file is configured correctly
- Verify Node.js version (14+)

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check REACT_APP_API_URL and REACT_APP_SOCKET_URL in `.env`
- Clear browser cache and reload

### Database errors
- Ensure `data/` directory has write permissions
- Try deleting `chat_app.db` and run `npm run db:init` again

## License

This project is part of an assignment for educational purposes.

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
