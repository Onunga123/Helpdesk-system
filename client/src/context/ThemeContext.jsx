import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../api/axios';

const ThemeContext = createContext({
  themePreference: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  getCurrentTheme: () => 'system',
});

const THEME_KEY = 'themePreference';

const getSystemTheme = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyThemeClass = (resolvedTheme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
};

export const ThemeProvider = ({ children }) => {
  const authUser = useSelector((state) => state.auth.user);
  const [themePreference, setThemePreference] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    const userStored = JSON.parse(localStorage.getItem('user') || 'null');
    const userTheme = userStored?.themePreference || userStored?.appearancePreferences?.theme;
    return userTheme || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    themePreference === 'system' ? getSystemTheme() : themePreference
  );

  const setTheme = useCallback((nextTheme) => {
    if (!['light', 'dark', 'system'].includes(nextTheme)) return;
    setThemePreference(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  }, []);

  const getCurrentTheme = useCallback(() => themePreference, [themePreference]);

  useEffect(() => {
    const nextResolved = themePreference === 'system' ? getSystemTheme() : themePreference;
    setResolvedTheme(nextResolved);
    applyThemeClass(nextResolved);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (themePreference === 'system') {
        const nextResolved = getSystemTheme();
        setResolvedTheme(nextResolved);
        applyThemeClass(nextResolved);
      }
    };
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [themePreference]);

  useEffect(() => {
    const token = authUser?.token || JSON.parse(localStorage.getItem('user') || 'null')?.token;
    if (!token) return;
    let active = true;
    API.get('/users/me')
      .then(({ data }) => {
        if (!active) return;
        const saved = data?.data?.themePreference || data?.data?.appearancePreferences?.theme;
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemePreference(saved);
          localStorage.setItem(THEME_KEY, saved);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authUser?._id, authUser?.token]);

  const value = useMemo(
    () => ({ themePreference, resolvedTheme, setTheme, getCurrentTheme }),
    [themePreference, resolvedTheme, setTheme, getCurrentTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
