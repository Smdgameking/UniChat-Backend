const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client (optional - falls back to memory store if Redis not available)
let redisClient;
try {
    redisClient = redis.createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        }
    });
} catch (error) {
    console.log('Redis not available, using memory store for rate limiting');
}

/**
 * Rate limiting configurations
 * 
 * Why Rate Limiting?
 * - Prevents brute force attacks on login/register
 * - Protects against DDoS attacks
 * - Ensures fair usage of API resources
 * - Reduces server load from malicious requests
 */

// Strict rate limit for authentication endpoints
// Prevents brute force password guessing
const authLimiter = rateLimit({
    store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Skip successful requests (optional - counts all requests)
    skipSuccessfulRequests: false
});

// Moderate rate limit for general API endpoints
// Prevents abuse while allowing normal usage
const apiLimiter = rateLimit({
    store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
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
    store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
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
    store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
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