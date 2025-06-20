// backend/models/Cosmetic.js
const mongoose = require('mongoose');

const cosmeticSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // Unique ID for quick lookup
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['avatar', 'border', 'theme'] },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Cosmetic = mongoose.model('Cosmetic', cosmeticSchema);

module.exports = Cosmetic;