// backend/models/User.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: uuidv4, // 👈 Automatically assigns UUID string
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 26
  },
  avatar: {
    head: { type: String, default: 'default-head' },
    body: { type: String, default: 'default-body' },
    accessory: { type: String, default: 'default-accessory' }
  },
  coins: { type: Number, default: 0, min: 0 },
  cosmetics: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
