const Friend = require('../models/friend.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Friend Service Layer
 * 
 * Handles all friend-related business logic
 */

/**
 * Send friend request
 */
const sendFriendRequest = async (requesterId, recipientId) => {
    try {
        // Can't send request to yourself
        if (requesterId === recipientId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            throw new Error('User not found');
        }

        // Check if friendship already exists
        const existingFriendship = await Friend.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'pending') {
                throw new Error('Friend request already sent');
            } else if (existingFriendship.status === 'accepted') {
                throw new Error('Already friends');
            } else if (existingFriendship.status === 'blocked') {
                throw new Error('Cannot send friend request');
            }
        }

        // Create friend request
        const friendRequest = new Friend({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        });

        await friendRequest.save();

        logger.info('Friend request sent', { requesterId, recipientId });

        return {
            id: friendRequest._id,
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
            createdAt: friendRequest.createdAt
        };
    } catch (error) {
        logger.error('Send friend request failed', error, { requesterId, recipientId });
        throw error;
    }
};

/**
 * Accept friend request
 */
const acceptFriendRequest = async (userId, requestId) => {
    try {
        const friendRequest = await Friend.findById(requestId);

        if (!friendRequest) {
            throw new Error('Friend request not found');
        }

        // Only recipient can accept
        if (friendRequest.recipient.toString() !== userId) {
            throw new Error('Not authorized to accept this request');
        }

        if (friendRequest.status !== 'pending') {
            throw new Error('Friend request is not pending');
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        logger.info('Friend request accepted', { userId, requestId });

        return {
            id: friendRequest._id,
            requester: friendRequest.requester,
            recipient: friendRequest.recipient,
            status: 'accepted'
        };
    } catch (error) {
        logger.error('Accept friend request failed', error, { userId, requestId });
        throw error;
    }
};

/**
 * Reject friend request
 */
const rejectFriendRequest = async (userId, requestId) => {
    try {
        const friendRequest = await Friend.findById(requestId);

        if (!friendRequest) {
            throw new Error('Friend request not found');
        }

        // Only recipient can reject
        if (friendRequest.recipient.toString() !== userId) {
            throw new Error('Not authorized to reject this request');
        }

        if (friendRequest.status !== 'pending') {
            throw new Error('Friend request is not pending');
        }

        friendRequest.status = 'rejected';
        await friendRequest.save();

        logger.info('Friend request rejected', { userId, requestId });

        return {
            id: friendRequest._id,
            status: 'rejected'
        };
    } catch (error) {
        logger.error('Reject friend request failed', error, { userId, requestId });
        throw error;
    }
};

/**
 * Remove friend
 */
const removeFriend = async (userId, friendId) => {
    try {
        const friendship = await Friend.findOne({
            $or: [
                { requester: userId, recipient: friendId },
                { requester: friendId, recipient: userId }
            ],
            status: 'accepted'
        });

        if (!friendship) {
            throw new Error('Friendship not found');
        }

        await Friend.findByIdAndDelete(friendship._id);

        logger.info('Friend removed', { userId, friendId });

        return { success: true };
    } catch (error) {
        logger.error('Remove friend failed', error, { userId, friendId });
        throw error;
    }
};

/**
 * Block user
 */
const blockUser = async (userId, targetId) => {
    try {
        // Can't block yourself
        if (userId === targetId) {
            throw new Error('Cannot block yourself');
        }

        // Check if target exists
        const target = await User.findById(targetId);
        if (!target) {
            throw new Error('User not found');
        }

        // Find existing friendship
        let friendship = await Friend.findOne({
            $or: [
                { requester: userId, recipient: targetId },
                { requester: targetId, recipient: userId }
            ]
        });

        if (friendship) {
            // Update existing friendship
            friendship.status = 'blocked';
            friendship.blockedBy = userId;
            await friendship.save();
        } else {
            // Create new blocked relationship
            friendship = new Friend({
                requester: userId,
                recipient: targetId,
                status: 'blocked',
                blockedBy: userId
            });
            await friendship.save();
        }

        logger.info('User blocked', { userId, targetId });

        return {
            id: friendship._id,
            requester: friendship.requester,
            recipient: friendship.recipient,
            status: 'blocked',
            blockedBy: friendship.blockedBy
        };
    } catch (error) {
        logger.error('Block user failed', error, { userId, targetId });
        throw error;
    }
};

/**
 * Unblock user
 */
const unblockUser = async (userId, targetId) => {
    try {
        const friendship = await Friend.findOne({
            requester: userId,
            recipient: targetId,
            status: 'blocked',
            blockedBy: userId
        });

        if (!friendship) {
            throw new Error('Blocked relationship not found');
        }

        await Friend.findByIdAndDelete(friendship._id);

        logger.info('User unblocked', { userId, targetId });

        return { success: true };
    } catch (error) {
        logger.error('Unblock user failed', error, { userId, targetId });
        throw error;
    }
};

/**
 * Get friends list
 */
const getFriends = async (userId) => {
    try {
        const friendships = await Friend.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).populate('requester recipient', 'username displayName avatar status');

        const friends = friendships.map(friendship => {
            const friend = friendship.requester._id.toString() === userId 
                ? friendship.recipient 
                : friendship.requester;

            return {
                id: friend._id,
                username: friend.username,
                displayName: friend.displayName || friend.username,
                avatar: friend.avatar,
                status: friend.status,
                friendsSince: friendship.createdAt
            };
        });

        return friends;
    } catch (error) {
        logger.error('Get friends failed', error, { userId });
        throw error;
    }
};

