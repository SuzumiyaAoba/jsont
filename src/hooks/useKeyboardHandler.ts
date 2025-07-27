/**
 * Keyboard input handling logic extracted from App.tsx
 * Handles navigation, mode switching, and complex keyboard interactions
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";
import {
  useGlobalHandler,
  useHelpHandler,
  useJqHandler,
  useNavigationHandler,
  useSearchHandler,
} from "./handlers";

export interface KeyboardHandlerDependencies {
  // Debug utilities
  updateDebugInfo: (action: string, input: string) => void;
  updateDebugInfoCallback: (action: string, input: string) => void;

  // App state
  helpVisible: boolean;
  setHelpVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;

  // Search state
  searchState: {
    isSearching: boolean;
    searchTerm: string;
  };
  searchInput: string;
  searchCursorPosition: number;
  setSearchInput: (input: string) => void;
  setSearchCursorPosition: (position: number) => void;
  setIsSearching: (searching: boolean) => void;
  startSearch: (term: string) => void;
  cancelSearch: () => void;
  cycleScope: () => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;

  // JQ state
  jqState: { isActive: boolean };
  jqInput: string;
  jqCursorPosition: number;
  jqFocusMode: "input" | "json";
  setJqInput: (input: string) => void;
  setJqCursorPosition: (position: number) => void;
  setJqFocusMode: (
    mode: "input" | "json" | ((prev: "input" | "json") => "input" | "json"),
  ) => void;
  setJqErrorScrollOffset: (offset: number | ((prev: number) => number)) => void;
  handleJqTransformation: (query: string) => void;
  exitJqMode: () => void;
  toggleJqMode: () => void;
  toggleJqView: () => void;

  // Navigation state
  maxScroll: number;
  maxScrollSearchMode: number;
  halfPageLines: number;
  waitingForSecondG: boolean;
  adjustScroll: (delta: number, max: number) => void;
  scrollToTop: () => void;
  scrollToBottom: (max: number) => void;
  resetScroll: () => void;
  resetGSequence: () => void;
  startGSequence: () => void;

  // View modes
  treeViewMode: boolean;
  collapsibleMode: boolean;
  schemaVisible: boolean;
  lineNumbersVisible: boolean;
  toggleTreeView: () => void;
  toggleCollapsible: () => void;
  toggleSchema: () => void;
  toggleLineNumbers: () => void;
  toggleDebugLogViewer: () => void;
  openSettings: () => void;

  // Handlers from child components
  treeViewKeyboardHandler?:
    | ((input: string, key: KeyboardInput) => boolean)
    | null;
  collapsibleViewerRef?: React.RefObject<{
    navigate: (action: any) => void;
  } | null>;

  // Utilities
  keybindings: any;
  handleTextInput: (
    textState: { text: string; cursorPosition: number },
    setters: {
      setText: (text: string) => void;
      setCursorPosition: (pos: number) => void;
    },
    key: KeyboardInput,
    input: string,
  ) => boolean;
  handleExportSchema: () => void;
  handleExportData: () => void;
  exit: () => void;
}

export function useKeyboardHandler(deps: KeyboardHandlerDependencies) {
  const {
    updateDebugInfo,
    updateDebugInfoCallback,
    helpVisible,
    setHelpVisible,
    searchState,
    searchInput,
    searchCursorPosition,
    setSearchInput,
    setSearchCursorPosition,
    setIsSearching,
    startSearch,
    cancelSearch,
    cycleScope,
    nextSearchResult,
    previousSearchResult,
    jqState,
    jqInput,
    jqCursorPosition,
    jqFocusMode,
    setJqInput,
    setJqCursorPosition,
    setJqFocusMode,
    setJqErrorScrollOffset,
    handleJqTransformation,
    exitJqMode,
    toggleJqMode,
    toggleJqView,
    maxScroll,
    maxScrollSearchMode,
    halfPageLines,
    waitingForSecondG,
    adjustScroll,
    scrollToTop,
    scrollToBottom,
    resetScroll,
    resetGSequence,
    startGSequence,
    treeViewMode,
    collapsibleMode,
    schemaVisible,
    lineNumbersVisible,
    toggleTreeView,
    toggleCollapsible,
    toggleSchema,
    toggleLineNumbers,
    toggleDebugLogViewer,
    openSettings,
    treeViewKeyboardHandler,
    collapsibleViewerRef,
    keybindings,
    handleTextInput,
    handleExportSchema,
    handleExportData,
    exit,
  } = deps;

  // Initialize handler hooks with their specific dependencies
  const { handleGlobalInput } = useGlobalHandler({
    updateDebugInfo,
    keybindings,
    searchState,
    handleExportSchema,
    handleExportData,
    exit,
  });

  const { handleHelpInput } = useHelpHandler({
    helpVisible,
    setHelpVisible,
    keybindings,
    updateDebugInfo,
  });

  const { handleSearchInput } = useSearchHandler({
    searchState,
    searchInput,
    searchCursorPosition,
    setSearchInput,
    setSearchCursorPosition,
    startSearch,
    cancelSearch,
    cycleScope,
    resetScroll,
    keybindings,
    updateDebugInfoCallback,
    handleTextInput,
  });

  const { handleJqInput } = useJqHandler({
    jqState,
    jqInput,
    jqCursorPosition,
    jqFocusMode,
    setJqInput,
    setJqCursorPosition,
    setJqFocusMode,
    setJqErrorScrollOffset,
    handleJqTransformation,
    exitJqMode,
    toggleJqView,
    updateDebugInfo,
    keybindings,
    searchState,
    maxScroll,
    maxScrollSearchMode,
    halfPageLines,
    adjustScroll,
    scrollToTop,
    scrollToBottom,
    handleTextInput,
  });

  const { handleNavigationInput } = useNavigationHandler({
    treeViewMode,
    treeViewKeyboardHandler,
    collapsibleMode,
    collapsibleViewerRef,
    updateDebugInfo,
    keybindings,
    halfPageLines,
    setIsSearching,
    setSearchInput,
    setSearchCursorPosition,
    resetScroll,
    searchState,
    maxScroll,
    maxScrollSearchMode,
    adjustScroll,
    toggleJqMode,
    jqState,
    setHelpVisible,
    helpVisible,
    openSettings,
    toggleTreeView,
    toggleSchema,
    schemaVisible,
    toggleCollapsible,
    toggleLineNumbers,
    lineNumbersVisible,
    toggleDebugLogViewer,
    waitingForSecondG,
    scrollToTop,
    resetGSequence,
    startGSequence,
    scrollToBottom,
    nextSearchResult,
    previousSearchResult,
  });

  // Main handler that routes to appropriate mode handler
  const handleKeyInput = useCallback(
    (input: string, key: KeyboardInput): void => {
      // Try global commands first (always available)
      if (handleGlobalInput(input, key)) return;

      // Try help mode (blocks other input when active)
      if (handleHelpInput(input, key)) return;

      // Try search mode (blocks other input when active)
      if (handleSearchInput(input, key)) return;

      // Try JQ mode (blocks other input when active)
      if (handleJqInput(input, key)) return;

      // Try navigation mode (default mode)
      handleNavigationInput(input, key);
    },
    [
      handleGlobalInput,
      handleHelpInput,
      handleSearchInput,
      handleJqInput,
      handleNavigationInput,
    ],
  );

  return {
    handleKeyInput,
    handleNavigationInput,
    handleSearchInput,
    handleJqInput,
    handleHelpInput,
    handleGlobalInput,
  };
}
