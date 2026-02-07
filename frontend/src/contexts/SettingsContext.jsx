import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Settings Context
const SettingsContext = createContext(null);

// Default settings
const DEFAULT_SETTINGS = {
    soundEnabled: true,
    musicVolume: 0.3,
    notificationsEnabled: true,
    theme: 'dark',
    fastMode: false,
};

// Background music URL (royalty-free game music)
const BACKGROUND_MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        // Load from localStorage on init
        const saved = localStorage.getItem('trivia_settings');
        if (saved) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            } catch {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayer, setShowPlayer] = useState(true);
    const audioRef = useRef(null);

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio(BACKGROUND_MUSIC_URL);
        audioRef.current.loop = true;
        audioRef.current.volume = settings.musicVolume;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Update volume when settings change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = settings.musicVolume;
        }
    }, [settings.musicVolume]);

    // Handle sound enabled toggle
    useEffect(() => {
        if (audioRef.current) {
            if (!settings.soundEnabled && isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [settings.soundEnabled]);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('trivia_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleMusic = () => {
        if (!audioRef.current || !settings.soundEnabled) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => {
                console.log('Audio play failed:', err);
            });
            setIsPlaying(true);
        }
    };

    const setVolume = (volume) => {
        updateSetting('musicVolume', volume);
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            isPlaying,
            toggleMusic,
            setVolume,
            showPlayer,
            setShowPlayer,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Music Player Component
export const MusicPlayer = () => {
    const { settings, isPlaying, toggleMusic, setVolume, showPlayer, setShowPlayer } = useSettings();

    if (!showPlayer) {
        return (
            <button
                onClick={() => setShowPlayer(true)}
                className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 
                   flex items-center justify-center text-white text-xl shadow-lg hover:scale-110 transition-transform
                   border border-cyan-400/30"
                title="Show music player"
            >
                🎵
            </button>
        );
    }

    return (
        <div className="music-player">
            <button
                onClick={toggleMusic}
                className="music-player-btn"
                disabled={!settings.soundEnabled}
                title={isPlaying ? 'Pause music' : 'Play music'}
            >
                {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div className="flex flex-col gap-1">
                <span className="text-xs text-cyan-400 font-medium">
                    {isPlaying ? 'Now Playing' : 'Music'}
                </span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.musicVolume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="music-player-volume"
                    disabled={!settings.soundEnabled}
                />
            </div>

            <button
                onClick={() => setShowPlayer(false)}
                className="text-gray-400 hover:text-white text-sm transition-colors ml-2"
                title="Hide player"
            >
                ✕
            </button>
        </div>
    );
};

export default SettingsContext;
