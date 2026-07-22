const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const PasswordReset = require('../models/passwordReset.model');
const EmailVerification = require('../models/emailVerification.model');
const { sendPasswordResetEmail, sendEmailVerification } = require('../utils/email.service');
const { generateToken, generateAccessToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/token.utils');
const logger = require('../utils/logger');

/**
 * Authentication Service Layer
 * 
 * Handles all authentication-related business logic
 */

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const tokenDoc = await verifyRefreshToken(refreshToken);
        
        if (!tokenDoc) {
            throw new Error('Invalid or expired refresh token');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(tokenDoc.user);

        logger.auth('token_refresh', tokenDoc.user._id);

        return {
            accessToken: newAccessToken
        };
    } catch (error) {
        logger.error('Token refresh failed', error);
        throw error;
    }
};

/**
 * Logout user (revoke refresh token)
 */
const logout = async (userId, refreshToken) => {
    try {
        if (refreshToken) {
            // Revoke specific refresh token
            await revokeRefreshToken(refreshToken);
        } else {
            // If no token provided, revoke all user tokens
            await revokeAllUserTokens(userId);
        }

        logger.auth('logout', userId);
        return { success: true };
    } catch (error) {
        logger.error('Logout failed', error, { userId });
        throw error;
    }
};

/**
 * Logout from all devices
 */
const logoutAll = async (userId) => {
    try {
        await revokeAllUserTokens(userId);
        
        logger.auth('logout_all', userId);
        return { success: true };
    } catch (error) {
        logger.error('Logout all failed', error, { userId });
        throw error;
    }
};

/**
 * Forgot password - send reset email
 */
const forgotPassword = async (email) => {
    try {
        // Find user by email
        const user = await User.findOne({ email });
        
        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            return { success: true };
        }

        // Generate reset token
        const resetToken = generateToken();
        
        // Calculate expiration (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Save reset token
        const passwordReset = new PasswordReset({
            token: resetToken,
            user: user._id,
            expiresAt: expiresAt
        });

        await passwordReset.save();

        // Send email
        await sendPasswordResetEmail(user.email, resetToken, user.displayName || user.username);

        logger.auth('password_reset_requested', user._id, { email });

        return { success: true };
    } catch (error) {
        logger.error('Forgot password failed', error, { email });
        throw error;
    }
};

/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
    try {
        // Find valid reset token
        const passwordReset = await PasswordReset.findOne({
            token: token,
            expiresAt: { $gt: new Date() },
            used: false
        }).populate('user');

        if (!passwordReset) {
            throw new Error('Invalid or expired reset token');
        }

        // Hash new password
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        passwordReset.user.password = hashedPassword;
        await passwordReset.user.save();

        // Mark token as used
        passwordReset.used = true;
        await passwordReset.save();

        // Revoke all refresh tokens (force re-login on all devices)
        await revokeAllUserTokens(passwordReset.user._id);

        logger.auth('password_reset_completed', passwordReset.user._id);

        return { success: true };
    } catch (error) {
        logger.error('Reset password failed', error);
        throw error;
    }
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (userId) => {
    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if already verified
        if (user.emailVerified) {
            throw new Error('Email is already verified');
        }

        // Generate verification token
        const verificationToken = generateToken();
        
        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Save verification token
        const emailVerification = new EmailVerification({
            token: verificationToken,
            user: user._id,
            email: user.email,
            expiresAt: expiresAt
        });

        await emailVerification.save();

        // Send email
        await sendEmailVerification(user.email, verificationToken, user.displayName || user.username);

        logger.auth('verification_email_sent', userId);

        return { success: true };
    } catch (error) {
        logger.error('Send verification failed', error, { userId });
        throw error;
    }
};

/**
 * Verify email with token
 */
const verifyEmail = async (token) => {
    try {
        // Find valid verification token
        const emailVerification = await EmailVerification.findOne({
            token: token,
            expiresAt: { $gt: new Date() },
            verified: false
        }).populate('user');

        if (!emailVerification) {
            throw new Error('Invalid or expired verification token');
        }

        // Update user as verified
        emailVerification.user.emailVerified = true;
        await emailVerification.user.save();

        // Mark token as used
        emailVerification.verified = true;
        await emailVerification.save();

        logger.auth('email_verified', emailVerification.user._id);

        return { success: true };
    } catch (error) {
        logger.error('Email verification failed', error);
        throw error;
    }
};

/**
 * Check email verification status
 */
const getVerificationStatus = async (userId) => {
    try {
        const user = await User.findById(userId).select('emailVerified');
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            emailVerified: user.emailVerified || false
        };
    } catch (error) {
        logger.error('Get verification status failed', error, { userId });
        throw error;
    }
};

module.exports = {
    refreshAccessToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    getVerificationStatus
};