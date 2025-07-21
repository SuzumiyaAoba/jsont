/**
 * Debug state atoms
 */

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
    set(debugInfoAtom, {
      lastKey,
      lastKeyAction,
      timestamp: new Date().toISOString(),
    });
  },
);

export const clearDebugInfoAtom = atom(null, (_, set) => {
  set(debugInfoAtom, null);
});
