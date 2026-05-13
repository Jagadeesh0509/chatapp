# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except `/auth/register` and `/auth/login`) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules:**
- Username: 3-20 characters
- Email: Valid email format
- Password: Minimum 6 characters

---

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### 3. Logout User
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### 1. Get All Users
**GET** `/users/all`

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "status": "online",
    "avatar_url": null
  }
]
```

---

### 2. Get Online Users
**GET** `/users/online`

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "status": "online",
    "avatar_url": null
  }
]
```

---

### 3. Get User Profile
**GET** `/users/profile/:userId`

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "status": "online",
  "avatar_url": null,
  "created_at": "2024-05-12T10:00:00Z"
}
```

---

### 4. Update User Profile
**PUT** `/users/profile/:userId`

**Request Body:**
```json
{
  "username": "john_doe_updated",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "john_doe_updated",
    "email": "john@example.com",
    "status": "online",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

---

### 5. Search Users
**GET** `/users/search?q=search_term`

**Query Parameters:**
- `q` (required): Search term (minimum 2 characters)

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "status": "online",
    "avatar_url": null
  }
]
```

---

## Room Endpoints

### 1. Get All Public Rooms
**GET** `/rooms/all`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "general",
    "description": "General discussion room",
    "creator_id": 1,
    "creator_name": "john_doe",
    "member_count": 5,
    "is_public": 1,
    "created_at": "2024-05-12T10:00:00Z"
  }
]
```

---

### 2. Get Room Details
**GET** `/rooms/:roomId`

**Response (200):**
```json
{
  "id": 1,
  "name": "general",
  "description": "General discussion room",
  "creator_id": 1,
  "creator_name": "john_doe",
  "member_count": 5,
  "is_public": 1,
  "created_at": "2024-05-12T10:00:00Z"
}
```

---

### 3. Get Room Members
**GET** `/rooms/:roomId/members`

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "status": "online",
    "avatar_url": null
  }
]
```

---

### 4. Create Room
**POST** `/rooms/create`

**Request Body:**
```json
{
  "name": "random",
  "description": "Random discussion"
}
```

**Response (201):**
```json
{
  "message": "Room created successfully",
  "room": {
    "id": 2,
    "name": "random",
    "description": "Random discussion",
    "creator_id": 1,
    "is_public": 1,
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### 5. Join Room
**POST** `/rooms/:roomId/join`

**Response (200):**
```json
{
  "message": "Joined room successfully"
}
```

---

### 6. Leave Room
**POST** `/rooms/:roomId/leave`

**Response (200):**
```json
{
  "message": "Left room successfully"
}
```

---

## Message Endpoints

### 1. Get Room Messages
**GET** `/messages/room/:roomId?page=1&limit=50`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello everyone!",
      "sender_id": 1,
      "username": "john_doe",
      "avatar_url": null,
      "room_id": 1,
      "conversation_id": null,
      "message_type": "text",
      "is_edited": 0,
      "is_deleted": 0,
      "created_at": "2024-05-12T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

### 2. Get Conversation Messages
**GET** `/messages/conversation/:conversationId?page=1&limit=50`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hi there!",
      "sender_id": 1,
      "username": "john_doe",
      "avatar_url": null,
      "room_id": null,
      "conversation_id": 1,
      "message_type": "text",
      "is_edited": 0,
      "is_deleted": 0,
      "created_at": "2024-05-12T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 50
}
```

---

### 3. Mark Messages as Read
**POST** `/messages/mark-read`

**Request Body:**
```json
{
  "messageIds": [1, 2, 3]
}
```

**Response (200):**
```json
{
  "message": "Messages marked as read"
}
```

---

## Conversation Endpoints

### 1. Get All Conversations
**GET** `/conversations`

**Response (200):**
```json
[
  {
    "id": 1,
    "participant1_id": 1,
    "participant1_username": "john_doe",
    "participant2_id": 2,
    "participant2_username": "jane_doe",
    "created_at": "2024-05-12T10:00:00Z",
    "updated_at": "2024-05-12T11:00:00Z"
  }
]
```

---

### 2. Get or Create Conversation
**POST** `/conversations/with/:userId`

**Response (200):**
```json
{
  "id": 1,
  "participant1_id": 1,
  "participant2_id": 2,
  "created_at": "2024-05-12T10:00:00Z",
  "updated_at": "2024-05-12T10:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "errors": [
    {
      "param": "username",
      "msg": "Username must be 3-20 characters"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - New resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider adding rate limiting middleware.

---

## Pagination

For endpoints that support pagination:
- Default page: 1
- Default limit: 50
- Maximum limit: 100

---

## Example Usage with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Rooms (with token)
```bash
curl -X GET http://localhost:5000/api/rooms/all \
  -H "Authorization: Bearer <token>"
```

---

## Example Usage with JavaScript/Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Register
async function register(username, email, password) {
  const response = await axios.post(`${API_URL}/auth/register`, {
    username,
    email,
    password
  });
  return response.data;
}

// Login
async function login(email, password) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  return response.data;
}

// Get all rooms (with token)
async function getAllRooms(token) {
  const response = await axios.get(`${API_URL}/rooms/all`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
}
```
