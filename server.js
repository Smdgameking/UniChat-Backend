const express = require('express');
const app = express();
const authRoute = require('./Routes/Auth.route');
const tokenRoute = require('./Routes/token.route');
const authenticateToken = require('./middleware/auth.middleware');
const user = require('./Routes/user.route');
const friend = require('./Routes/friend.route');
const notification = require('./Routes/notification.route');
const server = require('./Routes/server.route');
const chat = require('./Routes/chat.route');
const userStatus = require('./Routes/userStatus.route');
const cors = require("cors");
require("dotenv").config();
require('./db/db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes - no token required
app.use('/auth', authRoute);
app.use('/auth', tokenRoute);

// Protected routes - token required for all other routes
app.use(authenticateToken);

app.use('/user', user);
app.use('/friend', friend);
app.use('/notification', notification);
app.use('/server', server);
app.use('/chat', chat);
app.use('/user', userStatus);
// Example protected route
app.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

app.listen(3000, "0.0.0.0",() => {
    console.log('Server is running on port 3000');
});