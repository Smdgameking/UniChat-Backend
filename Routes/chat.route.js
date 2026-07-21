const express = require('express');
const route = express.Router();
const Message = require('../models/message.model');
const Channel = require('../models/channel.model');
const ServerMember = require('../models/serverMember.model');
const Friend = require('../models/friend.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Get channel messages
route.get('/channel/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;

        // Validate channelId
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid channel ID'
            });
        }

        // Check if user is a member of the channel's server
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        const membership = await ServerMember.findOne({
            server: channel.server,
            user: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // Build query
        let query = { channelId: channelId, type: 'channel' };
        
        // Pagination: fetch messages before a specific message ID
        if (before && mongoose.Types.ObjectId.isValid(before)) {
            const beforeMessage = await Message.findById(before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        // Fetch messages
        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Reverse to get chronological order
        messages.reverse();

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            channelId: msg.channelId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.createdAt
        }));

        res.status(200).json({
            success: true,
            messages: formattedMessages
        });
    } catch (error) {
        console.error('Get channel messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Send channel message
route.post('/channel/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Validate channelId
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid channel ID'
            });
        }

        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Channel not found'
            });
        }

        // Check if user is a member of the channel's server
        const membership = await ServerMember.findOne({
            server: channel.server,
            user: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // Get user details for senderName
        const user = await User.findById(userId).select('username displayName');
        const senderName = user?.displayName || user?.username || 'Unknown User';

        // Create message
        const message = new Message({
            content: content.trim(),
            senderId: userId,
            senderName: senderName,
            channelId: channelId,
            type: 'channel'
        });

        await message.save();

        res.status(201).json({
            success: true,
            message: {
                id: message._id,
                channelId: message.channelId,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                timestamp: message.createdAt
            }
        });
    } catch (error) {
        console.error('Send channel message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

// Get friend messages
route.get('/friend/:friendId/messages', async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;

        // Validate friendId
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid friend ID'
            });
        }

        // Check if they are friends
        const friendship = await Friend.findOne({
            $or: [
                { requester: userId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: userId, status: 'accepted' }
            ]
        });

        if (!friendship) {
            return res.status(403).json({
                success: false,
                message: 'You are not friends with this user'
            });
        }

        // Build query - get messages between the two users
        let query = {
            type: 'friend',
            $or: [
                { senderId: userId, recipientId: friendId },
                { senderId: friendId, recipientId: userId }
            ]
        };

        // Pagination
        if (before && mongoose.Types.ObjectId.isValid(before)) {
            const beforeMessage = await Message.findById(before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        // Fetch messages
        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Reverse to get chronological order
        messages.reverse();

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.createdAt
        }));

        res.status(200).json({
            success: true,
            messages: formattedMessages
        });
    } catch (error) {
        console.error('Get friend messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Send friend message
route.post('/friend/:friendId/messages', async (req, res) => {
    try {
        const { friendId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Validate friendId
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid friend ID'
            });
        }

        // Check if they are friends
        const friendship = await Friend.findOne({
            $or: [
                { requester: userId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: userId, status: 'accepted' }
            ]
        });

        if (!friendship) {
            return res.status(403).json({
                success: false,
                message: 'You are not friends with this user'
            });
        }

        // Get user details for senderName
        const user = await User.findById(userId).select('username displayName');
        const senderName = user?.displayName || user?.username || 'Unknown User';

        // Create message
        const message = new Message({
            content: content.trim(),
            senderId: userId,
            senderName: senderName,
            recipientId: friendId,
            type: 'friend'
        });

        await message.save();

        res.status(201).json({
            success: true,
            message: {
                id: message._id,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content,
                timestamp: message.createdAt
            }
        });
    } catch (error) {
        console.error('Send friend message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

module.exports = route;