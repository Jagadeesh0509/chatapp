# 🚀 Quick Reference Guide - Best Practices Implemented

## For Frontend Developers

### Using the API Service
```javascript
// ✅ Correct - Uses interceptors and error handling
import { authService, userService } from '../services/api';

try {
  const response = await authService.login(email, password);
  // Response automatically has logging and error handling
} catch (error) {
  // Error already logged with full details
  console.error('Login failed:', error.message);
}
```

### Handling Errors
```javascript
// ✅ Correct - Errors are caught and logged
try {
  await userService.getAllUsers();
} catch (error) {
  // Error is logged in api.js interceptor
  // User sees friendly message
  // If 401, auto-redirected to login
}
```

### Navigation to Sections
```javascript
// ✅ Correct - Uses URL parameters
const handleSectionChange = (section) => {
  setSearchParams({ section }); // Updates URL to ?section=friends
};

// URL becomes: /dashboard?section=friends
// Works with browser back/forward
// Can be bookmarked
```

### Error Boundary Component
```javascript
// ✅ Already wrapped in App.js
<ErrorBoundary>
  <Router>
    {/* Your routes */}
  </Router>
</ErrorBoundary>
```

---

## For Backend Developers

### Sending API Responses
```javascript
// ✅ Correct - Use standardized response helpers
const { sendSuccess, sendError, sendValidationError } = require('../utils/apiResponse');

// Success response
router.get('/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users');
    sendSuccess(res, users, 'Users fetched successfully');
  } catch (error) {
    sendError(res, 'Failed to fetch users', 500);
  }
});

// Validation error
if (invalid) {
  return sendValidationError(res, {
    email: 'Invalid email format',
    password: 'Password too short'
  });
}

// Unauthorized
if (!req.user) {
  return sendUnauthorized(res, 'Please login');
}
```

### Input Validation
```javascript
// ✅ Correct - Use validation utilities
const { validateUsername, validateEmail, validatePassword } = require('../utils/validation');

// Simple validation
const emailValidation = validateEmail(email);
if (!emailValidation.valid) {
  return sendError(res, emailValidation.message, 400);
}

// Complex validation with error details
try {
  validateRegistration(username, email, password);
} catch (error) {
  return sendValidationError(res, error.errors);
}
```

### Error Handling
```javascript
// ✅ Correct - Let error middleware handle it
// The global error handler (errorHandler.js) will catch all errors

router.post('/users', async (req, res, next) => {
  try {
    const user = await db.run('INSERT INTO users...');
    sendSuccess(res, user, 'User created', 201);
  } catch (error) {
    // Error middleware will catch and handle
    next(error);
  }
});

// Or throw custom errors:
if (userExists) {
  const error = new Error('User already exists');
  error.status = 409;
  throw error;
}
```

### Logging
```javascript
// ✅ Correct - Logs are in middleware
// All requests automatically logged with timing
// Check server console to see:
// [INFO] GET /api/users/all - 200 (45ms)
// [ERROR] POST /api/auth/login - 401 (120ms)
```

---

## Common Patterns

### Frontend - Making API Calls
```javascript
// ❌ Wrong - Old way without error handling
axios.get('/api/users');

// ✅ Correct - New way with error handling
import { userService } from '../services/api';

try {
  const response = await userService.getAllUsers();
  setUsers(response.data.data); // Response has data field
} catch (error) {
  // Already logged and handled
}
```

### Backend - Validating Input
```javascript
// ❌ Wrong - No validation
router.post('/rooms', async (req, res) => {
  const { name, description } = req.body;
  const room = await db.run('INSERT INTO rooms...');
  res.json(room);
});

// ✅ Correct - With validation
const { validateRoomCreation } = require('../utils/validation');
const { sendSuccess, sendValidationError } = require('../utils/apiResponse');

router.post('/rooms', async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    validateRoomCreation(name, description, is_public);
    
    const room = await db.run('INSERT INTO rooms...');
    sendSuccess(res, room, 'Room created', 201);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error.errors);
    }
    // Error middleware handles other errors
  }
});
```

