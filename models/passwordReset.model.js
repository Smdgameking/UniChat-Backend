const mongoose = require('mongoose');

const PasswordResetSchema = mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-delete expired tokens
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for quick token lookup
PasswordResetSchema.index({ token: 1 });

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);