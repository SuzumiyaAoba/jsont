/**
 * Layout calculation hook
 * Handles terminal size calculations and UI component heights
 */

import type { JqState } from "@features/jq/types/jq";
import type { SearchState } from "@features/search/types/search";
import {
  calculateStatusBarHeight,
  getStatusContent,
} from "@features/status/utils/statusUtils";
import { useMemo } from "react";

export interface LayoutDependencies {
  terminalSize: { width: number; height: number };
  debugVisible: boolean;
  searchState: SearchState;
  jqState: JqState;
  helpVisible: boolean;
  keyboardEnabled: boolean;
  collapsibleMode: boolean;
  error: string | null;
}

export function useLayoutCalculations(deps: LayoutDependencies) {
  const { terminalSize, debugVisible, searchState, jqState, helpVisible } =
    deps;

  // Debug bar height calculation
  const debugBarHeight = useMemo(() => {
    if (!debugVisible) return 0;

    const debugTextLength =
      `DEBUG: Last key: ${debugVisible} | Action: ${""} | Time: ${""}`.length;
    return Math.max(1, Math.ceil(debugTextLength / terminalSize.width));
  }, [debugVisible, terminalSize.width]);

  // Status bar height calculation
  const statusBarHeight = useMemo(() => {
    if (!helpVisible) {
      const statusContent = getStatusContent({
        keyboardEnabled: true,
        collapsibleMode: false,
        error: null,
      });
      return calculateStatusBarHeight(statusContent, terminalSize.width);
    }
    return 0;
  }, [helpVisible, terminalSize.width]);

  // Search bar height calculation
  const searchBarHeight = useMemo(() => {
    if (!searchState.isSearching) return 0;

    const searchPrompt = `Search: ${searchState.searchTerm}`;
    return Math.max(1, Math.ceil(searchPrompt.length / terminalSize.width));
  }, [searchState.isSearching, searchState.searchTerm, terminalSize.width]);

  // JQ bar height calculation
  const jqBarHeight = useMemo(() => {
    const isJqMode = jqState.query || jqState.error || jqState.transformedData;
    if (!isJqMode) return 0;

    const jqPromptText = `jq: ${jqState.query}`;
    return Math.max(1, Math.ceil(jqPromptText.length / terminalSize.width));
  }, [
    jqState.query,
    jqState.error,
    jqState.transformedData,
    terminalSize.width,
  ]);

  // Total reserved lines calculation
  const reservedLines = useMemo(() => {
    return debugBarHeight + statusBarHeight + searchBarHeight + jqBarHeight;
  }, [debugBarHeight, statusBarHeight, searchBarHeight, jqBarHeight]);

  // Visible lines calculation
  const visibleLines = useMemo(() => {
    return Math.max(1, terminalSize.height - reservedLines);
  }, [terminalSize.height, reservedLines]);

  // Half page lines for page up/down navigation
  const halfPageLines = useMemo(() => {
    return Math.max(1, Math.floor(visibleLines / 2));
  }, [visibleLines]);

  // Search mode visible lines (when in search mode)
  const searchModeVisibleLines = useMemo(() => {
    const searchModeReservedLines = debugBarHeight + searchBarHeight + 1; // +1 for search input
    return Math.max(1, terminalSize.height - searchModeReservedLines);
  }, [terminalSize.height, debugBarHeight, searchBarHeight]);

  return {
    debugBarHeight,
    statusBarHeight,
    searchBarHeight,
    jqBarHeight,
    reservedLines,
    visibleLines,
    halfPageLines,
    searchModeVisibleLines,
  };
}
