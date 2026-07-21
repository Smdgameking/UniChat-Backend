const express = require('express');
const route = express.Router();
const Notification = require('../models/notification.model');
const Friend = require('../models/friend.model');
const User = require('../models/user.model');

// Get all notifications for current user
route.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'username displayName')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark notification as read
route.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark all notifications as read
route.patch('/read-all', async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete notification
route.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Accept friend request
route.post('/friend/:notificationId/accept', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.notificationId,
            recipient: req.user.id,
            type: 'friend_request'
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Friend request notification not found'
            });
        }

        // Update friend request status to accepted
        const friendRequest = await Friend.findOne({
            requester: notification.sender,
            recipient: req.user.id,
            status: 'pending'
        });

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Mark notification as read
        notification.read = true;
        await notification.save();

        // Create acceptance notification for the sender
        const currentUser = await User.findById(req.user.id).select('username displayName');
        await Notification.create({
            recipient: notification.sender,
            sender: req.user.id,
            type: 'friend_accepted',
            message: `${currentUser.displayName || currentUser.username} accepted your friend request`,
            data: { friendId: req.user.id }
        });

        res.status(200).json({
            success: true,
            message: 'Friend request accepted'
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Reject friend request
route.post('/friend/:notificationId/reject', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.notificationId,
            recipient: req.user.id,
            type: 'friend_request'
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Friend request notification not found'
            });
        }

        // Update friend request status to rejected
        const friendRequest = await Friend.findOne({
            requester: notification.sender,
            recipient: req.user.id,
            status: 'pending'
        });

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        friendRequest.status = 'rejected';
        await friendRequest.save();

        // Mark notification as read
        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Friend request rejected'
        });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = route;