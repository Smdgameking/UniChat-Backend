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
    confirmpassword:{
        type: String,
        required: true
    },
    dob:{
        type: Date,
        required: true
    },
    gender:{
        type: String,
        enum: ['male', 'female'],
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
    profileInComplete:{
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('User', User);