/**
 * Get pending friend requests
 */
const getPendingRequests = async (userId) => {
    try {
        const requests = await Friend.find({
            recipient: userId,
            status: 'pending'
        }).populate('requester', 'username displayName avatar');

        return requests.map(request => ({
            id: request._id,
            requester: {
                id: request.requester._id,
                username: request.requester.username,
                displayName: request.requester.displayName || request.requester.username,
                avatar: request.requester.avatar
            },
            createdAt: request.createdAt
        }));
    } catch (error) {
        logger.error('Get pending requests failed', error, { userId });
        throw error;
    }
};

/**
 * Check friendship status between two users
 */
const getFriendshipStatus = async (userId, targetId) => {
    try {
        const friendship = await Friend.findOne({
            $or: [
                { requester: userId, recipient: targetId },
                { requester: targetId, recipient: userId }
            ]
        });

        if (!friendship) {
            return { status: 'none' };
        }

        return {
            status: friendship.status,
            blockedBy: friendship.blockedBy,
            actionUser: friendship.requester.toString() === userId ? 'requester' : 'recipient'
        };
    } catch (error) {
        logger.error('Get friendship status failed', error, { userId, targetId });
        throw error;
    }
};

/**
 * Search users by username
 */
const searchUsers = async (userId, query) => {
    try {
        const users = await User.find({
            _id: { $ne: userId },
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } }
            ]
        })
        .select('_id username displayName avatar status')
        .limit(20)
        .lean();

        // Check friendship status for each user
        const results = await Promise.all(users.map(async (user) => {
            const friendship = await Friend.findOne({
                $or: [
                    { requester: userId, recipient: user._id },
                    { requester: user._id, recipient: userId }
                ]
            });

            let friendStatus = 'none';
            if (friendship) {
                if (friendship.status === 'pending') {
                    // Check if current user is requester or recipient
                    friendStatus = friendship.requester.toString() === userId ? 'pending' : 'pending';
                } else if (friendship.status === 'accepted') {
                    friendStatus = 'accepted';
                } else if (friendship.status === 'blocked') {
                    friendStatus = 'blocked';
                }
            }

            return {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatar: user.avatar,
                status: user.status,
                friendStatus
            };
        }));

        return results;
    } catch (error) {
        logger.error('Search users failed', error, { userId, query });
        throw error;
    }
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    getFriends,
    getPendingRequests,
    getFriendshipStatus,
    searchUsers
};
