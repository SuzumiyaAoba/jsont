import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import { JsonViewer } from "./components/JsonViewer.js";
import { SearchBar } from "./components/SearchBar.js";
import { StatusBar } from "./components/StatusBar.js";
import type { AppProps } from "./types/app.js";
import type { SearchState } from "./types/index.js";
import { searchInJson } from "./utils/searchUtils.js";

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

  const { exit } = useApp();

  // Calculate max scroll based on JSON data
  const JSON_INDENT = 2;
  const DEFAULT_TERMINAL_HEIGHT = 24;
  const UI_RESERVED_LINES = 3; // Status bar, search bar, and borders
  const G_SEQUENCE_TIMEOUT = 1000;

  const jsonLines = initialData
    ? JSON.stringify(initialData, null, JSON_INDENT).split("\n").length
    : 0;
  const terminalHeight = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;
  const visibleLines = Math.max(1, terminalHeight - UI_RESERVED_LINES);
  const maxScroll = Math.max(0, jsonLines - visibleLines);

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
        setScrollOffset(Math.min(maxScroll, targetLine));
      }
    },
    [visibleLines, maxScroll],
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
        scrollToSearchResult(results[0]);
      }
    } else {
      setSearchState((prev) => ({
        ...prev,
        searchResults: [],
        currentResultIndex: 0,
      }));
    }
  }, [searchState.searchTerm, initialData, scrollToSearchResult]);

  // Clear timeout when component unmounts or when g sequence is reset
  useEffect(() => {
    return () => {
      if (gTimeoutRef.current) {
        clearTimeout(gTimeoutRef.current);
      }
    };
  }, []);

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
      if (key.ctrl && input === "c") {
        exit();
      } else if (input === "q" && !key.ctrl) {
        exit();
      } else if (input === "j" && !key.ctrl) {
        // Line down
        setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
      } else if (input === "k" && !key.ctrl) {
        // Line up
        setScrollOffset((prev) => Math.max(0, prev - 1));
      } else if (key.ctrl && input === "f") {
        // Half-page down (Ctrl-f)
        setScrollOffset((prev) => Math.min(maxScroll, prev + halfPageLines));
      } else if (key.ctrl && input === "b") {
        // Half-page up (Ctrl-b)
        setScrollOffset((prev) => Math.max(0, prev - halfPageLines));
      } else if (input === "g" && !key.ctrl && !key.meta) {
        if (waitingForSecondG) {
          // Second 'g' pressed - goto top (gg)
          setScrollOffset(0);
          setWaitingForSecondG(false);
          if (gTimeoutRef.current) {
            clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = null;
          }
        } else {
          // First 'g' pressed - wait for second 'g'
          setWaitingForSecondG(true);
          // Reset after timeout if second 'g' is not pressed
          gTimeoutRef.current = setTimeout(() => {
            setWaitingForSecondG(false);
            gTimeoutRef.current = null;
          }, G_SEQUENCE_TIMEOUT);
        }
      } else if (input === "G" && !key.ctrl && !key.meta) {
        // Goto bottom (G)
        setScrollOffset(maxScroll);
      } else if (
        input === "s" &&
        !key.ctrl &&
        !key.meta &&
        !searchState.isSearching
      ) {
        // Start search mode
        setSearchState((prev) => ({ ...prev, isSearching: true }));
        setSearchInput("");
      } else if (searchState.isSearching) {
        // Handle search input
        if (key.return) {
          // Confirm search
          setSearchState((prev) => ({
            ...prev,
            isSearching: false,
            searchTerm: searchInput,
          }));
        } else if (key.escape) {
          // Cancel search
          setSearchState((prev) => ({ ...prev, isSearching: false }));
          setSearchInput("");
        } else if (key.backspace || key.delete) {
          // Remove character
          setSearchInput((prev) => prev.slice(0, -1));
        } else if (input && !key.ctrl && !key.meta && input.length === 1) {
          // Add character
          setSearchInput((prev) => prev + input);
        }
      } else if (
        input === "n" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchResults.length > 0
      ) {
        // Next search result
        navigateToNextResult();
      } else if (
        input === "N" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchResults.length > 0
      ) {
        // Previous search result
        navigateToPreviousResult();
      } else {
        // Any other key resets the 'g' sequence
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
      exit,
      maxScroll,
      halfPageLines,
      waitingForSecondG,
      searchState,
      searchInput,
      navigateToNextResult,
      navigateToPreviousResult,
    ],
  );

  // Use Ink's useInput hook for keyboard handling
  useInput(handleKeyInput, {
    isActive: keyboardEnabled,
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} keyboardEnabled={keyboardEnabled} />
      <SearchBar searchState={searchState} searchInput={searchInput} />
      <Box flexGrow={1} width="100%">
        <JsonViewer
          data={initialData ?? null}
          scrollOffset={scrollOffset}
          searchTerm={searchState.searchTerm}
          searchResults={searchState.searchResults}
          currentSearchIndex={searchState.currentResultIndex}
        />
      </Box>
    </Box>
  );
}
