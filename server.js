const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const authRoute = require('./Routes/Auth.route');
const tokenRoute = require('./Routes/token.route');
const passwordRoute = require('./Routes/password.route');
const verificationRoute = require('./Routes/verification.route');
const authenticateToken = require('./middleware/auth.middleware');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const user = require('./Routes/user.route');
const profile = require('./Routes/profile.route');
const friend = require('./Routes/friend.route');
const notification = require('./Routes/notification.route');
const server = require('./Routes/server.route');
const chat = require('./Routes/chat.route');
const userStatus = require('./Routes/userStatus.route');
const cors = require("cors");
require("dotenv").config();
require('./db/db');

const serverApp = http.createServer(app);

// Socket.IO setup
const io = new Server(serverApp, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.IO authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.user?.username, socket.id);

    // Join channel room
    socket.on("join_channel", ({ channelId }) => {
        const room = `channel_${channelId}`;
        socket.join(room);
        console.log(`${socket.user?.username} joined channel room: ${room}`);
    });

    // Leave channel room
    socket.on("leave_channel", ({ channelId }) => {
        const room = `channel_${channelId}`;
        socket.leave(room);
        console.log(`${socket.user?.username} left channel room: ${room}`);
    });

    // Join friend chat room
    socket.on("join_friend_chat", ({ friendId }) => {
        const room = `friend_${friendId}`;
        socket.join(room);
        console.log(`${socket.user?.username} joined friend room: ${room}`);
    });

    // Leave friend chat room
    socket.on("leave_friend_chat", ({ friendId }) => {
        const room = `friend_${friendId}`;
        socket.leave(room);
        console.log(`${socket.user?.username} left friend room: ${room}`);
    });

    // Send channel message
    socket.on("send_channel_message", async ({ channelId, content }) => {
        try {
            const Message = require('./models/message.model');
            const message = new Message({
                content: content.trim(),
                senderId: socket.user.id,
                senderName: socket.user.username || 'Unknown',
                channelId: channelId,
                type: 'channel'
            });
            await message.save();
            
            io.to(`channel_${channelId}`).emit("message", {
                id: message._id,
                channelId: message.channelId,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                timestamp: message.createdAt
            });
        } catch (error) {
            console.error('Socket send_channel_message error:', error);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    // Send friend message
    socket.on("send_friend_message", async ({ friendId, content }) => {
        try {
            const Message = require('./models/message.model');
            const message = new Message({
                content: content.trim(),
                senderId: socket.user.id,
                senderName: socket.user.username || 'Unknown',
                recipientId: friendId,
                type: 'friend'
            });
            await message.save();
            
            // Emit to both users in the friend chat
            const room = `friend_${friendId}`;
            io.to(room).emit("message", {
                id: message._id,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                timestamp: message.createdAt,
                friendId: friendId
            });
            
            // Also emit to the sender's own friend room
            const senderRoom = `friend_${socket.user.id}`;
            io.to(senderRoom).emit("message", {
                id: message._id,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                timestamp: message.createdAt,
                friendId: friendId
            });
        } catch (error) {
            console.error('Socket send_friend_message error:', error);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    // Typing indicator
    socket.on("typing", ({ targetId, type }) => {
        if (type === "channel") {
            socket.to(`channel_${targetId}`).emit("typing", {
                userId: socket.user.id,
                userName: socket.user.username,
                type: "channel",
                channelId: targetId
            });
        } else if (type === "friend") {
            socket.to(`friend_${targetId}`).emit("typing", {
                userId: socket.user.id,
                userName: socket.user.username,
                type: "friend"
            });
        }
    });

    // Stop typing indicator
    socket.on("stop_typing", ({ targetId, type }) => {
        if (type === "channel") {
            socket.to(`channel_${targetId}`).emit("stop_typing", {
                userId: socket.user.id,
                channelId: targetId
            });
        } else if (type === "friend") {
            socket.to(`friend_${targetId}`).emit("stop_typing", {
                userId: socket.user.id
            });
        }
    });

    // Mark messages as read
    socket.on("mark_as_read", async ({ messageIds }) => {
        try {
            const Message = require('./models/message.model');
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $set: { read: true } }
            );
        } catch (error) {
            console.error('Socket mark_as_read error:', error);
        }
    });

    // User online status
    socket.on("user_online", () => {
        const User = require('./models/user.model');
        User.findByIdAndUpdate(socket.user.id, { status: 'online' }).exec();
        socket.broadcast.emit("user_online", socket.user.id);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.user?.username, socket.id);
        const User = require('./models/user.model');
        User.findByIdAndUpdate(socket.user.id, { 
            status: 'offline',
            lastSeen: new Date()
        }).exec();
        socket.broadcast.emit("user_offline", socket.user.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes - no token required
app.use('/auth', authRoute);
app.use('/auth', tokenRoute);
app.use('/auth', passwordRoute);
app.use('/auth', verificationRoute);

// Protected routes - token required for all other routes
app.use(authenticateToken);

app.use('/user', user);
app.use('/user', profile);
app.use('/friend', friend);
app.use('/notification', notification);
app.use('/server', server);
app.use('/chat', chat);
app.use('/user', userStatus);

// Example protected route
app.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

serverApp.listen(3000, "0.0.0.0", () => {
    console.log('Server is running on port 3000');
});