const mongoose = require('mongoose');

const ChannelSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'voice'],
        required: true,
        default: 'text'
    },
    description: {
        type: String,
        default: ''
    },
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Channel', ChannelSchema);