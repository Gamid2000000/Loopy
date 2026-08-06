import type { ResolvedTheme, ThemePreference } from "./themeTypes";

export const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

export function getSystemIsDark() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_THEME_MEDIA_QUERY).matches
    : true;
}
