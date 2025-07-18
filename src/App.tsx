import type {
  AppProps,
  KeyboardHandler,
  KeyboardHandlerRegistration,
  KeyboardInput,
} from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { CollapsibleJsonViewer } from "@features/collapsible/components/CollapsibleJsonViewer";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { handleTextInput } from "@features/common/components/TextInput";
import { DebugBar } from "@features/debug/components/DebugBar";
import { DebugLogViewer } from "@features/debug/components/DebugLogViewer";
import { JqQueryInput } from "@features/jq/components/JqQueryInput";
import type { JqState } from "@features/jq/types/jq";
import { transformWithJq } from "@features/jq/utils/jqTransform";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { ExportDialog } from "@features/schema/components/ExportDialog";
import { SchemaViewer } from "@features/schema/components/SchemaViewer";
import type { ExportDialogState } from "@features/schema/types/export";
import {
  exportToFile,
  generateDefaultFilename,
} from "@features/schema/utils/fileExport";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { SearchBar } from "@features/search/components/SearchBar";
import type { SearchScope, SearchState } from "@features/search/types/search";
import {
  getNextSearchScope,
  searchInJson,
  searchInJsonSchema,
} from "@features/search/utils/searchUtils";
import { StatusBar } from "@features/status/components/StatusBar";
import {
  calculateStatusBarHeight,
  getStatusContent,
} from "@features/status/utils/statusUtils";
import { TreeView } from "@features/tree/components/TreeView";
import { Box, Text, useApp, useInput } from "ink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  // Check if we're in test environment - moved to top to avoid dependency issues
  const isTestEnvironment =
    process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";

  // Avoid unused variable warning
  void isTestEnvironment;

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
    searchScope: "all",
  });
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchCursorPosition, setSearchCursorPosition] = useState<number>(0);

  // Debug state for keyboard input
  const [debugInfo, setDebugInfo] = useState<{
    lastKey: string;
    lastKeyAction: string;
    timestamp: string;
  } | null>(null);
  const [debugVisible, setDebugVisible] = useState<boolean>(false);
  const [lineNumbersVisible, setLineNumbersVisible] = useState<boolean>(false);
  const [schemaVisible, setSchemaVisible] = useState<boolean>(false);

  // Export state
  const [exportStatus, setExportStatus] = useState<{
    isExporting: boolean;
    message?: string;
    type?: "success" | "error";
  }>({ isExporting: false });
  const [exportDialog, setExportDialog] = useState<ExportDialogState>({
    isVisible: false,
    mode: "simple",
  });
  const [collapsibleMode, setCollapsibleMode] = useState<boolean>(false);
  const [treeViewMode, setTreeViewMode] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);
  const [debugLogViewerVisible, setDebugLogViewerVisible] = useState<boolean>(false);
  const [treeViewKeyboardHandler, setTreeViewKeyboardHandler] =
    useState<KeyboardHandler | null>(null);

  // Prevent invalid calls to TreeView handler during registration
  const safeSetTreeViewKeyboardHandler =
    useCallback<KeyboardHandlerRegistration>(
      (handler: KeyboardHandler | null) => {
        setTreeViewKeyboardHandler(() => handler); // Use function form to ensure handler is set correctly
      },
      [],
    );

  // jq transformation state
  const [jqState, setJqState] = useState<JqState>({
    isActive: false,
    query: "",
    transformedData: null,
    error: null,
    isProcessing: false,
    showOriginal: false,
  });
  const [jqInput, setJqInput] = useState<string>("");
  const [jqCursorPosition, setJqCursorPosition] = useState<number>(0);
  const [jqErrorScrollOffset, setJqErrorScrollOffset] = useState<number>(0);
  const [jqFocusMode, setJqFocusMode] = useState<"input" | "json">("input"); // 'input' for query input, 'json' for result viewing

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
  const jqBarLines = jqState.isActive ? (jqState.error ? 12 : 7) : 0; // jq query input height (with error box)
  const contentPaddingLines = 2; // JsonViewer padding={1} adds 1 line top + 1 line bottom
  const UI_RESERVED_LINES =
    statusBarLines +
    searchBarLines +
    debugBarLines +
    jqBarLines +
    contentPaddingLines;
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

  // Determine which data to display
  const displayData = useMemo((): unknown => {
    if (
      jqState.isActive &&
      jqState.transformedData !== null &&
      !jqState.showOriginal
    ) {
      return jqState.transformedData;
    }
    return initialData ?? null;
  }, [
    jqState.isActive,
    jqState.transformedData,
    jqState.showOriginal,
    initialData,
  ]);

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

  // Helper function to handle search scope changes
  const handleSearchScopeChange = useCallback((newScope: SearchScope) => {
    setSearchState((prev) => ({
      ...prev,
      searchScope: newScope,
    }));
  }, []);

  // Update search results when search term or view mode changes
  useEffect(() => {
    if (searchState.searchTerm && initialData) {
      // Use appropriate search function based on current view mode
      const results = schemaVisible
        ? searchInJsonSchema(
            initialData,
            searchState.searchTerm,
            searchState.searchScope,
          )
        : searchInJson(
            initialData,
            searchState.searchTerm,
            searchState.searchScope,
          );

      setSearchState((prev) => ({
        ...prev,
        searchResults: results,
        currentResultIndex: 0,
      }));

      // Reset scroll to top after search
      setScrollOffset(0);
    } else {
      setSearchState((prev) => ({
        ...prev,
        searchResults: [],
        currentResultIndex: 0,
      }));
    }
  }, [
    searchState.searchTerm,
    searchState.searchScope,
    initialData,
    schemaVisible,
  ]);

  // Clear timeout when component unmounts or when g sequence is reset
  useEffect(() => {
    return () => {
      if (gTimeoutRef.current) {
        clearTimeout(gTimeoutRef.current);
      }
    };
  }, []);

  // Reset error scroll offset when error changes
  useEffect(() => {
    setJqErrorScrollOffset(0);
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

  // Handle schema export
  const handleExportSchema = useCallback(() => {
    if (!initialData) {
      setExportStatus({
        isExporting: false,
        message: "No data to export. Please load JSON data first.",
        type: "error",
      });
      return;
    }
    // Show export dialog
    setExportDialog({ isVisible: true, mode: "simple" });
  }, [initialData]);

  // Handle export dialog confirmation
  const handleExportConfirm = useCallback(
    async (options: Parameters<typeof exportToFile>[1]) => {
      if (!initialData) return;

      setExportDialog({ isVisible: false, mode: "simple" });
      setExportStatus({ isExporting: true });

      try {
        const result = await exportToFile(initialData, options);
        if (result.success) {
          const exportType =
            options?.format === "json" ? "JSON data" : "JSON Schema";
          setExportStatus({
            isExporting: false,
            message: `${exportType} exported to ${result.filePath}`,
            type: "success",
          });
        } else {
          setExportStatus({
            isExporting: false,
            message: result.error || "Export failed",
            type: "error",
          });
        }
      } catch (error) {
        setExportStatus({
          isExporting: false,
          message: error instanceof Error ? error.message : "Export failed",
          type: "error",
        });
      }
      // Clear export status after 3 seconds
      setTimeout(() => {
        setExportStatus({ isExporting: false });
      }, 3000);
    },
    [initialData],
  );

  // Handle export dialog cancellation
  const handleExportCancel = useCallback(() => {
    setExportDialog({ isVisible: false, mode: "simple" });
  }, []);

  // Handle jq transformation
  const handleJqTransformation = useCallback(
    async (query: string) => {
      if (!initialData) return;

      setJqState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = await transformWithJq(initialData, query);

        if (result.success) {
          setJqState((prev) => ({
            ...prev,
            transformedData: result.data,
            error: null,
            isProcessing: false,
            query: query,
          }));
        } else {
          setJqState((prev) => ({
            ...prev,
            transformedData: null,
            error: result.error || "Transformation failed",
            isProcessing: false,
          }));
        }
      } catch (error) {
        setJqState((prev) => ({
          ...prev,
          transformedData: null,
          error: error instanceof Error ? error.message : "Unknown error",
          isProcessing: false,
        }));
      }
    },
    [initialData],
  );

  // Handle jq input mode
  const handleJqInput = useCallback(
    (
      input: string,
      key: {
        return?: boolean;
        escape?: boolean;
        backspace?: boolean;
        delete?: boolean;
        ctrl?: boolean;
        meta?: boolean;
        tab?: boolean;
        upArrow?: boolean;
        downArrow?: boolean;
        leftArrow?: boolean;
        rightArrow?: boolean;
        shift?: boolean;
      },
    ) => {
      if (key.return) {
        // Apply jq transformation
        handleJqTransformation(jqInput);
        // Keep focus in edit mode after transformation
      } else if (key.escape) {
        // Exit jq mode
        setJqState((prev) => ({
          ...prev,
          isActive: false,
          transformedData: null,
          error: null,
        }));
        setJqInput("");
        setJqCursorPosition(0);
        setJqFocusMode("input");
      } else if (key.tab) {
        // Toggle focus between input and JSON (Tab or Ctrl+Tab)
        setJqFocusMode((prev) => (prev === "input" ? "json" : "input"));
      } else if (jqFocusMode === "json") {
        // Handle JSON navigation when focus is on JSON result
        // Get the currently displayed data (respecting showOriginal flag)
        const currentDisplayData =
          jqState.showOriginal || !jqState.transformedData
            ? initialData
            : jqState.transformedData;

        if (input === "j" && !key.ctrl) {
          // Scroll down
          const currentMaxScroll = Math.max(
            0,
            JSON.stringify(currentDisplayData, null, 2).split("\n").length -
              visibleLines,
          );
          setScrollOffset((prev) => Math.min(currentMaxScroll, prev + 1));
        } else if (input === "k" && !key.ctrl) {
          // Scroll up
          setScrollOffset((prev) => Math.max(0, prev - 1));
        } else if (key.ctrl && input === "f") {
          // Half-page down
          const currentMaxScroll = Math.max(
            0,
            JSON.stringify(currentDisplayData, null, 2).split("\n").length -
              visibleLines,
          );
          setScrollOffset((prev) =>
            Math.min(currentMaxScroll, prev + halfPageLines),
          );
        } else if (key.ctrl && input === "b") {
          // Half-page up
          setScrollOffset((prev) => Math.max(0, prev - halfPageLines));
        } else if (input === "g" && !key.ctrl && !key.meta) {
          if (waitingForSecondG) {
            // Go to top (gg)
            setScrollOffset(0);
            setWaitingForSecondG(false);
          } else {
            // First 'g' pressed
            setWaitingForSecondG(true);
            setTimeout(() => setWaitingForSecondG(false), 1000);
          }
        } else if (input === "G" && !key.ctrl && !key.meta) {
          // Go to bottom
          const currentMaxScroll = Math.max(
            0,
            JSON.stringify(currentDisplayData, null, 2).split("\n").length -
              visibleLines,
          );
          setScrollOffset(currentMaxScroll);
        } else if (input === "i" && !key.ctrl && !key.meta) {
          // Return to input mode
          setJqFocusMode("input");
        } else if (
          input === "o" &&
          !key.ctrl &&
          !key.meta &&
          jqState.transformedData !== null
        ) {
          // Toggle between original and transformed JSON view
          setJqState((prev) => ({ ...prev, showOriginal: !prev.showOriginal }));

          // Reset scroll position when switching views to ensure proper navigation
          setScrollOffset(0);

          updateDebugInfo(
            `Show ${jqState.showOriginal ? "transformed" : "original"} JSON`,
            input,
          );
        }
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
      } else if (jqState.error && key.upArrow && key.shift) {
        // Scroll error message up
        setJqErrorScrollOffset((prev) => Math.max(0, prev - 1));
      } else if (jqState.error && key.downArrow && key.shift) {
        // Scroll error message down
        const errorLines = jqState.error.split("\n");
        const maxErrorLines = 2;
        setJqErrorScrollOffset((prev) =>
          Math.min(Math.max(0, errorLines.length - maxErrorLines), prev + 1),
        );
      } else if (input === "J" && !key.ctrl && !key.meta) {
        // Toggle jq mode (exit when in jq mode)
        setJqState((prev) => ({
          ...prev,
          isActive: false,
          transformedData: null,
          error: null,
          showOriginal: false,
        }));
        setJqInput("");
        setJqCursorPosition(0);
        setJqErrorScrollOffset(0);
        setJqFocusMode("input");
      } else {
        // In jq mode, ignore other keys
      }
    },
    [
      jqInput,
      jqCursorPosition,
      jqFocusMode,
      visibleLines,
      halfPageLines,
      initialData,
      jqState.transformedData,
      jqState.showOriginal,
      waitingForSecondG,
      handleJqTransformation,
      jqState.error,
      updateDebugInfo,
    ],
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
        tab?: boolean;
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
        setScrollOffset(0); // Reset scroll to top after search
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
        setSearchCursorPosition(0);
        setScrollOffset(0); // Reset scroll to top after canceling search
      } else if (key.tab) {
        // Toggle search scope
        updateDebugInfo("Toggle search scope", input);
        const nextScope = getNextSearchScope(searchState.searchScope);
        handleSearchScopeChange(nextScope);
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
      } else {
        // In search mode, ignore other keys
        updateDebugInfo(`Ignored in search mode: "${input}"`, input);
      }
    },
    [
      searchInput,
      searchCursorPosition,
      updateDebugInfo,
      searchState.searchScope,
      handleSearchScopeChange,
    ],
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
        tab?: boolean;
        upArrow?: boolean;
        downArrow?: boolean;
        leftArrow?: boolean;
        rightArrow?: boolean;
        pageUp?: boolean;
        pageDown?: boolean;
        shift?: boolean;
        backspace?: boolean;
        delete?: boolean;
      },
    ) => {
      // Handle T key for mode switching even in TreeView mode
      if (input === "T" && !key?.ctrl && !key?.meta) {
        // Toggle tree view mode
        setTreeViewMode((prev) => !prev);
        updateDebugInfo(
          `Toggle tree view mode ${treeViewMode ? "OFF" : "ON"}`,
          input,
        );
        return;
      }

      // Handle D key for debug log viewer
      if (input === "D" && !key?.ctrl && !key?.meta) {
        // Toggle debug log viewer
        setDebugLogViewerVisible((prev) => !prev);
        updateDebugInfo(
          `Toggle debug log viewer ${debugLogViewerVisible ? "OFF" : "ON"}`,
          input,
        );
        return;
      }

      // Safety check for undefined key
      if (!key) {
        return;
      }

      // Handle TreeView keyboard input first if in tree view mode
      if (treeViewMode && treeViewKeyboardHandler) {
        try {
          // Validate input before processing
          if (
            typeof input === "string" &&
            input !== null &&
            input !== undefined
          ) {
            // Convert key object to match KeyboardInput interface
            const keyboardInput: KeyboardInput = {
              upArrow: key?.upArrow || false,
              downArrow: key?.downArrow || false,
              leftArrow: key?.leftArrow || false,
              rightArrow: key?.rightArrow || false,
              pageUp: key?.pageUp || false,
              pageDown: key?.pageDown || false,
              return: key?.return || false,
              escape: key?.escape || false,
              ctrl: key?.ctrl || false,
              shift: key?.shift || false,
              tab: key?.tab || false,
              backspace: key?.backspace || false,
              delete: key?.delete || false,
              meta: key?.meta || false,
            };

            if (treeViewKeyboardHandler(input, keyboardInput)) {
              return; // Input was handled by TreeView
            }
          }
        } catch (error) {
          // Log error in development but continue processing
          if (process.env["NODE_ENV"] === "development") {
            console.error("TreeView handler error in App:", error);
          }
        }
      }

      if (input === "s" && !key.ctrl && !key.meta) {
        // Start search mode
        updateDebugInfo("Start search mode", input);
        setSearchState((prev) => ({ ...prev, isSearching: true }));
        setSearchInput("");
        setSearchCursorPosition(0);
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
        setSearchCursorPosition(searchState.searchTerm.length);
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
      } else if (input === " " && !key.ctrl && !key.meta && collapsibleMode) {
        // Space: Alternative toggle for collapsible nodes
        updateDebugInfo("Toggle node (Space)", input);
        handleCollapsibleNavigation({ type: "toggle_node" });
      } else if (input === "o" && !key.ctrl && !key.meta && collapsibleMode) {
        // 'o': Open/expand current node
        updateDebugInfo("Expand node", input);
        handleCollapsibleNavigation({ type: "expand_node" });
      } else if (input === "c" && !key.ctrl && !key.meta && collapsibleMode) {
        // 'c': Close/collapse current node
        updateDebugInfo("Collapse node", input);
        handleCollapsibleNavigation({ type: "collapse_node" });
      } else if (input === "O" && !key.ctrl && !key.meta && collapsibleMode) {
        // 'O': Expand all nodes (capital O)
        updateDebugInfo("Expand all", input);
        handleCollapsibleNavigation({ type: "expand_all" });
      } else if (key.ctrl && input === "f") {
        // Half-page down (Ctrl-f)
        if (collapsibleMode) {
          updateDebugInfo("Page down (Ctrl-f)", input);
          handleCollapsibleNavigation({
            type: "page_down",
            count: halfPageLines,
          });
        } else {
          updateDebugInfo("Half-page down", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          setScrollOffset((prev) =>
            Math.min(currentMaxScroll, prev + halfPageLines),
          );
        }
      } else if (key.ctrl && input === "b") {
        // Half-page up (Ctrl-b)
        if (collapsibleMode) {
          updateDebugInfo("Page up (Ctrl-b)", input);
          handleCollapsibleNavigation({
            type: "page_up",
            count: halfPageLines,
          });
        } else {
          updateDebugInfo("Half-page up", input);
          setScrollOffset((prev) => Math.max(0, prev - halfPageLines));
        }
      } else if (input === "g" && !key.ctrl && !key.meta) {
        if (waitingForSecondG) {
          // Second 'g' pressed - goto top (gg)
          updateDebugInfo("Go to top (gg)", input);
          if (collapsibleMode) {
            handleCollapsibleNavigation({ type: "goto_top" });
          } else {
            setScrollOffset(0);
          }
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
        if (collapsibleMode) {
          handleCollapsibleNavigation({ type: "goto_bottom" });
        } else {
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          setScrollOffset(currentMaxScroll);
        }
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
      } else if (
        key.tab &&
        (searchState.searchTerm || searchState.isSearching)
      ) {
        // Toggle search scope when Tab is pressed and search is active
        updateDebugInfo("Toggle search scope", input);
        const nextScope = getNextSearchScope(searchState.searchScope);
        handleSearchScopeChange(nextScope);
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
      } else if (input === "J" && !key.ctrl && !key.meta) {
        // Toggle jq mode
        setJqState((prev) => ({
          ...prev,
          isActive: !prev.isActive,
          showOriginal: false, // Reset to show transformed data when entering jq mode
        }));
        updateDebugInfo(
          `Toggle jq mode ${jqState.isActive ? "OFF" : "ON"}`,
          input,
        );
        if (!jqState.isActive) {
          setJqInput("");
        }
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
      searchState.searchScope,
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
      handleSearchScopeChange,
      jqState.isActive,
      treeViewMode,
      treeViewKeyboardHandler,
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
        tab?: boolean;
        upArrow?: boolean;
        downArrow?: boolean;
        leftArrow?: boolean;
        rightArrow?: boolean;
        pageUp?: boolean;
        pageDown?: boolean;
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
      } else if (input === "E" && !key.ctrl && !key.meta) {
        // Export JSON Schema to file - always available regardless of search mode
        updateDebugInfo("Export schema", input);
        handleExportSchema();
      } else if (searchState.isSearching) {
        handleSearchInput(input, key);
      } else if (jqState.isActive) {
        handleJqInput(input, key);
      } else {
        // Handle navigation input
        handleNavigationInput(input, key);
      }
    },
    [
      exit,
      searchState.isSearching,
      searchState.searchTerm,
      jqState.isActive,
      handleSearchInput,
      handleJqInput,
      handleNavigationInput,
      updateDebugInfo,
      handleExportSchema,
    ],
  );

  // Use Ink's useInput hook for keyboard handling

  // Handle keyboard input via useInput hook from Ink

  // No manual stdin handling - let useInput handle everything

  useInput(
    (input, key) => {
      // Handle keyboard input
      handleKeyInput(input, key);
    },
    {
      isActive: keyboardEnabled && !exportDialog.isVisible,
    },
  );

  return (
    <Box flexDirection="column" width="100%">
      {/* Help bar - only shown when ? key is pressed */}
      {helpVisible && !exportDialog.isVisible && (
        <Box flexShrink={0} width="100%" height={statusBarHeight}>
          <StatusBar
            error={error}
            keyboardEnabled={keyboardEnabled}
            collapsibleMode={collapsibleMode}
          />
        </Box>
      )}
      {/* Search bar fixed at top when in search mode */}
      {(searchState.isSearching || searchState.searchTerm) &&
        !exportDialog.isVisible && (
          <Box flexShrink={0} width="100%" height={searchBarHeight}>
            <SearchBar
              searchState={searchState}
              searchInput={searchInput}
              searchCursorPosition={searchCursorPosition}
              onScopeChange={handleSearchScopeChange}
            />
          </Box>
        )}
      {/* jq transformation bar */}
      {jqState.isActive && !exportDialog.isVisible && (
        <Box flexShrink={0} width="100%" height={jqState.error ? 12 : 7}>
          <JqQueryInput
            jqState={jqState}
            queryInput={jqInput}
            cursorPosition={jqCursorPosition}
            errorScrollOffset={jqErrorScrollOffset}
            focusMode={jqFocusMode}
          />
        </Box>
      )}
      {/* Keyboard unavailable warning */}
      {!keyboardEnabled && !exportDialog.isVisible && (
        <Box flexShrink={0} width="100%" height={1}>
          <Box
            borderStyle="single"
            borderColor="yellow"
            padding={0}
            paddingLeft={1}
            paddingRight={1}
            width="100%"
          >
            <Text color="yellow" dimColor>
              ⚠️ Keyboard input unavailable (terminal access failed). Use file
              input: jsont file.json
            </Text>
          </Box>
        </Box>
      )}
      {/* Export status bar */}
      {(exportStatus.isExporting || exportStatus.message) &&
        !exportDialog.isVisible && (
          <Box flexShrink={0} width="100%" height={1}>
            <Box
              borderStyle="single"
              borderColor={
                exportStatus.isExporting
                  ? "yellow"
                  : exportStatus.type === "success"
                    ? "green"
                    : "red"
              }
              padding={0}
              paddingLeft={1}
              paddingRight={1}
              width="100%"
            >
              {exportStatus.isExporting ? (
                <Text color="yellow">Exporting...</Text>
              ) : (
                <Text color={exportStatus.type === "success" ? "green" : "red"}>
                  {exportStatus.message}
                </Text>
              )}
            </Box>
          </Box>
        )}
      {!exportDialog.isVisible && (
        <Box
          flexGrow={1}
          width="100%"
          minHeight={
            searchState.isSearching || searchState.searchTerm
              ? searchModeVisibleLines
              : 1
          }
        >
          {treeViewMode ? (
            <TreeView
              data={displayData as JsonValue | null}
              height={
                searchState.isSearching || searchState.searchTerm
                  ? searchModeVisibleLines
                  : visibleLines
              }
              searchTerm={searchState.searchTerm}
              options={{
                showArrayIndices: true,
                showPrimitiveValues: true,
                maxValueLength: 50,
                useUnicodeTree: true,
              }}
              onKeyboardHandlerReady={safeSetTreeViewKeyboardHandler}
            />
          ) : collapsibleMode ? (
            <CollapsibleJsonViewer
              ref={collapsibleViewerRef}
              data={displayData as JsonValue | null}
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
              data={displayData as JsonValue | null}
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
              data={displayData as JsonValue | null}
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
      )}
      {/* Debug bar - conditionally rendered based on debugVisible */}
      {debugVisible && !exportDialog.isVisible && (
        <Box flexShrink={0} width="100%">
          <DebugBar
            debugInfo={debugInfo}
            keyboardEnabled={keyboardEnabled}
            searchState={searchState}
          />
        </Box>
      )}

      {/* Debug Log Viewer - fullscreen modal overlay */}
      {debugLogViewerVisible && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          backgroundColor="black"
        >
          <DebugLogViewer
            height={terminalSize.height}
            width={terminalSize.width}
            onExit={() => setDebugLogViewerVisible(false)}
          />
        </Box>
      )}

      {/* Export Dialog - fullscreen modal overlay */}
      {exportDialog.isVisible && (
        <Box
          flexGrow={1}
          width="100%"
          justifyContent="center"
          alignItems="center"
          paddingX={2}
          paddingY={2}
        >
          <ExportDialog
            isVisible={exportDialog.isVisible}
            onConfirm={handleExportConfirm}
            onCancel={handleExportCancel}
            defaultFilename={generateDefaultFilename()}
          />
        </Box>
      )}
    </Box>
  );
}
