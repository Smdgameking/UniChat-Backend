const rateLimit = require('express-rate-limit');

/**
 * Rate limiting configurations
 * 
 * Why Rate Limiting?
 * - Prevents brute force attacks on login/register
 * - Protects against DDoS attacks
 * - Ensures fair usage of API resources
 * - Reduces server load from malicious requests
 * 
 * Note: Using memory store by default. For production with multiple server instances,
 * install Redis and configure it below.
 */

// Strict rate limit for authentication endpoints
// Prevents brute force password guessing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Moderate rate limit for general API endpoints
// Prevents abuse while allowing normal usage
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Lenient rate limit for read-heavy endpoints
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Very strict rate limit for sensitive operations
// Password reset, email change, etc.
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per hour
    message: {
        success: false,
        message: 'Too many requests for this operation. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter,
    apiLimiter,
    readLimiter,
    sensitiveLimiter
};