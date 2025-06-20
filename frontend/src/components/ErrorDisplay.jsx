// frontend/src/components/ErrorDisplay.jsx
import React from 'react';
import { useGameStore } from '../store/gameStore'; // To clear the error

function ErrorDisplay() {
  const { error, clearError } = useGameStore();

  if (!error) return null;

  let borderColorClass = '';
  let bgColorClass = '';
  let textColorClass = '';

  // You can customize error types if needed (e.g., 'join', 'game', 'connect', 'settings')
  switch (error.type) {
    case 'connect':
      borderColorClass = 'border-red-600';
      bgColorClass = 'bg-red-100';
      textColorClass = 'text-red-800';
      break;
    case 'join':
      borderColorClass = 'border-orange-600';
      bgColorClass = 'bg-orange-100';
      textColorClass = 'text-orange-800';
      break;
    case 'game':
      borderColorClass = 'border-purple-600';
      bgColorClass = 'bg-purple-100';
      textColorClass = 'text-purple-800';
      break;
    case 'room': // General room errors, like delete authorization
      borderColorClass = 'border-red-600';
      bgColorClass = 'bg-red-100';
      textColorClass = 'text-red-800';
      break;
    default:
      borderColorClass = 'border-gray-600';
      bgColorClass = 'bg-gray-100';
      textColorClass = 'text-gray-800';
  }

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 border-l-4 ${borderColorClass} ${bgColorClass} shadow-md rounded-md flex justify-between items-center w-80`}>
      <p className={`font-semibold ${textColorClass}`}>{error.message}</p>
      <button
        onClick={clearError}
        className="ml-4 text-gray-500 hover:text-gray-800 focus:outline-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}

export default ErrorDisplay;