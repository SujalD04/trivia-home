import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/UserStore'; // Assuming this provides userId

const LeaderboardPage = () => {
  const { userId } = useUserStore();
  const [personalStats, setPersonalStats] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        // Fetch personal stats
        let personalData = null;
        if (userId) { // Only fetch if userId is available
          const personalRes = await fetch(`${API_BASE_URL}/stats/${userId}`);
          if (!personalRes.ok) {
            console.warn(`Failed to fetch personal stats for ${userId}: ${personalRes.status}`);
          } else {
            personalData = await personalRes.json();
          }
        }
        setPersonalStats(personalData);

        // Fetch top players
        const topRes = await fetch(`${API_BASE_URL}/stats/global/top`);
        if (!topRes.ok) {
          throw new Error(`HTTP error! status: ${topRes.status} for global top players`);
        }
        const topData = await topRes.json();
        setTopPlayers(topData);

      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError("Failed to load leaderboard data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]); // Dependency on userId to re-fetch if it changes

  // Calculate personal answer accuracy for display
  // Assuming totalWins is correct answers and totalQuestions is all attempted questions
  const personalAccuracyRate = personalStats && personalStats.totalQuestions > 0
    ? (personalStats.totalWins / personalStats.totalQuestions) * 100
    : 0;

  // Determine if the current user is in the top 3
  const isUserTop3 = userId && topPlayers.slice(0, 3).some(player => player.userId === userId);
  const userRank = userId ? topPlayers.findIndex(player => player.userId === userId) + 1 : -1;


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center bg-gray-800 bg-opacity-90 rounded-2xl shadow-lg p-8 sm:p-10 border-4 border-purple-700 animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className="mt-4 text-xl font-semibold text-purple-300">Loading the grand rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center bg-red-800 bg-opacity-90 rounded-2xl shadow-lg p-8 sm:p-10 border-4 border-red-700 animate-fade-in">
          <p className="text-xl font-bold text-red-300 mb-4">Error!</p>
          <p className="text-lg text-red-200 text-center">{error}</p>
          <p className="mt-4 text-sm text-red-200">Could not retrieve leaderboard data.</p>
        </div>
      </div>
    );
  }

  return (
    // Reusing the general page styling from HomePage
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">

      {/* Global CSS for Animations (copied for consistency, adjust if already global) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes slide-up-fade-in {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade-in {
          animation: slide-up-fade-in 0.7s ease-out forwards;
        }

        .shadow-neo-brutalism {
            box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.8);
        }
        .shadow-neo-inset {
            box-shadow: inset 5px 5px 0px rgba(0, 0, 0, 0.6);
        }
        .hover\\:shadow-neo-brutalism-hover:hover {
            box-shadow: 12px 12px 0px rgba(0, 0, 0, 0.9);
        }
        .ring-inset-gold {
          box-shadow: inset 0 0 0 4px rgba(255, 215, 0, 0.7);
        }
        .ring-inset-silver {
          box-shadow: inset 0 0 0 4px rgba(192, 192, 192, 0.7);
        }
        .ring-inset-bronze {
          box-shadow: inset 0 0 0 4px rgba(205, 127, 50, 0.7);
        }
      `}</style>

      {/* --- Background Elements --- */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm"
        style={{ backgroundImage: "url('https://thumbs.dreamstime.com/b/flying-magic-books-library-367534733.jpg')" }}
        aria-hidden="true"
      ></div>

      {/* --- Main Content Container --- */}
      {/* Added pt-20 (or equivalent based on header height) to prevent content overlap with sticky header if applicable later */}
      <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-6xl mx-auto animate-fade-in border-4 border-gray-700">

        {/* --- Header --- */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-center mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg animate-bounce-in">
          THE LEADERBOARD
        </h1>
        <p className="text-lg sm:text-xl text-center text-gray-300 mb-8 font-light">
          See where you stand among the trivia elite!
        </p>

        {/* --- Personal Stats Section --- */}
        <div className="mb-10 animate-slide-up-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl font-extrabold text-green-400 mb-6 text-center border-b-2 border-green-600 pb-3">
            <span className="mr-2">👤</span> Your Performance
          </h2>
          {personalStats && userId ? (
            <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-xl p-6 text-center shadow-neo-brutalism border-2 border-green-500">
              <p className="text-sm text-green-200 mb-2">Player ID: <code className="font-mono text-green-300">{userId}</code></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <PersonalStatItem label="Games Completed" value={personalStats.totalGames} /> {/* Renamed */}
                <PersonalStatItem label="Correct Answers" value={personalStats.totalWins} /> {/* Renamed */}
                <PersonalStatItem label="Incorrect Answers" value={personalStats.totalLosses} /> {/* Renamed */}
                <PersonalStatItem label="Questions Attempted" value={personalStats.totalQuestions} />
                <PersonalStatItem label="Fastest Answer" value={personalStats.fastestAnswerTime?.toFixed(2) + 's' || 'N/A'} />
                <PersonalStatItem label="Answer Accuracy" value={`${personalAccuracyRate.toFixed(1)}%`} // Changed to Accuracy
                  progress={<ProgressBar percentage={personalAccuracyRate} colorClass="bg-green-400" />} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 bg-opacity-70 rounded-xl p-6 text-center shadow-neo-inset border-2 border-gray-600">
              <p className="text-lg text-gray-300">
                You need to log in or play a game to see your personal stats here.
              </p>
            </div>
          )}
        </div>

        {/* --- Dynamic Tips/Achievements Section --- */}
        {(() => {
          if (!userId) {
            return (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 text-center mb-10 shadow-lg border-2 border-blue-400 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-xl font-bold text-white mb-2">💡 Want to see your stats?</p>
                <p className="text-lg text-blue-200">Log in or create an account to start tracking your progress!</p>
              </div>
            );
          } else if (!personalStats || personalStats.totalGames === 0) {
            return (
              <div className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl p-4 text-center mb-10 shadow-lg border-2 border-purple-400 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-xl font-bold text-white mb-2">🚀 Ready to make your mark?</p>
                <p className="text-lg text-purple-200">Play your first game to see your name appear on the leaderboard!</p>
              </div>
            );
          } else if (isUserTop3) {
            return (
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl p-4 text-center mb-10 shadow-lg border-2 border-yellow-400 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-xl font-bold text-white mb-2">🌟 You're a Trivia Superstar!</p>
                <p className="text-lg text-yellow-200">Currently ranked #{userRank}! Keep up the amazing work!</p>
              </div>
            );
          } else if (personalStats.totalGames > 0) { // User has played but isn't top 3
            return (
              <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl p-4 text-center mb-10 shadow-lg border-2 border-orange-400 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-xl font-bold text-white mb-2">💪 Keep Climbing!</p>
                <p className="text-lg text-orange-200">Every game gets you closer to the top ranks!</p>
              </div>
            );
          }
          return null; // No message if none of the above conditions met
        })()}


        {/* --- Global Leaderboard Section --- */}
        <div className="animate-slide-up-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl font-extrabold text-blue-400 mb-6 text-center border-b-2 border-blue-600 pb-3">
            <span className="mr-2">🏆</span> Top Players Worldwide
          </h2>
          {topPlayers.length > 0 ? (
            <div className="bg-gray-700 bg-opacity-70 rounded-xl shadow-neo-brutalism p-4 overflow-x-auto border-2 border-gray-600">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-700 bg-opacity-90 backdrop-filter backdrop-blur-sm z-10">
                  <tr className="border-b border-gray-500 text-gray-300 uppercase text-sm">
                    <th className="py-3 px-4 rounded-tl-lg">Rank</th>
                    <th className="py-3 px-4">Player ID</th>
                    <th className="py-3 px-4 text-center">Correct</th>
                    <th className="py-3 px-4 text-center">Games</th>
                    <th className="py-3 px-4 text-center hidden sm:table-cell">Questions</th>
                    <th className="py-3 px-4 text-center rounded-tr-lg hidden md:table-cell">Fastest Time</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, index) => (
                    <tr
                      key={player.userId}
                      className={`
                        border-b border-gray-600 last:border-b-0 transition-all duration-200 ease-in-out
                        ${player.userId === userId ? 'bg-purple-600 bg-opacity-40 font-bold text-white shadow-lg ring-inset-gold' : 'hover:bg-gray-600 hover:bg-opacity-50'}
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-extrabold' : ''}
                        ${index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900 font-bold' : ''}
                        ${index === 2 ? 'bg-gradient-to-r from-orange-700 to-amber-800 text-white' : ''}
                        ${index < 3 ? 'text-shadow-md' : 'text-gray-200'}
                      `}
                    >
                      <td className="py-3 px-4 text-center text-lg">
                        {index === 0 && <span className="text-3xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index >= 3 && index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm sm:text-base">
                        <div className="flex flex-col leading-tight">
                          <code className={`${player.userId === userId ? 'text-white' : 'text-blue-300'}`}>
                            {player.userId}
                          </code>
                          <span className="text-xs text-gray-400 font-sans mt-1 break-words">
                            {player.username || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-lg font-semibold">{player.totalWins}</td>
                      <td className="py-3 px-4 text-center text-lg font-semibold">{player.totalGames}</td>
                      <td className="py-3 px-4 text-center text-lg hidden sm:table-cell">{player.totalQuestions}</td>
                      <td className="py-3 px-4 text-center text-lg hidden md:table-cell">
                        {player.fastestAnswerTime?.toFixed(2) || 'N/A'}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topPlayers.length === 0 && (
                <p className="text-center text-gray-400 py-6">No players on the leaderboard yet. Be the first!</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-700 bg-opacity-70 rounded-xl p-6 text-center shadow-neo-inset border-2 border-gray-600">
              <p className="text-lg text-gray-300">
                The global leaderboard is currently empty. Start playing to climb the ranks!
              </p>
            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <p className="text-center text-gray-500 text-sm mt-12">
          &copy; {new Date().getFullYear()} Trivia Home. All rights reserved.
        </p>

      </div>
    </div>
  );
};

// --- Helper Components ---

function PersonalStatItem({ label, value, progress }) {
  return (
    <div className="bg-green-800 bg-opacity-60 rounded-lg p-3 border border-green-600 shadow-sm transition-transform duration-200 hover:scale-105">
      <p className="text-sm text-green-200">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {progress && <div className="mt-2">{progress}</div>}
    </div>
  );
}

function ProgressBar({ percentage, colorClass }) {
  return (
    <div className="w-full bg-gray-600 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}

export default LeaderboardPage;