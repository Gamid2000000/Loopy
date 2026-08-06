import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import { DARK_THEME_MEDIA_QUERY, getSystemIsDark, resolveTheme } from "./resolveTheme";
import { getStoredThemePreference, isThemePreference, saveThemePreference, THEME_STORAGE_KEY } from "./themeStorage";
import type { ResolvedTheme, ThemePreference } from "./themeTypes";

function applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredThemePreference(), getSystemIsDark()),
  );

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    const nextResolvedTheme = resolveTheme(nextPreference, getSystemIsDark());
    setPreferenceState(nextPreference);
    setResolvedTheme(nextResolvedTheme);
    saveThemePreference(nextPreference);
    applyTheme(nextPreference, nextResolvedTheme);
  }, []);

  useEffect(() => {
    applyTheme(preference, resolvedTheme);
  }, [preference, resolvedTheme]);

  useEffect(() => {
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(DARK_THEME_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setResolvedTheme(event.matches ? "dark" : "light");
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [preference]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextPreference = isThemePreference(event.newValue) ? event.newValue : "system";
      setPreferenceState(nextPreference);
      setResolvedTheme(resolveTheme(nextPreference, getSystemIsDark()));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
