import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

// Define available DiceBear avatar styles for dynamic generation
const AVAILABLE_AVATAR_HEADS = [
  'adventurer',
  'bottts',
  'lorelei',
  'initials',
  'pixel-art',
  'icons',
  'micah',
  'identicon'
];

// Helper to generate DiceBear avatar URL
const getDiceBearAvatarUrl = (style, seed) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=000000,c0a5f3,d2a4fc,e4a2f8,f1a0f5&radius=50&flip=true`;
};

function HomePage() {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarHeadInput, setAvatarHeadInput] = useState(AVAILABLE_AVATAR_HEADS[0]); // Default to first avatar

  const {
    isConnected,
    roomId,
    roomStatus,
    isLoading,
    joinRoom,
    createRoom,
    setNotification,
    error,
    clearError,
  } = useGameStore();

  // --- Persistent User Data (Username & Avatar) ---
  useEffect(() => {
    // Load saved username and avatar from localStorage on mount
    const savedUsername = localStorage.getItem('trivia_username');
    const savedAvatarHead = localStorage.getItem('trivia_avatar_head');
    if (savedUsername) {
      setUsernameInput(savedUsername);
    }
    // Only set if the saved avatar is one of the available ones, else default
    if (savedAvatarHead && AVAILABLE_AVATAR_HEADS.includes(savedAvatarHead)) {
      setAvatarHeadInput(savedAvatarHead);
    }
  }, []);

  // Save username and avatar to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trivia_username', usernameInput);
  }, [usernameInput]);

  useEffect(() => {
    localStorage.setItem('trivia_avatar_head', avatarHeadInput);
  }, [avatarHeadInput]);

  // --- Navigation & Notification Effects ---
  useEffect(() => {
    if (roomId && (roomStatus === 'waiting' || roomStatus === 'playing')) {
      navigate(`/room/${roomId}`);
      setNotification({ type: 'success', message: `Welcome to room ${roomId}!` });
      clearError(); // Clear any previous errors on successful navigation
    }
  }, [roomId, roomStatus, navigate, setNotification, clearError]);

  // Handle errors from the store
  useEffect(() => {
    if (error) {
      setNotification({ type: 'error', message: error.message });
      // Clear the error after displaying, so it doesn't persist across successful actions
      const timer = setTimeout(() => clearError(), 5000); // Clear error notification after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, setNotification, clearError]);

  // --- Validation Helper ---
  const validateInputs = useCallback(() => {
    if (!roomIdInput.trim() || !passwordInput.trim() || !usernameInput.trim() || !avatarHeadInput.trim()) {
      setNotification({ type: 'error', message: 'All fields are required!' });
      return false;
    }

    if (!isConnected) {
      setNotification({ type: 'error', message: 'Not connected to game server. Please ensure connection.' });
      return false;
    }

    return true;
  }, [roomIdInput, passwordInput, usernameInput, avatarHeadInput, isConnected, setNotification]);

  // --- Handle CREATE room form submission ---
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setNotification(null); // Clear previous notifications

    if (!validateInputs()) return;

    // Use the selected DiceBear style for the avatar head
    const avatar = { head: avatarHeadInput, body: 'default-body', accessory: 'default-accessory' };

    await createRoom(roomIdInput, passwordInput, usernameInput, avatar);
  };

  // --- Handle JOIN room form submission ---
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setNotification(null); // Clear previous notifications

    if (!validateInputs()) return;

    // Use the selected DiceBear style for the avatar head
    const avatar = { head: avatarHeadInput, body: 'default-body', accessory: 'default-accessory' };

    await joinRoom(roomIdInput, passwordInput, usernameInput, avatar);
  };

  return (
    // Main container now takes full width and ensures min-height
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">

      {/* --- Global CSS for Animations --- */}
      {/* This can be moved to a global CSS file if preferred, but for self-contained code, it's here */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        /* Custom Neon Glow for Title */
        @keyframes neon-glow {
          0%, 100% {
            text-shadow: 0 0 5px #ff00de, 0 0 10px #ff00de, 0 0 20px #ff00de, 0 0 40px #8a2be2, 0 0 80px #8a2be2, 0 0 90px #8a2be2, 0 0 100px #8a2be2;
          }
          50% {
            text-shadow: 0 0 2px #ff00de, 0 0 5px #ff00de, 0 0 10px #ff00de, 0 0 20px #8a2be2, 0 0 40px #8a2be2, 0 0 50px #8a2be2, 0 0 60px #8a2be2;
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

        /* Ping once for avatar selection */
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
        .shadow-avatar-selected {
            box-shadow: 0 0 15px rgba(255, 223, 0, 0.7), 0 0 30px rgba(255, 165, 0, 0.5); /* Gold glow */
        }
      `}</style>

      {/* --- Background Elements (Themed, subtle animations) --- */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm"
        style={{ backgroundImage: "url('https://thumbs.dreamstime.com/b/flying-magic-books-library-367534733.jpg')" }}
        aria-hidden="true"
      ></div>

      {/* --- Global Notification Area --- */}
      {/* {useGameStore.getState().notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 sm:p-4 rounded-lg shadow-lg text-center z-50 animate-slide-down-fade ${
          useGameStore.getState().notification.type === 'success' ? 'bg-green-600' :
          useGameStore.getState().notification.type === 'error' ? 'bg-red-600' :
          useGameStore.getState().notification.type === 'info' ? 'bg-blue-600' :
          'bg-gray-600'
        } text-white font-semibold transform transition-all duration-300`}>
          {useGameStore.getState().notification.message}
        </div>
      )} */}

      {/* --- Main Content Container (now takes full width, with max-width for content inside) --- */}
      <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-6xl mx-auto animate-fade-in border-4 border-gray-700">

        {/* --- Game Title --- */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-center mb-6 sm:mb-8 md:mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg ">
          TRIVIA HOME
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-center text-gray-300 mb-8 sm:mb-10 md:mb-12 font-light">
          Test your knowledge, challenge your friends. Are you ready for the ultimate quiz battle?
        </p>

        {/* --- Connection Status Indicator --- */}
        <div className="mb-8 text-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <span className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'}`}></span>
            Server Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* --- Main Forms Layout --- */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Create Room Section */}
          <div className="flex-1 p-6 border-4 border-indigo-500 rounded-xl shadow-neo-inset hover:shadow-neo-brutalism-hover transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-3xl font-extrabold text-indigo-400 mb-6 text-center border-b-2 border-indigo-600 pb-3">Create New Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label htmlFor="create-room-id" className="block text-sm font-medium text-gray-200 mb-1">Room ID</label>
                <input
                  type="text"
                  id="create-room-id"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="e.g., QUANTUMQUIZ"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} // Restrict to alphanumeric, uppercase
                  maxLength="10"
                  disabled={isLoading || roomStatus !== 'idle'}
                />
              </div>
              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                <input
                  type="password"
                  id="create-password"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="Keep it secret!"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isLoading || roomStatus !== 'idle'}
                />
              </div>
              <div>
                <label htmlFor="create-username" className="block text-sm font-medium text-gray-200 mb-1">Your Username</label>
                <input
                  type="text"
                  id="create-username"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="e.g., TriviaMaster"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={isLoading || roomStatus !== 'idle'}
                  maxLength={26}
                />
              </div>

              {/* Avatar Head Selection & Preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Choose Your Avatar Head</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                  {AVAILABLE_AVATAR_HEADS.map((head) => (
                    <div
                      key={head}
                      className={`
                        w-full h-16 sm:h-20 flex items-center justify-center rounded-lg cursor-pointer p-1
                        ${avatarHeadInput === head ? 'bg-indigo-600 border-4 border-yellow-400 shadow-avatar-selected scale-110' : 'bg-gray-600 border-2 border-gray-500'}
                        hover:bg-indigo-500 hover:scale-105 transition-all duration-200 ease-in-out transform
                        relative overflow-hidden group
                      `}
                      onClick={() => !isLoading && roomStatus === 'idle' && setAvatarHeadInput(head)}
                      title={`Style: ${head.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
                    >
                      {/* Using DiceBear API for actual avatar images */}
                      <img
                        src={getDiceBearAvatarUrl(head, usernameInput || 'default-seed')}
                        alt={`${head} avatar`}
                        className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-200"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/60x60/333333/FFFFFF?text=ERR"; }} // Fallback
                      />
                      {avatarHeadInput === head && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <svg className="w-8 h-8 text-yellow-300 animate-ping-once" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {usernameInput && (
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600 flex items-center space-x-3 shadow-inner">
                        <span className="text-gray-300 text-sm">Your Avatar Preview:</span>
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-500">
                            <img
                                src={getDiceBearAvatarUrl(avatarHeadInput, usernameInput)}
                                alt="Your selected avatar preview"
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/333333/FFFFFF?text=ERR"; }} // Fallback
                            />
                        </div>
                        <span className="text-lg font-bold text-indigo-300">{usernameInput}</span>
                    </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-3 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-indigo-700 hover:to-blue-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-indigo-400"
                disabled={isLoading || roomStatus !== 'idle' || !isConnected}
              >
                {isLoading && roomStatus === 'connecting' ? (
                  <>
                    <span className="animate-spin mr-3 text-2xl">⚙️</span> CREATING...
                  </>
                ) : 'CREATE & JOIN ROOM'}
              </button>
            </form>
          </div>

          {/* Separator for larger screens */}
          <div className="hidden md:flex items-center justify-center relative">
            <div className="w-1 h-full bg-gradient-to-b from-transparent via-gray-600 to-transparent rounded-full animate-pulse-slow-move"></div>
            <div className="absolute text-gray-400 bg-gray-800 p-2 rounded-full border-2 border-gray-600 font-bold text-lg -mt-4">OR</div>
          </div>
          <div className="block md:hidden w-full h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent my-8 rounded-full animate-pulse-slow-move"></div>

          {/* Join Room Section */}
          <div className="flex-1 p-6 border-4 border-purple-500 rounded-xl shadow-neo-inset hover:shadow-neo-brutalism-hover transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-3xl font-extrabold text-purple-400 mb-6 text-center border-b-2 border-purple-600 pb-3">Join Existing Room</h2>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label htmlFor="join-room-id" className="block text-sm font-medium text-gray-200 mb-1">Room ID</label>
                <input
                  type="text"
                  id="join-room-id"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="e.g., QUANTUMQUIZ"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} // Restrict to alphanumeric, uppercase
                  maxLength="10"
                  disabled={isLoading || roomStatus !== 'idle'}
                />
              </div>
              <div>
                <label htmlFor="join-password" className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                <input
                  type="password"
                  id="join-password"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="Room password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isLoading || roomStatus !== 'idle'}
                />
              </div>
              <div>
                <label htmlFor="join-username" className="block text-sm font-medium text-gray-200 mb-1">Your Username</label>
                <input
                  type="text"
                  id="join-username"
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 outline-none transform focus:scale-105"
                  placeholder="e.g., QuizWhiz"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={isLoading || roomStatus !== 'idle'}
                />
              </div>

              {/* Avatar Head Selection (re-used logic) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Choose Your Avatar Head</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                  {AVAILABLE_AVATAR_HEADS.map((head) => (
                    <div
                      key={head}
                      className={`
                        w-full h-16 sm:h-20 flex items-center justify-center rounded-lg cursor-pointer p-1
                        ${avatarHeadInput === head ? 'bg-purple-600 border-4 border-yellow-400 shadow-avatar-selected scale-110' : 'bg-gray-600 border-2 border-gray-500'}
                        hover:bg-purple-500 hover:scale-105 transition-all duration-200 ease-in-out transform
                        relative overflow-hidden group
                      `}
                      onClick={() => !isLoading && roomStatus === 'idle' && setAvatarHeadInput(head)}
                      title={`Style: ${head.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
                    >
                      {/* Using DiceBear API for actual avatar images */}
                      <img
                        src={getDiceBearAvatarUrl(head, usernameInput || 'default-seed')}
                        alt={`${head} avatar`}
                        className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-200"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/60x60/333333/FFFFFF?text=ERR"; }} // Fallback
                      />
                      {avatarHeadInput === head && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <svg className="w-8 h-8 text-yellow-300 animate-ping-once" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {usernameInput && (
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600 flex items-center space-x-3 shadow-inner">
                        <span className="text-gray-300 text-sm">Your Avatar Preview:</span>
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-500">
                            <img
                                src={getDiceBearAvatarUrl(avatarHeadInput, usernameInput)}
                                alt="Your selected avatar preview"
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/333333/FFFFFF?text=ERR"; }} // Fallback
                            />
                        </div>
                        <span className="text-lg font-bold text-purple-300">{usernameInput}</span>
                    </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-700 text-white py-3 rounded-lg font-bold text-xl uppercase tracking-wide hover:from-purple-700 hover:to-pink-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transform active:scale-95 shadow-lg border-2 border-purple-400"
                disabled={isLoading || roomStatus !== 'idle' || !isConnected}
              >
                {isLoading && roomStatus === 'connecting' ? (
                  <>
                    <span className="animate-spin mr-3 text-2xl">⚙️</span> JOINING...
                  </>
                ) : 'JOIN ROOM'}
              </button>
            </form>
          </div>
        </div>

        {/* --- Footer / Credits --- */}
        <p className="text-center text-gray-500 text-sm mt-12 animate-fade-in animation-delay-1000">
          &copy; {new Date().getFullYear()} Trivia Home. All rights reserved.
        </p>

      </div>
    </div>
  );
}

export default HomePage;
