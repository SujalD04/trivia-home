// backend/routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User'); // We'll need the User model for hostId
const bcrypt = require('bcryptjs'); // For password hashing
const { v4: uuidv4 } = require('uuid'); // For generating unique room IDs

// Install uuid if you haven't already: npm install uuid
// And bcryptjs: npm install bcryptjs

// Helper to generate a simple alphanumeric room ID
const generateRoomId = () => {
    // Generate a 6-character alphanumeric ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};


// @route   POST /api/rooms/create
// @desc    Create a new game room
// @access  Public (for now, will involve user later)
router.post('/create', async (req, res) => {
    const { roomName, password, username } = req.body; // Expecting username of the host

    // Basic validation
    if (!roomName || !password || !username) {
        return res.status(400).json({ message: 'Please enter a room name, password, and username.' });
    }

    try {
        // Check if roomName already exists (case-insensitive for user-friendliness)
        const existingRoom = await Room.findOne({ roomId: roomName.toUpperCase() });
        if (existingRoom) {
            return res.status(409).json({ message: 'Room name already taken. Please choose another.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const trimmedUsername = username.trim().toLowerCase();
        if (trimmedUsername.length > 26) {
            return res.status(400).json({ message: 'Username cannot exceed 26 characters.' });
        }

        if (trimmedUsername.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters.' });
        }


        // Ensure the host user exists or create them (basic user creation if not existing)
        let user = await User.findById(req.body.userId);
        if (!user) {
        user = new User({
            _id: req.body.userId,
            username: trimmedUsername,
        });
        await user.save();
        }



        const newRoom = new Room({
            roomId: roomName.toUpperCase(), // Using roomName as roomId, converted to uppercase
            passwordHash,
            hostId: trimmedUsername // Store the username of the host
        });

        await newRoom.save();
        res.status(201).json({
            message: 'Room created successfully!',
            roomId: newRoom.roomId,
            settings: newRoom.settings,
            hostId: trimmedUsername
        });

    } catch (err) {
        console.error('Error creating room:', err.message);
        // Handle Mongoose validation errors or other server errors
        res.status(500).json({ message: 'Server error. Could not create room.' });
    }
});


// @route   POST /api/rooms/join
// @desc    Join an existing game room
// @access  Public
router.post('/join', async (req, res) => {
    const { roomId, password, username } = req.body;

    if (!roomId || !password || !username) {
        return res.status(400).json({ message: 'Please enter room ID, password, and username.' });
    }

    try {
        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        const isMatch = await bcrypt.compare(password, room.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        const trimmedUsername = username.trim().toLowerCase();
        if (trimmedUsername.length > 26) {
            return res.status(400).json({ message: 'Username cannot exceed 26 characters.' });
        }
        if (trimmedUsername.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters.' });
        }


        // Ensure the joining user exists or create them (basic user creation if not existing)
        let user = await User.findById(req.body.userId);

        if (!user) {
        user = new User({
            _id: req.body.userId,                    // ✅ This MUST be a UUID string
            username: trimmedUsername,
        });
        await user.save();
        }



        // Check if room is full
        // NOTE: Actual "players in room" will be managed by Socket.IO in-memory.
        // This is a placeholder for a maxPlayers check on the DB model level.
        // The real check will happen via Socket.IO room occupancy.
        // For now, we'll just allow joining if room exists and password is correct.
        // We'll add real-time checks later.

        res.status(200).json({
            message: 'Successfully joined room!',
            roomId: room.roomId,
            settings: room.settings,
            hostId: trimmedUsername
        });

    } catch (err) {
        console.error('Error joining room:', err.message);
        res.status(500).json({ message: 'Server error. Could not join room.' });
    }
});

module.exports = router;