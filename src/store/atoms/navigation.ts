/**
 * Navigation and scroll state atoms
 */

import { atom } from "jotai";

// Navigation state with validation
export const scrollOffsetAtom = atom<number>(0);

// Enhanced scroll offset atom with validation
export const setScrollOffsetAtom = atom(null, (_, set, newOffset: number) => {
  // Validate and sanitize the scroll offset
  const sanitizedOffset = Math.max(0, Number.isNaN(newOffset) ? 0 : newOffset);
  set(scrollOffsetAtom, sanitizedOffset);
});
export const waitingForSecondGAtom = atom<boolean>(false);

// Scroll actions using validated setter
export const resetScrollAtom = atom(null, (_, set) => {
  set(setScrollOffsetAtom, 0);
});

export const scrollToTopAtom = atom(null, (_, set) => {
  set(setScrollOffsetAtom, 0);
});

export const scrollToBottomAtom = atom(null, (_, set, maxScroll: number) => {
  const sanitizedMaxScroll = Math.max(0, maxScroll);
  set(setScrollOffsetAtom, sanitizedMaxScroll);
});

export const adjustScrollAtom = atom(
  null,
  (get, set, delta: number, maxScroll: number) => {
    const current = get(scrollOffsetAtom);
    const newOffset = Math.max(
      0,
      Math.min(Math.max(0, maxScroll), current + delta),
    );
    set(setScrollOffsetAtom, newOffset);
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
