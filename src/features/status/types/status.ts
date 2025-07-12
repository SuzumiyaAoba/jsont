/**
 * Status and help functionality type definitions
 */

export interface StatusBarProps {
  error: string | null;
  keyboardEnabled?: boolean;
  collapsibleMode?: boolean;
}

export interface StatusContentOptions {
  keyboardEnabled: boolean;
  collapsibleMode: boolean;
  error?: string | null;
}

export interface HelpContent {
  title: string;
  shortcuts: KeyboardShortcut[];
  sections: HelpSection[];
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: "navigation" | "search" | "view" | "general";
}

export interface HelpSection {
  title: string;
  content: string[];
}
