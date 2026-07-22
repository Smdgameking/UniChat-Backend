/**
 * Standardized API Response Formatter
 * 
 * Why standardized responses?
 * - Consistent frontend experience
 * - Easier to handle responses on frontend
 * - Better error tracking and debugging
 * - Professional API design
 */

const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data
    };

    return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
        ...(errors && { errors })
    };

    return res.status(statusCode).json(response);
};

const sendPaginatedResponse = (res, message, data, pagination, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            currentPage: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
            totalItems: pagination.total || 0,
            itemsPerPage: pagination.limit || 10,
            hasNextPage: pagination.hasNextPage || false,
            hasPreviousPage: pagination.hasPreviousPage || false
        }
    };

    return res.status(statusCode).json(response);
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginatedResponse
};