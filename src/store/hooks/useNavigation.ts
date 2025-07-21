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
  startGSequenceAtom,
  waitingForSecondGAtom,
} from "@store/atoms/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useScrollOffset = () => useAtom(scrollOffsetAtom);
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
