/**
 * Debug state atoms
 */

import { DebugLogger } from "@features/debug/utils/debugLogger";
import { atom } from "jotai";

// Debug info atom
export const debugInfoAtom = atom<{
  lastKey: string;
  lastKeyAction: string;
  timestamp: string;
} | null>(null);

// Debug actions
export const updateDebugInfoAtom = atom(
  null,
  (_, set, lastKeyAction: string, lastKey: string) => {
    const timestamp = new Date().toISOString();

    // Update jotai state for DebugBar
    set(debugInfoAtom, {
      lastKey,
      lastKeyAction,
      timestamp,
    });

    // Also log to DebugLogger for Debug Log Viewer
    DebugLogger.log("info", "keyboard", `${lastKeyAction} (key: ${lastKey})`, {
      lastKey,
      lastKeyAction,
      timestamp,
    });
  },
);

export const clearDebugInfoAtom = atom(null, (_, set) => {
  set(debugInfoAtom, null);
});
