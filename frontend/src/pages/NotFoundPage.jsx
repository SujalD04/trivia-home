import React, { useState, useEffect, useRef, useCallback } from 'react';

// NotFoundPage component, now enhanced with the mini-game
function NotFoundPage() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game constants
  const dinoHeight = 50;
  const dinoWidth = 30;
  const gravity = 0.5;
  const jumpStrength = -10;

  const cactusWidth = 20;
  const cactusHeight = 40;
  const gameSpeed = 5; // Pixels per frame, determines game difficulty

  // Refs for mutable game state and flags to avoid stale closures
  const dinoYRef = useRef(0);
  const dinoVelocityYRef = useRef(0);
  const cactiRef = useRef([]);
  const animationFrameIdRef = useRef(null);

  const gameOverRef = useRef(gameOver);
  const gameStartedRef = useRef(gameStarted);

  // Sync gameOver and gameStarted state with their refs
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  // Function to initialize or reset dino and game elements
  const initializeGameElements = useCallback((canvas) => {
    if (canvas) {
      dinoYRef.current = canvas.height - 20 - dinoHeight; // Set initial Y on ground relative to canvas height
    }
    dinoVelocityYRef.current = 0;
    cactiRef.current = []; // Clear cactiRef.current array
  }, []);

  // Effect to set canvas dimensions and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCanvasDimensions = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initializeGameElements(canvas); // Re-initialize game elements on resize
      // Re-draw immediately after resize, regardless of game state, to show current elements
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        // Only draw static elements here to avoid complex game state in resize
        // The animate loop will handle full drawing if active.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw Ground
        ctx.fillStyle = '#4A148C';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        // Draw Dino
        ctx.fillStyle = '#6A1B9A';
        const dinoX = canvas.width * 0.1;
        ctx.fillRect(dinoX, dinoYRef.current, dinoWidth, dinoHeight);
      }
    };

    setCanvasDimensions(); // Initial setup

    window.addEventListener('resize', setCanvasDimensions);
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [initializeGameElements]); // Removed gameStarted, gameOver as they are not needed for initial drawing on resize

  // Game Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame

    // --- Game Logic (only runs if game is started and not over) ---
    if (gameStartedRef.current && !gameOverRef.current) {
      // Update dino position (gravity and jumping)
      dinoVelocityYRef.current += gravity;
      dinoYRef.current += dinoVelocityYRef.current;

      // Keep dino on the ground
      if (dinoYRef.current + dinoHeight > canvas.height - 20) {
        dinoYRef.current = canvas.height - 20 - dinoHeight;
        dinoVelocityYRef.current = 0;
      }

      // Update cactiRef.current positions
      cactiRef.current.forEach(cactus => {
        cactus.x -= gameSpeed;
      });

      // Remove off-screen cactiRef.current and add new ones
      cactiRef.current = cactiRef.current.filter(cactus => cactus.x + cactus.width > 0);
      if (cactiRef.current.length === 0 || cactiRef.current[cactiRef.current.length - 1].x < canvas.width * 0.5) {
        cactiRef.current.push({
          x: canvas.width + Math.random() * 100,
          y: canvas.height - 20 - cactusHeight,
          width: cactusWidth,
          height: cactusHeight
        });
      }

      // Collision Detection (simple AABB collision)
      const dinoX = canvas.width * 0.1;
      let collisionDetected = false;
      cactiRef.current.forEach(cactus => {
        if (dinoX < cactus.x + cactus.width &&
          dinoX + dinoWidth > cactus.x &&
          dinoYRef.current < cactus.y + cactus.height &&
          dinoYRef.current + dinoHeight > cactus.y) {
          collisionDetected = true;
        }
      });

      if (collisionDetected) {
        setGameOver(true);
        gameOverRef.current = true; // immediately update ref
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null; // Clear the ID
        }
        return; // Stop the animate loop immediately
      }

      // Update score
      setScore(prevScore => prevScore + 1);
    } else if (gameOverRef.current) {
        // If game is over, we still want to draw the final state
        // but not update score or positions.
        // The requestAnimationFrame will be canceled by the useEffect that watches gameOver.
    }


    // --- Draw Game Elements (always draw if canvas exists) ---

    // Draw Ground
    ctx.fillStyle = '#4A148C'; // Dark Purple
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Draw Dino
    ctx.fillStyle = '#6A1B9A'; // Medium Purple
    const dinoX = canvas.width * 0.1;
    ctx.fillRect(dinoX, dinoYRef.current, dinoWidth, dinoHeight);

    // Draw cactiRef.current (only if game has started or is over to show lingering cacti)
    // Or if you only want to see them when the game is actively running, keep it inside the if block above.
    // For initial display, we typically don't want cacti to show until the game starts.
    if (gameStartedRef.current || gameOverRef.current) {
        ctx.fillStyle = '#AB47BC'; // Light Purple
        cactiRef.current.forEach(cactus => {
            ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        });
    }


    // Request next frame if the game is still running or if it's not started yet (to show static scene)
    // The main useEffect for starting/stopping animation handles this based on `gameStarted` and `gameOver`
    if (!gameOverRef.current) { // Continue animating as long as the game isn't explicitly over
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Effect for starting and stopping the animation loop
  useEffect(() => {
    // This useEffect will now manage starting/stopping the animation loop.
    // It should request a frame even if gameStarted is false, to draw the initial state.
    // However, we only cancel it if the game is over.
    if (!animationFrameIdRef.current) { // Only start a new loop if one isn't already running
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }

    // Cleanup on component unmount or when game is definitively over.
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [animate]); // Only depends on animate, which is memoized

  // Jump handler
  const handleJump = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Only allow jump if dino is on the ground and game is running
    if (dinoYRef.current + dinoHeight >= canvas.height - 20 && gameStartedRef.current && !gameOverRef.current) {
      dinoVelocityYRef.current = jumpStrength;
    }
  }, []);

  // Keyboard event listener for jumping and starting the game
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!gameStartedRef.current && !gameOverRef.current) {
          resetGame();
        } else {
          handleJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Touch event listener for jumping (for mobile)
  const handleCanvasTouch = useCallback(() => {
    if (!gameStartedRef.current && !gameOverRef.current) {
      resetGame();
    } else {
      handleJump();
    }
  }, [handleJump]);

  // Reset game state
  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    // Immediately update refs for consistency
    gameOverRef.current = false;
    gameStartedRef.current = true;

    dinoVelocityYRef.current = 0;
    cactiRef.current = [];
    initializeGameElements(canvasRef.current); // Re-initialize positions based on current canvas size

    // Ensure animation restarts if it was stopped
    if (!animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  };

  return (
    <>
      {/* Tailwind CSS CDN */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Google Fonts - Inter */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden; 
            background-color: #1a1a2e;
          }
          #root {
            width: 100%;
            height: 100%;
          }
          canvas {
            touch-action: manipulation;
            width: 100%;
            height: 100%;
          }
          .animate-pulse-strong {
            animation: pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse-strong {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .7;
            }
          }
        `}
      </style>
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#1a1a2e] p-4 font-inter">
        <div className="p-8 bg-[#2a2a3a] rounded-xl shadow-2xl text-center w-full relative z-10 border-4 border-[#6a0dad] flex flex-col items-center justify-center">
          <h2 className="text-5xl font-extrabold text-[#e91e63] mb-4 animate-pulse-strong">404 - Page Not Found</h2>
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">
            Oops! It seems you've wandered off the path. Don't worry, you can play a quick game while you figure things out!
          </p>

          {!gameStarted && !gameOver && (
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-[#00bcd4] text-white font-bold rounded-full shadow-lg hover:bg-[#00acc1] transition-all duration-300 transform hover:scale-105 active:scale-95 mb-6"
            >
              Start Game (Press Spacebar or Tap)
            </button>
          )}

          {gameOver && (
            <div className="mt-4 mb-6">
              <p className="text-3xl font-bold text-[#e91e63] mb-3">Game Over!</p>
              <p className="text-xl text-gray-300 mb-5">Your Score: <span className="font-extrabold text-[#6a0dad]">{score}</span></p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-[#00bcd4] text-white font-semibold rounded-md hover:bg-[#00acc1] transition-colors duration-200 shadow-md transform hover:scale-105 active:scale-95"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-center w-full h-48 sm:h-64 md:h-80 lg:h-96">
            <canvas
              ref={canvasRef}
              className="bg-[#3a3a4a] border-4 border-[#6a0dad] rounded-lg shadow-inner cursor-pointer"
              onTouchStart={handleCanvasTouch}
              style={{ display: 'block' }} // Always show canvas
            ></canvas>
          </div>

          <p className="text-base text-gray-300 mt-4 font-medium">Current Score: <span className="font-bold text-[#00bcd4]">{score}</span></p>

          <a
            href="#"
            onClick={() => window.location.href = '/'}
            className="mt-8 inline-block px-7 py-3 bg-[#8e24aa] text-white font-semibold rounded-md hover:bg-[#7b1fa2] transition-colors duration-200 shadow-lg transform hover:scale-105 active:scale-95"
            aria-label="Go to Home Page"
          >
            Go to Home
          </a>
        </div>
      </div>
    </>
  );
}

export default NotFoundPage;