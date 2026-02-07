// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react'; // Import useEffect
import { useGameStore } from './store/gameStore.js'; // Import your Zustand store - Added .js extension

import HomePage from './pages/HomePage.jsx'; // Added .jsx extension
import LobbyPage from './pages/LobbyPage.jsx'; // Added .jsx extension
import GamePage from './pages/GamePage.jsx'; // Added .jsx extension
import NotFoundPage from './pages/NotFoundPage.jsx'; // Added .jsx extension
import Notification from './components/Notification.jsx'; // Added .jsx extension
import ErrorDisplay from './components/ErrorDisplay.jsx'; // Added .jsx extension
import MainMenuPage from './pages/MainMenuPage.jsx'; // Added .jsx extension
import SettingsPage from './pages/SettingsPage.jsx'; // Added .jsx extension

import ShopPage from './pages/ShopPage.jsx'; // Added .jsx extension
import CoinDisplay from './components/CoinDisplay.jsx'; // Added .jsx extension (though not used in App.jsx itself)
import LeaderboardPage from './pages/LeaderboardPage.jsx'; // Added .jsx extension

import KnowledgeLoader from './components/KnowledgeLoader.jsx'; // Import the new loader component - Added .jsx extension

import { SettingsProvider, MusicPlayer } from './contexts/SettingsContext.jsx'; // Settings context and music player

import { Analytics } from "@vercel/analytics/react"

function App() {
  const { connectSocket, isConnected, notification, error, isLoading } = useGameStore();

  useEffect(() => {
    // Connect to Socket.IO when the app mounts
    if (!isConnected) {
      connectSocket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]); // Re-run if connection status changes (e.g., after a disconnect)

  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
          {notification && <Notification message={notification.message} type={notification.type} />}
          {error && <ErrorDisplay message={error.message} type={error.type} />}
          {isLoading && (
            // Replaced the generic loading spinner with the custom KnowledgeLoader
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
              <KnowledgeLoader />
            </div>
          )}

          <Routes>
            <Route path="/" element={<MainMenuPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/room/:roomId" element={<LobbyPage />} />
            <Route path="/game/:roomId" element={<GamePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>

          {/* Floating Music Player */}
          <MusicPlayer />
        </div>
        <Analytics />
      </Router>
    </SettingsProvider>
  );
}

export default App;

