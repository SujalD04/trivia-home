import React from 'react';

const KnowledgeLoader = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 font-inter">
      {/* Global CSS for Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        @keyframes stack-slide-up {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.8);
          }
          70% {
            opacity: 1;
            transform: translateY(-5px) scale(1.05); /* Slight bounce */
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.4), 0 0 20px rgba(139, 92, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4);
          }
        }

        .loader-block {
          animation: stack-slide-up 0.7s ease-out forwards;
        }

        .loader-container.loaded .loader-block:last-child {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center bg-gray-800 bg-opacity-90 rounded-2xl shadow-lg p-8 sm:p-10 border-4 border-purple-700 animate-fade-in relative overflow-hidden">
        {/* Decorative particles */}
        <div className="absolute inset-0 z-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-purple-500 rounded-full animate-pulse"
              style={{
                width: `${Math.random() * 5 + 2}px`,
                height: `${Math.random() * 5 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                opacity: 0.7
              }}
            />
          ))}
        </div>

        {/* Knowledge Blocks */}
        <div className="relative z-10 flex flex-col items-center loader-container loaded">
          <div
            className="loader-block w-24 h-6 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg mb-1 border-2 border-purple-500 shadow-xl"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="loader-block w-28 h-6 bg-gradient-to-r from-blue-600 to-cyan-700 rounded-lg mb-1 border-2 border-blue-500 shadow-xl"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="loader-block w-32 h-6 bg-gradient-to-r from-green-600 to-teal-700 rounded-lg mb-1 border-2 border-green-500 shadow-xl"
            style={{ animationDelay: '0.3s' }}
          ></div>
          <div
            className="loader-block w-36 h-6 bg-gradient-to-r from-yellow-600 to-orange-700 rounded-lg border-2 border-yellow-500 shadow-xl"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>

        <p className="mt-8 text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          Unlocking New Insights...
        </p>
        <p className="mt-2 text-md sm:text-lg text-gray-400 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          Please wait while we gather the data.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeLoader;
