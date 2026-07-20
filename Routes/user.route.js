const express = require('express');
const route = express.Router();
const User = require('../models/user.model');

route.post('/complete-profile', async (req, res) => {
    try {
        const {username, displayName, bio, gender, country, phoneNo} = req.body;
        const user = await User.findOneAndUpdate(
            { username },
            { displayName, gender, bio, country, phoneNo, profileInComplete: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            profileInComplete: false,
            displayName: displayName,
            message: 'Profile Completed',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = route;