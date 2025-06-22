import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js'; // Ensure .js extension for explicit resolution
import LiveChat from '../components/LiveChat.jsx';
import Loader from '../components/KnowledgeLoader.jsx';

// Helper to generate DiceBear avatar URL (consistent with HomePage)
const getDiceBearAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=000000,c0a5f3,d2a4fc,e4a2f8,f1a0f5&radius=50&flip=true`;
};

function LobbyPage() {
    const { roomId: urlRoomId } = useParams(); // Get room ID from URL
    const navigate = useNavigate();
    const [showChatForHost, setShowChatForHost] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const { roomPassword } = useGameStore();


    const participants = useGameStore(state => state.participants);
    // Access state and actions from Zustand store
    const {
        socket,
        socketId,
        roomId,
        myUsername,
        myAvatar,
        isHost,
        gameSettings,
        availableCategories, // This comes from useGameStore now
        fetchCategories,      // This is the action to call to get them
        roomStatus,
        isLoading,
        error,
        notification,
        leaveRoom,
        startGame,
        updateGameSettings,
        deleteRoom,
        connectSocket,
        setNotification,
        setError,
        clearError,
    } = useGameStore();

    // Local state for game settings form (only host can change these)
    const [localQuestionCount, setLocalQuestionCount] = useState(gameSettings.questionCount);
    const [localTimePerQuestion, setLocalTimePerQuestion] = useState(gameSettings.timePerQuestion);
    const [localMaxPlayers, setLocalMaxPlayers] = useState(gameSettings.maxPlayers);
    // Use gameSettings.categories[0] for selected category, assuming backend sends an array and we pick the first one
    // Convert it to string for the select input's value, or 'any' if not set
    const [selectedCategoryId, setSelectedCategoryId] = useState(
        gameSettings.categories && gameSettings.categories.length > 0 && gameSettings.categories[0] !== 'any'
            ? String(gameSettings.categories[0]) // Assumes categories are stored as IDs in gameSettings
            : 'any'
    );

        // --- NEW: Local state for selected difficulty ---
    const [selectedDifficulty, setSelectedDifficulty] = useState(
        gameSettings.difficulty || 'any' // Initialize with gameSettings.difficulty or 'any'
    );

    // Define available difficulties (hardcoded as they are fixed values from OpenTDB)
    const difficulties = [
        { id: 'any', name: 'Any Difficulty' },
        { id: 'easy', name: 'Easy' },
        { id: 'medium', name: 'Medium' },
        { id: 'hard', name: 'Hard' },
    ];

    // Local state for actions that might have a brief loading period without affecting global isLoading
    const [isStartingGame, setIsStartingGame] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [isDeletingRoom, setIsDeletingRoom] = useState(false);
    const [isLeavingRoom, setIsLeavingRoom] = useState(false);

    // State for custom confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'deleteRoom' or 'leaveRoom'
    const categoriesToDisplay = [
    { id: 'any', name: 'Any Category' },
    ...(Array.isArray(availableCategories) ? availableCategories : [])
];

    // Effect to synchronize local form state with global gameSettings
    // This runs whenever gameSettings from the store changes (e.g., host updates settings)
        useEffect(() => {
        setLocalQuestionCount(gameSettings.questionCount);
        setLocalTimePerQuestion(gameSettings.timePerQuestion);
        setLocalMaxPlayers(gameSettings.maxPlayers);

        // Determine the selected category ID from gameSettings
        const currentSelectedId = gameSettings.categories && gameSettings.categories.length > 0
            ? String(gameSettings.categories[0]) // Assuming it stores the ID as [id]
            : 'any'; // Default to 'any' if no category is selected

        setSelectedCategoryId(currentSelectedId);
        
        setSelectedDifficulty(gameSettings.difficulty || 'any');// Update the local state for the dropdown

    }, [gameSettings]); // Re-run when gameSettings object changes

            // Effect to fetch trivia categories using the store action 
    useEffect(() => {
        // Only fetch if availableCategories is not undefined AND is empty
        if (availableCategories && availableCategories.length === 0) { 
            fetchCategories(); // Call the action from useGameStore 
        }
    }, [fetchCategories, availableCategories]);

    // Effect to handle initial connection and redirection logic
    useEffect(() => {
        // If socket is not connected, try to connect it.
        if (!socket || !socket.connected) {
            connectSocket();
        }

        // Redirect to home if room data is cleared (e.g., room deleted, disconnected)
        if (!roomId && urlRoomId) {
            setNotification({ type: 'error', message: 'You have left or been disconnected from the room.' });
            navigate('/');
            return;
        }

        // If game starts, redirect to a game-specific page
        if (roomStatus === 'playing') {
            setNotification({ type: 'info', message: 'Game is starting!' });
            navigate(`/game/${urlRoomId || roomId}`); // Use URL roomId if available, fallback to store
            return;
        }

        // Clear any room-specific errors if the room is now valid
        if (error && error.type === 'room' && roomId) {
            clearError();
        }

        // Reset local loading states when global isLoading changes to false,
        // or when roomStatus changes, indicating an action completed.
        if (!isLoading || roomStatus !== 'connecting') {
            setIsStartingGame(false);
            setIsUpdatingSettings(false);
            setIsDeletingRoom(false);
            setIsLeavingRoom(false);
        }

    }, [socket, roomId, roomStatus, navigate, urlRoomId, connectSocket, setNotification, error, clearError, isLoading]);

    const handleCategoryChange = (e) => {
     setSelectedCategoryId(e.target.value); 
    };

    // --- NEW: Handle difficulty change ---
    const handleDifficultyChange = (e) => {
        setSelectedDifficulty(e.target.value);
    };


    // Handle game settings submission
    const handleUpdateSettings = async (e) => {
    e.preventDefault();

    if (!isHost) {
        setNotification({ type: 'error', message: 'Only the host can update settings.' });
        return;
    }

    let categoryToSend;
    if (selectedCategoryId === 'any') {
        categoryToSend = 'any'; // If "Any Category" is selected, send 'any' string
    } else {
        categoryToSend = parseInt(selectedCategoryId, 10); // Convert selected ID string back to number
    }

    const difficultyToSend = selectedDifficulty === 'any' ? 'any' : selectedDifficulty;

    const newSettings = {
        questionCount: parseInt(localQuestionCount, 10),
        timePerQuestion: parseInt(localTimePerQuestion, 10),
        maxPlayers: parseInt(localMaxPlayers, 10),
        categories: [categoryToSend],
        difficulty: difficultyToSend,
    };


    // Basic validation
    if (isNaN(newSettings.questionCount) || newSettings.questionCount <= 0 ||
        isNaN(newSettings.timePerQuestion) || newSettings.timePerQuestion <= 0 ||
        isNaN(newSettings.maxPlayers) || newSettings.maxPlayers <= 1) { // Min 2 players
        setNotification({ type: 'error', message: 'Please enter valid positive numbers for settings.' });
        return;
    }

    if (newSettings.questionCount > 20 || newSettings.timePerQuestion > 60 || newSettings.maxPlayers > 10) {
        setNotification({ type: 'error', message: 'Settings values are too high (Max: Q:20, T:60s, P:10).' });
        return;
    }

    setIsUpdatingSettings(true); // Start loading state for this specific action
    setNotification(null); // Clear previous notifications

    try {
        await updateGameSettings(newSettings); // Call the store action
        // If updateGameSettings throws an error, it will be caught below.
        // If it completes successfully, we'll reach here.
        setNotification({ type: 'success', message: 'Game settings updated successfully!' });

    } catch (error) {
        console.error("Error updating game settings:", error);
        setNotification({ type: 'error', message: error.message || 'Failed to update settings.' });
    } finally {
        setIsUpdatingSettings(false); // ALWAYS set to false when the asynchronous operation finishes
    }
};

    // Handle start game
    const handleStartGame = async () => {
        if (!isHost) {
            setNotification({ type: 'error', message: 'Only the host can start the game.' });
            return;
        }
        if (participants.length < 2) {
            setNotification({ type: 'warning', message: 'Need at least 2 players to start the game.' });
            return;
        }
        setIsStartingGame(true); // Set local loading for this action
        await startGame(); // Call the store action
        // isStartingGame will be reset by the useEffect when roomStatus changes to 'playing'
    };

    // Handle leave room via confirmation modal
    const handleLeaveRoom = () => {
        setShowConfirmModal(true);
        setModalAction('leaveRoom');
    };

    // Handle delete room (host only) via confirmation modal
    const handleDeleteRoom = () => {
        if (!isHost) {
            setNotification({ type: 'error', message: 'Only the host can delete the room.' });
            return;
        }
        setShowConfirmModal(true);
        setModalAction('deleteRoom');
    };

    // Confirm action from modal
    const handleConfirmAction = async () => {
        setShowConfirmModal(false);
        if (modalAction === 'leaveRoom') {
            setIsLeavingRoom(true);
            await leaveRoom();
        } else if (modalAction === 'deleteRoom') {
            setIsDeletingRoom(true);
            await deleteRoom();
        }
        setModalAction(null); // Clear modal action
    };

    // Cancel action from modal
    const handleCancelAction = () => {
        setShowConfirmModal(false);
        setModalAction(null);
    };

    // --- Render Logic Based on State ---

    // Initial loading or if somehow page loaded without a roomId (should redirect)
    if (isLoading && !roomId) {
        return (
            <Loader />
        );
    }

    // Error display
    if (error) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-900 text-red-400 font-inter">
                <p className="text-3xl font-bold mb-6 text-red-500 drop-shadow-lg">Error: {error.message}</p>
                <button
                    onClick={() => { clearError(); navigate('/'); }}
                    className="px-8 py-3 bg-red-700 text-white rounded-lg font-bold text-xl uppercase tracking-wide hover:bg-red-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform active:scale-95 shadow-lg"
                >
                    Go to Home
                </button>
            </div>
        );
    }

    // Fallback if roomId is unexpectedly not set (should trigger useEffect redirect)
    if (!roomId) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-900 text-white font-inter">
                <p className="text-2xl animate-pulse text-gray-400">Room data not available. Redirecting...</p>
            </div>
        );
    }

    // Custom Confirmation Modal Component
    const ConfirmModal = ({ show, onConfirm, onCancel, message, confirmText, cancelText }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-gray-800 rounded-lg shadow-neo-brutalism p-8 max-w-sm w-full border-4 border-gray-700 animate-slide-up">
                    <p className="text-xl text-white text-center mb-6">{message}</p>
                    <div className="flex justify-around gap-4">
                        <button
                            onClick={onConfirm}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition duration-200 transform active:scale-95 shadow-md"
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition duration-200 transform active:scale-95 shadow-md"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">
            {/* --- Global CSS for Animations (consistent with HomePage) --- */}
            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }

                /* Custom Neon Glow for Title */
                @keyframes neon-glow {
                    0%, 100% {
                        text-shadow: 0 0 5px #4ade80, 0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 40px #22d3ee, 0 0 80px #22d3ee, 0 0 90px #22d3ee, 0 0 100px #22d3ee;
                    }
                    50% {
                        text-shadow: 0 0 2px #4ade80, 0 0 5px #4ade80, 0 0 10px #4ade80, 0 0 20px #22d3ee, 0 0 40px #22d3ee, 0 0 50px #22d3ee, 0 0 60px #22d3ee;
                    }
                }
                .animate-neon-glow {
                    animation: neon-glow 1.5s ease-in-out infinite alternate;
                }

                /* Custom Pulse Slow with more movement */
                @keyframes pulse-slow-move {
                    0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
                    25% { transform: scale(1.05) translate(10px, 5px); opacity: 0.4; }
                    50% { transform: scale(1) translate(0, 0); opacity: 0.3; }
                    75% { transform: scale(1.05) translate(-10px, -5px); opacity: 0.4; }
                }
                .animate-pulse-slow-move {
                    animation: pulse-slow-move 8s ease-in-out infinite;
                }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }

                /* Slide Down Fade In for Notifications */
                @keyframes slide-down-fade {
                    0% { opacity: 0; transform: translateY(-50px) translateX(-50%); }
                    100% { opacity: 1; transform: translateY(0) translateX(-50%); }
                }
                .animate-slide-down-fade {
                    animation: slide-down-fade 0.5s ease-out forwards;
                }

                /* Fade In for Main Content */
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }

                /* Ping once for avatar selection (used for checkmark) */
                @keyframes ping-once {
                    0% { transform: scale(0.2); opacity: 0; }
                    80% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-ping-once {
                    animation: ping-once 0.5s cubic-bezier(0, 0, 0.2, 1) forwards;
                }

                /* Neo-Brutalism Shadow */
                .shadow-neo-brutalism {
                    box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.8);
                }
                .shadow-neo-inset {
                    box-shadow: inset 5px 5px 0px rgba(0, 0, 0, 0.6);
                }
                .hover\\:shadow-neo-brutalism-hover:hover {
                    box-shadow: 12px 12px 0px rgba(0, 0, 0, 0.9);
                }
                .shadow-participant-glow {
                    box-shadow: 0 0 8px rgba(34, 197, 94, 0.6), 0 0 15px rgba(34, 197, 94, 0.4); /* Green glow */
                }
                .shadow-host-glow {
                    box-shadow: 0 0 8px rgba(251, 191, 36, 0.6), 0 0 15px rgba(251, 191, 36, 0.4); /* Yellow glow */
                }

                /* Slide Up for Modal */
                @keyframes slide-up {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>

            {/* --- Background Elements (Themed, subtle animations) --- */}
            <div
                className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm"
                style={{ backgroundImage: "url('https://thumbs.dreamstime.com/b/flying-magic-books-library-367534733.jpg')" }}
                aria-hidden="true"
            ></div>
            <div className="absolute animate-pulse-slow-move w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 top-10 left-10"></div>
            <div className="absolute animate-pulse-slow-move animation-delay-2000 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 bottom-20 right-20"></div>
            <div className="absolute animate-pulse-slow-move animation-delay-4000 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 top-1/3 right-1/4"></div>

            {/* --- Global Notification Area (consistent styling) --- */}
            {/* {notification && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 sm:p-4 rounded-lg shadow-lg text-center z-50 animate-slide-down-fade ${
                    notification.type === 'success' ? 'bg-green-600' :
                    notification.type === 'error' ? 'bg-red-600' :
                    notification.type === 'info' ? 'bg-blue-600' :
                    'bg-yellow-600'
                } text-white font-semibold transform transition-all duration-300`}>
                    {notification.message}
                </div>
            )} */}

            {/* --- Main Content Container --- */}
            <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-7xl mx-auto animate-fade-in border-4 border-gray-700">
                <h1 className="text-4xl sm:text-5xl font-bold text-center text-blue-400 mb-6">
                    Room: {roomId}
                </h1>
                {roomPassword && (
                <div className="max-w-sm mx-auto mt-4 bg-gray-800 text-blue-200 border border-blue-500 shadow-md rounded-xl px-4 py-3 relative mb-3">
                    <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-400">Room Password</span>
                    <button
                        onClick={() => setShowPassword(prev => !prev)}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                    </div>
                    <div className="flex items-center justify-between">
                    <code className="text-sm text-blue-300 tracking-wide">
                        {showPassword ? roomPassword : '••••••'}
                    </code>
                    <button
                        onClick={() => {
                        navigator.clipboard.writeText(roomPassword);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`ml-3 px-3 py-1 text-xs rounded transition 
                        ${copied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    </div>
                </div>
                )}


                <p className="text-lg sm:text-xl text-center text-gray-300 mb-8 font-light">
                    Welcome, <span className="font-semibold text-blue-300">{myUsername}</span>!
                    You are currently the <span className="font-semibold text-blue-300">{isHost ? 'Host' : 'Player'}</span>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Participants Section */}
                    <div className="bg-gray-700 p-6 rounded-xl shadow-neo-inset border-2 border-gray-600">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                            Participants ({participants.length}/{gameSettings.maxPlayers})
                            <span className="ml-2 text-lg text-gray-400">👥</span>
                        </h2>
                        <ul className="space-y-3">
                            {participants.map((p) => (
                                <li key={p.socketId} className={`flex items-center justify-between p-3 rounded-lg border ${p.socketId === socketId ? 'bg-indigo-600 border-indigo-400 shadow-participant-glow' : 'bg-gray-600 border-gray-500'}`}>
                                    <div className="flex items-center space-x-3">
                                        {/* Display DiceBear avatar for each participant */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-blue-400">
                                            <img
                                                src={getDiceBearAvatarUrl(p.avatar?.head || 'bottts', p.username || 'default-seed')}
                                                alt={`${p.username}'s avatar`}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/333333/FFFFFF?text=ERR"; }} // Fallback
                                            />
                                        </div>
                                        <span className={`text-lg font-medium ${p.socketId === socketId ? 'text-white' : 'text-gray-200'}`}>
                                            {p.username}
                                            {p.socketId === socketId && <span className="text-blue-200 font-normal ml-2">(You)</span>}
                                        </span>
                                    </div>
                                    {p.isHost && <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-host-glow">HOST</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Section: Game Settings (Host) or Live Chat (Everyone) */}
                    <div className="bg-gray-700 p-6 rounded-xl shadow-neo-inset border-2 border-gray-600 flex flex-col relative min-h-[500px]">
                    {isHost && (
                        <div className="flex justify-center mb-4 gap-4">
                        <button
                            onClick={() => setShowChatForHost(false)}
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                            !showChatForHost
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            Game Settings
                        </button>
                        <button
                            onClick={() => setShowChatForHost(true)}
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                            showChatForHost
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            Live Chat
                        </button>
                        </div>
                    )}

            {/* Always mounted, but only one is visible */}
            <div className="relative flex-1">
            {/* LiveChat section */}
            <div className={`${isHost && !showChatForHost ? 'hidden' : 'block'} absolute w-full h-full`}>
                <div className="h-full overflow-y-auto">
                    <LiveChat />
                </div>
            </div>
            {/* Conditional UI for host vs others */}
            {isHost && (
            <div className={`${showChatForHost ? 'hidden' : 'block'} absolute w-full h-full overflow-y-auto`}>
                <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                Game Settings <span className="ml-2 text-lg text-gray-400">⚙️</span>
                </h2>
                <form onSubmit={handleUpdateSettings} className="space-y-5 flex-1 flex flex-col justify-between">
                <div>
                    <div>
                    <label htmlFor="question-count" className="block text-sm font-medium text-gray-300 mb-1">Question Count</label>
                    <input
                        type="number"
                        id="question-count"
                        className="w-full px-4 py-2 bg-gray-600 border-2 border-gray-500 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none"
                        value={localQuestionCount}
                        onChange={(e) => setLocalQuestionCount(e.target.value)}
                        min="1" max="20"
                    />
                    </div>

                    <div className="mt-4">
                    <label htmlFor="time-per-question" className="block text-sm font-medium text-gray-300 mb-1">Time per Question (seconds)</label>
                    <input
                        type="number"
                        id="time-per-question"
                        className="w-full px-4 py-2 bg-gray-600 border-2 border-gray-500 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none"
                        value={localTimePerQuestion}
                        onChange={(e) => setLocalTimePerQuestion(e.target.value)}
                        min="5" max="60"
                    />
                    </div>

                    <div className="mt-4">
                    <label htmlFor="max-players" className="block text-sm font-medium text-gray-300 mb-1">Max Players</label>
                    <input
                        type="number"
                        id="max-players"
                        className="w-full px-4 py-2 bg-gray-600 border-2 border-gray-500 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none"
                        value={localMaxPlayers}
                        onChange={(e) => setLocalMaxPlayers(e.target.value)}
                        min="2" max="10"
                    />
                    </div>

                    <div className="mt-4">
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-300 mb-1">Trivia Category</label>
                    <select
                        id="category-select"
                        className="w-full px-4 py-2 bg-gray-600 border-2 border-gray-500 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none"
                        value={selectedCategoryId}
                        onChange={handleCategoryChange}
                    >
                        {categoriesToDisplay.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                        ))}
                    </select>
                    {error && error.type === 'categories' && (
                        <p className="text-red-400 text-sm mt-1">{error.message}</p>
                    )}
                    </div>
                    <div className="mt-4">
                        <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                        <select
                            id="difficulty-select"
                            className="w-full px-4 py-2 bg-gray-600 border-2 border-gray-500 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none"
                            value={selectedDifficulty}
                            onChange={handleDifficultyChange}
                        >
                            {difficulties.map((diff) => (
                                <option key={diff.id} value={diff.id}>
                                    {diff.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 text-white py-3 rounded-lg font-bold text-lg uppercase tracking-wide hover:from-blue-700 hover:to-cyan-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-blue-400 mt-6"
                    disabled={isUpdatingSettings || isLoading}
                >
                    {isUpdatingSettings ? (
                    <span className="animate-spin mr-3 text-xl">⚙️</span>
                    ) : (
                    'Update Settings'
                    )}
                </button>
                </form>
                </div>
            )} 
            </div>
        </div>
    </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6">
                    {isHost && roomStatus === 'waiting' && (
                        <>
                            <button
                                onClick={handleStartGame}
                                className="flex-1 bg-gradient-to-r from-green-600 to-lime-700 text-white py-4 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-green-700 hover:to-lime-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-green-400"
                                disabled={isStartingGame || isLoading || participants.length < 2}
                            >
                                {isStartingGame ? <span className="animate-spin mr-3 text-2xl">🚀</span> : 'Start Game'}
                                <span className="ml-2 text-sm text-green-200">({participants.length}/2+ needed)</span>
                            </button>
                            <button
                                onClick={handleDeleteRoom}
                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 text-white py-4 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-red-700 hover:to-rose-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-red-400"
                                disabled={isDeletingRoom || isLoading}
                            >
                                {isDeletingRoom ? <span className="animate-spin mr-3 text-2xl">❌</span> : 'Delete Room'}
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleLeaveRoom}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-gray-700 hover:to-gray-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-gray-400"
                        disabled={isLeavingRoom || isLoading}
                    >
                        {isLeavingRoom ? <span className="animate-spin mr-3 text-2xl">🚪</span> : 'Leave Room'}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal Render */}
            <ConfirmModal
                show={showConfirmModal}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
                message={modalAction === 'deleteRoom' ? 'Are you sure you want to delete this room? This cannot be undone.' : 'Are you sure you want to leave this room?'}
                confirmText={modalAction === 'deleteRoom' ? 'Delete' : 'Leave'}
                cancelText="Cancel"
            />
        </div>
    );
}

export default LobbyPage;