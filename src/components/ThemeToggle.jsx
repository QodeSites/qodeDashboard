// ThemeToggle.jsx
"use client";
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className=" rounded-lg hover:bg-gray-200  transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-1 w-1 text-gray-800 " />
      ) : (
        <Moon className="h-1 w-1 text-gray-800 " />
      )}
    </button>
  );
};

export default ThemeToggle;