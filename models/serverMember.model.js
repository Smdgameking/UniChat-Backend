const mongoose = require('mongoose');

const ServerMemberSchema = mongoose.Schema({
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate memberships
ServerMemberSchema.index({ server: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ServerMember', ServerMemberSchema);