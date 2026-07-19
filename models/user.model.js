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
    }
})