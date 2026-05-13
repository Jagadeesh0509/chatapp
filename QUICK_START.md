# Quick Start Guide

Get your chat application running in less than 5 minutes!

## Prerequisites
- Node.js v14+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## TL;DR - Quick Setup

### Terminal 1: Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```

### Terminal 2: Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

The app will open at `http://localhost:3000`

## First Time Usage

1. **Register:** Create a new account
2. **Create Room:** Click "+" to create a chat room
3. **Send Message:** Type and send messages in real-time
4. **Open Another Tab:** Create another user to see real-time messaging

## Key Features to Try

### ✨ Real-Time Messaging
- Send messages instantly in rooms
- See typing indicators
- Message delivery confirmation

### 👥 Public Rooms
- Create unlimited rooms
- Invite others to join
- Room descriptions for context

### 💬 Private Conversations
- Direct messages with users
- Read receipts
- Message history

### ✏️ Message Management
- Edit your messages
- Delete messages
- View edit history

### 🔔 User Status
- See who's online
- Real-time status updates
- User presence tracking

### 🎯 @Mentions
- Mention users with @username
- Get notifications
- Highlight important messages

## Troubleshooting Quick Fixes

**Backend won't start?**
```bash
# Kill process on port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Frontend won't connect?**
- Check backend is running: `http://localhost:5000/api/health`
- Clear browser cache: Ctrl+Shift+Delete
- Restart frontend: `npm start`

**Database issues?**
```bash
cd backend
rm -rf data/chat_app.db
npm run db:init
```

## Project Structure

```
backend/          # Express server + WebSocket
frontend/         # React application
README.md         # Full documentation
INSTALLATION.md   # Detailed setup guide
API_DOCUMENTATION.md  # API reference
```

## Useful Commands

**Backend:**
- `npm run dev` - Development with auto-reload
- `npm start` - Production mode
- `npm run db:init` - Initialize database
- `npm test` - Run tests

**Frontend:**
- `npm start` - Start dev server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Advanced (one-way operation)

## Environment Files

Already configured with defaults, but you can customize:

**backend/.env:**
```ini
PORT=5000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

**frontend/.env:**
```ini
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Testing Locally

### Test Real-Time Features
1. Open frontend in two browser windows
2. Login as different users in each
3. Send messages - see instant delivery
4. Watch typing indicators appear
5. See status updates in real-time

### Test Edge Cases
- Send very long messages
- Rapid message sending
- Join/leave rooms quickly
- Disconnect and reconnect

## Next Steps

### Customize
- Edit `frontend/src/styles/global.css` for theme
- Modify `frontend/src/components/` for UI changes
- Add new rooms, user features, etc.

### Deploy
- **Frontend:** Vercel, Netlify, AWS S3
- **Backend:** Heroku, AWS EC2, DigitalOcean

### Scale
- Add user roles and permissions
- Implement file uploads
- Add voice/video calls
- Implement message search
- Add user blocking features

## Architecture

```
┌─────────────────────────────────────────────┐
│         React Frontend (3000)                │
│  ┌─────────────────────────────────────┐   │
│  │  Pages: Login, Register, Dashboard  │   │
│  │  Components: Chat, Messages, Rooms  │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │ HTTP + WebSocket
               │
┌──────────────▼──────────────────────────────┐
│        Node.js Backend (5000)                │
│  ┌─────────────────────────────────────┐   │
│  │  Express Router + Socket.io          │   │
│  │  Authentication + Real-time Events   │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │ SQL Queries
               │
┌──────────────▼──────────────────────────────┐
│        SQLite Database                       │
│  ┌─────────────────────────────────────┐   │
│  │  Users, Rooms, Messages, Status      │   │
│  │  Conversations, Read Receipts        │   │
│  └─────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## Performance Tips

- Messages are paginated (50 per load)
- Typing indicators debounced (3 seconds)
- Status updates throttled
- Socket rooms prevent unnecessary broadcasting

## Security Notes

- Passwords hashed with bcryptjs
- JWT tokens expire after 7 days
- CORS enabled only for frontend origin
- Input validation on all endpoints
- SQL injection protection via parameterized queries

## Support & Resources

- **Backend Issues:** Check `backend/` logs
- **Frontend Issues:** Open DevTools (F12)
- **Database Issues:** Check WebStorm DB viewer or SQLite CLI
- **Docs:** See API_DOCUMENTATION.md and INSTALLATION.md

## License

Part of educational assignment.

---

**Happy Chatting!** 🎉
