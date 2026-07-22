/**
 * Global Error Handling Middleware
 * 
 * Why centralized error handling?
 * - Consistent error responses across all endpoints
 * - Single place to handle all errors
 * - Automatic error logging
 * - Cleaner controller code (no need for try-catch everywhere)
 * - Better debugging and monitoring
 */

const { sendError } = require('../utils/response.utils');

/**
 * Custom API Error class
 * Extends Error to include status code and additional details
 */
class ApiError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true; // Distinguish from programming errors
    }
}

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));
        return sendError(res, 'Validation failed', 400, errors);
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return sendError(res, `${field} already exists`, 409);
    }

    // Handle Mongoose CastError (invalid ID format)
    if (err.name === 'CastError') {
        return sendError(res, 'Invalid ID format', 400);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
        return sendError(res, err.message, err.statusCode, err.errors);
    }

    // Handle Multer errors (file uploads)
    if (err.name === 'MulterError') {
        return sendError(res, err.message, 400);
    }

    // Default error
    return sendError(
        res,
        err.message || 'Internal server error',
        err.statusCode || 500
    );
};

/**
 * Not found handler for undefined routes
 */
const notFound = (req, res) => {
    return sendError(res, 'Route not found', 404);
};

module.exports = {
    errorHandler,
    notFound,
    ApiError
};