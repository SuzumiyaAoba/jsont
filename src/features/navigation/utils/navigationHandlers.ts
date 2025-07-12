/**
 * Navigation functionality handlers extracted from App.tsx
 */

import type { NavigationHandlers, NavigationState } from "../types/navigation";

export function createNavigationHandlers(
  state: NavigationState,
  updateState: (updates: Partial<NavigationState>) => void,
  options: {
    halfPageLines: number;
    maxScrollSearchMode: number;
    isSearchMode: boolean;
  },
): NavigationHandlers {
  const { halfPageLines, maxScrollSearchMode, isSearchMode } = options;
  const currentMaxScroll = isSearchMode ? maxScrollSearchMode : state.maxScroll;

  return {
    handleLineNavigation: (direction: "up" | "down") => {
      const delta = direction === "down" ? 1 : -1;
      const newOffset =
        direction === "down"
          ? Math.min(currentMaxScroll, state.scrollOffset + delta)
          : Math.max(0, state.scrollOffset + delta);

      updateState({ scrollOffset: newOffset });
    },

    handlePageNavigation: (direction: "up" | "down") => {
      const delta = direction === "down" ? halfPageLines : -halfPageLines;
      const newOffset =
        direction === "down"
          ? Math.min(currentMaxScroll, state.scrollOffset + delta)
          : Math.max(0, state.scrollOffset + delta);

      updateState({ scrollOffset: newOffset });
    },

    handleGotoNavigation: (target: "top" | "bottom") => {
      const newOffset = target === "top" ? 0 : currentMaxScroll;
      updateState({ scrollOffset: newOffset });
    },

    handleGSequence: (isFirstG: boolean) => {
      if (!isFirstG && state.waitingForSecondG) {
        // Second 'g' pressed - goto top (gg)
        updateState({
          scrollOffset: 0,
          waitingForSecondG: false,
        });
      } else if (isFirstG) {
        // First 'g' pressed - wait for second 'g'
        updateState({ waitingForSecondG: true });
      }
    },
  };
}

export function calculateScrollLimits(
  jsonLines: number,
  visibleLines: number,
  searchModeVisibleLines: number,
): { maxScroll: number; maxScrollSearchMode: number } {
  const maxScroll = Math.max(0, jsonLines - visibleLines);
  const maxScrollSearchMode = Math.max(0, jsonLines - searchModeVisibleLines);

  return { maxScroll, maxScrollSearchMode };
}

export function calculateVisibleLines(
  terminalHeight: number,
  uiReservedLines: number,
  minLines: number = 1,
): number {
  return Math.max(minLines, terminalHeight - uiReservedLines);
}
