import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import LiveChat from '../components/LiveChat';

// Helper function to decode HTML entities like &eacute;
function decodeHtml(html) {
    if (typeof window === 'undefined') return html; // Avoid errors during server-side rendering
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Helper to generate DiceBear avatar URL (consistent with HomePage and LobbyPage)
const getDiceBearAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=000000,c0a5f3,d2a4fc,e4a2f8,f1a0f5&radius=50&flip=true`;
};

function GamePage() {
    const { roomId: urlRoomId } = useParams();
    const navigate = useNavigate();

    const {
        socket, roomId, myUsername, myScore, isHost, participants, gameSettings,
        roomStatus, currentQuestion, questionIndex, timeRemaining, isLoading,
        error, submitAnswer, leaveRoom, clearError, connectSocket, socketId
    } = useGameStore();


    const [selectedOption, setSelectedOption] = useState(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [scoreUpdateFeedback, setScoreUpdateFeedback] = useState(null);

    const scoreFeedbackTimeoutRef = useRef(null);

    // --- Event Handlers ---

    // Handles feedback after an answer is submitted or time is up
    const handleAnswerFeedback = useCallback((data) => {

    if (Array.isArray(data.correctAnswer)) {
        setCorrectAnswer(data.correctAnswer[0]); // pick first element
    } else {
        setCorrectAnswer(data.correctAnswer);
    }

    setTimeout(() => setAnswerSubmitted(true), 0);
}, []);


    // Handles time up event (similar to answer feedback, but no user selection)
    const handleTimeUp = useCallback((data) => {
        setAnswerSubmitted(true);
        if (data.correctAnswer) {
            setCorrectAnswer(data.correctAnswer);
        }
    }, []); // Removed setNotification

    // Handles score updates, showing a transient feedback
    const handleScoreUpdate = useCallback((data) => {
        setScoreUpdateFeedback(data);
        if (scoreFeedbackTimeoutRef.current) clearTimeout(scoreFeedbackTimeoutRef.current);
        scoreFeedbackTimeoutRef.current = setTimeout(() => setScoreUpdateFeedback(null), 3000); // Clear feedback after 3 seconds
    }, []);

    // Resets state for a new question
    const handleSendQuestion = useCallback(() => {
        setSelectedOption(null);
        setAnswerSubmitted(false);
        setCorrectAnswer(null);
    }, []); // Removed setNotification

    // Handles game end logic
    const handleGameEnd = useCallback(() => {
        setAnswerSubmitted(true); // Prevent further interaction
    }, []); // Removed setNotification


    // --- Effect for Socket Events and Navigation ---
    useEffect(() => {
        // Attempt to connect socket if not connected
        if (!socket || !socket.connected) {
            console.log("GamePage: Socket not connected, attempting to connect.");
            connectSocket(); // This will attempt to re-join room if data exists in store
            return;
        }

        // Redirect logic based on room status
        if (roomStatus === 'waiting' && roomId === urlRoomId) {
            console.log("GamePage: Room status is 'waiting', navigating to lobby.");
            navigate(`/room/${roomId}`);
            return;
        }
        // If no room ID or room ID mismatch, or not in 'playing'/'finished' state, go home
        if (!roomId || roomId !== urlRoomId || !['playing', 'finished', 'loading_questions'].includes(roomStatus)) {
            console.log("GamePage: Invalid room state or ID mismatch, navigating to home.");
            // Removed notification here
            navigate('/');
            return;
        }

        // Clear global error if present and context is valid
        if (error) {
            console.log("GamePage: Clearing global error.");
            clearError();
        }

        // Register socket event listeners
        socket.on('answer_feedback', handleAnswerFeedback);
        socket.on('score_update', handleScoreUpdate);
        socket.on('time_up', handleTimeUp);
        socket.on('game_end', handleGameEnd);
        socket.on('send_question', handleSendQuestion);

        // Cleanup function for socket listeners and timeouts
        return () => {
            if (scoreFeedbackTimeoutRef.current) clearTimeout(scoreFeedbackTimeoutRef.current);
            socket.off('answer_feedback', handleAnswerFeedback);
            socket.off('score_update', handleScoreUpdate);
            socket.off('time_up', handleTimeUp);
            socket.off('game_end', handleGameEnd);
            socket.off('send_question', handleSendQuestion);
        };
    }, [
        socket, roomId, roomStatus, navigate, urlRoomId, myUsername, error,
        connectSocket, clearError, handleAnswerFeedback, handleScoreUpdate,
        handleTimeUp, handleGameEnd, handleSendQuestion
    ]); // Removed setNotification from dependencies

    // Handles submitting the chosen answer
    const handleSubmitAnswer = () => {
        // Removed notification here
        if (!selectedOption) return;
        if (answerSubmitted) return; // Prevent double submission
        submitAnswer(selectedOption);
        setAnswerSubmitted(true);
    };

    // Handles leaving the game (disconnect and go to home)
    const handleLeaveGame = useCallback(async () => {
        await leaveRoom(); // This will disconnect socket and clear store state
        navigate('/'); // Navigate back to home
    }, [leaveRoom, navigate]);

    // Handles going back to the lobby (stay connected, just navigate)
    const handleBackToLobby = useCallback(() => {
        navigate(`/room/${roomId}`);
    }, [navigate, roomId]);

    // --- Render Logic ---
    // Loading state for initial page load or reconnecting
    if (isLoading && !roomId) {
        return (
            <div className="min-h-screen w-full flex justify-center items-center bg-gray-900 text-white font-inter">
                <div className="flex items-center space-x-3 text-2xl text-blue-400">
                    <span className="animate-spin text-4xl">⚙️</span>
                    <p>Loading game...</p>
                </div>
            </div>
        );
    }

    // Error state display
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

    // Game Finished Screen
    if (roomStatus === 'finished') {
        const sortedParticipants = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0)); // Ensure score is numeric
        const winner = sortedParticipants[0];

        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">
                {/* Background animations */}
                <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm" style={{ backgroundImage: "url('https://placehold.co/1920x1080/000000/FFFFFF?text=CONFETTI_PATTERN')" }} aria-hidden="true"></div>
                <div className="absolute animate-pulse-slow-move w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 top-10 left-10"></div>
                <div className="absolute animate-pulse-slow-move animation-delay-2000 w-64 h-64 bg-lime-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 bottom-20 right-20"></div>

                <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-xl mx-auto animate-fade-in border-4 border-gray-700 text-center">
                    <h2 className="text-5xl font-black text-yellow-400 mb-6 animate-neon-glow">Game Over!</h2>
                    <p className="text-3xl font-semibold text-white mb-4">🏆 {winner?.username} is the Winner! 🏆</p>
                    <p className="text-2xl text-gray-300 mb-8">Score: {winner?.score} points</p>

                    <h3 className="text-2xl font-semibold mb-6 text-blue-300">Final Scoreboard:</h3>
                    <ul className="space-y-3 mb-8">
                        {sortedParticipants.map((p, index) => (
                            <li key={p.socketId} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                                p.socketId === winner?.socketId
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-bold scale-105 shadow-host-glow animate-bounce-sm'
                                    : p.socketId === socketId // Corrected: Use socketId to identify current user
                                    ? 'bg-purple-700 border-purple-500 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-200'
                            } transition-all duration-300 transform`}>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-blue-400">
                                        <img
                                            src={getDiceBearAvatarUrl(p.avatar?.head || 'bottts', p.username || 'default-seed')}
                                            alt={`${p.username}'s avatar`}
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://thumbs.dreamstime.com/b/flying-magic-books-library-367534733.jpg"; }}
                                        />
                                    </div>
                                    <span className="text-xl">{index + 1}. {p.username}</span>
                                </div>
                                <span className="text-xl">{p.score} points</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                        {/* Always show Back to Lobby button */}
                        <button onClick={handleBackToLobby} className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white py-3 px-6 rounded-lg font-bold text-lg uppercase tracking-wide hover:from-blue-700 hover:to-cyan-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform active:scale-95 shadow-lg">
                            Back to Lobby
                        </button>
                        {/* Always show Leave Game button */}
                        <button onClick={handleLeaveGame} className="bg-gradient-to-r from-red-600 to-rose-700 text-white py-3 px-6 rounded-lg font-bold text-lg uppercase tracking-wide hover:from-red-700 hover:to-rose-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform active:scale-95 shadow-lg">
                            Leave Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">
            {/* --- Global CSS for Animations (consistent with HomePage & LobbyPage) --- */}
            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }

                /* Custom Neon Glow for Titles */
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
                /* Removed: No longer needed due to notification removal */

                /* Fade In for Main Content */
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }

                /* Bounce Small (for winner) */
                @keyframes bounce-sm {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
                .animate-bounce-sm {
                    animation: bounce-sm 0.5s ease-in-out infinite alternate;
                }

                /* Score Feedback Animation */
                @keyframes fade-up-score {
                    0% { opacity: 0; transform: translateY(0); }
                    20% { opacity: 1; transform: translateY(-20px); }
                    80% { opacity: 1; transform: translateY(-30px); }
                    100% { opacity: 0; transform: translateY(-40px); }
                }
                .animate-fade-up-score {
                    animation: fade-up-score 2.5s ease-out forwards;
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
                .shadow-self-score-glow {
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.7); /* Gold glow for self score */
                }
            `}</style>

            {/* --- Background Elements (Themed, subtle animations) --- */}
            <div
                className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm"
                style={{ backgroundImage: "url('https://placehold.co/1920x1080/000000/FFFFFF?text=GAME_PATTERN')" }}
                aria-hidden="true"
            ></div>
            <div className="absolute animate-pulse-slow-move w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 top-10 left-10"></div>
            <div className="absolute animate-pulse-slow-move animation-delay-2000 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 bottom-20 right-20"></div>
            <div className="absolute animate-pulse-slow-move animation-delay-4000 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 top-1/3 right-1/4"></div>

            {/* --- Main Game Content Container --- */}
            <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-7xl mx-auto animate-fade-in border-4 border-gray-700 flex flex-col md:flex-row gap-8">
                {/* Left Side: Question and Options */}
                <div className="flex-1 flex flex-col">
                    <h1 className="text-4xl sm:text-5xl font-black text-center text-green-400 mb-6">Trivia Battle!</h1>
                    <p className="text-lg sm:text-xl text-center text-gray-300 mb-8 font-light">
                        Playing as: <span className="font-semibold text-green-300">{myUsername}</span> | Your Score: <span className="relative inline-block font-semibold text-yellow-400 shadow-self-score-glow px-2 py-1 rounded">{myScore}
                        {scoreUpdateFeedback && (
                            <span className={`absolute top-0 left-1/2 -translate-x-1/2 text-lg font-bold animate-fade-up-score ${scoreUpdateFeedback.scoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {scoreUpdateFeedback.scoreChange > 0 ? '+' : ''}{scoreUpdateFeedback.scoreChange}
                            </span>
                        )}
                        </span>
                    </p>

                    {currentQuestion && roomStatus === 'playing' ? (
                        <div className="bg-gray-700 p-6 rounded-xl shadow-neo-inset mb-6 border-2 border-gray-600 animate-fade-in">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-blue-300">
                                Question {questionIndex + 1}{gameSettings?.questionCount ? ` / ${gameSettings.questionCount}` : ''}
                            </h2>
                            <div className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white leading-relaxed">
                                {decodeHtml(currentQuestion.questionText)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentQuestion.options.map((option) => {

                                    const decodedOption = decodeHtml(option).trim();
                                    const decodedCorrectAnswer = decodeHtml(correctAnswer || '').trim(); // <-- Use the local state!
                                    const decodedSelectedOption = decodeHtml(selectedOption || '').trim(); // Defensive check for null/undefined

                                    const isCorrect = decodedOption === decodedCorrectAnswer;
                                    const isSelectedWrong = decodedOption === decodedSelectedOption && !isCorrect;

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => !answerSubmitted && setSelectedOption(option)}
                                            className={`p-4 rounded-lg text-lg sm:text-xl text-left transition duration-300 border-2
                                                ${
                                                    answerSubmitted
                                                        ? isCorrect
                                                            ? 'bg-green-600 border-green-700 animate-pulse-sm-light text-white'
                                                            : isSelectedWrong
                                                                ? 'bg-red-600 border-red-700 text-white'
                                                                : 'bg-gray-600 border-gray-500 opacity-60 text-gray-300 cursor-not-allowed'
                                                        : decodedSelectedOption === decodedOption
                                                            ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                                                            : 'bg-gray-600 hover:bg-gray-500 border-gray-500 text-white hover:shadow-md'
                                                }
                                                ${answerSubmitted ? 'cursor-not-allowed' : 'cursor-pointer transform hover:-translate-y-1'}`}
                                            disabled={answerSubmitted}
                                        >
                                            {decodeHtml(option)}
                                            {answerSubmitted && isCorrect && (
                                                <span className="ml-2 text-green-200 text-2xl">✔️</span>
                                            )}
                                            {answerSubmitted && isSelectedWrong && (
                                                <span className="ml-2 text-red-200 text-2xl">❌</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 text-center bg-gray-900 p-4 rounded-lg border-2 border-gray-700 shadow-inner">
                                <div className="text-xl text-gray-300">Time Remaining:</div>
                                <div className={`text-6xl font-extrabold ${timeRemaining <= 5 ? 'text-red-500 animate-pulse-fast' : 'text-green-400'} mt-2`}>
                                    {timeRemaining}s
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitAnswer}
                                className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-indigo-700 hover:to-purple-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-indigo-400"
                                disabled={answerSubmitted || !selectedOption}
                            >
                                {answerSubmitted ? 'Answer Submitted!' : 'Submit Answer'}
                                {!answerSubmitted && selectedOption && <span className="ml-2 text-2xl">✅</span>}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-700 p-6 rounded-xl shadow-neo-inset mb-6 border-2 border-gray-600 flex items-center justify-center h-48 animate-pulse">
                            <p className="text-2xl text-center text-gray-400">Waiting for the next question...</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Scoreboard */}
                <div className="w-full md:w-1/3 flex flex-col">
                  <LiveChat />
                  <div className="bg-gray-700 p-6 rounded-xl shadow-neo-inset border-2 border-gray-600 flex-1 pt-2">
                        <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">Live Scoreboard</h2>
                        {/* New div for the scrollable list of participants */}
                        <div className="h-80 overflow-y-auto pr-2"> {/* Added h-80 for fixed height, overflow-y-auto for scroll, and pr-2 for scrollbar spacing */}
                            <ul className="space-y-3 mb-6">
                                {[...participants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => (
                                    <li key={p.socketId} className={`flex items-center justify-between p-3 rounded-md border ${p.socketId === socketId ? 'bg-purple-600 border-purple-400 shadow-participant-glow' : 'bg-gray-600 border-gray-500'}`}>
                                        <div className="flex items-center space-x-3">
                                            {/* Participant Avatar */}
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border-2 border-blue-400">
                                                <img
                                                    src={getDiceBearAvatarUrl(p.avatar?.head || 'bottts', p.username || 'default-seed')}
                                                    alt={`${p.username}'s avatar`}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/32x32/333333/FFFFFF?text=ERR"; }}
                                                />
                                            </div>
                                            <span className={`font-medium ${p.socketId === socketId ? 'text-white' : 'text-gray-200'}`}>{p.username}</span>
                                        </div>
                                        <span className="font-semibold text-yellow-300">{p.score} points</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex justify-center mt-6">
                        {/* Unified Leave Game button during active gameplay */}
                        <button
                            onClick={handleLeaveGame}
                            className="bg-gradient-to-r from-red-600 to-rose-700 text-white py-3 px-8 rounded-lg font-bold text-lg uppercase tracking-wide hover:from-red-700 hover:to-rose-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform active:scale-95 shadow-lg border-2 border-red-400"
                        >
                            Leave Game
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Footer / Credits (Consistent) --- */}
            <p className="text-center text-gray-500 text-sm mt-12 animate-fade-in animation-delay-1000">
                &copy; {new Date().getFullYear()} Trivia Home. All rights reserved.
            </p>
        </div>
    );
}

export default GamePage;