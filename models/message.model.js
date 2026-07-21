const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    // For channel messages
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },
    // For friend messages
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Message type: 'channel' or 'friend'
    type: {
        type: String,
        enum: ['channel', 'friend'],
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);