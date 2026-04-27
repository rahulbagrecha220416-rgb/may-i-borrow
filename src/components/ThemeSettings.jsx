import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSettings = () => {
    const { theme, setTheme, greyscaleLevel, setGreyscaleLevel } = useTheme();

    const resetToDefault = () => {
        setTheme('light');
        setGreyscaleLevel(0);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Theme Settings</h3>
                <button
                    onClick={resetToDefault}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    Reset to Default
                </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    <span className="text-sm">Dark Mode</span>
                </div>
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : ''
                        }`} />
                </button>
            </div>

            {/* Greyscale Slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Palette size={20} />
                        <span className="text-sm">Greyscale Level</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{greyscaleLevel}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={greyscaleLevel}
                    onChange={(e) => setGreyscaleLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>Full Color</span>
                    <span>Greyscale</span>
                </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                <p className="text-white text-xs font-medium">Color Preview</p>
            </div>
        </div>
    );
};

export default ThemeSettings;
