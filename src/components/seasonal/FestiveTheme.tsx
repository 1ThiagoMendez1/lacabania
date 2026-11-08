"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const preferenceKey = 'lacabania_festive_decor';
const FestiveContext = createContext({ enabled: true, toggle: () => {} });

export function FestiveThemeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const readPreference = () => {
      try {
        const next = localStorage.getItem(preferenceKey) !== 'off';
        setEnabled(next);
        document.documentElement.dataset.festive = next ? 'christmas' : 'off';
      } catch { /* Decoration remains available if storage is restricted. */ }
    };
    readPreference();
    const sync = (event: StorageEvent) => { if (event.key === preferenceKey) readPreference(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.dataset.festive = next ? 'christmas' : 'off';
    try { localStorage.setItem(preferenceKey, next ? 'on' : 'off'); } catch { /* Optional preference. */ }
  }, [enabled]);
  return <FestiveContext.Provider value={{ enabled, toggle }}>{children}</FestiveContext.Provider>;
}

export const useFestiveTheme = () => useContext(FestiveContext);
