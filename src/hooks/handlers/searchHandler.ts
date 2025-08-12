/**
 * Search mode keyboard input handler
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";
import type { IKeybindingMatcher } from "./types";

export interface SearchHandlerDependencies {
  searchState: {
    isSearching: boolean;
    searchTerm: string;
  };
  searchInput: string;
  searchCursorPosition: number;
  setSearchInput: (input: string) => void;
  setSearchCursorPosition: (position: number) => void;
  startSearch: (term: string) => void;
  cancelSearch: () => void;
  cycleScope: () => void;
  toggleRegexMode: () => void;
  resetScroll: () => void;
  keybindings: IKeybindingMatcher;
  updateDebugInfoCallback: (action: string, input: string) => void;
  handleTextInput: (
    textState: { text: string; cursorPosition: number },
    setters: {
      setText: (text: string) => void;
      setCursorPosition: (pos: number) => void;
    },
    key: KeyboardInput,
    input: string,
  ) => boolean;
}

export function useSearchHandler(deps: SearchHandlerDependencies) {
  const {
    searchState,
    searchInput,
    searchCursorPosition,
    setSearchInput,
    setSearchCursorPosition,
    startSearch,
    cancelSearch,
    cycleScope,
    toggleRegexMode,
    resetScroll,
    keybindings,
    updateDebugInfoCallback,
    handleTextInput,
  } = deps;

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
      } else if (key.ctrl && input === "r") {
        // Toggle regex mode
        updateDebugInfoCallback("Toggle regex mode", input);
        toggleRegexMode();
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
      toggleRegexMode,
      handleTextInput,
      setSearchInput,
      setSearchCursorPosition,
    ],
  );

  return { handleSearchInput };
}
