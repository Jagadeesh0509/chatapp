# Troubleshooting Guide

## Common Issues and Solutions

---

## Backend Issues

### Issue: "Port 5000 already in use"

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

**Option 1: Change the port**
```bash
# Edit backend/.env
PORT=5001

# Then restart: npm run dev
```

**Option 2: Kill the process using the port**

macOS/Linux:
```bash
# Find process on port 5000
lsof -ti:5000

# Kill it
lsof -ti:5000 | xargs kill -9

# Or use fuser
fuser -k 5000/tcp
```

Windows:
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with the number shown)
taskkill /PID <PID> /F
```

---

### Issue: "Cannot find module" errors

**Error Message:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend

# Clean install dependencies
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try running again
npm run dev
```

---

### Issue: Database not initializing

**Error Message:**
```
Error: ENOENT: no such file or directory, open './data/chat_app.db'
```

**Solution:**
```bash
cd backend

# Manually create data directory
mkdir data

# Then initialize database
npm run db:init

# Verify database was created
ls data/  # Should show 'chat_app.db'
```

---

### Issue: JWT Authentication errors

**Error Message:**
```
Error: Invalid or expired token
```

**Possible Causes:**
1. Token has expired (default: 7 days)
2. JWT_SECRET changed (invalidates all tokens)
3. Token format is wrong

**Solutions:**

**Solution 1: Clear token and login again**
```javascript
// In browser console:
localStorage.clear();
// Reload and login
```

**Solution 2: Adjust JWT_EXPIRY in .env**
```bash
# backend/.env
JWT_EXPIRY=30d  # Longer expiration
```

**Solution 3: Check JWT_SECRET**
```bash
# Ensure JWT_SECRET is consistent across restarts
# backend/.env
JWT_SECRET=<strong-random-secret>
```

---

### Issue: CORS errors

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

Check backend `.env`:
```bash
# backend/.env
CORS_ORIGIN=http://localhost:3000
```

Make sure:
1. Frontend is running on correct port
2. CORS_ORIGIN matches your frontend URL
3. Backend is restarted after changing `.env`

---

### Issue: Socket.io connection failing

**Error Message:**
```
Failed to connect to socket
```

**Symptoms:**
- Messages not updating in real-time
- Typing indicators don't work
- Status updates don't appear

**Solutions:**

**Step 1: Verify backend is running**
```bash
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","timestamp":"..."}
```

