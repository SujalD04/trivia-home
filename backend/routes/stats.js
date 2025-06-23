const express = require('express');
const mongoose = require('mongoose');
const UserStats = require('../models/UserStats');
const User = require('../models/User');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const stats = await UserStats.findOne({ userId: req.params.userId });
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/global/top', async (req, res) => {
  try {
    const topUsers = await UserStats.aggregate([
      { $sort: { totalWins: -1 } },
      { $limit: 25 },
      {
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
        }

      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: 1,
          totalGames: 1,
          totalWins: 1,
          totalLosses: 1,
          totalQuestions: 1,
          fastestAnswerTime: 1,
          username: '$userDetails.username',  // ✅ inject username
          avatar: '$userDetails.avatar'       // ✅ inject avatar if needed
        }
      }
    ]);
    
    res.json(topUsers);
  } catch (err) {
    console.error('Error fetching global leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
