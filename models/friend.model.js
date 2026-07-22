const mongoose = require('mongoose');

const FriendSchema = mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate friend requests
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Update timestamp on save
FriendSchema.pre('save', function() {
    this.updatedAt = new Date();
});

module.exports = mongoose.model('Friend', FriendSchema);