const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    getFriends,
    getPendingRequests,
    getFriendshipStatus
} = require('../services/friend.service');
const logger = require('../utils/logger');

/**
 * Friend Controller
 * 
 * Handles all friend-related operations
 */

/**
 * Send friend request
 * POST /friend/request/:userId
 */
const sendRequest = async (req, res, next) => {
    try {
        const requesterId = req.user.id;
        const { userId } = req.params;

        const result = await sendFriendRequest(requesterId, userId);

        res.status(201).json({
            success: true,
            message: 'Friend request sent',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Accept friend request
 * POST /friend/accept/:requestId
 */
const acceptRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;

        const result = await acceptFriendRequest(userId, requestId);

        res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject friend request
 * POST /friend/reject/:requestId
 */
const rejectRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;

        const result = await rejectFriendRequest(userId, requestId);

        res.status(200).json({
            success: true,
            message: 'Friend request rejected',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove friend
 * DELETE /friend/:friendId
 */
const deleteFriend = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        await removeFriend(userId, friendId);

        res.status(200).json({
            success: true,
            message: 'Friend removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Block user
 * POST /friend/block/:userId
 */
const block = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { userId: targetId } = req.params;

        const result = await blockUser(userId, targetId);

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Unblock user
 * POST /friend/unblock/:userId
 */
const unblock = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { userId: targetId } = req.params;

        await unblockUser(userId, targetId);

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get friends list
 * GET /friend/list
 */
const listFriends = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const friends = await getFriends(userId);

        res.status(200).json({
            success: true,
            count: friends.length,
            friends
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get pending friend requests
 * GET /friend/requests
 */
const getRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requests = await getPendingRequests(userId);

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check friendship status
 * GET /friend/status/:userId
 */
const checkStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { userId: targetId } = req.params;

        const result = await getFriendshipStatus(userId, targetId);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    block,
    unblock,
    listFriends,
    getRequests,
    checkStatus
};
