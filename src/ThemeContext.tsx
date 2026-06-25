import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check localStorage, default to 'dark' per requirements
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const handleThemeChange = () => {
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
        setResolvedTheme('light');
      } else if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          root.classList.add('dark');
          setResolvedTheme('dark');
        } else {
          root.classList.remove('dark');
          setResolvedTheme('light');
        }
      }
    };

    handleThemeChange();

    // If on system settings, listen for OS system changes dynamically
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => handleThemeChange();
      
      // Modern browsers support addEventListener, older use addListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Persist to user profile document in Firestore if logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          theme: newTheme,
        });
      } catch (error) {
        console.warn('Failed to persist theme preference to Firestore:', error);
      }
    }
  };

  // Keep in sync with Firestore profile theme if user logs in
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // We can fetch user's saved theme dynamically if available
    // But we don't block layout since saved in localStorage first
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
