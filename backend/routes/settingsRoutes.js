// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router(); // Create a new router instance
const UserSetting = require('../models/UserSetting'); // Import the UserSetting model

/**
 * @route GET /api/settings/:userId
 * @description Get user settings by userId.
 * If settings for the userId do not exist, return a 404.
 * @access Public (or protected if you implement authentication)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL parameters
    const settings = await UserSetting.findOne({ userId: userId }); // Find settings by userId

    if (!settings) {
      // If no settings document is found for the given userId
      return res.status(404).json({ message: 'Settings not found for this user.' });
    }

    // If settings are found, send them as JSON
    res.json(settings);
  } catch (error) {
    // Send a 500 Internal Server Error response
    res.status(500).json({ message: 'Server error while fetching settings.' });
  }
});

/**
 * @route PUT /api/settings/:userId
 * @description Update user settings by userId.
 * If settings for the userId do not exist, create them (upsert).
 * @access Public (or protected if you implement authentication)
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL parameters
    // Destructure the expected settings fields from the request body
    const { soundEnabled, notificationsEnabled, theme, fastMode, musicVolume, preferredLanguage } = req.body;

    // Use findOneAndUpdate to find a document by userId and update it.
    // If no document is found, `upsert: true` will create a new one.
    // `new: true` returns the modified document rather than the original.
    // `runValidators: true` ensures that schema validators are run on the update.
    const updatedSettings = await UserSetting.findOneAndUpdate(
      { userId: userId }, // Query: find by userId
      { soundEnabled, notificationsEnabled, theme, fastMode, musicVolume, preferredLanguage }, // Update fields
      { new: true, upsert: true, runValidators: true } // Options
    );

    // Send the updated (or newly created) settings as JSON
    res.json(updatedSettings);
  } catch (error) {
    // Send a 500 Internal Server Error response
    res.status(500).json({ message: 'Server error while updating settings.' });
  }
});


module.exports = router;
