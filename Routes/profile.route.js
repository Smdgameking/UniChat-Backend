const express = require('express');
const route = express.Router();
const {
    getMyProfile,
    getUserProfile,
    updateMyProfile,
    updateUserStatus
} = require('../controller/profile.controller');

// Get current user's profile
// GET /user/profile
route.get('/profile', getMyProfile);

// Get user profile by username
// GET /user/profile/:username
route.get('/profile/:username', getUserProfile);

// Update current user's profile
// PATCH /user/profile
route.patch('/profile', updateMyProfile);

// Update user status
// PATCH /user/status
route.patch('/status', updateUserStatus);

module.exports = route;