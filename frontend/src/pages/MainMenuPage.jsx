import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

function MainMenuPage() {
  const navigate = useNavigate();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const blueCircles = [
  { width: 30, height: 30, top: '10%', left: '20%', blur: 6 },
  { width: 40, height: 40, top: '15%', left: '60%', blur: 8 },
  { width: 25, height: 25, top: '30%', left: '35%', blur: 7 },
  { width: 50, height: 50, top: '50%', left: '10%', blur: 9 },
  { width: 35, height: 35, top: '70%', left: '75%', blur: 6 },
  { width: 28, height: 28, top: '80%', left: '40%', blur: 7 },
  { width: 45, height: 45, top: '65%', left: '20%', blur: 6 },
  { width: 38, height: 38, top: '55%', left: '55%', blur: 7 },
  { width: 30, height: 30, top: '25%', left: '80%', blur: 8 },
  { width: 32, height: 32, top: '5%', left: '45%', blur: 5 },
];

const pinkCircles = [
  { width: 30, height: 30, top: '12%', left: '25%', blur: 6 },
  { width: 42, height: 42, top: '18%', left: '65%', blur: 8 },
  { width: 27, height: 27, top: '32%', left: '38%', blur: 7 },
  { width: 48, height: 48, top: '52%', left: '15%', blur: 9 },
  { width: 33, height: 33, top: '73%', left: '70%', blur: 6 },
  { width: 30, height: 30, top: '82%', left: '35%', blur: 7 },
  { width: 43, height: 43, top: '68%', left: '18%', blur: 6 },
  { width: 36, height: 36, top: '58%', left: '58%', blur: 7 },
  { width: 28, height: 28, top: '28%', left: '85%', blur: 8 },
  { width: 34, height: 34, top: '8%', left: '50%', blur: 5 },
];


  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white font-inter relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* --- Global CSS for Animations & Fonts --- */}
      <style>{`
        /* Hide scrollbar for webkit browsers */
        ::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        body {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        .font-orbitron {
          font-family: 'Orbitron', sans-serif;
        }

        /* Custom Neon Glow for Title (static) */
        .animate-neon-glow-main {
          text-shadow: 0 0 10px #00e0ff, 0 0 20px #00e0ff, 0 0 40px #2e86de, 0 0 80px #2e86de;
        }

        /* Fade In and Slide Up for Main Content */
        @keyframes fade-in-slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-slide-up {
          animation: fade-in-slide-up 0.8s ease-out forwards;
        }

        /* Staggered Fade In for Buttons */
        .animate-stagger-fade-in > * {
          opacity: 0;
          animation: fade-in-slide-up 0.6s ease-out forwards;
        }
        .animate-stagger-fade-in > *:nth-child(1) { animation-delay: 0.2s; }
        .animate-stagger-fade-in > *:nth-child(2) { animation-delay: 0.4s; }
        .animate-stagger-fade-in > *:nth-child(3) { animation-delay: 0.6s; }
        .animate-stagger-fade-in > *:nth-child(4) { animation-delay: 0.8s; }
        .animate-stagger-fade-in > *:nth-child(5) { animation-delay: 1.0s; }
        .animate-stagger-fade-in > *:nth-child(6) { animation-delay: 1.2s; }

        /* Neo-Brutalism Shadow (tweaked for more depth) */
        .shadow-neo-brutalism {
            box-shadow: 12px 12px 0px rgba(0, 0, 0, 0.7);
        }
        .hover\\:shadow-neo-brutalism-hover:hover {
            box-shadow: 18px 18px 0px rgba(0, 0, 0, 0.9);
        }
        /* Button specific shadow */
        .btn-shadow-neo {
            box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.6);
        }
        .btn-shadow-neo:hover {
            box-shadow: 10px 10px 0px rgba(0, 0, 0, 0.7);
        }
        .btn-shadow-neo:active {
            box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.4);
            transform: translate(2px, 2px); /* Simulate button press */
        }

        /* Modal specific animation */
        @keyframes modal-fade-in {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-fade-in {
            animation: modal-fade-in 0.3s ease-out forwards;
        }

        /* Floating particles animation */
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.8; }
          25% { transform: translateY(-15px) translateX(10px) rotate(5deg); opacity: 0.9; }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.8; }
          75% { transform: translateY(15px) translateX(-10px) rotate(-5deg); opacity: 0.9; }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.8; }
        }

        /* Background grid animation */
        @keyframes grid-fade-in {
          from { opacity: 0; }
          to { opacity: 0.1; }
        }
        .animate-grid-fade-in {
          animation: grid-fade-in 1.5s ease-out forwards;
          animation-delay: 0.5s;
        }

        /* Subtle glare effect on main content container */
        @keyframes glare-slide {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .glare-effect {
          position: relative;
        }
        .glare-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: glare-slide 8s infinite linear;
          pointer-events: none;
          mix-blend-mode: overlay;
        }

        /* Variables for hover colors for MenuButton component */
        .hover-colors-green-500-teal-600:hover {
          background-image: linear-gradient(to right, #22C55E, #0D9488);
        }
        .hover-colors-blue-500-indigo-600:hover {
          background-image: linear-gradient(to right, #3B82F6, #4F46E5);
        }
        .hover-colors-purple-500-pink-600:hover {
          background-image: linear-gradient(to right, #A855F7, #DB2777);
        }
        .hover-colors-yellow-500-orange-600:hover {
          background-image: linear-gradient(to right, #F59E0B, #EA580C);
        }
        .hover-colors-gray-500-blue-700:hover {
          background-image: linear-gradient(to right, #6B7280, #1D4ED8);
        }
        .hover-colors-red-600-rose-700:hover {
          background-image: linear-gradient(to right, #DC2626, #BE123C);
        }
      `}</style>

      {/* --- Background Elements (Enhanced for "Attractiveness") --- */}
      {/* Background image with deeper blur and slight desaturation */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-10 blur-lg filter grayscale"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1510915361007-83fc0aef6356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NTMzNXwwfDF8c2VhcmNofDE3fHxxdWl6JTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3MDcxMzcwNDF8MA&ixlib=rb-4.0.3&q=80&w=1080')" }}
        aria-hidden="true"
      ></div>

      {/* Dynamic Grid Overlay - more techy and engaging */}
      <div
        className="absolute inset-0 w-full h-full opacity-10 animate-grid-fade-in"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      ></div>

      {/* Floating Abstract Particles (Subtle and non-distracting) */}
      <>
        {blueCircles.map((circle, i) => (
          <div
            key={`blue-${i}`}
            className="absolute bg-blue-500 rounded-full mix-blend-screen opacity-80"
            style={{
              width: `${circle.width}px`,
              height: `${circle.height}px`,
              top: circle.top,
              left: circle.left,
              filter: `blur(${circle.blur}px)`,
              zIndex: 0,
            }}
          />
        ))}
        {pinkCircles.map((circle, i) => (
          <div
            key={`pink-${i}`}
            className="absolute bg-pink-500 rounded-full mix-blend-screen opacity-80"
            style={{
              width: `${circle.width}px`,
              height: `${circle.height}px`,
              top: circle.top,
              left: circle.left,
              filter: `blur(${circle.blur}px)`,
              zIndex: 0,
            }}
          />
        ))}
      </>


      {/* --- Main Content Container --- */}
      <div className="relative z-10 w-full max-w-md bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 animate-fade-in-slide-up border-4 border-gray-700 hover:shadow-neo-brutalism-hover transition-all duration-300 transform glare-effect">

        {/* --- Game Title --- */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-center mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500 drop-shadow-lg font-orbitron">
          Trivia Home
        </h1>
        <p className="text-md sm:text-lg text-center text-gray-300 mb-8 font-light max-w-xs mx-auto">
          Challenge your mind, conquer trivia!
        </p>

        {/* Menu Buttons with Staggered Animation */}
        <div className="space-y-4 animate-stagger-fade-in">
          <MenuButton
            label="START NEW GAME"
            icon="⚔️"
            colors="from-green-500 to-teal-600"
            ringColor="green-400"
            borderColor="green-400"
            onClick={() => navigate('/home')}
          />
          <MenuButton
            label="HOW TO PLAY"
            icon="❓"
            colors="from-blue-500 to-indigo-600"
            ringColor="blue-400"
            borderColor="blue-400"
            onClick={() => setShowHowToPlay(true)}
          />
          <MenuButton
            label="LEADERBOARD"
            icon="🏆"
            colors="from-purple-500 to-pink-600"
            ringColor="purple-400"
            borderColor="purple-400"
            onClick={() => navigate('/leaderboard')}
          />
          <MenuButton
            label="SETTINGS"
            icon="⚙️"
            colors="from-gray-500 to-blue-700"
            ringColor="blue-500"
            borderColor="gray-400"
            onClick={() => navigate('/settings')}
          />
        </div>

        {/* --- Footer / Credits --- */}
        <p className="text-center text-gray-400 text-xs mt-10 opacity-80 animate-fade-in-slide-up animation-delay-2000">
          <span className="font-semibold text-gray-300">Trivia Home</span> v1.1 | Powered by the OpenTDB API
        </p>
      </div>

      {/* --- How to Play Modal --- */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-4 border-indigo-600 rounded-xl shadow-neo-brutalism p-6 sm:p-8 w-full max-w-lg animate-modal-fade-in relative max-h-[90vh] overflow-y-auto"> {/* Added max-h and overflow-y-auto */}
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-3xl font-extrabold text-indigo-400 text-center mb-6 border-b-2 border-indigo-500 pb-3 font-orbitron">How to Play Quiz Arena</h2>
            <div className="text-gray-200 space-y-5 text-base leading-relaxed"> {/* Increased space-y and added leading-relaxed */}
              <p>
                Welcome, future trivia master, to <b>Trivia Home</b>! This guide will help you understand the core mechanics and strategy to dominate the leaderboards.
              </p>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-teal-300 mb-2">Game Modes</h3>
                <ul className="list-none space-y-2"> {/* Removed default bullet, using custom icons/styling */}
                  <li className="flex items-start">
                    <span className="mr-3 text-xl text-green-400">⚡</span>
                    <div>
                      <strong className="text-green-300">Start New Game:</strong> Dive straight into a quick, solo challenge. Test your knowledge against the clock and aim for a high score. Perfect for honing your skills or a rapid trivia fix!
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-xl text-blue-400">🏡</span>
                    <div>
                      <strong className="text-blue-300">Create Room:</strong> Become the host! Set up a private game for you and your friends. You'll get a unique Room ID and can set a password for exclusive access. Customize categories and round limits if options become available in future updates!
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-xl text-purple-400">🤝</span>
                    <div>
                      <strong className="text-purple-300">Join Room:</strong> Looking to play with buddies? Enter their Room ID and password to jump right into their private game. The more, the merrier!
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-orange-300 mb-2">Gameplay Essentials</h3>
                <ul className="list-disc list-inside space-y-2 marker:text-orange-400">
                  <li>
                    <b>Answer Quickly:</b> Speed is crucial! The faster you answer correctly, the more points you earn. Deliberate, but don't dally!
                  </li>
                  <li>
                    <b>Accuracy Matters:</b> Incorrect answers may result in penalties or no points, so choose wisely.
                  </li>
                  <li>
                    <b>Objective:</b> The player who accumulates the highest score by the end of all rounds will be declared the champion of that game!
                  </li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-pink-300 mb-2">Other Menu Options</h3>
                <ul className="list-disc list-inside space-y-2 marker:text-pink-400">
                  <li>
                    <b>Leaderboard:</b> See how you stack up against other players globally. Compete for the top spot!
                  </li>
                  <li>
                    <b>Shop:</b> Unlock new avatars, themes, or power-ups to enhance your game (features to be expanded!).
                  </li>
                  <li>
                    <b>Settings:</b> Adjust game audio, notification preferences, and other personal options.
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-300 mt-4 text-center">
                Prepare your brain, sharpen your wits, and dive into the <b>Trivia Home</b> Good luck, and most importantly, have fun!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-lg font-bold text-lg uppercase tracking-wide hover:from-indigo-700 hover:to-purple-800 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform active:scale-95 btn-shadow-neo border-2 border-indigo-400"
            >
              Let's play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for cleaner button rendering
const MenuButton = ({ label, icon, onClick, colors, ringColor, borderColor }) => {
  const hoverClass = `hover-colors-${colors.replace('from-', '').replace('to-', '')}`;

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-r ${colors} text-white py-4 rounded-lg font-bold text-xl uppercase tracking-wide 
                  ${hoverClass} 
                  transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-${ringColor} 
                  focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center 
                  transform active:scale-95 btn-shadow-neo border-2 border-${borderColor}`}
    >
      <span className="mr-3 text-2xl">{icon}</span> {label}
    </button>
  );
};

export default MainMenuPage;