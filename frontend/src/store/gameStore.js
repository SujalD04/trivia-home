// frontend/src/store/gameStore.js
import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useUserStore } from '../store/UserStore';

// Define API and Socket server URLs
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_SERVER_URL = 'http://localhost:5000';

// Initial state for the game store
const initialState = {
    // Socket State
    socket: null,
    isConnected: false,
    socketId: null, // Client's own socket ID
    currentQuestionTimer: null, // Stores the interval ID for the client-side question timer
    notificationTimeoutId: null, // Stores the timeout ID for auto-clearing notifications

    // User State
    myUsername: null, // Set to null initially, populated upon successful join
    myAvatar: { head: 'default-head', body: 'default-body', accessory: 'default-accessory' },
    myScore: 0,
    isHost: false, // True if this client's socket is the current room host

    // Room State
    roomId: null, // Set to null initially, populated upon successful join
    roomPassword: '', // Stored temporarily (e.g., for re-joining attempts)
    hostUsername: '', // Username of the current live host
    roomStatus: 'idle', // 'idle', 'connecting', 'waiting', 'playing', 'finished', 'disconnected'
    participants: [], // Array of { username, socketId, score, isHost, avatar }
    availableCategories: [],

    // Game Settings (from backend, specific to the room)
    gameSettings: {
        questionCount: 5, // Default values
        timePerQuestion: 20,
        categories: [],
        maxPlayers: 8,
        difficulty: 'any', // <--- NEW: Default difficulty
    },

    // Current Question State
    currentQuestion: null, // { questionIndex, questionText, options, timeLimit }
    questionIndex: -1, // Current question index (0-based), -1 initially
    timeRemaining: 0, // Current countdown for question timer (in seconds)
    mySubmittedAnswer: null, // The answer this client chose for the current question
    answeredThisQuestion: false, // Prevents multiple submissions per question

    // Game Results State
    finalResults: [], // Array of { username, score, isWinner }
    coinsEarned: {}, // Object { username: coins }

    // UI State (for loading, errors, notifications)
    isLoading: true, // Indicates a significant operation (connection, join) is in progress
    error: null, // { type: 'join'|'game'|'room'|'connect'|'settings', message: '...' }
    notification: null, // { type: 'success'|'error'|'info'|'warning', message: '...' }
};

const { userId } = useUserStore.getState();

let rejoinEmitted = false;


