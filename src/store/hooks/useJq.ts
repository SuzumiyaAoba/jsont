/**
 * JQ transformation state hooks using jotai atoms
 */

import {
  clearJqErrorAtom,
  completeJqTransformationAtom,
  currentJqDataAtom,
  enterJqModeAtom,
  exitJqModeAtom,
  hasJqErrorAtom,
  hasJqResultAtom,
  jqCursorPositionAtom,
  jqErrorScrollOffsetAtom,
  jqFocusModeAtom,
  jqInputAtom,
  jqStateAtom,
  startJqTransformationAtom,
  toggleJqModeAtom,
  toggleJqViewAtom,
} from "@store/atoms/jq";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useJqInput = () => useAtom(jqInputAtom);
export const useJqCursorPosition = () => useAtom(jqCursorPositionAtom);
export const useJqFocusMode = () => useAtom(jqFocusModeAtom);
export const useJqErrorScrollOffset = () => useAtom(jqErrorScrollOffsetAtom);

// Read-only hooks
export const useJqState = () => useAtomValue(jqStateAtom);
export const useHasJqResult = () => useAtomValue(hasJqResultAtom);
export const useHasJqError = () => useAtomValue(hasJqErrorAtom);
export const useCurrentJqData = () => useAtomValue(currentJqDataAtom);

// Action hooks
export const useEnterJqMode = () => useSetAtom(enterJqModeAtom);
export const useExitJqMode = () => useSetAtom(exitJqModeAtom);
export const useToggleJqMode = () => useSetAtom(toggleJqModeAtom);
export const useStartJqTransformation = () =>
  useSetAtom(startJqTransformationAtom);
export const useCompleteJqTransformation = () =>
  useSetAtom(completeJqTransformationAtom);
export const useToggleJqView = () => useSetAtom(toggleJqViewAtom);
export const useClearJqError = () => useSetAtom(clearJqErrorAtom);
