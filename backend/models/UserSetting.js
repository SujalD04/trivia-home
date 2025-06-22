// backend/models/UserSetting.js
const mongoose = require('mongoose');

// Define the schema for user settings
const UserSettingSchema = new mongoose.Schema({
  // userId from your frontend (e.g., from useUserStore)
  userId: {
    type: String,
    required: true,
    unique: true, // Ensures each user has only one settings document
    index: true, // Adds an index for faster lookups by userId
  },
  soundEnabled: {
    type: Boolean,
    default: true, // Default value if not provided
  },
  notificationsEnabled: {
    type: Boolean,
    default: true, // Default value
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'system'], // Example themes, 'system' can be added for auto-detect
    default: 'dark', // Default theme
  },
  fastMode: {
    type: Boolean,
    default: false, // Default value
  },
  preferredLanguage: {
    type: String,
    default: 'en',
  },
}, {
  timestamps: true // Adds `createdAt` and `updatedAt` fields automatically
});

// Create and export the Mongoose model
const UserSetting = mongoose.model('UserSetting', UserSettingSchema);

module.exports = UserSetting;
