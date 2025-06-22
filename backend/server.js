// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');



// Import your models
const User = require('./models/User');
const Room = require('./models/Room');
const Game = require('./models/Game'); // Assuming you have a Game model for history

// Import routes
const roomRoutes = require('./routes/roomRoutes');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settingsRoutes');

// Import utilities
const { fetchTriviaQuestions, fetchTriviaCategories } = require('./utils/triviaApi');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://trivia-home.vercel.app'], // allow all dev origins you might use
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Live Game/Lobby State (In-Memory) ---
/**
 * activeRooms Map structure:
 * Key: roomId (String)
 * Value: {
 * hostUsername: String, // Original host username from DB
 * currentHostSocketId: String | null, // Socket ID of the current host (can change if original host disconnects)
 * settings: {}, // copy of room settings from DB
 * players: Map<socketId, { username: String, avatar: Object, score: Number, isHost: Boolean, answered: Boolean }>,
 * usernamesInRoom: Set<String>, // To quickly check for duplicate usernames (case-insensitive)
 * status: String, // 'waiting', 'playing', 'finished'
 * currentQuestionIndex: Number,
 * questions: Array, // All questions for the current game
 * currentQuestionTimer: NodeJS.Timeout | null, // To clear the timer
 * questionStartTime: Number, // Timestamp when current question was sent (for score calculation)
 * }
 */
const activeRooms = new Map();

// --- Game Constants ---
const POINTS_FOR_CORRECT_ANSWER = 100;
const BONUS_FOR_FASTEST_ANSWER_PERCENT = 0.2; // 20% bonus

setInterval(() => {
    const now = Date.now();
    for (const [username, ts] of recentDisconnects.entries()) {
        if (now - ts > 10000) recentDisconnects.delete(username);
    }
}, 10000);


// --- API Routes ---
app.use('/api/rooms', roomRoutes);
// Basic test route
app.get('/', (req, res) => {
    res.send('Trivia Home Backend is running!');
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await fetchTriviaCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error in endpoint:', error);
        res.status(500).json({ message: 'Failed to fetch categories from trivia API', detail: error.message });
    }
});

app.get('/api/questions', async (req, res) => {
    try {
        const { amount, category, difficulty, type } = req.query; // Extract query parameters

        const questions = await fetchTriviaQuestions({
            amount: amount ? parseInt(amount, 10) : undefined,
            category: category || undefined, // Pass category ID or 'any' if not provided
            difficulty: difficulty || undefined,
            type: type || undefined
        });
        res.json(questions);
    } catch (error) {
        console.error('Error in endpoint:', error);
        res.status(500).json({ message: 'Failed to fetch questions from trivia API', detail: error.message });
    }
});

