import { useGameStore } from "../store/gameStore";

// 🔊 Preload all audio files
const sounds = {
  click: new Audio("/sounds/click.mp3"),
  correct: new Audio("/sounds/correct.mp3"),
  wrong: new Audio("/sounds/wrong.mp3"),
  start: new Audio("/sounds/game-start.mp3"),
  countdown: new Audio("/sounds/countdown-beep.mp3"),
  gameover: new Audio("/sounds/game-over.mp3"),
};

// 🧠 Optional: adjust volume defaults if needed
sounds.click.volume = 0.5;
sounds.correct.volume = 0.7;
sounds.wrong.volume = 0.7;
sounds.start.volume = 0.6;
sounds.countdown.volume = 0.5;
sounds.gameover.volume = 0.6;

// 🚀 Main sound trigger function
export function playSound(effect) {
  const { soundEnabled } = useGameStore.getState();

  if (!soundEnabled) return;

  const sound = sounds[effect];
  if (!sound) return;

  try {
    sound.currentTime = 0;
    sound.play();
  } catch (err) {
    console.warn(`Failed to play sound "${effect}":`, err);
  }
}
