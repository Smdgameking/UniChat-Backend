const express = require('express');
const route = express.Router();
route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.post('/login', (req, res, next)=>{
    console.log('Login route hit');
    next();
}, (req, res) => {
    const { email, password } = req.body;
    console.log(`Logining user with email: ${email} and password: ${password}`);
    res.json({
        success: true
    });
});

module.exports = route;