const express = require('express');
const route = express.Router();
const { registerHandler, loginHandler } = require('../controller/user.controller');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

// Apply strict rate limiting to auth endpoints
// Prevents brute force attacks on login/register
route.use(authLimiter);

// Register with validation and rate limiting
route.post('/register', validateRegister, handleValidationErrors, registerHandler);

// Login with validation and rate limiting
route.post('/login', validateLogin, handleValidationErrors, loginHandler);

module.exports = route;
