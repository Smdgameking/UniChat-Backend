const express = require('express');
const route = express.Router();
const User = require('../models/user.model');

// In-memory store for online users
// Structure: Map<userId, { status: string, lastSeen: Date }>
const onlineUsers = new Map();

// Update user online status
route.post('/online-status', async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['online', 'away', 'dnd', 'offline'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: online, away, dnd, offline'
            });
        }

        // Update in-memory store
        onlineUsers.set(userId.toString(), {
            status: status,
            lastSeen: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Status updated'
        });
    } catch (error) {
        console.error('Update online status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Check if specific user is online
route.get('/online-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Get user info
        const user = await User.findById(userId).select('username displayName avatar');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check online status
        const onlineStatus = onlineUsers.get(userId.toString());
        const status = onlineStatus ? onlineStatus.status : 'offline';

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: user.avatar,
                status: status
            }
        });
    } catch (error) {
        console.error('Check online status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all online users
route.get('/online-users', async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Get all online user IDs
        const onlineUserIds = Array.from(onlineUsers.keys()).map(id => new mongoose.Types.ObjectId(id));

        if (onlineUserIds.length === 0) {
            return res.status(200).json({
                success: true,
                users: []
            });
        }

        // Get user details for online users
        const users = await User.find({ _id: { $in: onlineUserIds } })
            .select('username displayName avatar')
            .lean();

        // Format response with status
        const formattedUsers = users.map(user => {
            const onlineStatus = onlineUsers.get(user._id.toString());
            return {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: user.avatar,
                status: onlineStatus ? onlineStatus.status : 'offline'
            };
        });

        res.status(200).json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Remove user from online status (called on logout/disconnect)
route.post('/offline', async (req, res) => {
    try {
        const userId = req.user.id;
        onlineUsers.delete(userId.toString());

        res.status(200).json({
            success: true,
            message: 'User marked as offline'
        });
    } catch (error) {
        console.error('Set offline error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = route;