/**
 * Async Handler Middleware
 * 
 * Why use async handler wrapper?
 * - Eliminates repetitive try-catch blocks in controllers
 * - Automatically catches and forwards errors to error handling middleware
 * - Cleaner, more readable controller code
 * - Consistent error handling across all routes
 */

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;