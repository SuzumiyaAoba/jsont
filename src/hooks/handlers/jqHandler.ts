/**
 * JQ mode keyboard input handler
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";
import type { IKeybindingMatcher } from "./types";

export interface JqHandlerDependencies {
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
  toggleJqView: () => void;
  updateDebugInfo: (action: string, input: string) => void;
  keybindings: IKeybindingMatcher;
  searchState: {
    isSearching: boolean;
    searchTerm: string;
  };
  maxScroll: number;
  maxScrollSearchMode: number;
  halfPageLines: number;
  adjustScroll: (delta: number, max: number) => void;
  scrollToTop: () => void;
  scrollToBottom: (max: number) => void;
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

export function useJqHandler(deps: JqHandlerDependencies) {
  const {
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
  } = deps;

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

  return { handleJqInput };
}
