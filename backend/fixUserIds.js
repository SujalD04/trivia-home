const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = 'mongodb+srv://Sujal04:sujal123@cluster0.0wanz.mongodb.net/TriviaHome?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your URI

const userSchema = new mongoose.Schema({
  _id: String,
  username: String,
  avatar: Object,
  coins: Number,
  cosmetics: Array,
  createdAt: Date
});
const User = mongoose.model('User', userSchema, 'users');

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const oldUsers = await User.find({}).lean();
    const bulkOps = [];

    for (const oldUser of oldUsers) {
      if (typeof oldUser._id === 'string') continue; // Already migrated

      const newUser = {
        _id: uuidv4(),
        username: oldUser.username,
        avatar: oldUser.avatar || {},
        coins: oldUser.coins || 0,
        cosmetics: oldUser.cosmetics || [],
        createdAt: oldUser.createdAt || new Date()
      };

      bulkOps.push({ insertOne: { document: newUser } });
    }

    if (bulkOps.length > 0) {
      await User.collection.bulkWrite(bulkOps);
      console.log(`🔁 Migrated ${bulkOps.length} user(s)`);
    } else {
      console.log('✅ All users already use UUIDs');
    }

    console.log('✅ Migration complete.');
    process.exit();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();
