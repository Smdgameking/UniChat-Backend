const express = require('express');
const route = express.Router();
const { forgotPassword, resetPassword } = require('../services/auth.service');
const { sensitiveLimiter } = require('../middleware/rateLimit.middleware');

// Forgot password - send reset email
// POST /auth/forgot-password
route.post('/forgot-password', sensitiveLimiter, async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        await forgotPassword(email);

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.'
        });
    } catch (error) {
        next(error);
    }
});

// Reset password with token
// POST /auth/reset-password
route.post('/reset-password', sensitiveLimiter, async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        await resetPassword(token, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = route;