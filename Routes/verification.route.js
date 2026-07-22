const express = require('express');
const route = express.Router();
const { sendVerificationEmail, verifyEmail, getVerificationStatus } = require('../services/auth.service');
const { sensitiveLimiter } = require('../middleware/rateLimit.middleware');

// Send email verification
// POST /auth/send-verification
route.post('/send-verification', sensitiveLimiter, async (req, res, next) => {
    try {
        const userId = req.user.id;
        await sendVerificationEmail(userId);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Verify email with token
// GET /auth/verify-email/:token
route.get('/verify-email/:token', async (req, res, next) => {
    try {
        const { token } = req.params;
        await verifyEmail(token);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Check email verification status
// GET /auth/verification-status
route.get('/verification-status', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await getVerificationStatus(userId);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

module.exports = route;