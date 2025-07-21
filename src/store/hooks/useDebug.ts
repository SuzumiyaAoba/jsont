/**
 * Debug state hooks using jotai atoms
 */

import {
  clearDebugInfoAtom,
  debugInfoAtom,
  updateDebugInfoAtom,
} from "@store/atoms/debug";
import { useAtom, useSetAtom } from "jotai";

// Individual state hooks
export const useDebugInfo = () => useAtom(debugInfoAtom);

// Action hooks
export const useUpdateDebugInfo = () => useSetAtom(updateDebugInfoAtom);
export const useClearDebugInfo = () => useSetAtom(clearDebugInfoAtom);
