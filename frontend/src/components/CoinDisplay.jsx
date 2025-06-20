// frontend/src/components/CoinDisplay.jsx
import { useGameStore } from '../store/gameStore';

function CoinDisplay() {
  const { myCoins } = useGameStore(); // You’ll store this in Zustand

  return (
    <div className="fixed top-4 right-4 bg-yellow-300 text-black font-bold px-4 py-2 rounded shadow-lg z-50">
      🪙 Coins: {myCoins ?? 0}
    </div>
  );
}

export default CoinDisplay;
