# Chat Application - MERN Stack

A real-time chat application built with React.js, Node.js, Express.js, Socket.io, and SQLite.


###LIVE : https://chatapp-alpha-peach.vercel.app/login ###

## Features

### Core Features
- **User Authentication**: JWT-based registration and login system
- **Public & Private Chat Rooms**: Create, join, invite members, and chat in rooms
- **Channel Invitations**: Real-time room invitations with instant accept/decline banners
- **Private Messaging**: One-on-one direct conversations with teammates
- **Real-time Updates**: Instant message delivery and presence via Socket.io
- **Instant Online Presence**: Real-time online/offline indicators without page reloads
- **Typing Indicators**: See when others are typing in real time
- **Message Read Receipts**: Live read receipts for private messages
- **Message Editing & Deletion**: Edit or delete sent messages with edit history
- **@Mentions**: Mention users with instant push notifications
- **WebRTC Voice & Video Calls**: Peer-to-peer 1-on-1 audio and video calling
- **Search**: Search users, conversations, channels, and messages

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
- `POST /api/auth/logout` - Logout user (broadcasts instant offline status)

### Users
- `GET /api/users/all` - Get all users
- `GET /api/users/online` - Get online users
- `GET /api/users/profile/:userId` - Get user profile
- `PUT /api/users/profile/:userId` - Update profile
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/notifications` - Get user notifications
- `POST /api/users/notifications/read-all` - Mark notifications as read

### Rooms
- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/all` - Get all public rooms
- `GET /api/rooms/:roomId` - Get room details
- `GET /api/rooms/:roomId/members` - Get room members
- `POST /api/rooms/:roomId/join` - Join room
- `POST /api/rooms/:roomId/leave` - Leave room
- `POST /api/rooms/:roomId/invite` - Invite a user to a room (triggers real-time notification)
- `POST /api/rooms/:roomId/invite/accept` - Accept room invitation
- `POST /api/rooms/:roomId/invite/decline` - Decline room invitation

### Conversations (Direct Messaging)
- `GET /api/conversations` - Get all user direct conversations
- `POST /api/conversations/direct/:userId` - Get or create conversation with user
- `GET /api/conversations/:conversationId` - Get conversation details

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

### Real-Time User Presence
- `user:status-changed` - Real-time online/offline status broadcast immediately upon connection/disconnection/logout without needing page reloads

### Notification Events
- `notification:received` - Real-time delivery of mentions and room invites directly to target user socket rooms (`user:${userId}`)
- `notification:handled` - Notification dismissal when invite is accepted/declined

### WebRTC Audio & Video Calling
- `call:initiate` - Initiate peer-to-peer call offer
- `call:incoming` - Incoming call alert
- `call:accept` - Accept call with SDP answer
- `call:ice-candidate` - ICE candidate negotiation
- `call:reject` - Decline incoming call
- `call:end` - Terminate active call

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
