// backend/models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomId: { // A more user-friendly, unique ID for joining
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, // Optional: make room IDs uppercase for consistency
        minlength: 4,
        maxlength: 10
    },
    passwordHash: {
        type: String,
        required: true
    },
    settings: {
        questionCount: { type: Number, default: 10, min: 1, max: 20 },
        timePerQuestion: { type: Number, default: 20, min: 10, max: 60 }, // seconds
        categories: { type: [String], default: ['any'] }, // e.g., ['Science & Nature', 'History']
        maxPlayers: { type: Number, default: 8, min: 2, max: 12 }
    },
    hostId: { // Stores the username of the user who created the room
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;