### Frontend - Navigation
```javascript
// ❌ Wrong - State based, not bookmarkable
const [section, setSection] = useState('chats');

// ✅ Correct - URL based, bookmarkable
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const section = searchParams.get('section') || 'chats';

// Change section
setSearchParams({ section: 'friends' });
// URL becomes: /dashboard?section=friends
```

---

## Response Format Reference

### Success (200)
```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": { /* your data */ },
  "timestamp": "2024-05-13T10:30:45.123Z"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "status": 400,
  "message": "Validation Error",
  "errors": {
    "email": "Invalid email format",
    "password": "Too short"
  },
  "timestamp": "2024-05-13T10:30:45.123Z"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "status": 401,
  "message": "Unauthorized",
  "data": null,
  "timestamp": "2024-05-13T10:30:45.123Z"
}
```

### Not Found (404)
```json
{
  "success": false,
  "status": 404,
  "message": "Not Found",
  "data": null,
  "timestamp": "2024-05-13T10:30:45.123Z"
}
```

### Server Error (500)
```json
{
  "success": false,
  "status": 500,
  "message": "Internal Server Error",
  "data": null,
  "timestamp": "2024-05-13T10:30:45.123Z"
}
```

---

## Validation Rules

### Email
- Must be valid email format
- Example valid: `user@example.com`
- Example invalid: `invalid`, `user@domain`

### Username
- 3-30 characters
- Alphanumeric, underscore, hyphen only
- Examples: `john_doe`, `user-123`, `JohnDoe123`

### Password
- Minimum 6 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Examples: `Pass123`, `MyPass2024`

### Room Name
- Required
- Maximum 100 characters
- Examples: `General Chat`, `Tech Discussion`

### Message
- Required (non-empty)
- Maximum 5000 characters
- Cannot be just whitespace

---

## Debugging Tips

### Check API Logs in Console
```javascript
// Open browser DevTools → Console
// You'll see:
[API Debug] Request: GET /api/users/all
[API Debug] Response success: 200

// For errors:
[API Error] Response error: {
  status: 401,
  message: "Invalid credentials",
  url: "/api/auth/login"
}
```

### Check Backend Logs
```bash
# Terminal running backend server shows:
[INFO] GET /api/users/all - 200 (45ms)
[INFO] POST /api/messages/send - 201 (120ms)
[ERROR] POST /api/auth/login - 401 (80ms)
```

### Check Network Tab
1. Open DevTools → Network tab
2. Perform action
3. Click on request
4. See request headers with Authorization token
5. See response with standardized format

### Check Error Boundary
```javascript
// If component crashes, you'll see in Console:
Error caught by boundary: TypeError: Cannot read property 'xyz' of undefined
```

---

## Best Practices Summary

✅ Always use API service layer (don't call axios directly)
✅ Always await API calls and handle errors
✅ Always validate input on backend
✅ Always use standardized response helpers
✅ Always use URL parameters for navigation
✅ Always check sessionStorage not localStorage
✅ Always let error middleware handle errors
✅ Always log important operations
✅ Always return proper HTTP status codes
✅ Always provide clear error messages

---

## Common Issues & Solutions

**Issue**: API requests not showing in console
- **Solution**: Make sure you're in Console tab, not Network tab

**Issue**: Navigation not changing URL
- **Solution**: Use `setSearchParams({ section: 'name' })` not `setState`

**Issue**: 401 redirect not working
- **Solution**: Check if token is expired, clear sessionStorage if needed

**Issue**: Validation errors not showing
- **Solution**: Check error response structure, should have `errors` field with field-level details

**Issue**: Session shared across tabs
- **Solution**: Already fixed - using sessionStorage (per-tab)

---

**Last Updated**: May 13, 2024
**Status**: ✅ Production Ready
