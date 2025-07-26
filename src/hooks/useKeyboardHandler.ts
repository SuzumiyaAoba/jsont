/**
 * Keyboard input handling logic extracted from App.tsx
 * Handles navigation, mode switching, and complex keyboard interactions
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";

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

  // Global commands that are always available
  const handleGlobalInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Always allow exit commands
      if (key.ctrl && input === "c") {
        updateDebugInfo("Exit (Ctrl+C)", input);
        exit();
        return true;
      } else if (
        keybindings.isQuit(input, key) &&
        !searchState.isSearching &&
        !searchState.searchTerm
      ) {
        updateDebugInfo("Quit", input);
        exit();
        return true;
      } else if (keybindings.isExport(input, key)) {
        // Export JSON Schema to file - always available regardless of search mode
        updateDebugInfo("Export schema", input);
        handleExportSchema();
        return true;
      } else if (keybindings.isExportData(input, key)) {
        // Export current data to file - always available regardless of search mode
        updateDebugInfo("Export data", input);
        handleExportData();
        return true;
      }
      return false;
    },
    [
      exit,
      updateDebugInfo,
      keybindings,
      searchState.isSearching,
      searchState.searchTerm,
      handleExportSchema,
      handleExportData,
    ],
  );

  // Help mode input handling
  const handleHelpInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      if (!helpVisible) return false;

      // Handle help mode inputs - only allow help close or exit
      if (keybindings.isHelp(input, key)) {
        if (process.stdout.write) {
          // Restore main screen buffer and clear
          process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
          process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
        }
        setHelpVisible(false);
        updateDebugInfo("Close help (?)", input);
        return true;
      } else if (key.escape) {
        if (process.stdout.write) {
          // Restore main screen buffer and clear
          process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
          process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
        }
        setHelpVisible(false);
        updateDebugInfo("Close help (Esc)", input);
        return true;
      }
      // Ignore all other keys when help is visible
      return true;
    },
    [helpVisible, keybindings, setHelpVisible, updateDebugInfo],
  );

  // Search mode input handling
  const handleSearchInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      if (!searchState.isSearching) return false;

      // Search input mode
      if (key.return) {
        // Confirm search
        updateDebugInfoCallback("Confirm search", input);
        startSearch(searchInput);
        resetScroll(); // Reset scroll to top after search
        return true;
      } else if (keybindings.isSearchExit(input, key)) {
        // Cancel search - exit search mode entirely and clear all search state
        updateDebugInfoCallback("Cancel search", input);
        cancelSearch();
        resetScroll(); // Reset scroll to top after canceling search
        return true;
      } else if (key.tab) {
        // Toggle search scope
        updateDebugInfoCallback("Toggle search scope", input);
        cycleScope();
        return true;
      } else if (
        handleTextInput(
          { text: searchInput, cursorPosition: searchCursorPosition },
          {
            setText: setSearchInput,
            setCursorPosition: setSearchCursorPosition,
          },
          key,
          input,
        )
      ) {
        // Text input handled by utility
        return true;
      } else {
        // In search mode, ignore other keys
        updateDebugInfoCallback(`Ignored in search mode: "${input}"`, input);
        return true;
      }
    },
    [
      searchState.isSearching,
      searchInput,
      searchCursorPosition,
      updateDebugInfoCallback,
      startSearch,
      resetScroll,
      keybindings,
      cancelSearch,
      cycleScope,
      handleTextInput,
      setSearchInput,
      setSearchCursorPosition,
    ],
  );

  // JQ mode input handling
  const handleJqInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      if (!jqState.isActive) return false;

      // JQ mode - complete implementation with all documented shortcuts

      // Handle Enter key first (before text input) to execute jq transformation
      if (key.return) {
        handleJqTransformation(jqInput);
        return true;
      } else if (
        jqFocusMode === "input" &&
        handleTextInput(
          { text: jqInput, cursorPosition: jqCursorPosition },
          { setText: setJqInput, setCursorPosition: setJqCursorPosition },
          key,
          input,
        )
      ) {
        // Text input handled by utility
        return true;
      } else if (key.escape) {
        exitJqMode();
        return true;
      } else if (key.tab) {
        setJqFocusMode((prev) => (prev === "input" ? "json" : "input"));
        return true;
      } else if (input === "i" && !key.ctrl && !key.meta) {
        // Return to input mode (only when not in input mode or text input didn't handle it)
        setJqFocusMode("input");
        updateDebugInfo("JQ: Return to input mode", input);
        return true;
      } else if (input === "o" && !key.ctrl && !key.meta) {
        // Toggle original/result view
        toggleJqView();
        updateDebugInfo("JQ: Toggle original/result view", input);
        return true;
      } else if (key.shift && key.upArrow) {
        // Scroll error messages up
        setJqErrorScrollOffset((prev) => Math.max(0, prev - 1));
        updateDebugInfo("JQ: Scroll error up", "Shift+↑");
        return true;
      } else if (key.shift && key.downArrow) {
        // Scroll error messages down
        setJqErrorScrollOffset((prev) => prev + 1);
        updateDebugInfo("JQ: Scroll error down", "Shift+↓");
        return true;
      } else if (jqFocusMode === "json") {
        // JSON output navigation when focus is on result
        if (keybindings.isDown(input, key)) {
          // Scroll JSON result down
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(1, currentMaxScroll);
          updateDebugInfo("JQ JSON: Scroll down", input);
          return true;
        } else if (keybindings.isUp(input, key)) {
          // Scroll JSON result up
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(-1, currentMaxScroll);
          updateDebugInfo("JQ JSON: Scroll up", input);
          return true;
        } else if (keybindings.isTop(input, key)) {
          // Go to top in JSON result (simplified, no gg sequence in JQ mode)
          scrollToTop();
          updateDebugInfo("JQ JSON: Go to top", input);
          return true;
        } else if (keybindings.isBottom(input, key)) {
          // Go to bottom in JSON result
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          scrollToBottom(currentMaxScroll);
          updateDebugInfo("JQ JSON: Go to bottom", input);
          return true;
        } else if (keybindings.isPageDown(input, key)) {
          // Page down in JSON result
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(halfPageLines, currentMaxScroll);
          updateDebugInfo("JQ JSON: Page down", "Ctrl+f");
          return true;
        } else if (keybindings.isPageUp(input, key)) {
          // Page up in JSON result
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(-halfPageLines, currentMaxScroll);
          updateDebugInfo("JQ JSON: Page up", "Ctrl+b");
          return true;
        }
      }

      return false;
    },
    [
      jqState.isActive,
      jqInput,
      jqCursorPosition,
      jqFocusMode,
      handleJqTransformation,
      handleTextInput,
      setJqInput,
      setJqCursorPosition,
      exitJqMode,
      setJqFocusMode,
      updateDebugInfo,
      toggleJqView,
      setJqErrorScrollOffset,
      keybindings,
      searchState.isSearching,
      maxScrollSearchMode,
      maxScroll,
      adjustScroll,
      scrollToTop,
      scrollToBottom,
      halfPageLines,
    ],
  );

  // Navigation mode input handling
  const handleNavigationInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Check TreeView handler first
      if (treeViewMode && treeViewKeyboardHandler) {
        // Let TreeView handle the input first
        if (treeViewKeyboardHandler(input, key)) {
          updateDebugInfo("TreeView handled", input);
          return true; // TreeView handled the input
        }
      }

      // Check Collapsible mode handler
      if (collapsibleMode && collapsibleViewerRef?.current) {
        // Handle collapsible-specific navigation
        if (keybindings.isDown(input, key)) {
          // Move cursor down
          collapsibleViewerRef.current.navigate({ type: "move_down" });
          updateDebugInfo("Collapsible: Move cursor down", input);
          return true;
        } else if (keybindings.isUp(input, key)) {
          // Move cursor up
          collapsibleViewerRef.current.navigate({ type: "move_up" });
          updateDebugInfo("Collapsible: Move cursor up", input);
          return true;
        } else if (key.return || input === " ") {
          // Toggle node
          collapsibleViewerRef.current.navigate({ type: "toggle_node" });
          updateDebugInfo("Collapsible: Toggle node", input);
          return true;
        } else if (input === "o" && !key.ctrl && !key.meta) {
          // Expand node
          collapsibleViewerRef.current.navigate({ type: "expand_node" });
          updateDebugInfo("Collapsible: Expand node", input);
          return true;
        } else if (input === "c" && !key.ctrl && !key.meta) {
          // Collapse node
          collapsibleViewerRef.current.navigate({ type: "collapse_node" });
          updateDebugInfo("Collapsible: Collapse node", input);
          return true;
        } else if (input === "O" && !key.ctrl && !key.meta) {
          // Expand all
          collapsibleViewerRef.current.navigate({ type: "expand_all" });
          updateDebugInfo("Collapsible: Expand all", input);
          return true;
        } else if (keybindings.isPageDown(input, key)) {
          // Page down
          collapsibleViewerRef.current.navigate({
            type: "page_down",
            count: halfPageLines,
          });
          updateDebugInfo("Collapsible: Page down", "Ctrl+f");
          return true;
        } else if (keybindings.isPageUp(input, key)) {
          // Page up
          collapsibleViewerRef.current.navigate({
            type: "page_up",
            count: halfPageLines,
          });
          updateDebugInfo("Collapsible: Page up", "Ctrl+b");
          return true;
        } else if (keybindings.isTop(input, key)) {
          // Go to top (simplified, no gg sequence in collapsible mode)
          collapsibleViewerRef.current.navigate({ type: "goto_top" });
          updateDebugInfo("Collapsible: Go to top", input);
          return true;
        } else if (keybindings.isBottom(input, key)) {
          // Go to bottom
          collapsibleViewerRef.current.navigate({ type: "goto_bottom" });
          updateDebugInfo("Collapsible: Go to bottom", input);
          return true;
        }
      }

      // Standard navigation mode
      if (keybindings.isSearch(input, key)) {
        // Start search mode
        updateDebugInfo("Start search mode", input);
        setIsSearching(true);
        setSearchInput(searchState.searchTerm); // Preserve previous search term
        setSearchCursorPosition(searchState.searchTerm.length); // Position cursor at end
        resetScroll();
        return true;
      } else if (keybindings.isDown(input, key)) {
        // Line down
        updateDebugInfo("Scroll down", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        adjustScroll(1, currentMaxScroll);
        return true;
      } else if (keybindings.isUp(input, key)) {
        // Line up
        updateDebugInfo("Scroll up", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        adjustScroll(-1, currentMaxScroll);
        return true;
      } else if (keybindings.isJq(input, key)) {
        // Toggle jq mode
        toggleJqMode();
        // Reset scroll when entering/exiting jq mode to ensure first line visibility
        resetScroll();
        updateDebugInfo(
          `Toggle jq mode ${jqState.isActive ? "OFF" : "ON"}`,
          input,
        );
        return true;
      } else if (keybindings.isHelp(input, key)) {
        // Toggle help visibility
        setHelpVisible((prev) => !prev);
        updateDebugInfo(`Toggle help ${helpVisible ? "OFF" : "ON"}`, input);
        return true;
      } else if (input === "P" && !key.ctrl && !key.meta) {
        // Open settings (P for Preferences)
        openSettings();
        updateDebugInfo("Open settings", input);
        return true;
      } else if (keybindings.isTree(input, key)) {
        // Toggle tree view mode
        toggleTreeView();
        updateDebugInfo(
          `Toggle tree view ${treeViewMode ? "OFF" : "ON"}`,
          input,
        );
        return true;
      } else if (keybindings.isSchema(input, key)) {
        // Toggle schema view
        toggleSchema();
        updateDebugInfo(
          `Toggle schema view ${schemaVisible ? "OFF" : "ON"}`,
          input,
        );
        return true;
      } else if (keybindings.isCollapsible(input, key)) {
        // Toggle collapsible mode
        toggleCollapsible();
        updateDebugInfo(
          `Toggle collapsible mode ${collapsibleMode ? "OFF" : "ON"}`,
          input,
        );
        return true;
      } else if (keybindings.isLineNumbers(input, key)) {
        // Toggle line numbers
        toggleLineNumbers();
        updateDebugInfo(
          `Toggle line numbers ${lineNumbersVisible ? "OFF" : "ON"}`,
          input,
        );
        return true;
      } else if (keybindings.isDebug(input, key)) {
        // Toggle debug log viewer
        toggleDebugLogViewer();
        updateDebugInfo("Toggle debug log viewer", input);
        return true;
      } else if (keybindings.isTop(input, key)) {
        // Start G sequence for 'gg' command
        if (waitingForSecondG) {
          // Second 'g' pressed - go to top
          updateDebugInfo("Go to top (gg)", input);
          scrollToTop();
          resetGSequence();
        } else {
          // First 'g' pressed - start sequence
          updateDebugInfo("Start G sequence (g)", input);
          startGSequence();
        }
        return true;
      } else if (keybindings.isBottom(input, key)) {
        // Go to bottom
        updateDebugInfo("Go to bottom (G)", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        scrollToBottom(currentMaxScroll);
        resetGSequence();
        return true;
      } else if (keybindings.isPageDown(input, key)) {
        // Page down
        updateDebugInfo("Page down (Ctrl+f)", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        adjustScroll(halfPageLines, currentMaxScroll);
        return true;
      } else if (keybindings.isPageUp(input, key)) {
        // Page up
        updateDebugInfo("Page up (Ctrl+b)", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        adjustScroll(-halfPageLines, currentMaxScroll);
        return true;
      } else if (
        keybindings.isSearchNext(input, key) &&
        searchState.searchTerm
      ) {
        // Next search result
        updateDebugInfo("Next search result (n)", input);
        nextSearchResult();
        return true;
      } else if (
        keybindings.isSearchPrevious(input, key) &&
        searchState.searchTerm
      ) {
        // Previous search result
        updateDebugInfo("Previous search result (N)", input);
        previousSearchResult();
        return true;
      }

      return false;
    },
    [
      treeViewMode,
      treeViewKeyboardHandler,
      updateDebugInfo,
      collapsibleMode,
      collapsibleViewerRef,
      keybindings,
      halfPageLines,
      setIsSearching,
      setSearchInput,
      searchState.searchTerm,
      searchState.isSearching,
      setSearchCursorPosition,
      resetScroll,
      maxScrollSearchMode,
      maxScroll,
      adjustScroll,
      toggleJqMode,
      jqState.isActive,
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
    ],
  );

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