const recentDisconnects = new Map(); // username.toLowerCase() → timestamp

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {

    // --- Lobby Management Events ---
    socket.on('join_room', async ({ roomId, username, avatar, userId }) => {

    if (!roomId || !username || !avatar) {
        console.warn(`Invalid join_room attempt by User. Missing data.`);
        socket.emit('join_room_error', { message: 'Missing room ID, username, or avatar.' });
        socket.emit("join_error", { error: "You're already in the room on another tab or from a recent session." });
        return;
    }

    roomId = roomId.toUpperCase();
    let roomState = activeRooms.get(roomId);

    const dbRoom = await Room.findOne({ roomId });
    if (!dbRoom) {
        socket.emit('join_room_error', { message: 'Room does not exist.' });
        return;
    }

    if (!roomState) {
        roomState = {
            hostUsername: dbRoom.hostId,
            currentHostSocketId: null,
            settings: dbRoom.settings,
            players: new Map(),
            usernamesInRoom: new Set(),
            status: 'waiting',
            currentQuestionIndex: 0,
            questions: [],
            currentQuestionTimer: null,
            questionStartTime: 0
        };
        activeRooms.set(roomId, roomState);
    }

    if (roomState.players.size >= roomState.settings.maxPlayers) {
        socket.emit('join_room_error', { message: 'Room is full.' });
        return;
    }

    if (roomState.status === 'playing') {
        socket.emit('join_room_error', { message: 'Cannot join: game is already in progress.' });
        return;
    }

    const usernameKey = username.toLowerCase();
    const isUsernameTaken = roomState.usernamesInRoom.has(usernameKey);
    const graceData = recentDisconnects.get(usernameKey);
    const inGracePeriod = graceData && (Date.now() - graceData.timestamp < 2000);

    if (isUsernameTaken && !inGracePeriod) {
        socket.emit('join_room_error', { message: `Username "${username}" is already in this room.` });
        return;
    }

    if (inGracePeriod) {
        if (graceData.claimed) {
            socket.emit('join_room_error', { message: `Username "${username}" is already in this room.` });
            return;
        }

        graceData.claimed = true;
        recentDisconnects.set(usernameKey, graceData);
    }

    let isHostForThisSession = false;
    if (username === roomState.hostUsername) {
        if (!roomState.currentHostSocketId) {
            roomState.currentHostSocketId = socket.id;
            isHostForThisSession = true;
        } 
    } else if (!roomState.currentHostSocketId && roomState.players.size === 0) {
        roomState.currentHostSocketId = socket.id;
        isHostForThisSession = true;
    }

    roomState.players.set(socket.id, {
        socketId: socket.id,
        username,
        avatar,
        score: 0,
        isHost: isHostForThisSession || (socket.id === roomState.currentHostSocketId),
        answered: false,
        userId
    });
    roomState.usernamesInRoom.add(usernameKey);
    socket.join(roomId);

    // Optional: Cleanup grace period entry a few seconds later
    if (inGracePeriod) {
        setTimeout(() => {
            recentDisconnects.delete(usernameKey);
        }, 3000); // Add a small buffer after claiming
    }

    const participants = Array.from(roomState.players.values());
    io.to(roomId).emit('update_lobby', {
        roomId: roomId,
        participants: participants,
        settings: roomState.settings,
        status: roomState.status,
        hostUsername: roomState.players.get(roomState.currentHostSocketId)?.username || roomState.hostUsername
    });
});

    //Live Chat
    socket.on('chatMessage', (data) => {
    let { roomId, senderId, senderName, senderAvatar, text, timestamp } = data;

    // Enforce max message length
    text = text.trim();
    if (text.length === 0) return; // Ignore empty messages
    if (text.length > 300) {
        return socket.emit('notification', {
            type: 'error',
            message: 'Chat messages cannot exceed 300 characters.'
        });
    }

    // Ensure the user is actually in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.has(socket.id)) {
        io.to(roomId).emit('chatMessage', {
            senderId,
            senderName,
            senderAvatar,
            text,
            timestamp
        });
    } else {
        console.warn(`User tried to send message to unauthorized room ${roomId}`);
        socket.emit('notification', {
            type: 'error',
            message: 'You are not in this room.'
        });
    }
});


    // --- Disconnect Event ---
    socket.on('disconnect', async () => {

        // Find which room the disconnected socket belonged to
        // We iterate through activeRooms because a socket might be in multiple rooms (though typically one for a quiz)
        // Or if the client didn't explicitly leave before disconnecting.
        for (let [roomId, roomState] of activeRooms.entries()) {
            if (roomState.players.has(socket.id)) {
                const disconnectedPlayer = roomState.players.get(socket.id);
                roomState.players.delete(socket.id); // Remove player from room state

                if (disconnectedPlayer?.username) {
                    const usernameKey = disconnectedPlayer.username.toLowerCase();

                    // Track recent disconnect for grace period
                    recentDisconnects.set(usernameKey, {
                        time: Date.now(),
                        claimed: false
                    });

                    // Remove from in-memory username tracking
                    if (roomState.usernamesInRoom instanceof Set) {
                        roomState.usernamesInRoom.delete(usernameKey);
                    } else {
                        console.warn(`usernamesInRoom not a Set during disconnect for room ${roomId}. Re-initializing.`);
                        roomState.usernamesInRoom = new Set();
                    }

                } else {
                    console.warn("disconnect(): No username found for socket");
                }


                // Handle host disconnection
                if (socket.id === roomState.currentHostSocketId) {
                    if (roomState.players.size > 0) {
                        // Assign new host: For simplicity, the first player in the map becomes the new host.
                        // In a real game, you might want more sophisticated logic (e.g., longest-staying player, random).
                        const newHostSocketId = roomState.players.keys().next().value;
                        const newHostPlayer = roomState.players.get(newHostSocketId);
                        newHostPlayer.isHost = true; // Mark as host
                        roomState.currentHostSocketId = newHostSocketId;
                    } else {
                        // No players left, clear current host
                        roomState.currentHostSocketId = null;
                    }
                }

                // Check if the room is now empty and then clean up room when empty
                if (roomState.players.size === 0) {
                    activeRooms.delete(roomId);
                    // Remove from in-memory state
                    // Clear any game timer if it was running for this room
                    if (roomState.currentQuestionTimer) {
                        clearTimeout(roomState.currentQuestionTimer);
                        roomState.currentQuestionTimer = null;
                    }

                    // Delete the room document from MongoDB
                    try {
                        await Room.deleteOne({ roomId: roomId });
                        // Await the deletion
                        // No need to emit update_lobby if room is empty
                    } catch (error) {
                        console.error(`Error deleting room ${roomId} from DB:`, error);
                    }
                } else {
                    // Update host status for all remaining players based on new currentHostSocketId
                    roomState.players.forEach(p => {
                        p.isHost = (p.socketId === roomState.currentHostSocketId);
                    });
                    // Emit updated lobby state to remaining players in that room
                    const participants = Array.from(roomState.players.values());
                    io.to(roomId).emit('update_lobby', {
                        roomId: roomId,
                        participants: participants,
                        settings: roomState.settings,
                        status: roomState.status,
                        hostUsername: roomState.players.get(roomState.currentHostSocketId)?.username || roomState.hostUsername
                    });
                    // If game was playing and host disconnected, consider pausing or ending if specific rules apply
                    // For now, it will continue with new host.
                    if (roomState.status === 'playing' && disconnectedPlayer.isHost && roomState.currentHostSocketId) {
                    }
                }
                break;
                // Stop iterating once the room is found and handled
            }
        }
    });

    // --- Custom 'leave_room' event (if you add a "Leave Room" button on client) ---
    // This is similar to disconnect but initiated by the client explicitly.
    socket.on('leave_room', async ({ roomId }) => {
        if (!roomId) {
            console.warn(`Invalid leave_room attempt by User. Missing room ID.`);
            return;
        }
        roomId = roomId.toUpperCase();
        const roomState = activeRooms.get(roomId);

        if (!roomState || !roomState.players.has(socket.id)) {
            console.warn(`User tried to leave room ${roomId} but was not found in it.`);
            return;
        }

        const leavingPlayer = roomState.players.get(socket.id);
        socket.leave(roomId); // Make the socket leave the Socket.IO room

        roomState.players.delete(socket.id);
        roomState.usernamesInRoom.delete(leavingPlayer.username.toLowerCase());

        // Host transfer logic
        if (socket.id === roomState.currentHostSocketId) {
            if (roomState.players.size > 0) {
                const newHostSocketId = roomState.players.keys().next().value;
                const newHostPlayer = roomState.players.get(newHostSocketId);
                newHostPlayer.isHost = true;
                roomState.currentHostSocketId = newHostSocketId;
            } else {
                roomState.currentHostSocketId = null;
            }
        }

        if (roomState.players.size === 0) {
            roomState.status = 'finished';
            if (roomState.currentQuestionTimer) {
                clearTimeout(roomState.currentQuestionTimer);
                roomState.currentQuestionTimer = null;
            }
            io.to(roomId).emit('game_error', { message: 'Room became empty, quiz ended.' });
            activeRooms.delete(roomId);
        } else {
            roomState.players.forEach(p => {
                p.isHost = (p.socketId === roomState.currentHostSocketId);
            });
            const participants = Array.from(roomState.players.values());
            io.to(roomId).emit('update_lobby', {
                roomId: roomId,
                participants: participants,
                settings: roomState.settings,
                status: roomState.status,
                hostUsername: roomState.players.get(roomState.currentHostSocketId)?.username || roomState.hostUsername
            });
        }
    });

    // --- Game Settings Update (Host Only) ---
    socket.on('update_game_settings', async ({ roomId, settings }) => {
        roomId = roomId.toUpperCase();
        const roomState = activeRooms.get(roomId);
        const player = roomState?.players.get(socket.id);

        if (!roomState || socket.id !== roomState.currentHostSocketId) {
            console.warn(`Unauthorized attempt to update settings for room ${roomId}.`);
            socket.emit('game_settings_error', { message: 'You are not authorized to change settings.' });
            return;
        }
        if (roomState.status === 'playing') {
            console.warn(`Attempt to update settings for room ${roomId} while game is playing.`);
            socket.emit('game_settings_error', { message: 'Cannot change settings while a game is in progress.' });
            return;
        }

        // Basic validation for settings (expand this based on your actual settings structure)
        if (settings.questionCount && (isNaN(settings.questionCount) ||
            settings.questionCount < 1 || settings.questionCount > 50)) {
            socket.emit('game_settings_error', { message: 'Invalid question count.' });
            return;
        }
        if (settings.timePerQuestion && (isNaN(settings.timePerQuestion) || settings.timePerQuestion < 5 || settings.timePerQuestion > 60)) {
            socket.emit('game_settings_error', { message: 'Invalid time per question.' });
            return;
        }


        // Apply new settings
        roomState.settings = { ...roomState.settings, ...settings };

        // Update settings in database for persistence
        try {
            await Room.findOneAndUpdate({ roomId }, { settings: roomState.settings }, { new: true });
            // Broadcast updated settings to all clients in the room
            io.to(roomId).emit('game_settings_updated', {
                roomId: roomId,
                settings: roomState.settings
            });
        } catch (err) {
            console.error(`Error saving updated room settings for ${roomId}:`, err);
            socket.emit('game_settings_error', { message: 'Could not save settings to database.' });
        }
    });

    // --- NEW Socket.IO Event: delete_room (Host initiated) ---
    socket.on('delete_room', async ({ roomId }) => {
        roomId = roomId.toUpperCase();
        const roomState = activeRooms.get(roomId);
        const player = roomState?.players.get(socket.id);

        // Validation: Check if room exists, sender is the current live host
        if (!roomState || !player || socket.id !== roomState.currentHostSocketId) {
            console.warn("Unauthorized attempt to delete room.");
            socket.emit('room_error', { message: 'You are not authorized to delete this room or room does not exist.' });
            return;
        }


        try {
            // Emit an event to all clients in the room that the
            io.to(roomId).emit('room_deleted', { roomId: roomId, message: 'The host has deleted the room.' });

            // Disconnect all clients in the room (optional, but ensures cleanup)
            // A more robust approach might be to have clients gracefully leave on 'room_deleted'
            // For a test client, this is fine, for production, clients should handle leaving.
            const sockets = await io.in(roomId).fetchSockets();

            sockets.forEach(socket => {
                socket.disconnect(true);
            });
            // Disconnects all sockets in the room

            // Clear any game timer
            if (roomState.currentQuestionTimer) {
                clearTimeout(roomState.currentQuestionTimer);
                roomState.currentQuestionTimer = null;
            }

            // Remove from in-memory state
            activeRooms.delete(roomId);

            // Delete the room document from MongoDB
            await Room.deleteOne({ roomId: roomId });

        } catch (error) {
            console.error(`Error deleting room ${roomId} by host:`, error);
            socket.emit('room_error', { message: 'An error occurred while deleting the room.' });
        }
    });

    // --- Game Start Event (Host Only) ---
    socket.on('start_game', async ({ roomId }) => {
        roomId = roomId.toUpperCase();
        const roomState = activeRooms.get(roomId);
        const player = roomState?.players.get(socket.id);

        // Validation: Check if room exists, sender is host, and game is not already playing
        if (!roomState || !player || socket.id !== roomState.currentHostSocketId) {
            console.warn(`Unauthorized attempt to start game for room ${roomId} by ${socket.id}.`);
            socket.emit('game_error', { message: 'You are not authorized to start the game or room does not exist.' });
            return;
        }
        if (roomState.status === 'playing') {
            console.warn(`Attempt to start game in room ${roomId}, but game is already in progress.`);
            socket.emit('game_error', { message: 'Game is already in progress.' });
            return;
        }
        if (roomState.players.size < 2) { // Minimum 2 players to start a game
            socket.emit('game_error', { message: 'Need at least 2 players to start a game.' });
            return;
        }

        // Set room status to playing
        roomState.status = 'playing';
        roomState.currentQuestionIndex = 0;
        roomState.questions = []; // Clear any previous questions
        // Reset scores and answered status for new game
        roomState.players.forEach(p => {
            p.score = 0;
            p.answered = false;
        });

        try {
            // Fetch questions based on room settings
            const questions = await fetchTriviaQuestions({
                amount: roomState.settings.questionCount,
                type: 'multiple', // Or roomState.settings.type, if implemented
                difficulty: roomState.settings.difficulty === 'any' ? undefined : roomState.settings.difficulty,
                // FIXED: Directly join the categories array which already contains numeric IDs.
                category: roomState.settings.categories.length > 0 ? roomState.settings.categories.join(',') : undefined
            });
            if (questions.length === 0) {
                console.error(`Failed to fetch questions for room ${roomId}. Resetting status to waiting.`);
                roomState.status = 'waiting'; // Reset status if no questions
                io.to(roomId).emit('game_error', { message: 'Could not fetch trivia questions. Please try again later.' });
                return;
            }

            roomState.questions = questions;
            // Notify all clients in the room that the game is starting
            io.to(roomId).emit('game_starting', {
                roomId: roomId,
                settings: roomState.settings,
                players: Array.from(roomState.players.values()) // Send initial player list with 0 scores
            });
            // Start the first question after a short delay
            setTimeout(() => sendNextQuestion(roomId), 3000);
            // 3-second countdown

        } catch (error) {
            console.error(`Error starting game in room ${roomId}:`, error);
            roomState.status = 'waiting'; // Reset status if error
            io.to(roomId).emit('game_error', { message: 'An error occurred while starting the game.' });
        }
    });

    // --- Answer Submission Event ---
    socket.on('submit_answer', async ({ roomId, username, answer, userId }) => {
        roomId = roomId.toUpperCase();
        const roomState = activeRooms.get(roomId);
        const player = roomState?.players.get(socket.id);

        if (!roomState || roomState.status !== 'playing' || !player) {
            socket.emit('answer_feedback', { success: false, message: 'Invalid game state.' });
            return;
        }
        if (player.answered) {
            socket.emit('answer_feedback', { success: false, message: 'You have already answered this question.' });
            return;
        }

        const currentQuestion = roomState.questions[roomState.currentQuestionIndex];
        if (!currentQuestion) {
            socket.emit('answer_feedback', { success: false, message: 'No active question.' });
            return;
        }

        player.answered = true;

        const submittedAnswer = String(answer).trim().toLowerCase();
        const correctAnswer = String(currentQuestion.correctAnswer).trim().toLowerCase();
        let isCorrect = submittedAnswer === correctAnswer;
        let pointsEarned = 0;
        let isFastest = false;

        if (isCorrect) {
            pointsEarned = POINTS_FOR_CORRECT_ANSWER;

            if (!currentQuestion.firstCorrectAnswerSocketId) {
                pointsEarned += POINTS_FOR_CORRECT_ANSWER * BONUS_FOR_FASTEST_ANSWER_PERCENT;
                currentQuestion.firstCorrectAnswerSocketId = socket.id;
                isFastest = true;
            }

            player.score += pointsEarned;
            player.coins = (player.coins || 0) + pointsEarned;

            socket.emit('answer_feedback', {
                success: true,
                message: 'Correct answer!',
                correctAnswer: currentQuestion.correctAnswer
            });

            io.to(roomId).emit('score_update', {
                username,
                score: player.score,
                pointsEarned,
                isCorrect: true,
                isFastest,
                coins: player.coins
            });
        } else {
            socket.emit('answer_feedback', {
                success: false,
                message: 'Incorrect answer.',
                correctAnswer: currentQuestion.correctAnswer
            });

            io.to(roomId).emit('score_update', {
                username,
                score: player.score,
                pointsEarned: 0,
                isCorrect: false,
                isFastest: false,
                coins: player.coins || 0
            });
        }

        // ✅ Save stats to DB using userId
        if (userId) {
            try {
                const UserStats = await import('./models/UserStats.js').then(m => m.default); // ESM-style
                let user = await UserStats.findOne({ userId });
                if (!user) {
                    user = await UserStats.create({ userId });
                }

                user.totalQuestions += 1;
                if (isCorrect) {
                    user.totalWins += 1;
                } else {
                    user.totalLosses += 1;
                }

                const now = Date.now();
                const startTime = player.questionStartTime || now; // fallback in case
                const answerTime = (now - startTime) / 1000; // in seconds

                if (!user.fastestAnswerTime || answerTime < user.fastestAnswerTime) {
                    user.fastestAnswerTime = answerTime;
                }

                await user.save();
            } catch (err) {
                console.error("Error updating user stats:", err);
            }
        }
    });



    // --- Helper function to send next question ---
    const sendNextQuestion = async (roomId) => {
        const roomState = activeRooms.get(roomId);
        // Crucial check: If room state no longer exists (e.g., all players disconnected)
        // or game is no longer playing, stop the function.
        if (!roomState || roomState.status !== 'playing') {
            return;
        }

        // Clear previous question timer if exists
        if (roomState.currentQuestionTimer) {
            clearTimeout(roomState.currentQuestionTimer);
            roomState.currentQuestionTimer = null;
        }

        // Reset 'answered' status for all players for the new question
        roomState.players.forEach(player => {
            player.answered = false;
            player.questionStartTime = Date.now();
        });
        // Check if there are more questions
        if (roomState.currentQuestionIndex < roomState.questions.length) {
            const question = roomState.questions[roomState.currentQuestionIndex];
            // Reset fastest answer tracking for new question
            question.firstCorrectAnswerSocketId = null;
            roomState.questionStartTime = Date.now(); // Record start time
            io.to(roomId).emit('send_question', {
                questionIndex: roomState.currentQuestionIndex,
                questionText: question.questionText,
                options: question.options,
                timeLimit: roomState.settings.timePerQuestion,
                questionStartTime: roomState.questionStartTime
            });

            // Set a timer for the next question or game end
            roomState.currentQuestionTimer = setTimeout(() => {
                // Inform clients about time's up and correct answer
                io.to(roomId).emit('time_up', {
                    questionIndex: roomState.currentQuestionIndex,
                    correctAnswer: roomState.questions[roomState.currentQuestionIndex].correctAnswer
                });

                roomState.currentQuestionIndex++; // Move to next question
                sendNextQuestion(roomId);
            }, roomState.settings.timePerQuestion * 1000);
            // Convert seconds to milliseconds

        } else {
            // Game End Logic
            roomState.status = 'finished';

            // Calculate final results and determine winner(s)
            const finalResults = Array.from(roomState.players.values()).map(player => ({
                username: player.username,
                score: player.score,
                isWinner: false // Placeholder, set below
            }));
            // Determine winner(s) - handle ties
            const maxScore = Math.max(...finalResults.map(p => p.score));
            const winners = finalResults.filter(p => p.score === maxScore && maxScore > 0);
            // Assign winner status and calculate coins (e.g., winner gets 100 coins, others 10)
            const coinsEarnedMap = new Map();
            // To track coins earned by each user in this game
            for (const player of finalResults) {
                let coins = 0;
                if (winners.some(w => w.username === player.username)) {
                    player.isWinner = true;
                    coins = 100 + Math.floor(player.score / 20); // Winner bonus + score-based
                } else {
                    coins = Math.floor(player.score / 10) + 10;
                    // Base 10 coins + score based
                }
                coinsEarnedMap.set(player.username, coins);
            }

            // Update user coins in DB (using Promise.all for efficiency)
            await Promise.all(
                Array.from(coinsEarnedMap.entries()).map(([username, coinsEarned]) =>
                    User.findOneAndUpdate(
                        { username: username.toLowerCase() },
                        { $inc: { coins: coinsEarned } },
                        { new: true, upsert: true } // upsert ensures user exists
                    )
                )
            );
            await Promise.all(
                Array.from(roomState.players.entries()).map(async ([socketId, player]) => {
                    if (!player.userId) return;

                    try {
                    const UserStats = await import('./models/UserStats.js').then(m => m.default);
                    const user = await UserStats.findOne({ userId: player.userId });
                    if (user) {
                        user.totalGames += 1;
                        await user.save();
                    }
                    } catch (err) {
                    console.error("Error updating totalGames for user", err);
                    }
                })
            );


            // Save game results to DB
            try {
                const newGameEntry = new Game({
                    roomId: roomId,
                    questions: roomState.questions.map(q => ({ // Store only essential question data
                        questionText: q.questionText,
                        correctAnswer: q.correctAnswer,
                        options: q.options,
                        type: q.type
                    })),
                    results: finalResults,
                    startTime: roomState.questionStartTime, // Use start time of first question
                    endTime: Date.now()
                });
                await newGameEntry.save();
                console.log(`Game results saved to DB for room ${roomId}.`);
            } catch (dbError) {
                console.error(`Error saving game results to DB for room ${roomId}:`, dbError);
            }


            io.to(roomId).emit('game_end', {
                roomId: roomId,
                results: finalResults,
                coinsEarned: Object.fromEntries(coinsEarnedMap) // Send coins earned as an object
            });

            // Reset room for a potential new game in the same room ID
            roomState.status = 'waiting';
            // Changed to reset to waiting so host can restart
            roomState.currentQuestionIndex = 0;
            // Reset index
            roomState.questions = [];
            // Clear questions from memory
            roomState.players.forEach(p => { // Reset scores and answered status for next game
                p.score = 0;
                p.answered = false;
            });
        }
    };
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});