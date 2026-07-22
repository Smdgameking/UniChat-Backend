const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/token.utils');
const logger = require('../utils/logger');

/**
 * User Service Layer
 * 
 * Why service layer?
 * - Separates business logic from controllers
 * - Reusable across multiple controllers
 * - Easier to test (can test business logic independently)
 * - Single responsibility principle
 * - Better code organization
 */

/**
 * Register a new user
 */
const register = async (userData) => {
    try {
        const { displayName, username, email, password, dob } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            displayName,
            username,
            email,
            password: hashedPassword,
            dob,
            profileInComplete: true
        });

        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        logger.auth('register', user._id, { username, email });

        return {
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                email: user.email
            },
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error('Registration failed', error);
        throw error;
    }
};

/**
 * Login user
 */
const login = async (email, password) => {
    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        logger.auth('login', user._id, { username: user.username });

        return {
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                email: user.email
            },
            accessToken,
            refreshToken,
            profileInComplete: user.profileInComplete
        };
    } catch (error) {
        logger.error('Login failed', error, { email });
        throw error;
    }
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            country: user.country,
            phoneNo: user.phoneNo,
            emailVerified: user.emailVerified || false,
            profileInComplete: user.profileInComplete
        };
    } catch (error) {
        logger.error('Get user failed', error, { userId });
        throw error;
    }
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
    try {
        const allowedFields = ['displayName', 'bio', 'country', 'phoneNo', 'avatar', 'banner', 'gender'];
        const updateFields = {};
        
        // Only allow updating specific fields
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields[key] = updateData[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        logger.info('Profile updated', { userId, updatedFields: Object.keys(updateFields) });

        return {
            id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            email: user.email,
            avatar: user.avatar,
            banner: user.banner,
            bio: user.bio,
            country: user.country,
            phoneNo: user.phoneNo,
            status: user.status,
            lastSeen: user.lastSeen
        };
    } catch (error) {
        logger.error('Profile update failed', error, { userId });
        throw error;
    }
};

/**
 * Update user status
 */
const updateStatus = async (userId, status) => {
    try {
        const validStatuses = ['online', 'away', 'dnd', 'offline'];
        
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                status: status,
                lastSeen: new Date()
            },
            { new: true }
        ).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        logger.info('Status updated', { userId, status });

        return {
            status: user.status,
            lastSeen: user.lastSeen
        };
    } catch (error) {
        logger.error('Status update failed', error, { userId });
        throw error;
    }
};

/**
 * Get user profile by username
 */
const getUserByUsername = async (username) => {
    try {
        const user = await User.findOne({ username }).select('-password');
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar,
            banner: user.banner,
            bio: user.bio,
            country: user.country,
            status: user.status,
            lastSeen: user.lastSeen,
            emailVerified: user.emailVerified || false
        };
    } catch (error) {
        logger.error('Get user by username failed', error, { username });
        throw error;
    }
};

module.exports = {
    register,
    login,
    getUserById,
    getUserByUsername,
    updateProfile,
    updateStatus
};
