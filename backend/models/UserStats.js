const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  totalGames: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  fastestAnswerTime: { type: Number, default: null },
}, { timestamps: true });

const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats;