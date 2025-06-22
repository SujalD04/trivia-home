const express = require('express');
const UserStats = require('../models/UserStats');

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
    const topUsers = await UserStats.find({})
      .sort({ totalWins: -1 }) // or sort by totalGames or totalQuestions
      .limit(25);

    res.json(topUsers);
  } catch (err) {
    console.error('Error fetching global leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
