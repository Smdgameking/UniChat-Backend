/**
 * Logger Utility
 * 
 * Why structured logging?
 * - Better debugging and troubleshooting
 * - Track application behavior in production
 * - Monitor performance and errors
 * - Audit trail for security events
 * - Integration with logging services (ELK, Datadog, etc.)
 */

const logger = {
    /**
     * Log info messages
     */
    info: (message, meta = {}) => {
        console.log(JSON.stringify({
            level: 'info',
            message,
            timestamp: new Date().toISOString(),
            ...meta
        }));
    },

    /**
     * Log error messages
     */
    error: (message, error = null, meta = {}) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            timestamp: new Date().toISOString(),
            error: error ? {
                message: error.message,
                stack: error.stack,
                code: error.code
            } : null,
            ...meta
        }));
    },

    /**
     * Log warning messages
     */
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({
            level: 'warn',
            message,
            timestamp: new Date().toISOString(),
            ...meta
        }));
    },

    /**
     * Log debug messages (only in development)
     */
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(JSON.stringify({
                level: 'debug',
                message,
                timestamp: new Date().toISOString(),
                ...meta
            }));
        }
    },

    /**
     * Log HTTP requests
     */
    http: (req, statusCode, responseTime) => {
        console.log(JSON.stringify({
            level: 'http',
            method: req.method,
            url: req.url,
            statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        }));
    },

    /**
     * Log authentication events
     */
    auth: (event, userId, meta = {}) => {
        console.log(JSON.stringify({
            level: 'auth',
            event, // 'login', 'logout', 'register', 'password_reset', etc.
            userId,
            timestamp: new Date().toISOString(),
            ...meta
        }));
    },

    /**
     * Log security events
     */
    security: (event, severity, meta = {}) => {
        console.warn(JSON.stringify({
            level: 'security',
            event,
            severity, // 'low', 'medium', 'high', 'critical'
            timestamp: new Date().toISOString(),
            ...meta
        }));
    }
};

module.exports = logger;