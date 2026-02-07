const express = require('express');
const mongoose = require('mongoose');
const UserStats = require('../models/UserStats');
const User = require('../models/User');

const router = express.Router();

// Get stats for a specific user by userId (which is stored as _id in UserStats)
router.get('/:userId', async (req, res) => {
  try {
    // UserStats uses _id as the userId
    const stats = await UserStats.findById(req.params.userId);
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
          localField: "_id",  // UserStats._id is the userId
          foreignField: "_id", // User._id is also the userId
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
          _id: 1,
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
