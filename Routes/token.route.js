const express = require('express');
const route = express.Router();
const { refreshAccessToken, logout, logoutAll } = require('../services/auth.service');
const { sensitiveLimiter } = require('../middleware/rateLimit.middleware');

// Refresh access token using refresh token
// POST /auth/refresh-token
route.post('/refresh-token', sensitiveLimiter, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const result = await refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

// Logout - revoke refresh token
// POST /auth/logout
route.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user?.id;

        await logout(userId, refreshToken);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Logout from all devices
// POST /auth/logout-all
route.post('/logout-all', async (req, res, next) => {
    try {
        const userId = req.user.id;

        await logoutAll(userId);

        res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = route;