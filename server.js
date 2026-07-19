const express = require('express');
const app = express();
const authRoute = require('./Routes/Auth.route');
const authenticateToken = require('./middleware/auth.middleware');
const cors = require("cors");
require("dotenv").config();
require('./db/db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes - no token required
app.use('/auth', authRoute);

// Protected routes - token required for all other routes
app.use(authenticateToken);

// Example protected route
app.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});