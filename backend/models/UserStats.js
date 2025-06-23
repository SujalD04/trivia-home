const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema({
   _id: { type: String, required: true },
  totalGames: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  fastestAnswerTime: { type: Number, default: null }
}, { timestamps: true });

const UserStats = mongoose.model('UserStats', UserStatsSchema);
module.exports = UserStats;
