/**
 * Help system types and interfaces
 */

import type { AppMode } from "@core/types/app";

export interface HelpState {
  /** Whether help is currently visible */
  visible: boolean;
  /** Current mode for context-specific help */
  currentMode: AppMode;
}

export interface HelpShortcut {
  /** Key combination (e.g., "Ctrl+C", "Space", "?") */
  key: string;
  /** Description of what the shortcut does */
  description: string;
  /** Optional category for grouping shortcuts */
  category?: string;
}

export interface HelpSection {
  /** Section title with optional emoji */
  title: string;
  /** List of shortcuts in this section */
  shortcuts: HelpShortcut[];
}

export interface HelpContent {
  /** Mode this help content applies to */
  mode: AppMode;
  /** Sections of help content */
  sections: HelpSection[];
}

export type HelpActionType =
  | "SHOW_HELP"
  | "HIDE_HELP"
  | "TOGGLE_HELP"
  | "SET_MODE";

export interface HelpAction {
  type: HelpActionType;
  payload?: {
    mode?: AppMode;
  };
}
