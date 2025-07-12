/**
 * Navigation functionality type definitions
 */

export interface NavigationState {
  scrollOffset: number;
  waitingForSecondG: boolean;
  visibleLines: number;
  maxScroll: number;
}

export interface ScrollPosition {
  line: number;
  column: number;
}

export interface KeyboardInput {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
}

export interface NavigationHandlers {
  handleLineNavigation: (direction: "up" | "down") => void;
  handlePageNavigation: (direction: "up" | "down") => void;
  handleGotoNavigation: (target: "top" | "bottom") => void;
  handleGSequence: (isFirstG: boolean) => void;
}

export type NavigationType = "line" | "page" | "goto" | "search";
export type NavigationDirection = "up" | "down" | "left" | "right";
