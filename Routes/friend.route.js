const express = require('express');
const route = express.Router();
const User = require('../models/user.model');
const Friend = require('../models/friend.model');
const Notification = require('../models/notification.model');
const mongoose = require('mongoose');

// Search users by username
route.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Find users whose username contains the search term (case-insensitive)
        // Exclude the current user (req.user.id) from results
        const users = await User.find({
            username: { $regex: q.trim(), $options: 'i' },
            _id: { $ne: req.user.id }
        })
        .select('username displayName')
        .limit(20);

        // Get friend status for each user
        const userIds = users.map(u => u._id);
        const friendRequests = await Friend.find({
            $or: [
                { requester: req.user.id, recipient: { $in: userIds } },
                { recipient: req.user.id, requester: { $in: userIds } }
            ]
        });

        // Build a map of userId -> friend status
        const friendMap = {};
        friendRequests.forEach(fr => {
            const otherId = fr.requester.toString() === req.user.id.toString() 
                ? fr.recipient.toString() 
                : fr.requester.toString();
            friendMap[otherId] = fr.status;
        });

        const results = users.map(user => ({
            id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            friendStatus: friendMap[user._id.toString()] || 'none'
        }));

        res.status(200).json({
            success: true,
            users: results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Send friend request
route.post('/request', async (req, res) => {
    try {
        const { recipientId } = req.body;
        const requesterId = req.user.id;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: 'Recipient ID is required'
            });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Can't send request to yourself
        if (requesterId.toString() === recipientId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send friend request to yourself'
            });
        }

        // Check if request already exists
        const existing = await Friend.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existing) {
            if (existing.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Friend request already pending'
                });
            }
            if (existing.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'Already friends'
                });
            }
            // If rejected, allow re-sending by updating
            existing.status = 'pending';
            await existing.save();
            return res.status(200).json({
                success: true,
                message: 'Friend request sent'
            });
        }

        const friendRequest = new Friend({
            requester: requesterId,
            recipient: recipientId
        });

        await friendRequest.save();

        // Create notification for recipient
        const requester = await User.findById(requesterId).select('username displayName');
        const displayName = requester?.displayName || requester?.username || 'Someone';
        await Notification.create({
            recipient: recipientId,
            sender: requesterId,
            type: 'friend_request',
            message: `${displayName} sent you a friend request`,
            data: { 
                friendId: requesterId,
                senderUsername: requester?.username,
                senderDisplayName: requester?.displayName
            }
        });

        res.status(201).json({
            success: true,
            message: 'Friend request sent'
        });
    } catch (error) {
        console.error('Friend request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get friends list with online status
route.get('/list', async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all accepted friend requests where user is either requester or recipient
        const friendships = await Friend.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).lean();

        // Extract friend IDs
        const friendIds = friendships.map(f => 
            f.requester.toString() === userId.toString() ? f.recipient : f.requester
        );

        if (friendIds.length === 0) {
            return res.status(200).json({
                success: true,
                friends: []
            });
        }

        // Get friend details
        const friends = await User.find({ _id: { $in: friendIds } })
            .select('username displayName avatar')
            .lean();

        // Format response with online status
        const formattedFriends = friends.map(friend => ({
            id: friend._id,
            username: friend.username,
            displayName: friend.displayName || friend.username,
            status: 'offline', // Default status, will be updated by online status system
            avatar: friend.avatar
        }));

        res.status(200).json({
            success: true,
            friends: formattedFriends
        });
    } catch (error) {
        console.error('Get friends list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch friends'
        });
    }
});

module.exports = route;
