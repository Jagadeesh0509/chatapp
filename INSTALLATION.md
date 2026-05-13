# Installation & Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **SQLite** (optional - will be installed via npm)
- **Git** (for version control)

Verify installation:
```bash
node --version
npm --version
```

## Step-by-Step Installation

### 1. Backend Setup

#### 1.1 Navigate to Backend Directory
```bash
cd backend
```

#### 1.2 Create Environment File
```bash
cp .env.example .env
```

Edit the `.env` file to customize:
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT (change in production)
- `DATABASE_URL` - SQLite database path
- `CORS_ORIGIN` - Frontend URL for CORS

#### 1.3 Install Dependencies
```bash
npm install
```

This will install:
- express - Web framework
- socket.io - Real-time communication
- sqlite3 - Database driver
- sequelize - Optional ORM
- jwt-simple - JWT handling
- bcryptjs - Password hashing
- cors - CORS middleware
- dotenv - Environment variables
- express-validator - Input validation

#### 1.4 Initialize Database
```bash
npm run db:init
```

This will:
- Create the `data/` directory
- Create `chat_app.db` file
- Initialize database schema with all tables

#### 1.5 Start Backend Server
**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Socket.io listening for connections
```

### 2. Frontend Setup

Open a new terminal and:

#### 2.1 Navigate to Frontend Directory
```bash
cd frontend
```

#### 2.2 Create Environment File
```bash
cp .env.example .env
```

The default values should work if backend is on localhost:5000:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

#### 2.3 Install Dependencies
```bash
npm install
```

This will install:
- react - Front-end library
- react-dom - React DOM renderer
- react-router-dom - Routing
- socket.io-client - WebSocket client
- axios - HTTP client
- date-fns - Date formatting
- react-markdown - Markdown support

#### 2.4 Start Frontend Development Server
```bash
npm start
```

The app will automatically open at `http://localhost:3000`

## Verify Installation

### Test Backend API
Open a terminal and run:
```bash
curl http://localhost:5000/api/health
```

You should get:
```json
{"status":"OK","timestamp":"2024-05-12T..."}
```

### Test Frontend Connection
- Navigate to `http://localhost:3000/login`
- You should see the login page

## Running the Application

### Development Setup

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

Both servers will run concurrently:
- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

### Testing the Application

1. **Register a new account:**
   - Go to http://localhost:3000/register
   - Fill in username, email, and password
   - Click "Register"

2. **Login:**
   - Go to http://localhost:3000/login
   - Use the credentials you just created
   - You'll be redirected to the dashboard

3. **Create a room:**
   - Click the "+" button in the chat sidebar
   - Enter room name and description
   - Click "Create Room"

4. **Send a message:**
   - Select a room
   - Type a message in the input box
   - Click Send or press Enter

5. **See real-time updates:**
   - Open the app in another browser/tab
   - Register another user
   - Join the same room
   - See messages in real-time

## Build for Production

### Frontend Build
```bash
cd frontend
npm run build
```

This creates an optimized build in `frontend/build/` directory.

### Backend for Production

1. Update `.env` with production values:
```
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=<your-domain>
```

2. Start server:
```bash
cd backend
npm start
```

## Troubleshooting

### Issue: "Port already in use"
**Solution:** Change the port in `.env`
```
PORT=5001
```

### Issue: "Cannot find module" errors
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database file not created
**Solution:** Create data directory manually
```bash
mkdir backend/data
npm run db:init
```

### Issue: Socket.io connection failing
**Solution:** 
- Verify backend is running
- Check REACT_APP_SOCKET_URL in frontend `.env`
- Check CORS_ORIGIN in backend `.env`

### Issue: Login not working
**Solution:**
- Clear browser localStorage
- Ensure backend database is initialized
- Check browser console for errors

## Environment Variables Reference

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment mode |
| DATABASE_URL | ./data/chat_app.db | SQLite database path |
| JWT_SECRET | your_secret_key | JWT signing secret |
| JWT_EXPIRY | 7d | JWT expiration time |
| CORS_ORIGIN | http://localhost:3000 | Frontend URL |
| LOG_LEVEL | debug | Logging level |

### Frontend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| REACT_APP_API_URL | http://localhost:5000/api | Backend API URL |
| REACT_APP_SOCKET_URL | http://localhost:5000 | Backend Socket.io URL |

## Next Steps

1. **Customize the UI:**
   - Edit files in `frontend/src/styles/`
   - Modify components in `frontend/src/components/`

2. **Add new features:**
   - Create new routes in `backend/src/routes/`
   - Add new components in `frontend/src/components/`

3. **Deploy:**
   - Use services like Heroku, AWS, or DigitalOcean
   - See deployment guides for each service

4. **Database Backups:**
   - Backup `backend/data/chat_app.db` regularly
   - Consider using cloud storage

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## Support

For issues:
1. Check the troubleshooting section above
2. Review error messages in browser console
3. Check backend logs in terminal
4. Refer to library documentation
