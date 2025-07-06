/**
 * Theme Management Hook
 * Provides theme state and switching functionality
 */

import { useCallback, useState } from "react";
import {
  DEFAULT_THEME,
  getTheme,
  getThemeNames,
  type ThemeConfig,
} from "../types/theme.js";

export interface ThemeHook {
  // Current theme state
  currentTheme: ThemeConfig;
  themeName: string;

  // Theme switching
  setTheme: (themeName: string) => void;
  nextTheme: () => void;

  // Available themes
  availableThemes: string[];

  // Color utilities
  getColor: (colorKey: keyof ThemeConfig["colors"]) => string;
}

export function useTheme(initialTheme = "default"): ThemeHook {
  const [themeName, setThemeName] = useState<string>(initialTheme);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(
    getTheme(initialTheme),
  );

  const setTheme = useCallback((newThemeName: string) => {
    const theme = getTheme(newThemeName);
    setThemeName(newThemeName);
    setCurrentTheme(theme);
  }, []);

  const nextTheme = useCallback(() => {
    const themes = getThemeNames();
    const currentIndex = themes.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex] || "default");
  }, [themeName, setTheme]);

  const getColor = useCallback(
    (colorKey: keyof ThemeConfig["colors"]) => {
      return (
        currentTheme.colors[colorKey] ||
        DEFAULT_THEME.colors[colorKey] ||
        "white"
      );
    },
    [currentTheme],
  );

  const availableThemes = getThemeNames();

  return {
    currentTheme,
    themeName,
    setTheme,
    nextTheme,
    availableThemes,
    getColor,
  };
}
