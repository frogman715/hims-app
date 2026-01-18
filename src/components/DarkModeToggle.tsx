'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Dark Mode Toggle Component
 * Uses Tailwind dark class + localStorage persistence
 */
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage or system preference
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('hims-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const applyDarkMode = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hims-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hims-dark-mode', 'false');
    }
  };

  // Apply dark mode on mount and when isDark changes
  useEffect(() => {
    applyDarkMode(isDark);
  }, [isDark]);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyDarkMode(newIsDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="
        p-2 rounded-lg bg-gray-200 dark:bg-gray-700 
        text-gray-800 dark:text-gray-200
        hover:bg-gray-300 dark:hover:bg-gray-600
        transition-colors duration-200
      "
      title={isDark ? 'Light mode' : 'Dark mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
