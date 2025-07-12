import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppProps } from "./core/types/app";
import { CollapsibleJsonViewer } from "./features/collapsible/components/CollapsibleJsonViewer";
import type { NavigationAction } from "./features/collapsible/types/collapsible";
import { DebugBar } from "./features/debug/components/DebugBar";
import { JsonViewer } from "./features/json-rendering/components/JsonViewer";
import { SchemaViewer } from "./features/schema/components/SchemaViewer";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "./features/schema/utils/schemaUtils";
import { SearchBar } from "./features/search/components/SearchBar";
import type { SearchState } from "./features/search/types/search";
import {
  searchInJson,
  searchInJsonSchema,
} from "./features/search/utils/searchUtils";
import { StatusBar } from "./features/status/components/StatusBar";
import {
  calculateStatusBarHeight,
  getStatusContent,
} from "./features/status/utils/statusUtils";

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
  const [debugVisible, setDebugVisible] = useState<boolean>(false);
  const [lineNumbersVisible, setLineNumbersVisible] = useState<boolean>(false);
  const [schemaVisible, setSchemaVisible] = useState<boolean>(false);
  const [collapsibleMode, setCollapsibleMode] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);
  const [terminalSize, setTerminalSize] = useState({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  });
  const collapsibleViewerRef = useRef<{
    navigate: (action: NavigationAction) => void;
  } | null>(null);

  const { exit } = useApp();

  // Monitor terminal size changes
  useEffect(() => {
    const updateTerminalSize = () => {
      setTerminalSize({
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
      });
    };

    // Update size on resize if supported
    if (process.stdout.on && process.stdout.off) {
      // Increase max listeners to prevent warnings in tests
      if (process.stdout.setMaxListeners) {
        process.stdout.setMaxListeners(20);
      }

      process.stdout.on("resize", updateTerminalSize);
      return () => {
        process.stdout.off("resize", updateTerminalSize);
      };
    }

    // Return undefined when process.stdout.on is not available
    return undefined;
  }, []);

  // Calculate max scroll based on JSON data
  const JSON_INDENT = 2;
  // Calculate debug bar height dynamically based on content length with memoization
  const debugBarHeight = useMemo(() => {
    if (!debugVisible) return 0; // No debug bar when hidden

    const terminalWidth = terminalSize.width;
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
    debugVisible,
    keyboardEnabled,
    searchState.isSearching,
    searchState.searchTerm,
    debugInfo,
    terminalSize.width,
  ]);

  // Calculate status bar height dynamically based on content length
  const statusBarHeight = useMemo(() => {
    if (!helpVisible) return 0;

    const statusContent = getStatusContent({
      keyboardEnabled,
      collapsibleMode,
      error,
    });

    return calculateStatusBarHeight(statusContent, terminalSize.width);
  }, [
    helpVisible,
    keyboardEnabled,
    collapsibleMode,
    error,
    terminalSize.width,
  ]);

  // Calculate search bar height dynamically based on content
  const searchBarHeight = useMemo(() => {
    if (!searchState.isSearching && !searchState.searchTerm) return 0;

    const terminalWidth = terminalSize.width;
    let searchContent = "";

    if (searchState.isSearching) {
      searchContent = `Search: ${searchInput} (Enter: confirm, Esc: cancel)`;
    } else {
      const navigationInfo =
        searchState.searchResults.length > 0
          ? `${searchState.currentResultIndex + 1}/${searchState.searchResults.length}`
          : "0/0";
      searchContent = `Search: ${searchState.searchTerm} (${navigationInfo}) n: next, N: prev, s: new search`;
    }

    // SearchBar uses borderStyle="single" + padding={1}
    // Available width = terminalWidth - 4 (2 borders + 2 padding)
    const availableWidth = Math.max(terminalWidth - 4, 20);
    const contentLines = Math.ceil(searchContent.length / availableWidth);

    // Total height = contentLines + 2 (borders) + 2 (padding) = contentLines + 4
    // But Ink optimizes this, so use conservative calculation
    const calculatedHeight = contentLines + 3;
    return Math.max(3, calculatedHeight); // Minimum 3 lines
  }, [
    searchState.isSearching,
    searchState.searchTerm,
    searchInput,
    searchState.searchResults.length,
    searchState.currentResultIndex,
    terminalSize.width,
  ]);

  // Calculate UI reserved lines dynamically
  const statusBarLines = statusBarHeight; // Dynamic status bar height
  const searchBarLines = searchBarHeight; // Dynamic search bar height
  const debugBarLines = debugBarHeight; // Debug bar height based on content
  const contentPaddingLines = 2; // JsonViewer padding={1} adds 1 line top + 1 line bottom
  const UI_RESERVED_LINES =
    statusBarLines + searchBarLines + debugBarLines + contentPaddingLines;
  const G_SEQUENCE_TIMEOUT = 1000;

  const jsonLines = initialData
    ? JSON.stringify(initialData, null, JSON_INDENT).split("\n").length
    : 0;

  // Calculate schema lines when in schema view mode
  const schemaLines = useMemo(() => {
    if (!initialData || !schemaVisible) return 0;
    const schema = inferJsonSchema(initialData, "JSON Schema");
    const formattedSchema = formatJsonSchema(schema);
    return formattedSchema.split("\n").length;
  }, [initialData, schemaVisible]);

  const terminalHeight = terminalSize.height;
  const visibleLines = Math.max(1, terminalHeight - UI_RESERVED_LINES);

  // Use schema lines for scroll calculation when in schema view
  const currentDataLines = schemaVisible ? schemaLines : jsonLines;
  const maxScroll = Math.max(0, currentDataLines - visibleLines);

  // Calculate max scroll for search mode (when search bar is visible)
  const searchModeVisibleLines = Math.max(
    1,
    terminalHeight -
      (statusBarLines + searchBarLines + debugBarLines + contentPaddingLines),
  );

  const maxScrollSearchMode = Math.max(
    0,
    currentDataLines - searchModeVisibleLines,
  );

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

  // Helper function to handle collapsible navigation
  const handleCollapsibleNavigation = useCallback(
    (action: NavigationAction) => {
      if (collapsibleViewerRef.current?.navigate) {
        collapsibleViewerRef.current.navigate(action);
      }
    },
    [],
  );

  // Helper function to handle scroll changes from collapsible viewer
  const handleCollapsibleScrollChange = useCallback(
    (newScrollOffset: number) => {
      setScrollOffset(newScrollOffset);
    },
    [],
  );

  // Update search results when search term or view mode changes
  useEffect(() => {
    if (searchState.searchTerm && initialData) {
      // Use appropriate search function based on current view mode
      const results = schemaVisible
        ? searchInJsonSchema(initialData, searchState.searchTerm)
        : searchInJson(initialData, searchState.searchTerm);

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
    schemaVisible, // Add schemaVisible as dependency to trigger re-search when view changes
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
        return?: boolean;
      },
    ) => {
      if (input === "s" && !key.ctrl && !key.meta) {
        // Start search mode
        updateDebugInfo("Start search mode", input);
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
        if (collapsibleMode) {
          // Cursor down in collapsible mode
          updateDebugInfo("Cursor down", input);
          handleCollapsibleNavigation({ type: "move_down" });
        } else {
          // Line down in normal mode
          updateDebugInfo("Scroll down", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          setScrollOffset((prev) => Math.min(currentMaxScroll, prev + 1));
        }
      } else if (input === "k" && !key.ctrl) {
        if (collapsibleMode) {
          // Cursor up in collapsible mode
          updateDebugInfo("Cursor up", input);
          handleCollapsibleNavigation({ type: "move_up" });
        } else {
          // Line up in normal mode
          updateDebugInfo("Scroll up", input);
          setScrollOffset((prev) => Math.max(0, prev - 1));
        }
      } else if (key.return && !key.ctrl && !key.meta && collapsibleMode) {
        // Toggle node in collapsible mode
        updateDebugInfo("Toggle node", input);
        handleCollapsibleNavigation({ type: "toggle_node" });
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
      } else if (input === "D" && !key.ctrl && !key.meta) {
        // Toggle debug visibility
        setDebugVisible((prev) => !prev);
        updateDebugInfo(`Toggle debug ${debugVisible ? "OFF" : "ON"}`, input);
      } else if (input === "L" && !key.ctrl && !key.meta) {
        // Toggle line numbers visibility
        setLineNumbersVisible((prev) => !prev);
        updateDebugInfo(
          `Toggle line numbers ${lineNumbersVisible ? "OFF" : "ON"}`,
          input,
        );
      } else if (input === "S" && !key.ctrl && !key.meta) {
        // Toggle schema view
        setSchemaVisible((prev) => !prev);
        updateDebugInfo(
          `Toggle schema view ${schemaVisible ? "OFF" : "ON"}`,
          input,
        );
      } else if (input === "C" && !key.ctrl && !key.meta) {
        // Toggle collapsible mode
        setCollapsibleMode((prev) => !prev);
        updateDebugInfo(
          `Toggle collapsible mode ${collapsibleMode ? "OFF" : "ON"}`,
          input,
        );
      } else if (input === "?" && !key.ctrl && !key.meta) {
        // Toggle help visibility
        setHelpVisible((prev) => !prev);
        updateDebugInfo(`Toggle help ${helpVisible ? "OFF" : "ON"}`, input);
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
      debugVisible,
      lineNumbersVisible,
      schemaVisible,
      collapsibleMode,
      helpVisible,
      handleCollapsibleNavigation,
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
      handleSearchInput,
      handleNavigationInput,
      updateDebugInfo,
    ],
  );

  // Use Ink's useInput hook for keyboard handling
  useInput(handleKeyInput, {
    isActive: keyboardEnabled,
  });

  return (
    <Box flexDirection="column" width="100%">
      {/* Help bar - only shown when ? key is pressed */}
      {helpVisible && (
        <Box flexShrink={0} width="100%" height={statusBarHeight}>
          <StatusBar
            error={error}
            keyboardEnabled={keyboardEnabled}
            collapsibleMode={collapsibleMode}
          />
        </Box>
      )}
      {/* Search bar fixed at top when in search mode */}
      {(searchState.isSearching || searchState.searchTerm) && (
        <Box flexShrink={0} width="100%" height={searchBarHeight}>
          <SearchBar searchState={searchState} searchInput={searchInput} />
        </Box>
      )}
      <Box
        flexGrow={1}
        width="100%"
        minHeight={
          searchState.isSearching || searchState.searchTerm
            ? searchModeVisibleLines
            : 1
        }
      >
        {collapsibleMode ? (
          <CollapsibleJsonViewer
            ref={collapsibleViewerRef}
            data={initialData ?? null}
            scrollOffset={scrollOffset}
            searchTerm={searchState.searchTerm}
            searchResults={searchState.searchResults}
            currentSearchIndex={searchState.currentResultIndex}
            visibleLines={
              searchState.isSearching || searchState.searchTerm
                ? searchModeVisibleLines
                : visibleLines
            }
            showLineNumbers={lineNumbersVisible}
            onScrollChange={handleCollapsibleScrollChange}
          />
        ) : schemaVisible ? (
          <SchemaViewer
            data={initialData ?? null}
            scrollOffset={scrollOffset}
            searchTerm={searchState.searchTerm}
            searchResults={searchState.searchResults}
            currentSearchIndex={searchState.currentResultIndex}
            visibleLines={
              searchState.isSearching || searchState.searchTerm
                ? searchModeVisibleLines
                : visibleLines
            }
            showLineNumbers={lineNumbersVisible}
          />
        ) : (
          <JsonViewer
            data={initialData ?? null}
            scrollOffset={scrollOffset}
            searchTerm={searchState.searchTerm}
            searchResults={searchState.searchResults}
            currentSearchIndex={searchState.currentResultIndex}
            visibleLines={
              searchState.isSearching || searchState.searchTerm
                ? searchModeVisibleLines
                : visibleLines
            }
            showLineNumbers={lineNumbersVisible}
          />
        )}
      </Box>
      {/* Debug bar - conditionally rendered based on debugVisible */}
      {debugVisible && (
        <Box flexShrink={0} width="100%">
          <DebugBar
            debugInfo={debugInfo}
            keyboardEnabled={keyboardEnabled}
            searchState={searchState}
          />
        </Box>
      )}
    </Box>
  );
}
