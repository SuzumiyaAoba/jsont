/**
 * Navigation and scroll state atoms
 */

import { atom } from "jotai";

// Navigation state
export const scrollOffsetAtom = atom<number>(0);
export const waitingForSecondGAtom = atom<boolean>(false);

// Scroll actions
export const resetScrollAtom = atom(null, (_, set) => {
  set(scrollOffsetAtom, 0);
});

export const scrollToTopAtom = atom(null, (_, set) => {
  set(scrollOffsetAtom, 0);
});

export const scrollToBottomAtom = atom(null, (_, set, maxScroll: number) => {
  set(scrollOffsetAtom, Math.max(0, maxScroll));
});

export const adjustScrollAtom = atom(
  null,
  (get, set, delta: number, maxScroll: number) => {
    const current = get(scrollOffsetAtom);
    const newOffset = Math.max(0, Math.min(maxScroll, current + delta));
    set(scrollOffsetAtom, newOffset);
  },
);

// G sequence handling
export const startGSequenceAtom = atom(null, (_, set) => {
  set(waitingForSecondGAtom, true);
  // Auto-reset after timeout
  setTimeout(() => {
    set(waitingForSecondGAtom, false);
  }, 1000);
});

export const resetGSequenceAtom = atom(null, (_, set) => {
  set(waitingForSecondGAtom, false);
});
