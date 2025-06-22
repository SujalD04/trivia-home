import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/UserStore.js'; // Corrected to .js extension
import { useGameStore } from '../store/gameStore.js'; // Corrected to .js extension
import Loader from '../components/KnowledgeLoader.jsx';

const SettingsPage = () => {
  const { userId } = useUserStore();
  const { setNotification, setError } = useGameStore(); // For showing app-wide notifications/errors

  // State for user settings
  const [settings, setSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: true,
    theme: 'dark', // Default theme
    fastMode: false,
    preferredLanguage: 'en', // Added preferredLanguage with default 'en'
  });

  const [initialSettings, setInitialSettings] = useState(null); // To track if changes have been made
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'error', 'saving', ''
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchSettings() {
      if (!userId) {
        setLoading(false);
        setError({ message: "User ID not available. Cannot fetch settings.", type: "error" });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/settings/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setSettings({
              soundEnabled: true,
              notificationsEnabled: true,
              theme: 'dark',
              fastMode: false,
              preferredLanguage: 'en', // Set default for new users
            });
            setInitialSettings({ // Set initial settings to defaults
              soundEnabled: true,
              notificationsEnabled: true,
              theme: 'dark',
              fastMode: false,
              preferredLanguage: 'en', // Set default for new users
            });
            setNotification({ message: "Default settings loaded.", type: "info" });
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data = await response.json();
          // Ensure all settings fields are present, even if backend sends less
          setSettings({
            soundEnabled: data.soundEnabled ?? true,
            notificationsEnabled: data.notificationsEnabled ?? true,
            theme: data.theme ?? 'dark',
            fastMode: data.fastMode ?? false,
            preferredLanguage: data.preferredLanguage ?? 'en', // Handle new field
          });
          setInitialSettings({ // Store initial fetched settings, ensuring all fields
            soundEnabled: data.soundEnabled ?? true,
            notificationsEnabled: data.notificationsEnabled ?? true,
            theme: data.theme ?? 'dark',
            fastMode: data.fastMode ?? false,
            preferredLanguage: data.preferredLanguage ?? 'en',
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError({ message: "Failed to load settings. Please try again.", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [userId, setNotification, setError]); // Depend on userId to re-fetch if it changes


  // Check if settings have changed from their initial state
  const hasChanges = initialSettings && JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaveStatus(''); // Clear save status when changes are made
  };

  const handleSaveSettings = async () => {
    if (!userId) {
      setError({ message: "Cannot save settings: User ID not available.", type: "error" });
      return;
    }
    if (!hasChanges) {
      setNotification({ message: "No changes to save.", type: "info" });
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setError(null); // Clear any previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setInitialSettings(settings); // Update initial settings to current saved settings
      setSaveStatus('saved');
      setNotification({ message: "Settings saved successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaveStatus('error');
      setError({ message: "Failed to save settings. Please try again.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000); // Clear status after 3 seconds
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-inter">

      {/* Global CSS for Animations */}
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

        /* Custom toggle switch styling */
        .toggle-switch-container {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .toggle-switch-input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }
        .toggle-switch-slider {
            width: 50px;
            height: 28px;
            background-color: #6B7280; /* Gray-500 */
            border-radius: 28px;
            position: relative;
            transition: background-color 0.3s;
        }
        .toggle-switch-slider:before {
            content: "";
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: white;
            top: 4px;
            left: 4px;
            transition: transform 0.3s;
        }
        .toggle-switch-input:checked + .toggle-switch-slider {
            background-color: #4ADE80; /* Green-400 */
        }
        .toggle-switch-input:checked + .toggle-switch-slider:before {
            transform: translateX(22px);
        }
      `}</style>

      {/* --- Background Elements --- */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10 blur-sm"
        style={{ backgroundImage: "url('https://thumbs.dreamstime.com/b/flying-magic-books-library-367534733.jpg')" }}
        aria-hidden="true"
      ></div>

      {/* --- Main Content Container --- */}
      <div className="relative z-10 bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-2xl shadow-neo-brutalism p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-3xl mx-auto animate-fade-in border-4 border-gray-700">

        {/* --- Header --- */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-center mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 drop-shadow-lg animate-bounce-in">
          YOUR SETTINGS
        </h1>
        <p className="text-lg sm:text-xl text-center text-gray-300 mb-8 font-light">
          Customize your trivia experience.
        </p>

        {/* --- Settings Options Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Sound Toggle */}
          <SettingCard
            title="Game Sound"
            description="Enable or disable in-game sound effects and music."
            icon="🔊"
            delay="0.1s"
          >
            <ToggleSwitch
              name="soundEnabled"
              checked={settings.soundEnabled}
              onChange={handleChange}
            />
          </SettingCard>

          {/* Notifications Toggle */}
          <SettingCard
            title="Notifications"
            description="Receive in-app notifications for game events and updates."
            icon="🔔"
            delay="0.2s"
          >
            <ToggleSwitch
              name="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onChange={handleChange}
            />
          </SettingCard>

          {/* Theme Selector (Example, currently only dark is styled) */}
          <SettingCard
            title="App Theme"
            description="Choose your preferred visual theme for the application."
            icon="🎨"
            delay="0.3s"
          >
            <select
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="mt-2 p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-neo-inset"
            >
              <option value="dark">Dark Mode</option>
              {/* <option value="light">Light Mode (Coming Soon)</option> */}
            </select>
          </SettingCard>

          {/* Fast Mode Toggle */}
          <SettingCard
            title="Fast Mode"
            description="Enable faster transitions and skip some non-essential animations."
            icon="⚡"
            delay="0.4s"
          >
            <ToggleSwitch
              name="fastMode"
              checked={settings.fastMode}
              onChange={handleChange}
            />
          </SettingCard>

          {/* Preferred Language Selector - NEW */}
          <SettingCard
            title="Preferred Language"
            description="Select your preferred language for the application interface."
            icon="🌐"
            delay="0.5s"
          >
            <select
              name="preferredLanguage"
              value={settings.preferredLanguage}
              onChange={handleChange}
              className="mt-2 p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neo-inset"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              {/* Add more language options as needed */}
            </select>
          </SettingCard>

        </div>

        {/* --- Save Button --- */}
        <div className="flex justify-center mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={handleSaveSettings}
            disabled={saving || !hasChanges}
            className={`
              bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-3 px-8 rounded-xl
              shadow-neo-brutalism hover:shadow-neo-brutalism-hover transition-all duration-300
              transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500
              ${saving || !hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* --- Save Status Feedback --- */}
        {saveStatus === 'saved' && (
          <p className="text-center text-green-400 mt-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            Settings saved successfully!
          </p>
        )}
        {saveStatus === 'error' && (
          <p className="text-center text-red-400 mt-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            Failed to save settings.
          </p>
        )}

        {/* --- Footer --- */}
        <p className="text-center text-gray-500 text-sm mt-12">
          &copy; {new Date().getFullYear()} Trivia Home. All rights reserved.
        </p>

      </div>
    </div>
  );
};

// --- Helper Components ---

function SettingCard({ title, description, icon, delay, children }) {
  return (
    <div
      className={`bg-gray-700 bg-opacity-70 rounded-xl p-5 border-2 border-gray-600 shadow-neo-inset
                  flex flex-col items-center text-center animate-slide-up-fade-in`}
      style={{ animationDelay: delay }}
    >
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="mt-auto">{children}</div> {/* Ensure children are at the bottom */}
    </div>
  );
}

function ToggleSwitch({ name, checked, onChange }) {
  return (
    <label htmlFor={name} className="toggle-switch-container">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="toggle-switch-input"
      />
      <span className="toggle-switch-slider shadow-neo-brutalism"></span>
    </label>
  );
}

export default SettingsPage;
