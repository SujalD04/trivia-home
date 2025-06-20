// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 26
    },
    avatar: {
        head: { type: String, default: 'default-head' }, // Store ID or path to default head asset
        body: { type: String, default: 'default-body' }, // Store ID or path to default body asset
        accessory: { type: String, default: 'default-accessory' } // Store ID or path to default accessory asset
    },
    coins: {
        type: Number,
        default: 0,
        min: 0
    },
    cosmetics: [{ // Array of cosmetic item names or IDs the user owns
        type: String // We'll store the 'name' of the shop item here
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const User = mongoose.model('User', UserSchema);

module.exports = User;