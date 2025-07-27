/**
 * Navigation mode keyboard input handler
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";
import type { ICollapsibleViewerRef, IKeybindingMatcher } from "./types";

export interface NavigationHandlerDependencies {
  treeViewMode: boolean;
  treeViewKeyboardHandler?:
    | ((input: string, key: KeyboardInput) => boolean)
    | null
    | undefined;
  collapsibleMode: boolean;
  collapsibleViewerRef?:
    | React.RefObject<ICollapsibleViewerRef | null>
    | undefined;
  updateDebugInfo: (action: string, input: string) => void;
  keybindings: IKeybindingMatcher;
  halfPageLines: number;
  setIsSearching: (searching: boolean) => void;
  setSearchInput: (input: string) => void;
  setSearchCursorPosition: (position: number) => void;
  resetScroll: () => void;
  searchState: {
    isSearching: boolean;
    searchTerm: string;
  };
  maxScroll: number;
  maxScrollSearchMode: number;
  adjustScroll: (delta: number, max: number) => void;
  toggleJqMode: () => void;
  jqState: { isActive: boolean };
  setHelpVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  helpVisible: boolean;
  openSettings: () => void;
  toggleTreeView: () => void;
  toggleSchema: () => void;
  schemaVisible: boolean;
  toggleCollapsible: () => void;
  toggleLineNumbers: () => void;
  lineNumbersVisible: boolean;
  toggleDebugLogViewer: () => void;
  waitingForSecondG: boolean;
  scrollToTop: () => void;
  resetGSequence: () => void;
  startGSequence: () => void;
  scrollToBottom: (max: number) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
}

export function useNavigationHandler(deps: NavigationHandlerDependencies) {
  const {
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
  } = deps;

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

  return { handleNavigationInput };
}
