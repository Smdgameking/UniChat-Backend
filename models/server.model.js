const mongoose = require('mongoose');

const ServerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Server', ServerSchema);