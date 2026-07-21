const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/refreshToken.model');

/**
 * Token Utility Functions
 * 
 * Why separate utilities?
 * - Centralizes token logic for consistency
 * - Easier to maintain and update
 * - Reduces code duplication
 * - Improves testability
 */

// Generate random token string
const generateToken = (length = 64) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate JWT Access Token
// Short-lived token (15 minutes) for API access
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            username: user.username 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '15m', // Short-lived for security
            issuer: 'unichat-api',
            audience: 'unichat-client'
        }
    );
};

// Generate JWT Refresh Token
// Long-lived token (7 days) for getting new access tokens
const generateRefreshToken = async (user) => {
    // Create refresh token string
    const token = generateToken();
    
    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save to database
    const refreshToken = new RefreshToken({
        token: token,
        user: user._id,
        expiresAt: expiresAt
    });
    
    await refreshToken.save();
    
    return token;
};

// Verify JWT Access Token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'unichat-api',
            audience: 'unichat-client'
        });
    } catch (error) {
        return null;
    }
};

// Verify Refresh Token
const verifyRefreshToken = async (token) => {
    try {
        // Check if token exists in database
        const refreshToken = await RefreshToken.findOne({ 
            token: token,
            expiresAt: { $gt: new Date() } // Not expired
        }).populate('user');
        
        if (!refreshToken) {
            return null;
        }
        
        return refreshToken;
    } catch (error) {
        return null;
    }
};

// Revoke Refresh Token (logout)
const revokeRefreshToken = async (token) => {
    await RefreshToken.deleteOne({ token: token });
};

// Revoke all user refresh tokens (logout from all devices)
const revokeAllUserTokens = async (userId) => {
    await RefreshToken.deleteMany({ user: userId });
};

// Clean up expired tokens (can be called periodically)
const cleanupExpiredTokens = async () => {
    const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
};

module.exports = {
    generateToken,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanupExpiredTokens
};