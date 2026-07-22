const { getUserById, getUserByUsername, updateProfile, updateStatus } = require('../services/user.service');
const logger = require('../utils/logger');

/**
 * Profile Controller
 * 
 * Handles all profile-related operations
 */

/**
 * Get current user's profile
 * GET /user/profile
 */
const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await getUserById(userId);
        
        res.status(200).json({
            success: true,
            ...user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user profile by username
 * GET /user/profile/:username
 */
const getUserProfile = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await getUserByUsername(username);
        
        res.status(200).json({
            success: true,
            ...user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user's profile
 * PATCH /user/profile
 */
const updateMyProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        
        const user = await updateProfile(userId, updateData);
        
        logger.info('Profile updated via controller', { userId });
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            ...user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user status
 * PATCH /user/status
 */
const updateUserStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const result = await updateStatus(userId, status);
        
        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyProfile,
    getUserProfile,
    updateMyProfile,
    updateUserStatus
};