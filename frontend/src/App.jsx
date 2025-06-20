// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react'; // Import useEffect
import { useGameStore } from './store/gameStore'; // Import your Zustand store

import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import NotFoundPage from './pages/NotFoundPage';
import Notification from './components/Notification'; 
import ErrorDisplay from './components/ErrorDisplay'; 
import MainMenuPage from './pages/MainMenuPage';
import SettingsPage from './pages/SettingsPage';

import ShopPage from './pages/ShopPage'; 
import CoinDisplay from './components/CoinDisplay'; 
import LeaderboardPage from './pages/LeaderboardPage';

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
    <Router>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
        {notification && <Notification message={notification.message} type={notification.type} />}
        {error && <ErrorDisplay message={error.message} type={error.type} />}
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-white text-lg">Loading...</p>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<MainMenuPage />} />          
          <Route path="/home" element={<HomePage />} />            
          <Route path="/room/:roomId" element={<LobbyPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/shop" element={<ShopPage />} /> 
          <Route path="/leaderboard" element={ <LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;