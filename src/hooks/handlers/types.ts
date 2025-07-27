/**
 * Type definitions for keyboard handlers
 */

import type { KeyboardInput } from "@core/types/app";

/**
 * Keybinding matcher interface - matches the KeybindingMatcher class
 */
export interface IKeybindingMatcher {
  // Navigation bindings
  isUp(input: string, key: KeyboardInput): boolean;
  isDown(input: string, key: KeyboardInput): boolean;
  isPageUp(input: string, key: KeyboardInput): boolean;
  isPageDown(input: string, key: KeyboardInput): boolean;
  isTop(input: string, key: KeyboardInput): boolean;
  isBottom(input: string, key: KeyboardInput): boolean;

  // Mode bindings
  isSearch(input: string, key: KeyboardInput): boolean;
  isSchema(input: string, key: KeyboardInput): boolean;
  isTree(input: string, key: KeyboardInput): boolean;
  isCollapsible(input: string, key: KeyboardInput): boolean;
  isJq(input: string, key: KeyboardInput): boolean;
  isLineNumbers(input: string, key: KeyboardInput): boolean;
  isDebug(input: string, key: KeyboardInput): boolean;
  isHelp(input: string, key: KeyboardInput): boolean;
  isExport(input: string, key: KeyboardInput): boolean;
  isExportData(input: string, key: KeyboardInput): boolean;
  isQuit(input: string, key: KeyboardInput): boolean;

  // Search bindings
  isSearchNext(input: string, key: KeyboardInput): boolean;
  isSearchPrevious(input: string, key: KeyboardInput): boolean;
  isSearchExit(input: string, key: KeyboardInput): boolean;
}

/**
 * Navigation action types for collapsible viewer
 */
export type NavigationAction =
  | { type: "move_down" }
  | { type: "move_up" }
  | { type: "toggle_node" }
  | { type: "expand_node" }
  | { type: "collapse_node" }
  | { type: "expand_all" }
  | { type: "page_down"; count: number }
  | { type: "page_up"; count: number }
  | { type: "goto_top" }
  | { type: "goto_bottom" };

/**
 * Collapsible viewer ref interface
 */
export interface ICollapsibleViewerRef {
  navigate: (action: NavigationAction) => void;
}
