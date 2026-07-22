const mongoose = require('mongoose');

const User = mongoose.Schema({
    displayName:{
        type: String
    },
    username:{
        type: String,
        unique: true,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    dob:{
        type: Date,
        required: true
    },
    gender:{
        type: String,
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
    },
    bio:{
        type: String,
    },
    country:{
        type: String,
    },
    phoneNo:{
        type: Number,
    },
    avatar:{
        type: String,
        default: null
    },
    banner:{
        type: String,
        default: null
    },
    status:{
        type: String,
        enum: ['online', 'away', 'dnd', 'offline'],
        default: 'offline'
    },
    lastSeen:{
        type: Date,
        default: Date.now
    },
    emailVerified:{
        type: Boolean,
        default: false
    },
    profileInComplete:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('User', User);