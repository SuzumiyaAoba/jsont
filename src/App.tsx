import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DebugBar } from "./components/DebugBar";
import { JsonViewer } from "./components/JsonViewer";
import { SearchBar } from "./components/SearchBar";
import { StatusBar } from "./components/StatusBar";
import type { AppProps } from "./types/app";
import type { SearchState } from "./types/index";
import { searchInJson } from "./utils/searchUtils";

/**
 * Main application component for the JSON TUI Viewer
 *
 * @param initialData - JSON data to display
 * @param initialError - Initial error message to display
 * @param keyboardEnabled - Whether keyboard navigation is enabled
 */
export function App({
  initialData,
  initialError,
  keyboardEnabled = false,
}: AppProps) {
  const [error] = useState<string | null>(initialError ?? null);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [waitingForSecondG, setWaitingForSecondG] = useState<boolean>(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    searchTerm: "",
    searchResults: [],
    currentResultIndex: 0,
  });
  const [searchInput, setSearchInput] = useState<string>("");

  // Debug state for keyboard input
  const [debugInfo, setDebugInfo] = useState<{
    lastKey: string;
    lastKeyAction: string;
    timestamp: string;
  } | null>(null);

  const { exit } = useApp();

  // Calculate max scroll based on JSON data
  const JSON_INDENT = 2;
  const DEFAULT_TERMINAL_HEIGHT = 24;
  // Calculate debug bar height dynamically based on content length with memoization
  const debugBarHeight = useMemo(() => {
    const terminalWidth = process.stdout.columns || 80;
    let debugContent = `DEBUG: Keyboard: ${keyboardEnabled ? "ON" : "OFF"}`;

    if (searchState.isSearching || searchState.searchTerm) {
      debugContent += ` | Search: ${searchState.isSearching ? "ACTIVE" : "INACTIVE"}`;
      if (searchState.searchTerm) {
        debugContent += ` Term: "${searchState.searchTerm}"`;
      }
    }

    if (debugInfo) {
      debugContent += ` | Last: "${debugInfo.lastKey}" → ${debugInfo.lastKeyAction} @ ${debugInfo.timestamp}`;
    } else {
      debugContent += " | No key pressed yet";
    }

    // Calculate how many lines this content will take
    // Set minimum to 2 lines to account for potential wrapping
    const estimatedLines = Math.max(
      2,
      Math.ceil(debugContent.length / terminalWidth),
    );
    return estimatedLines;
  }, [
    keyboardEnabled,
    searchState.isSearching,
    searchState.searchTerm,
    debugInfo,
  ]);

  // Calculate UI reserved lines dynamically
  const statusBarLines = 3; // Status bar with borders
  const searchBarLines =
    searchState.isSearching || searchState.searchTerm ? 3 : 0; // Search bar with borders
  const debugBarLines = debugBarHeight; // Debug bar height based on content
  const UI_RESERVED_LINES = statusBarLines + searchBarLines + debugBarLines;
  const G_SEQUENCE_TIMEOUT = 1000;

  const jsonLines = initialData
    ? JSON.stringify(initialData, null, JSON_INDENT).split("\n").length
    : 0;
  const terminalHeight = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;
  const visibleLines = Math.max(1, terminalHeight - UI_RESERVED_LINES);
  const maxScroll = Math.max(0, jsonLines - visibleLines);

  // Calculate max scroll for search mode (when search bar is visible)
  const searchModeVisibleLines = Math.max(
    1,
    terminalHeight - (statusBarLines + 3 + debugBarLines),
  );
  const maxScrollSearchMode = Math.max(0, jsonLines - searchModeVisibleLines);

  // Calculate half-page scroll amount
  const halfPageLines = Math.max(1, Math.floor(visibleLines / 2));

  // Helper function to scroll to search result
  const scrollToSearchResult = useCallback(
    (result: (typeof searchState.searchResults)[0]) => {
      if (result) {
        const targetLine = Math.max(
          0,
          result.lineIndex - Math.floor(visibleLines / 2),
        );
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset(Math.min(currentMaxScroll, targetLine));
      }
    },
    [visibleLines, maxScroll, maxScrollSearchMode, searchState.isSearching],
  );

  // Helper function to navigate to next search result
  const navigateToNextResult = useCallback(() => {
    if (searchState.searchResults.length === 0) return;
    const nextIndex =
      (searchState.currentResultIndex + 1) % searchState.searchResults.length;
    setSearchState((prev) => ({ ...prev, currentResultIndex: nextIndex }));
    const nextResult = searchState.searchResults[nextIndex];
    if (nextResult) {
      scrollToSearchResult(nextResult);
    }
  }, [
    searchState.currentResultIndex,
    searchState.searchResults,
    scrollToSearchResult,
  ]);

  // Helper function to navigate to previous search result
  const navigateToPreviousResult = useCallback(() => {
    if (searchState.searchResults.length === 0) return;
    const prevIndex =
      searchState.currentResultIndex === 0
        ? searchState.searchResults.length - 1
        : searchState.currentResultIndex - 1;
    setSearchState((prev) => ({ ...prev, currentResultIndex: prevIndex }));
    const prevResult = searchState.searchResults[prevIndex];
    if (prevResult) {
      scrollToSearchResult(prevResult);
    }
  }, [
    searchState.currentResultIndex,
    searchState.searchResults,
    scrollToSearchResult,
  ]);

  // Update search results when search term changes
  useEffect(() => {
    if (searchState.searchTerm && initialData) {
      const results = searchInJson(initialData, searchState.searchTerm);
      setSearchState((prev) => ({
        ...prev,
        searchResults: results,
        currentResultIndex: 0,
      }));

      // Auto-scroll to first result
      if (results.length > 0 && results[0]) {
        const targetLine = Math.max(
          0,
          results[0].lineIndex - Math.floor(visibleLines / 2),
        );
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset(Math.min(currentMaxScroll, targetLine));
      }
    } else {
      setSearchState((prev) => ({
        ...prev,
        searchResults: [],
        currentResultIndex: 0,
      }));
    }
  }, [
    searchState.searchTerm,
    initialData,
    visibleLines,
    maxScroll,
    maxScrollSearchMode,
    searchState.isSearching,
  ]);

  // Clear timeout when component unmounts or when g sequence is reset
  useEffect(() => {
    return () => {
      if (gTimeoutRef.current) {
        clearTimeout(gTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to update debug info
  const updateDebugInfo = useCallback(
    (action: string, input: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setDebugInfo({
        lastKey: input,
        lastKeyAction: `${action} (searching: ${searchState.isSearching})`,
        timestamp: timestamp,
      });
    },
    [searchState.isSearching],
  );

  // Handle search input mode
  const handleSearchInput = useCallback(
    (
      input: string,
      key: {
        return?: boolean;
        escape?: boolean;
        backspace?: boolean;
        delete?: boolean;
        ctrl?: boolean;
        meta?: boolean;
      },
    ) => {
      if (key.return) {
        // Confirm search
        updateDebugInfo("Confirm search", input);
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          searchTerm: searchInput,
        }));
      } else if (key.escape) {
        // Cancel search - exit search mode entirely and clear all search state
        updateDebugInfo("Cancel search", input);
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          searchTerm: "",
          searchResults: [],
          currentResultIndex: 0,
        }));
        setSearchInput("");
      } else if (key.backspace || key.delete) {
        // Remove character
        updateDebugInfo("Delete character", input);
        setSearchInput((prev) => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta && input.length === 1) {
        // Add character
        updateDebugInfo(`Type: "${input}"`, input);
        setSearchInput((prev) => prev + input);
      } else {
        // In search mode, ignore other keys
        updateDebugInfo(`Ignored in search mode: "${input}"`, input);
      }
    },
    [searchInput, updateDebugInfo],
  );

  // Handle navigation input mode
  const handleNavigationInput = useCallback(
    (
      input: string,
      key: {
        ctrl?: boolean;
        meta?: boolean;
        escape?: boolean;
      },
    ) => {
      if (input === "s" && !key.ctrl && !key.meta) {
        // Start search mode
        updateDebugInfo("Start search mode", input);
        console.error(
          `[${new Date().toLocaleTimeString()}] [SEARCH] Starting search mode! Setting isSearching to true`,
        );
        setSearchState((prev) => ({ ...prev, isSearching: true }));
        setSearchInput("");
        setScrollOffset(0);
      } else if (
        input === "q" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchTerm
      ) {
        // Return to search input mode when 'q' is pressed after search
        updateDebugInfo("Return to search input", input);
        setSearchState((prev) => ({ ...prev, isSearching: true }));
        setSearchInput(searchState.searchTerm); // Pre-fill with current search term
      } else if (input === "j" && !key.ctrl) {
        // Line down
        updateDebugInfo("Scroll down", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset((prev) => Math.min(currentMaxScroll, prev + 1));
      } else if (input === "k" && !key.ctrl) {
        // Line up
        updateDebugInfo("Scroll up", input);
        setScrollOffset((prev) => Math.max(0, prev - 1));
      } else if (key.ctrl && input === "f") {
        // Half-page down (Ctrl-f)
        updateDebugInfo("Half-page down", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset((prev) =>
          Math.min(currentMaxScroll, prev + halfPageLines),
        );
      } else if (key.ctrl && input === "b") {
        // Half-page up (Ctrl-b)
        updateDebugInfo("Half-page up", input);
        setScrollOffset((prev) => Math.max(0, prev - halfPageLines));
      } else if (input === "g" && !key.ctrl && !key.meta) {
        if (waitingForSecondG) {
          // Second 'g' pressed - goto top (gg)
          updateDebugInfo("Go to top (gg)", input);
          setScrollOffset(0);
          setWaitingForSecondG(false);
          if (gTimeoutRef.current) {
            clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = null;
          }
        } else {
          // First 'g' pressed - wait for second 'g'
          updateDebugInfo("First 'g' (waiting for second)", input);
          setWaitingForSecondG(true);
          gTimeoutRef.current = setTimeout(() => {
            setWaitingForSecondG(false);
            gTimeoutRef.current = null;
          }, G_SEQUENCE_TIMEOUT);
        }
      } else if (input === "G" && !key.ctrl && !key.meta) {
        // Goto bottom (G)
        updateDebugInfo("Go to bottom (G)", input);
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset(currentMaxScroll);
      } else if (
        input === "n" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchResults.length > 0
      ) {
        // Next search result
        updateDebugInfo("Next result", input);
        navigateToNextResult();
      } else if (
        input === "N" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchResults.length > 0
      ) {
        // Previous search result
        updateDebugInfo("Previous result", input);
        navigateToPreviousResult();
      } else if (key.escape && searchState.searchTerm) {
        // Exit search mode when Escape is pressed and search results are visible
        updateDebugInfo("Exit search mode", input);
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          searchTerm: "",
          searchResults: [],
          currentResultIndex: 0,
        }));
        setSearchInput("");
      } else {
        // Any other key resets the 'g' sequence
        updateDebugInfo(`Unhandled key: "${input}"`, input);
        if (waitingForSecondG) {
          setWaitingForSecondG(false);
          if (gTimeoutRef.current) {
            clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = null;
          }
        }
      }
    },
    [
      searchState.isSearching,
      searchState.searchTerm,
      searchState.searchResults.length,
      maxScrollSearchMode,
      maxScroll,
      halfPageLines,
      waitingForSecondG,
      navigateToNextResult,
      navigateToPreviousResult,
      updateDebugInfo,
    ],
  );

  // Handle keyboard input function - memoized to prevent unnecessary re-renders
  const handleKeyInput = useCallback(
    (
      input: string,
      key: {
        ctrl: boolean;
        meta?: boolean;
        shift?: boolean;
        return?: boolean;
        escape?: boolean;
        backspace?: boolean;
        delete?: boolean;
      },
    ) => {
      // DEBUG: Log every single keyboard input with timestamp
      const timestamp = new Date().toLocaleTimeString();
      console.error(
        `[${timestamp}] [KEYBOARD] Input: "${input}" | Key object:`,
        JSON.stringify(key),
      );
      console.error(
        `[${timestamp}] [KEYBOARD] searchState.isSearching: ${searchState.isSearching}`,
      );
      console.error(
        `[${timestamp}] [KEYBOARD] keyboardEnabled: ${keyboardEnabled}`,
      );
      console.error(
        `[${timestamp}] [KEYBOARD] Conditions for 's': input=="${input}" && !ctrl=${!key.ctrl} && !meta=${!key.meta} && !isSearching=${!searchState.isSearching}`,
      );

      // Always allow exit commands
      if (key.ctrl && input === "c") {
        updateDebugInfo("Exit (Ctrl+C)", input);
        exit();
      } else if (
        input === "q" &&
        !key.ctrl &&
        !searchState.isSearching &&
        !searchState.searchTerm
      ) {
        updateDebugInfo("Quit", input);
        exit();
      } else if (searchState.isSearching) {
        // Handle search input
        handleSearchInput(input, key);
      } else {
        // Handle navigation input
        handleNavigationInput(input, key);
      }
    },
    [
      exit,
      searchState.isSearching,
      searchState.searchTerm,
      keyboardEnabled,
      handleSearchInput,
      handleNavigationInput,
      updateDebugInfo,
    ],
  );

  // Use Ink's useInput hook for keyboard handling
  useInput(handleKeyInput, {
    isActive: keyboardEnabled,
  });

  // DEBUG: Log useInput configuration on mount
  useEffect(() => {
    console.error(
      `[DEBUG] useInput configured with keyboardEnabled: ${keyboardEnabled}`,
    );
  }, [keyboardEnabled]);

  return (
    <Box flexDirection="column" width="100%">
      <Box flexShrink={0} width="100%">
        <StatusBar error={error} keyboardEnabled={keyboardEnabled} />
      </Box>
      {/* Search bar fixed at top when in search mode */}
      {(searchState.isSearching || searchState.searchTerm) && (
        <Box flexShrink={0} width="100%">
          <SearchBar searchState={searchState} searchInput={searchInput} />
        </Box>
      )}
      <Box flexGrow={1} width="100%" minHeight={0}>
        <JsonViewer
          data={initialData ?? null}
          scrollOffset={scrollOffset}
          searchTerm={searchState.searchTerm}
          searchResults={searchState.searchResults}
          currentSearchIndex={searchState.currentResultIndex}
          visibleLines={visibleLines}
        />
      </Box>
      <Box flexShrink={0} width="100%">
        <DebugBar
          debugInfo={debugInfo}
          keyboardEnabled={keyboardEnabled}
          searchState={searchState}
        />
      </Box>
    </Box>
  );
}
