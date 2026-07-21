const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/token.utils');

const register = async (req, res, next) => {
    try {
        const { displayName, username, email, password, dob } = req.body;

        // Input validation
        if (!username || !email || !password || !dob) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: username, email, password, and date of birth'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Registration failed. Please try again.'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            displayName,
            username,
            email,
            password: hashedPassword,
            dob,
            profileInComplete: true
        });

        await user.save();

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        res.status(200).json({
            success: true,
            profileInComplete: user.profileInComplete,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = { register, login };