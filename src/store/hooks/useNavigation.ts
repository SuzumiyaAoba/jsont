/**
 * Navigation and scroll state hooks using jotai atoms
 */

import {
  adjustScrollAtom,
  resetGSequenceAtom,
  resetScrollAtom,
  scrollOffsetAtom,
  scrollToBottomAtom,
  scrollToTopAtom,
  setScrollOffsetAtom,
  startGSequenceAtom,
  waitingForSecondGAtom,
} from "@store/atoms/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks with validation
export const useScrollOffset = () => {
  const scrollOffset = useAtomValue(scrollOffsetAtom);
  const setScrollOffset = useSetAtom(setScrollOffsetAtom);
  return [scrollOffset, setScrollOffset] as const;
};
export const useWaitingForSecondG = () => useAtom(waitingForSecondGAtom);

// Read-only hooks
export const useScrollOffsetValue = () => useAtomValue(scrollOffsetAtom);
export const useWaitingForSecondGValue = () =>
  useAtomValue(waitingForSecondGAtom);

// Action hooks
export const useResetScroll = () => useSetAtom(resetScrollAtom);
export const useScrollToTop = () => useSetAtom(scrollToTopAtom);
export const useScrollToBottom = () => useSetAtom(scrollToBottomAtom);
export const useAdjustScroll = () => useSetAtom(adjustScrollAtom);
export const useStartGSequence = () => useSetAtom(startGSequenceAtom);
export const useResetGSequence = () => useSetAtom(resetGSequenceAtom);

// Convenience hook for all navigation state (for compatibility)
export const useNavigationState = () => ({
  scrollOffset: useAtomValue(scrollOffsetAtom),
  waitingForSecondG: useAtomValue(waitingForSecondGAtom),
});
