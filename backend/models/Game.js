// backend/models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    roomId: { // Reference to the room where the game was played
        type: String,
        required: true
    },
    questions: [{ // Snapshot of questions asked in this specific game
        questionText: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        options: { type: [String], required: true },
        type: { type: String, required: true } // e.g., "multiple_choice", "boolean"
    }],
    results: [{ // Final results for each participant
        username: { type: String, required: true },
        score: { type: Number, default: 0 },
        isWinner: { type: Boolean, default: false }
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }
});

const Game = mongoose.model('Game', GameSchema);

module.exports = Game;