**Step 2: Check frontend .env**
```bash
# frontend/.env
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Step 3: Check browser console**
- Open DevTools (F12)
- Go to Console tab
- Look for connection errors

**Step 4: Verify network in DevTools**
- Open DevTools
- Go to Network tab
- Filter by "ws" (WebSocket)
- Should see Socket.io connection

**Step 5: Check browser compatibility**
```javascript
// In browser console:
if (typeof WebSocket !== 'undefined') {
  console.log('WebSocket supported');
} else {
  console.log('WebSocket NOT supported');
}
```

---

## Frontend Issues

### Issue: "localhost:3000 refused to connect"

**Error Message:**
```
This site can't be reached
```

**Solutions:**

**Check if frontend is running:**
```bash
# Terminal should show:
# Compiled successfully!
# Local: http://localhost:3000
```

**If not running:**
```bash
cd frontend
npm start
```

**If port 3000 is in use:**
```bash
# Find and kill process
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port (but update backend CORS_ORIGIN)
PORT=3001 npm start
```

---

### Issue: "Blank page" or "white screen"

**Possible Causes:**
1. JavaScript error
2. CSS not loading
3. React not compiled

**Solutions:**

**Step 1: Check browser console**
- Press F12
- Go to Console tab
- Look for red error messages

**Step 2: Check Network tab**
- Look for failed requests (red)
- Check if HTML, CSS, JS are loading

**Step 3: Hard refresh**
```
Windows/Linux: Ctrl+Shift+R
Mac: Cmd+Shift+R
```

**Step 4: Clear cache**
- Open DevTools (F12)
- Right-click reload button
- Select "Empty cache and hard reload"

**Step 5: Rebuild frontend**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### Issue: "Cannot login" or "Invalid credentials"

**Error Message:**
```
Invalid credentials
```

**Possible Causes:**
1. Account not created yet
2. Wrong email/password
3. Database not initialized

**Solutions:**

**Step 1: Verify account exists**
```bash
# In backend directory
sqlite3 data/chat_app.db
# sqlite> SELECT * FROM users;
# If no users, database wasn't initialized
```

**Step 2: Test registration**
Go to http://localhost:3000/register
- Create a new account
- Check for validation errors

**Step 3: Check backend logs**
- Look at terminal where backend is running
- Should see registration or login attempts

**Step 4: Reinitialize database**
```bash
cd backend
rm -rf data/chat_app.db
npm run db:init
# Try registering again
```

---

### Issue: "Messages not sending"

**Symptoms:**
- Type message, press send
- Message disappears from input
- Message doesn't appear in chat

**Solutions:**

**Step 1: Check Socket.io connection**
- Open DevTools Console
- Try: `console.log('Socket connected:', socket.connected)`
- Should print: `Socket connected: true`

**Step 2: Check browser console for errors**
- Press F12
- Go to Console tab
- Look for red errors about sending message

**Step 3: Verify in room**
- Make sure you've selected a room
- Not just viewing room list

**Step 4: Check network requests**
- DevTools > Network tab
- Send a message
- Look for Socket.io events (should see `/socket.io/`)

**Step 5: Restart Socket connection**
```javascript
// In browser console:
location.reload();  // Reload page
// Or refresh the browser
```

---

### Issue: "Real-time updates not working"

**Symptoms:**
- You send a message, others don't see it
- Typing indicators don't appear
- Status changes don't update

**Solutions:**

**Step 1: Verify both users in same room**
- Both users should see room selected
- Both should see same room name

**Step 2: Check Socket.io rooms**
DevTools > Network > WS
- Should see Socket.io events flowing

**Step 3: Restart both sessions**
```bash
# Reload both browser tabs/windows
```

**Step 4: Check backend logs**
- Terminal where backend is running
- Should see Socket.io events:
  ```
  [socket.io] User connected
  [socket.io] User joined room
  ```

**Step 5: Clear browser data**
```bash
# In DevTools Console:
localStorage.clear();
sessionStorage.clear();
# Reload
location.reload();
```

---

## Database Issues

### Issue: "Database locked"

**Error Message:**
```
Error: database is locked
```

**Causes:**
- Multiple processes accessing database
- Process didn't close properly

**Solutions:**

**Solution 1: Restart backend**
```bash
# Kill backend process (see port kill instructions)
# Start fresh:
npm run dev
```

**Solution 2: Delete and recreate database**
```bash
cd backend
rm data/chat_app.db
npm run db:init
```

---

### Issue: "Foreign key constraint failed"

**Error Message:**
```
Error: FOREIGN KEY constraint failed
```

**Causes:**
- Trying to insert invalid user ID
- Trying to delete user that has messages

**Solution:**
- This is a data integrity issue
- Restart with fresh database:
```bash
cd backend
rm data/chat_app.db
npm run db:init
```

---

### Issue: Cannot view database file

**Want to check what's in the database?**

**Option 1: Using SQLite CLI**
```bash
cd backend

# Install sqlite3 if needed
# macOS: brew install sqlite3
# Windows: choco install sqlite

# Open database
sqlite3 data/chat_app.db

# In sqlite prompt:
sqlite> .tables           # Show all tables
sqlite> SELECT * FROM users;  # View users
sqlite> SELECT * FROM chat_rooms;  # View rooms
sqlite> .quit             # Exit

