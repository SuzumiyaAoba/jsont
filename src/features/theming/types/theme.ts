/**
 * Theme Configuration Types
 * Defines color schemes for JSON syntax highlighting
 */

import { keys } from "es-toolkit/compat";

export interface JsonColorScheme {
  // JSON structure colors
  keys: string; // Object property names
  strings: string; // String values
  numbers: string; // Numeric values
  booleans: string; // true/false values
  null: string; // null values
  structural: string; // Braces, brackets, etc.

  // UI element colors
  background?: string; // Background color (optional)
  text: string; // Default text color

  // Additional colors for future use
  comments?: string; // For JSON5 comments (future feature)
  errors?: string; // Error highlighting
}

export interface ThemeConfig {
  name: string;
  description: string;
  colors: JsonColorScheme;
}

// Default color schemes
export const DEFAULT_THEME: ThemeConfig = {
  name: "default",
  description: "Default color scheme with high contrast",
  colors: {
    keys: "blue",
    strings: "green",
    numbers: "cyan",
    booleans: "yellow",
    null: "gray",
    structural: "magenta",
    text: "white",
    comments: "gray",
    errors: "red",
  },
};

export const DARK_THEME: ThemeConfig = {
  name: "dark",
  description: "Dark theme with muted colors",
  colors: {
    keys: "#6BADF7", // Light blue
    strings: "#A8CC8C", // Light green
    numbers: "#D19A66", // Orange
    booleans: "#E5C07B", // Yellow
    null: "#5C6370", // Gray
    structural: "#C678DD", // Purple
    text: "#ABB2BF", // Light gray
    comments: "#5C6370", // Gray
    errors: "#E06C75", // Red
  },
};

export const LIGHT_THEME: ThemeConfig = {
  name: "light",
  description: "Light theme with vibrant colors",
  colors: {
    keys: "#0000FF", // Blue
    strings: "#008000", // Green
    numbers: "#FF8C00", // Dark orange
    booleans: "#DAA520", // Golden rod
    null: "#808080", // Gray
    structural: "#800080", // Purple
    text: "#000000", // Black
    comments: "#808080", // Gray
    errors: "#FF0000", // Red
  },
};

export const MONOKAI_THEME: ThemeConfig = {
  name: "monokai",
  description: "Monokai inspired color scheme",
  colors: {
    keys: "#F92672", // Pink
    strings: "#E6DB74", // Yellow
    numbers: "#AE81FF", // Purple
    booleans: "#66D9EF", // Cyan
    null: "#75715E", // Gray
    structural: "#F8F8F2", // White
    text: "#F8F8F2", // White
    comments: "#75715E", // Gray
    errors: "#F92672", // Pink
  },
};

// Available themes registry
export const AVAILABLE_THEMES: Record<string, ThemeConfig> = {
  default: DEFAULT_THEME,
  dark: DARK_THEME,
  light: LIGHT_THEME,
  monokai: MONOKAI_THEME,
};

// Theme utility functions
export function getTheme(themeName: string): ThemeConfig {
  return AVAILABLE_THEMES[themeName] || DEFAULT_THEME;
}

export function getThemeNames(): string[] {
  return keys(AVAILABLE_THEMES);
}
