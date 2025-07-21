/**
 * JQ transformation state atoms
 */

import type { JqState } from "@features/jq/types/jq";
import { atom } from "jotai";

// Individual JQ atoms
export const jqInputAtom = atom<string>("");
export const jqCursorPositionAtom = atom<number>(0);
export const jqFocusModeAtom = atom<"input" | "json">("input");
export const jqIsActiveAtom = atom<boolean>(false);
export const jqQueryAtom = atom<string>("");
export const jqTransformedDataAtom = atom<unknown | null>(null);
export const jqErrorAtom = atom<string | null>(null);
export const jqIsProcessingAtom = atom<boolean>(false);
export const jqShowOriginalAtom = atom<boolean>(false);

// Error scroll offset for jq error display
export const jqErrorScrollOffsetAtom = atom<number>(0);

// Derived JQ state atom (for compatibility)
export const jqStateAtom = atom<JqState>((get) => ({
  isActive: get(jqIsActiveAtom),
  query: get(jqQueryAtom),
  transformedData: get(jqTransformedDataAtom),
  error: get(jqErrorAtom),
  isProcessing: get(jqIsProcessingAtom),
  showOriginal: get(jqShowOriginalAtom),
}));

// JQ mode actions
export const enterJqModeAtom = atom(null, (_, set) => {
  set(jqIsActiveAtom, true);
  set(jqFocusModeAtom, "input");
  set(jqErrorScrollOffsetAtom, 0);
});

export const exitJqModeAtom = atom(null, (_, set) => {
  set(jqIsActiveAtom, false);
  set(jqTransformedDataAtom, null);
  set(jqErrorAtom, null);
  set(jqShowOriginalAtom, false);
  set(jqInputAtom, "");
  set(jqCursorPositionAtom, 0);
  set(jqFocusModeAtom, "input");
  set(jqErrorScrollOffsetAtom, 0);
});

export const toggleJqModeAtom = atom(null, (get, set) => {
  const isActive = get(jqIsActiveAtom);
  if (isActive) {
    set(exitJqModeAtom);
  } else {
    set(enterJqModeAtom);
  }
});

export const startJqTransformationAtom = atom(null, (_, set, query: string) => {
  set(jqQueryAtom, query);
  set(jqIsProcessingAtom, true);
  set(jqErrorAtom, null);
});

export const completeJqTransformationAtom = atom(
  null,
  (_, set, result: { success: boolean; data?: unknown; error?: string }) => {
    set(jqIsProcessingAtom, false);

    if (result.success) {
      set(jqTransformedDataAtom, result.data);
      set(jqErrorAtom, null);
      set(jqShowOriginalAtom, false);
    } else {
      set(jqTransformedDataAtom, null);
      set(jqErrorAtom, result.error || "Transformation failed");
    }
  },
);

export const toggleJqViewAtom = atom(null, (get, set) => {
  const showOriginal = get(jqShowOriginalAtom);
  set(jqShowOriginalAtom, !showOriginal);
});

export const clearJqErrorAtom = atom(null, (_, set) => {
  set(jqErrorAtom, null);
});

// Computed atoms
export const hasJqResultAtom = atom((get) => {
  return get(jqTransformedDataAtom) !== null;
});

export const hasJqErrorAtom = atom((get) => {
  return get(jqErrorAtom) !== null;
});

export const currentJqDataAtom = atom((get) => {
  const showOriginal = get(jqShowOriginalAtom);
  const transformedData = get(jqTransformedDataAtom);

  // This will be combined with the main data atom in the app
  return { showOriginal, transformedData };
});
