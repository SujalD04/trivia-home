// backend/models/ShopItem.js
const mongoose = require('mongoose');

const ShopItemSchema = new mongoose.Schema({
    name: { // e.g., "Red Cap", "Cool Shades"
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: { // e.g., "head", "body", "accessory"
        type: String,
        required: true,
        enum: ['head', 'body', 'accessory']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    assetPath: { // URL or path to the asset for the frontend
        type: String,
        required: true
    },
    isDefault: { // If this item is part of the default avatar options
        type: Boolean,
        default: false
    }
});

ShopItemSchema.index({ name: 1 }, { unique: true });

const ShopItem = mongoose.model('ShopItem', ShopItemSchema);

module.exports = ShopItem;