```

**Option 2: Using VS Code Extension**
```bash
# Install SQLite extension in VS Code
# Then open data/chat_app.db from file explorer
```

**Option 3: Using Online Viewer**
1. Copy `data/chat_app.db` to your computer
2. Upload to https://sqliteonline.com/
3. View and query

---

## Network Issues

### Issue: "Cannot reach backend from frontend"

**Error:**
```
Failed to connect to http://localhost:5000
```

**Causes:**
- Backend not running
- Wrong URL in frontend .env
- Firewall blocking
- Browser security restrictions

**Solutions:**

**Step 1: Test backend directly**
```bash
curl http://localhost:5000/api/health

# Should return JSON response
```

**Step 2: Check frontend .env**
```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

**Step 3: Check firewall**
- Windows: Check Windows Defender Firewall
- macOS: System Preferences > Security & Privacy
- Linux: Check iptables or ufw

**Step 4: Test connectivity**
```bash
# macOS/Linux:
telnet localhost 5000

# Windows:
Test-NetConnection -ComputerName localhost -Port 5000
```

---

## Performance Issues

### Issue: "Application is slow"

**Solutions:**

**Step 1: Check network speed**
- DevTools > Network tab
- Send a message
- Look at request duration

**Step 2: Reduce message load**
```bash
# Try getting fewer messages per page
# (This is automatic with pagination)
```

**Step 3: Check backend logs**
- Look for slow database queries
- Check CPU/memory usage

**Step 4: Clear browser cache**
```
DevTools > Network > Disable cache (checkbox)
Or: Ctrl+Shift+R (hard refresh)
```

---

## Build/Compilation Issues

### Issue: "npm run build" fails

**Solutions:**

**Step 1: Check Node version**
```bash
node --version  # Should be 14+
npm --version
```

**Step 2: Clear cache**
```bash
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Step 3: Try build again**
```bash
npm run build
```

---

## Getting Help

### Debug Checklist

When something isn't working:

1. **Check terminal logs**
   - Backend terminal for server logs
   - Frontend terminal for build messages

2. **Check browser console** (F12)
   - JavaScript errors (red text)
   - Network errors
   - Socket.io status

3. **Verify connections**
   ```bash
   # Backend running?
   curl http://localhost:5000/api/health
   
   # Frontend running?
   curl http://localhost:3000
   ```

4. **Check .env files**
   - Port numbers
   - URLs
   - Keys and secrets

5. **Clear everything and restart**
   ```bash
   # Backend
   cd backend
   rm -rf data/chat_app.db node_modules
   npm install
   npm run db:init
   npm run dev
   
   # Frontend (in new terminal)
   cd frontend
   rm -rf node_modules
   npm install
   npm start
   ```

6. **Check file permissions**
   - Can backend write to `data/` directory?
   - Can frontend write to `node_modules/`?

### Useful Commands for Debugging

```bash
# Backend
npm run dev              # Show logs
npm run db:init         # Initialize DB

# Frontend
npm start               # Show logs
npm run build           # Check for errors

# General
node --version         # Check Node version
npm --version          # Check npm version
git status            # Check changes
```

### If still stuck...

1. Check the README.md for overview
2. Check API_DOCUMENTATION.md for API details
3. Check INSTALLATION.md for setup step-by-step
4. Review the code comments
5. Check error messages carefully (they usually tell you what's wrong!)

---

## Quick Reference

| Issue | Command |
|-------|---------|
| Port in use | `lsof -ti:PORT \| xargs kill -9` (Mac/Linux) |
| Module missing | `npm install` |
| Cache issues | `npm cache clean --force` |
| DB corrupted | `rm -rf data/chat_app.db && npm run db:init` |
| Token expired | `localStorage.clear()` (browser console) |
| Clear all | `rm -rf node_modules && npm install` |
| See DB contents | `sqlite3 data/chat_app.db` |

---

**Most issues are resolved by clearing cache and restarting!** 🔄
