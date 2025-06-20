// frontend/src/components/Notification.jsx
import React, { useEffect, useState } from 'react';

function Notification({ message, type }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // This component will be unmounted by Zustand after 5s due to `set({ notification: null })`
    // So, we just need local visibility for fade out if desired.
    // For now, simple fade out.
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500); // Start fading out slightly before it's cleared from store

    return () => clearTimeout(timer);
  }, [message]);

  let bgColorClass = '';
  let textColorClass = '';

  switch (type) {
    case 'success':
      bgColorClass = 'bg-green-500';
      textColorClass = 'text-white';
      break;
    case 'error':
      bgColorClass = 'bg-red-500';
      textColorClass = 'text-white';
      break;
    case 'info':
      bgColorClass = 'bg-blue-500';
      textColorClass = 'text-white';
      break;
    case 'warning':
      bgColorClass = 'bg-yellow-500';
      textColorClass = 'text-gray-900';
      break;
    default:
      bgColorClass = 'bg-gray-700';
      textColorClass = 'text-white';
  }

  return isVisible ? (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500 ease-out ${bgColorClass} ${textColorClass} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="font-semibold">{message}</p>
    </div>
  ) : null;
}

export default Notification;