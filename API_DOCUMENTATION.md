# UniChat Frontend API Documentation

## Base URL
```
http://10.119.79.91:3000
```

## Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer {token}
```

Token is stored in localStorage as `unichat_user.token`

---

## 1. Get User's Servers

**Endpoint:** `GET /server/list`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Expected Response (Success - 200 OK):**
```json
{
  "success": true,
  "servers": [
    {
      "id": "server_123",
      "name": "Gaming Community",
      "icon": "https://example.com/icon.png",
      "description": "A community for gamers"
    },
    {
      "id": "server_456",
      "name": "Study Group",
      "icon": null,
      "description": "Study together"
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Request status
- `servers` (array): List of server objects
  - `id` (string): Unique server identifier
  - `name` (string): Server display name
  - `icon` (string | null): URL to server icon image
  - `description` (string): Server description

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch servers"
}
```

---

## 2. Get Server Channels

**Endpoint:** `GET /server/{serverId}/channels`

**Request Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `serverId` (string): The server ID

**Expected Response (Success - 200 OK):**
```json
{
  "success": true,
  "channels": [
    {
      "id": "channel_123",
      "name": "general",
      "type": "text",
      "description": "General discussion"
    },
    {
      "id": "channel_456",
      "name": "Voice Chat",
      "type": "voice",
      "description": "Voice channel"
    },
    {
      "id": "channel_789",
      "name": "announcements",
      "type": "text",
      "description": "Important announcements"
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Request status
- `channels` (array): List of channel objects
  - `id` (string): Unique channel identifier
  - `name` (string): Channel name
  - `type` (string): Channel type - "text" or "voice"
  - `description` (string): Channel description

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch channels"
}
```

---

## 3. Get Friends List

**Endpoint:** `GET /friend/list`

**Request Headers:**
```
Authorization: Bearer {token}
```

**Expected Response (Success - 200 OK):**
```json
{
  "success": true,
  "friends": [
    {
      "id": "user_123",
      "username": "johndoe",
      "displayName": "John Doe",
      "status": "online",
      "avatar": "https://example.com/avatar.png"
    },
    {
      "id": "user_456",
      "username": "janesmith",
      "displayName": "Jane Smith",
      "status": "away",
      "avatar": null
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Request status
- `friends` (array): List of friend objects
  - `id` (string): Unique user identifier
  - `username` (string): Username
  - `displayName` (string): Display name
  - `status` (string): Online status - "online", "away", "dnd", "offline"
  - `avatar` (string | null): URL to avatar image

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch friends"
}
```

---

## 4. Get Channel Messages

**Endpoint:** `GET /chat/channel/{channelId}/messages`

**Request Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `channelId` (string): The channel ID

**Query Parameters (Optional):**
- `limit` (number): Number of messages to fetch (default: 50)
- `before` (string): Message ID to fetch messages before (for pagination)

**Expected Response (Success - 200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "channelId": "channel_123",
      "senderId": "user_456",
      "senderName": "John Doe",
      "content": "Hello everyone!",
      "timestamp": "2026-07-21T10:30:00.000Z"
    },
    {
      "id": "msg_456",
      "channelId": "channel_123",
      "senderId": "user_789",
      "senderName": "Jane Smith",
      "content": "Hey! How are you?",
      "timestamp": "2026-07-21T10:31:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Request status
- `messages` (array): List of message objects
  - `id` (string): Unique message identifier
  - `channelId` (string): Channel ID where message was sent
  - `senderId` (string): User ID who sent the message
  - `senderName` (string): Display name of sender
  - `content` (string): Message content
  - `timestamp` (string): ISO 8601 timestamp

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch messages"
}
```

---

## 5. Send Channel Message

**Endpoint:** `POST /chat/channel/{channelId}/messages`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**
- `channelId` (string): The channel ID

**Request Body:**
```json
{
  "content": "Hello everyone!"
}
```

**Request Body Fields:**
- `content` (string): Message content (required)

**Expected Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": {
    "id": "msg_789",
    "channelId": "channel_123",
    "senderId": "user_current",
    "senderName": "Current User",
    "content": "Hello everyone!",
    "timestamp": "2026-07-21T10:32:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to send message"
}
```

---

## 6. Get Friend Messages

**Endpoint:** `GET /chat/friend/{friendId}/messages`

**Request Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `friendId` (string): The friend's user ID

**Query Parameters (Optional):**
- `limit` (number): Number of messages to fetch (default: 50)
- `before` (string): Message ID to fetch messages before (for pagination)

**Expected Response (Success - 200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "senderId": "user_456",
      "senderName": "John Doe",
      "content": "Hey! How are you?",
      "timestamp": "2026-07-21T10:30:00.000Z"
    }
  ]
}
```

**Response Fields:**
Same as channel messages

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch messages"
}
```

---

## 7. Send Friend Message

**Endpoint:** `POST /chat/friend/{friendId}/messages`

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**
- `friendId` (string): The friend's user ID

**Request Body:**
```json
{
  "content": "Hey! How are you?"
}
```

**Expected Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": {
    "id": "msg_789",
    "senderId": "user_current",
    "senderName": "Current User",
    "content": "Hey! How are you?",
    "timestamp": "2026-07-21T10:32:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to send message"
}
```

---

## Notes for Backend Implementation

1. **Authentication**: All endpoints require valid JWT token in Authorization header
2. **Default Server**: Frontend creates a virtual "Friends" server (id: "friends") that doesn't come from API
3. **Message Ownership**: Frontend identifies own messages with `senderId: "me"` in local state
4. **Real-time Updates**: Consider implementing WebSocket/Socket.IO for real-time messaging
5. **Pagination**: Messages should support pagination with `limit` and `before` parameters
6. **File Uploads**: Future - support for image/file attachments in messages
7. **Message Status**: Future - add read receipts, delivered status, etc.

---

## Frontend Implementation Notes

Currently, the frontend uses **mock data** for demonstration. To connect to real API:

1. Uncomment the axios calls in:
   - `ServerSidebar.jsx` - fetchServers()
   - `FriendsSidebar.jsx` - fetchChannels() and fetchFriends()
   - `Chat.jsx` - fetchMessages() and sendMessage()

2. Ensure your backend returns data in the format specified above

3. Update the base URL if needed (currently `http://10.119.79.91:3000`)