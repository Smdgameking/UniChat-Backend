const { register, login, getUserById, updateProfile } = require('../services/user.service');

const registerHandler = async (req, res, next) => {
    try {
        const result = await register(req.body);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

const loginHandler = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { registerHandler, loginHandler };
