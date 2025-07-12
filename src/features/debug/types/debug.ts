/**
 * Debug functionality type definitions
 */

import type { SearchState } from "@features/search/types/search.js";

export interface DebugInfo {
  lastKey: string;
  lastKeyAction: string;
  timestamp: string;
}

export interface DebugBarProps {
  debugInfo: DebugInfo | null;
  keyboardEnabled: boolean;
  searchState: SearchState;
}

export interface DebugOptions {
  enabled: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  showTimestamps: boolean;
}