export const useGameStore = create((set, get) => ({
    ...initialState, // Spread initial state into the store

    // --- Utility Actions for UI State ---

    fetchCategories: async () => {
        set({ isLoading: true, error: null }); // Indicate loading for categories
        try {
            // This URL must point to your backend's categories endpoint
            const response = await fetch(`${API_BASE_URL}/categories`);
            console.log('Fetching categories from:', `${API_BASE_URL}/categories`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // Data should be a direct array of {id, name} objects

            // Verify that the data is an array
            if (Array.isArray(data)) {
                console.log('Categories fetched successfully:', data);
                set({ availableCategories: data, isLoading: false });
            } else {
                // Log the unexpected data for debugging
                console.error("Received unexpected category data format:", data);
                throw new Error('Invalid category data format received from backend.');
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            set({
                error: {
                    type: 'categories', // A specific error type for categories
                    message: `Failed to load trivia categories: ${err.message}`,
                },
                isLoading: false, // Stop loading even on error
            });
            get().setNotification({ type: 'error', message: `Failed to load categories: ${err.message}` });
        }
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    setNotification: (notification) => {
        // Clear any existing notification timeout to avoid conflicts
        if (get().notificationTimeoutId) {
            clearTimeout(get().notificationTimeoutId);
        }
        const timeoutId = setTimeout(() => set({ notification: null, notificationTimeoutId: null }), 5000);
        set({ notification, notificationTimeoutId: timeoutId });
    },
    clearNotification: () => {
        if (get().notificationTimeoutId) {
            clearTimeout(get().notificationTimeoutId);
            set({ notificationTimeoutId: null });
        }
        set({ notification: null });
    },

    // --- Socket.IO Connection and Event Listeners ---

    connectSocket: (initialRoomId = null, initialUsername = null) => {
        const { socket } = get();
        // If socket is already connected, just ensure loading is off and potentially re-emit join
        if (socket && socket.connected) {
            console.log('Socket already connected, re-using existing connection.');
            set({ isLoading: false }); // Ensure loading is off if already connected

            const currentRoomId = get().roomId || initialRoomId || localStorage.getItem('roomId');
            const currentUsername = get().myUsername || initialUsername || localStorage.getItem('myUsername');
            const currentAvatar = get().myAvatar; // Get from state, assuming it's set on initial join

            if (currentRoomId && currentUsername) {
                console.log(`Socket already connected: Attempting to re-emit join_room for ${currentRoomId} as ${currentUsername}`);
                socket.emit('join_room', {
                    roomId: currentRoomId,
                    username: currentUsername,
                    avatar: currentAvatar,
                    rejoin: true // Indicate this is a rejoin attempt
                });
                set({ isLoading: true, roomStatus: 'connecting', notification: { type: 'info', message: 'Rejoining room...' } });
            }
            return;
        }

        set({ isLoading: true, error: null, notification: { type: 'info', message: 'Connecting to game server...' } });
        const newSocket = io(SOCKET_SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: 5, // Try to reconnect 5 times
            reconnectionDelay: 1000, // Wait 1 second before first retry
            // If you need query params for auth/rejoin, they'd go here
            // query: { username: localStorage.getItem('myUsername'), roomId: localStorage.getItem('roomId') }
        });

        let hasRejoined = false;
        newSocket.on('connect', () => {
            if (rejoinEmitted) return;
            rejoinEmitted = true;

            console.log('Socket.IO connected:', newSocket.id);
            set({ socket: newSocket, isConnected: true, socketId: newSocket.id, isLoading: false });
            get().setNotification({ type: 'success', message: 'Connected to game server!' });
            localStorage.setItem('socketId', newSocket.id);

            const storedRoomId = localStorage.getItem('roomId');
            const storedUsername = localStorage.getItem('myUsername');
            const storedAvatar = JSON.parse(localStorage.getItem('myAvatar') || 'null') || initialState.myAvatar;

            if (storedRoomId && storedUsername) {
                console.log(`Re-emitting join_room for ${storedRoomId} as ${storedUsername}`);
                set({ isLoading: true, roomStatus: 'connecting', notification: { type: 'info', message: 'Rejoining room...' } });
                setTimeout(() => {
                    newSocket.emit('join_room', {
                        roomId: storedRoomId,
                        username: storedUsername,
                        avatar: storedAvatar,
                        userId: localStorage.getItem("quizUserId"),
                        rejoin: true
                    });
                }, 400);
            }
        });

        newSocket.on('disconnect', (reason) => {
            rejoinEmitted = false;
                set({ isConnected: false });
                console.log('Socket.IO disconnected.');
            console.log('Socket.IO disconnected. Reason:', reason);

            // Clear any active timer
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
                set({ currentQuestionTimer: null });
            }

            // Reset to safe defaults — avoid stale participant/lobby state
            set(() => ({
                ...initialState,
                socket: null,
                isConnected: false,
                isLoading: false,
                participants: [],
                roomId: null,
                myUsername: null,
                myAvatar: null,
                isHost: false,
                roomStatus: 'waiting',
                error: 'Disconnected from game server. Please refresh or rejoin.',
            }));

            // Notification
            get().setNotification({ type: 'error', message: `Disconnected from game server. (${reason})` });

            // Clear any saved user/session data
            localStorage.removeItem('roomId');
            localStorage.removeItem('myUsername');
            localStorage.removeItem('myAvatar');
            localStorage.removeItem('socketId');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err.message);
            get().setError({ type: 'connect', message: `Connection failed: ${err.message}. Is the server running?` });
            set({ isLoading: false, socket: null, isConnected: false });
        });
        // --- Core Room & Game Event Handlers ---

        // 'room_data' is a new event (you might need to implement this on backend)
        // It provides the complete state of the room upon initial join or rejoin
        newSocket.on('room_data', (data) => {
            console.log('Room Data Received:', data);
            const myId = get().socketId;
            const myPlayer = data.players.find(p => p.socketId === myId); // Use 'players' if that's what backend sends
            set({
                roomId: data.roomId,
                participants: data.players,
                gameSettings: {
                    ...data.settings, // Spread existing settings
                    difficulty: data.settings.difficulty || 'any', // <--- NEW: Ensure difficulty is set, default to 'any'
                    categories: data.settings.categories || [], // <--- Ensure categories is an array, default to empty
                },
                roomStatus: data.status,
                hostUsername: data.hostUsername,
                isHost: myPlayer ? myPlayer.isHost : false,
                currentQuestion: data.currentQuestion || null, // Set current question if rejoining mid-game
                questionIndex: data.currentQuestionIndex !== undefined ? data.currentQuestionIndex : -1, // Set question index
                timeRemaining: data.timeRemaining !== undefined ? data.timeRemaining : 0, // Set remaining time
                isLoading: false, // Data received, so loading is complete
                error: null, // Clear any previous error
            });
            // Re-sync client-side timer if rejoining mid-game
            if (data.status === 'playing' && data.currentQuestion && data.timeRemaining > 0) {
                if (get().currentQuestionTimer) {
                    clearInterval(get().currentQuestionTimer);
                }
                let countdown = data.timeRemaining;
                const timerInterval = setInterval(() => {
                    countdown--;
                    if (countdown >= 0) {
                        set({ timeRemaining: countdown });
                    } else {
                        clearInterval(timerInterval);
                        set({ currentQuestionTimer: null, timeRemaining: 0 });
                    }
                }, 1000);
                set({ currentQuestionTimer: timerInterval });
            }
            get().clearNotification(); // Clear previous "rejoining" notification
        });
        newSocket.on('join_room_error', (data) => {
            console.error('Join Room Error:', data.message);
            get().setError({ type: 'join', message: data.message });
            set({
                isLoading: false,
                roomStatus: 'idle',
                roomId: null, myUsername: null, isHost: false, participants: [],
                currentQuestion: null, questionIndex: -1, timeRemaining: 0,
            }); // Clear room data on error
            get().setNotification({ type: 'error', message: data.message });
            // Clear local storage if join failed
            localStorage.removeItem('roomId');
            localStorage.removeItem('myUsername');
            localStorage.removeItem('myAvatar');
            localStorage.removeItem('socketId');
        });
        newSocket.on('update_lobby', (data) => {
            console.log('Lobby Update:', data);
            const myId = get().socketId;
            const myPlayer = data.participants.find(p => p.socketId === myId);
            set((state) => ({
                roomId: data.roomId,
                participants: data.participants,
                gameSettings: {
                    ...data.settings, // Spread existing settings
                    difficulty: data.settings.difficulty || 'any', // <--- NEW: Ensure difficulty is set, default to 'any'
                    categories: data.settings.categories || [], // <--- Ensure categories is an array, default to empty
                },
                roomStatus: data.status,
                hostUsername: data.hostUsername,
                isHost: myPlayer ? myPlayer.isHost : false, // Update current client's host status
                isLoading: false, // Lobby update means we're done loading for room join/rejoin
                error: null, // Clear any previous error on successful update
                myUsername: state.myUsername || (myPlayer ? myPlayer.username : null), // Keep existing username if set
                myAvatar: state.myAvatar || (myPlayer ? myPlayer.avatar : initialState.myAvatar) // Keep existing avatar if set
            }));
            get().setNotification({ type: 'info', message: 'Lobby updated!' });

            // If game status changes from playing to waiting/finished, reset game-specific state
            if (get().roomStatus === 'playing' && data.status !== 'playing') {
                get().resetGameRoundState(); // Use the dedicated action
            }
        });
        newSocket.on('game_settings_updated', (data) => {
            console.log('Game settings updated:', data.settings);
            set({
                gameSettings: {
                    ...data.settings, // Spread existing settings
                    difficulty: data.settings.difficulty || 'any', // <--- NEW: Ensure difficulty is set, default to 'any'
                    categories: data.settings.categories || [], // <--- Ensure categories is an array, default to empty
                }
            });
            get().setNotification({ type: 'success', message: 'Game settings updated!' });
        });
        newSocket.on('game_settings_error', (data) => {
            console.error('Game settings error:', data.message);
            get().setError({ type: 'settings', message: data.message });
            get().setNotification({ type: 'error', message: data.message });
        });
        newSocket.on('game_starting', (data) => {
            console.log('Game starting:', data.roomId, 'Players:', data.players);
            // Ensure any previous question timer is cleared
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
                set({ currentQuestionTimer: null });
            }


            set({
                roomStatus: 'playing',
                participants: data.players.map(player => ({ ...player, score: 0, answered: false })),
                finalResults: [],
                coinsEarned: {},
                currentQuestion: null, // Clear for new game; first question comes via 'send_question'
                mySubmittedAnswer: null,
                answeredThisQuestion: false,
                questionIndex: -1, // Reset question index for the new game
                timeRemaining: 0, // Reset timer
                isLoading: false, // Game is starting, loading is done
            });
            get().setNotification({ type: 'success', message: 'Game is starting! Get ready!' });
        });
        // FIXED: The `send_question` event handler
        newSocket.on('send_question', (data) => {
            console.log('Received Question:', data);

            // Clear previous client-side timer if it exists
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
            }

            // Update store state with new question data
            set({
                currentQuestion: { // Ensure currentQuestion matches GamePage's expected structure
                    questionText: data.questionText,
                    options: data.options,
                },
                questionIndex: data.questionIndex, // Explicitly set question index
                timeRemaining: data.timeLimit || get().gameSettings.timePerQuestion, // Use consistent timeRemaining
                mySubmittedAnswer: null, // Reset for new question
                answeredThisQuestion: false, // Reset for new question
                isLoading: false, // Question data has arrived, loading is done!
                notification: null, // Clear any old notifications for a fresh question display
            });
            console.log(`Store: Setting question ${data.questionIndex + 1}. Time limit: ${get().timeRemaining}s`);

            // Start client-side timer for the new question
            let countdown = get().timeRemaining; // Start countdown from the set timeRemaining
            const newTimerIntervalId = setInterval(() => {
                countdown--;
                if (countdown >= 0) {
                    set({ timeRemaining: countdown });
                } else {
                    clearInterval(newTimerIntervalId);
                    set({ currentQuestionTimer: null, timeRemaining: 0 }); // Ensure timeRemaining is 0 after countdown
                    console.log("Client-side timer ended for current question.");
                }
            }, 1000);

            set({ currentQuestionTimer: newTimerIntervalId }); // Store the new interval ID
        });
        newSocket.on('answer_feedback', (data) => {
            console.log('Answer Feedback:', data);
            get().setNotification({ type: data.success ? 'success' : 'error', message: data.message });
            // GamePage local state handles selectedOption and correctAnswer based on this.
        });
        newSocket.on('score_update', (data) => {
            console.log('Score Update:', data);
            if (data.coins !== undefined) {
                set({ myCoins: data.coins });
            }

            set((state) => ({
                participants: state.participants.map(p =>
                    p.username === data.username ? { ...p, score: data.score } : p
                ),
                myScore: state.myUsername === data.username ? data.score : state.myScore,
            }));
            // Decided to let GamePage manage individual score feedback for less noisy notifications
        });
        newSocket.on('time_up', (data) => {
            console.log('Time Up:', data);
            // Stop client-side timer when server sends time_up (authoritative)
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
                set({ currentQuestionTimer: null });
            }
            set({ timeRemaining: 0 }); // Ensure timer shows 0
            get().setNotification({ type: 'warning', message: `Time's up! Correct Answer: ${data.correctAnswer}` });
            // resetGameRoundState will be called by GamePage after a delay to clear local states
        });
        newSocket.on('game_end', (data) => {
            console.log('Game Ended:', data);
            // Stop any lingering client-side timer
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
                set({ currentQuestionTimer: null });
            }
            set({
                roomStatus: 'finished', // Game is finished
                finalResults: data.results,
                coinsEarned: data.coinsEarned,
                currentQuestion: null, // Clear question display
                mySubmittedAnswer: null,
                answeredThisQuestion: false,
                questionIndex: -1, // Reset question index
                timeRemaining: 0, // Reset timer
                isLoading: false, // Game has ended, loading is complete
            });
            get().setNotification({ type: 'success', message: 'Game Over! See results.' });
        });
        newSocket.on('game_error', (data) => {
            console.error('Game Error:', data.message);
            get().setError({ type: 'game', message: data.message });
            // Stop any lingering client-side timer
            if (get().currentQuestionTimer) {
                clearInterval(get().currentQuestionTimer);
                set({ currentQuestionTimer: null });
            }
            set({ roomStatus: 'waiting', isLoading: false }); // Revert to waiting state and clear loading
            get().setNotification({ type: 'error', message: data.message });
        });
        newSocket.on('room_error', (data) => {
            console.error('Room Error:', data.message);
            get().setError({ type: 'room', message: data.message });
            get().setNotification({ type: 'error', message: data.message });
        });
        newSocket.on('room_deleted', (data) => {
            console.log('Room Deleted:', data.roomId, data.message);
            get().setNotification({ type: 'error', message: `Room ${data.roomId} was deleted: ${data.message}.` });
            // Disconnect socket and reset to initial state, like `leaveRoom`
            const { socket: currentSocket } = get();
            if (currentSocket) {
                currentSocket.disconnect(); // This will trigger the 'disconnect' handler and full reset
            } else {
                set({ ...initialState, isLoading: false }); // Fallback reset if socket was somehow already cleared
                localStorage.removeItem('roomId');
                localStorage.removeItem('myUsername');
                localStorage.removeItem('myAvatar');
                localStorage.removeItem('socketId');
            }
        });
    },

    // --- Actions to Emit Socket Events ---

    // Handles API call to join room and then emits socket event
    joinRoom: async (roomIdInput, passwordInput, usernameInput, avatarInput) => {
        set({
            isLoading: true,
            error: null,
            myUsername: usernameInput,
            roomId: roomIdInput, // Set roomId and username in store immediately
            roomPassword: passwordInput,
            myAvatar: avatarInput,
            roomStatus: 'connecting', // Indicate API call + socket connection is in progress
            notification: { type: 'info', message: 'Joining room...' }
        });
        localStorage.setItem('roomId', roomIdInput); // Persist
        localStorage.setItem('myUsername', usernameInput); // Persist
        localStorage.setItem('myAvatar', JSON.stringify(avatarInput)); // Persist

        try {
            const apiResponse = await fetch(`${API_BASE_URL}/rooms/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: roomIdInput, password: passwordInput, username: usernameInput })
            });

            const apiData = await apiResponse.json();
            if (!apiResponse.ok) {
                throw new Error(apiData.message || 'Failed to join room via API');
            }

            // API join successful, now emit socket event
            const { socket } = get();
            if (socket && socket.connected) {
                console.log(`API success, emitting join_room for socket ${get().socketId}`);
                socket.emit('join_room', {
                    roomId: apiData.roomId,
                    username: usernameInput,
                    avatar: avatarInput,
                    userId: useUserStore.getState().userId,
                    rejoin: false // This is an initial join, not a rejoin
                });
                // Status remains 'connecting' until 'update_lobby' or 'room_data' confirms
                get().setNotification({ type: 'info', message: 'Room validated. Awaiting lobby update...' });
            } else {
                // If API was successful but socket isn't connected, this is an issue
                set({ isLoading: false, roomStatus: 'idle', roomId: null, myUsername: null, isHost: false, participants: [] });
                get().clearNotification(); // Clear any previous notifications
                throw new Error('Socket not connected after API validation. Please refresh.');
            }
        } catch (error) {
            console.error("API or Socket Join Error:", error);
            set({
                isLoading: false,
                error: { type: 'join', message: error.message },
                roomStatus: 'idle', // Ensure status is reset
                roomId: null, myUsername: null, isHost: false, participants: []
            });
            get().setNotification({ type: 'error', message: error.message });
            // Clear local storage if join failed
            localStorage.removeItem('roomId');
            localStorage.removeItem('myUsername');
            localStorage.removeItem('myAvatar');
            localStorage.removeItem('socketId');
        }
    },

    // Handles API call to create room and then emits socket event
    createRoom: async (roomNameInput, passwordInput, usernameInput, avatarInput) => {
        set({
            isLoading: true,
            error: null,
            myUsername: usernameInput,
            roomPassword: passwordInput,
            myAvatar: avatarInput,
            roomStatus: 'connecting', // Indicate API call + socket connection is in progress
            notification: { type: 'info', message: 'Creating room...' }
        });
        localStorage.setItem('myUsername', usernameInput); // Persist
        localStorage.setItem('myAvatar', JSON.stringify(avatarInput)); // Persist

        try {
            const apiResponse = await fetch(`${API_BASE_URL}/rooms/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: roomNameInput, password: passwordInput, username: usernameInput })
            });

            const apiData = await apiResponse.json();
            if (!apiResponse.ok) {
                throw new Error(apiData.message || 'Failed to create room via API');
            }

            // Store the created roomId
            set({ roomId: apiData.roomId });
            localStorage.setItem('roomId', apiData.roomId); // Persist

            // API create successful, now emit socket event
            const { socket } = get();
            if (socket && socket.connected) {
                console.log(`API success, emitting join_room for socket ${get().socketId}`);
                socket.emit('join_room', {
                    roomId: apiData.roomId,
                    username: usernameInput,
                    avatar: avatarInput,
                    userId,
                    rejoin: false // This is an initial join, not a rejoin
                });
                // Status remains 'connecting' until 'update_lobby' or 'room_data' confirms
                get().setNotification({ type: 'info', message: 'Room created. Awaiting lobby update...' });
            } else {
                // If API was successful but socket isn't connected, this is an issue
                set({ isLoading: false, roomStatus: 'idle', roomId: null, myUsername: null, isHost: false, participants: [] });
                get().clearNotification(); // Clear any previous notifications
                throw new Error('Socket not connected after API validation. Please refresh.');
            }
        } catch (error) {
            console.error("API or Socket Create Error:", error);
            set({
                isLoading: false,
                error: { type: 'create', message: error.message },
                roomStatus: 'idle', // Ensure status is reset
                roomId: null, myUsername: null, isHost: false, participants: []
            });
            get().setNotification({ type: 'error', message: error.message });
            // Clear local storage if create failed
            localStorage.removeItem('roomId');
            localStorage.removeItem('myUsername');
            localStorage.removeItem('myAvatar');
            localStorage.removeItem('socketId');
        }
    },

    leaveRoom: () => {
        const { socket, currentQuestionTimer } = get();
        if (socket && socket.connected) {
            console.log(`Attempting to disconnect socket ${get().socketId} and leave room ${get().roomId}`);
            socket.disconnect(); // This will trigger the 'disconnect' event on the backend
        }
        // Clear any active timer
        if (currentQuestionTimer) {
            clearInterval(currentQuestionTimer);
            set({ currentQuestionTimer: null });
        }
        // Reset entire state, but ensure isLoading is false for homepage
        set({ ...initialState, isLoading: false, socket: null, isConnected: false });
        get().setNotification({ type: 'info', message: 'You have left the room.' });
        // Clear local storage
        localStorage.removeItem('roomId');
        localStorage.removeItem('myUsername');
        localStorage.removeItem('myAvatar');
        localStorage.removeItem('socketId');
    },

    startGame: () => {
        const { socket, roomId, isHost } = get();
        if (!isHost) {
            get().setNotification({ type: 'error', message: 'Only the host can start the game.' });
            return;
        }
        if (socket && socket.connected && roomId) {
            socket.emit('start_game', { roomId });
            get().setNotification({ type: 'info', message: 'Requesting game start...' });
            set({ isLoading: true }); // Indicate starting game process
        } else {
            get().setNotification({ type: 'error', message: 'Cannot start game: Not connected or room ID missing.' });
        }
    },

    updateGameSettings: (settings) => {
        const { socket, roomId, isHost } = get();
        if (!isHost) {
            get().setNotification({ type: 'error', message: 'Only the host can update game settings.' });
            return;
        }
        if (socket && socket.connected && roomId) {
            socket.emit('update_game_settings', { roomId, settings });
            get().setNotification({ type: 'info', message: 'Updating settings...' });
        } else {
            get().setNotification({ type: 'error', message: 'Cannot update settings: Not host or room ID missing.' });
        }
    },

    submitAnswer: (answer) => {
        const { socket, roomId, myUsername, answeredThisQuestion, currentQuestion, questionIndex } = get();
        const { userId } = useUserStore.getState(); // 🔥 Grab the uuid here

        if (answeredThisQuestion || !currentQuestion) {
        get().setNotification({ type: 'warning', message: 'Already answered or no question active.' });
        return;
        }

        if (socket && socket.connected && roomId && myUsername && answer) {
        socket.emit('submit_answer', {
            roomId,
            username: myUsername,
            answer,
            questionIndex,
            userId, // ✅ send uuid to backend
        });

        set({ mySubmittedAnswer: answer, answeredThisQuestion: true });
        get().setNotification({ type: 'info', message: 'Answer submitted!' });
        } else {
        get().setNotification({ type: 'error', message: 'Could not submit answer: Game not active or data missing.' });
        }
    },

    deleteRoom: async () => {
        const { socket, roomId, isHost } = get();
        if (!isHost) {
            get().setNotification({ type: 'error', message: 'Only the host can delete the room.' });
            return;
        }
        // Removed window.confirm for automated environment compliance.
        // In a real app, you'd want a custom modal here.
        // if (!window.confirm(`Are you sure you want to delete room ${roomId}? This cannot be undone.`)) {
        //     return;
        // }
        if (socket && socket.connected && roomId) {
            socket.emit('delete_room', { roomId });
            set({ isLoading: true, error: null }); // Show loading during deletion
        } else {
            get().setNotification({ type: 'error', message: 'Cannot delete room: Not connected or room ID missing.' });
        }
    },

    // Action to reset question-specific state for the next round or game reset
    resetGameRoundState: () => {
        // This action is designed to clear client-side transient state for a new question.
        // It does NOT reset currentQuestion or questionIndex, as those are updated by 'send_question'.
        if (get().currentQuestionTimer) {
            clearInterval(get().currentQuestionTimer);
            set({ currentQuestionTimer: null });
        }
        set({
            // currentQuestion: null, // NOT CLEARED HERE, 'send_question' overwrites it
            timeRemaining: 0, // Reset timer display
            mySubmittedAnswer: null, // Clear previous answer
            answeredThisQuestion: false, // Allow new submission
            // questionIndex: -1, // NOT CLEARED HERE
        });
        console.log("Game round state reset for client-side interaction.");
    },
}));