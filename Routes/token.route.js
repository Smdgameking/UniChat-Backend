const express = require('express');
const route = express.Router();
const { verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/token.utils');
const { sensitiveLimiter } = require('../middleware/rateLimit.middleware');

// Refresh access token using refresh token
// POST /auth/refresh-token
route.post('/refresh-token', sensitiveLimiter, async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const tokenDoc = await verifyRefreshToken(refreshToken);
        
        if (!tokenDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Generate new access token
        const { generateAccessToken } = require('../utils/token.utils');
        const newAccessToken = generateAccessToken(tokenDoc.user);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout - revoke refresh token
// POST /auth/logout
route.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user?.id;

        if (refreshToken) {
            // Revoke specific refresh token
            await revokeRefreshToken(refreshToken);
        } else if (userId) {
            // If no token provided, revoke all user tokens
            await revokeAllUserTokens(userId);
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout from all devices
// POST /auth/logout-all
route.post('/logout-all', async (req, res) => {
    try {
        const userId = req.user.id;

        // Revoke all refresh tokens for this user
        await revokeAllUserTokens(userId);

        res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = route;