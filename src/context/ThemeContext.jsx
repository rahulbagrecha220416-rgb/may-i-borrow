import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Load from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    // Greyscale level (0-100, where 0 is full color, 100 is full greyscale)
    const [greyscaleLevel, setGreyscaleLevel] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('greyscaleLevel');
            return stored !== null ? parseInt(stored) : 0;
        }
        return 0;
    });

    const applyTheme = useCallback(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        // Dark mode
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Greyscale filter disabled - conflicts with boho color palette
        // Setting to 'none' to ensure warm colors display correctly
        root.style.filter = 'none';
    }, [theme]);

    const cycleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
            localStorage.setItem('greyscaleLevel', greyscaleLevel);
        }

        // Apply theme to document
        applyTheme();
    }, [theme, greyscaleLevel, applyTheme]);


    return (
        <ThemeContext.Provider value={{
            theme,
            setTheme,
            greyscaleLevel,
            setGreyscaleLevel,
            cycleTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
