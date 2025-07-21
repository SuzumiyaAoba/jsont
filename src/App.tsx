import { useConfig } from "@core/context/ConfigContext";
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
import { HelpViewer } from "@features/help/components/HelpViewer";
import { JqQueryInput } from "@features/jq/components/JqQueryInput";
import { transformWithJq } from "@features/jq/utils/jqTransform";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { ExportDialog } from "@features/schema/components/ExportDialog";
import { SchemaViewer } from "@features/schema/components/SchemaViewer";
import {
  exportToFile,
  generateDefaultFilename,
} from "@features/schema/utils/fileExport";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { SearchBar } from "@features/search/components/SearchBar";
import {
  searchInJson,
  searchInJsonSchema,
} from "@features/search/utils/searchUtils";
import {
  calculateStatusBarHeight,
  getStatusContent,
} from "@features/status/utils/statusUtils";
import { TreeView } from "@features/tree/components/TreeView";
import { useSetAtom } from "@store/atoms";
import { isSearchingAtom } from "@store/atoms/search";
import { useUpdateDebugInfo } from "@store/hooks";
import {
  useDebugInfo,
  useExportDialog,
  useExportStatus,
  useHideExportDialog,
  useShowExportDialog,
} from "@store/hooks/useExport";
import {
  useCompleteJqTransformation,
  useExitJqMode,
  useJqCursorPosition,
  useJqErrorScrollOffset,
  useJqFocusMode,
  useJqInput,
  useJqState,
  useStartJqTransformation,
  useToggleJqMode,
  useToggleJqView,
} from "@store/hooks/useJq";
import {
  useAdjustScroll,
  useResetGSequence,
  useResetScroll,
  useScrollOffset,
  useScrollToBottom,
  useScrollToTop,
  useStartGSequence,
  useWaitingForSecondG,
} from "@store/hooks/useNavigation";
import {
  useCancelSearch,
  useCurrentSearchResult,
  useCycleScope,
  useNextSearchResult,
  usePreviousSearchResult,
  useSearchCursorPosition,
  useSearchInput,
  useSearchState,
  useStartSearch,
  useUpdateSearchResults,
} from "@store/hooks/useSearch";
import { useUI } from "@store/hooks/useUI";
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

  // Load configuration
  const config = useConfig();

  // Jotai-based state management
  const updateDebugInfo = useUpdateDebugInfo();

  // Search state management using jotai
  const searchState = useSearchState();
  const [searchInput, setSearchInput] = useSearchInput();
  const [searchCursorPosition, setSearchCursorPosition] =
    useSearchCursorPosition();
  const setIsSearching = useSetAtom(isSearchingAtom);
  // Note: searchScope is available via searchState.searchScope, setters not needed since we use cycleScope()
  const startSearch = useStartSearch();
  const cancelSearch = useCancelSearch();
  const cycleScope = useCycleScope();
  const updateSearchResults = useUpdateSearchResults();
  const nextSearchResult = useNextSearchResult();
  const previousSearchResult = usePreviousSearchResult();
  const currentSearchResult = useCurrentSearchResult();

  // Navigation and scroll state
  const [scrollOffset, setScrollOffset] = useScrollOffset();
  const [waitingForSecondG, setWaitingForSecondG] = useWaitingForSecondG();
  const resetScroll = useResetScroll();
  const scrollToTop = useScrollToTop();
  const scrollToBottom = useScrollToBottom();
  const adjustScroll = useAdjustScroll();
  const startGSequence = useStartGSequence();
  const resetGSequence = useResetGSequence();

  // JQ transformation state
  const jqState = useJqState();
  const [jqInput, setJqInput] = useJqInput();
  const [jqCursorPosition, setJqCursorPosition] = useJqCursorPosition();
  const [jqFocusMode, setJqFocusMode] = useJqFocusMode();
  const [jqErrorScrollOffset, setJqErrorScrollOffset] =
    useJqErrorScrollOffset();
  const exitJqMode = useExitJqMode();
  const toggleJqMode = useToggleJqMode();
  const toggleJqView = useToggleJqView();
  const startJqTransformation = useStartJqTransformation();
  const completeJqTransformation = useCompleteJqTransformation();

  // Export and debug state
  const [exportStatus, setExportStatus] = useExportStatus();
  const exportDialog = useExportDialog();
  const [debugInfo] = useDebugInfo();
  const showExportDialog = useShowExportDialog();
  const hideExportDialog = useHideExportDialog();

  // UI state
  const {
    debugVisible,
    setDebugVisible,
    lineNumbersVisible,
    setLineNumbersVisible,
    schemaVisible,
    setSchemaVisible,
    helpVisible,
    setHelpVisible,
    treeViewMode,
    setTreeViewMode,
    collapsibleMode,
    setCollapsibleMode,
    debugLogViewerVisible,
    setDebugLogViewerVisible,
  } = useUI();

  const [error] = useState<string | null>(initialError ?? null);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Determine current mode for help system
  const currentMode = useMemo(() => {
    if (searchState.isSearching || searchState.searchTerm) {
      return "search" as const;
    } else if (treeViewMode) {
      return "tree" as const;
    } else if (jqState.isActive) {
      return "filter" as const;
    } else if (collapsibleMode) {
      return "collapsible" as const;
    } else if (schemaVisible) {
      return "schema" as const;
    } else {
      return "raw" as const;
    }
  }, [
    searchState.isSearching,
    searchState.searchTerm,
    treeViewMode,
    jqState.isActive,
    collapsibleMode,
    schemaVisible,
  ]);

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
  const JSON_INDENT = config.display.json.indent;
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
  const contentPaddingLines = 0; // Removed padding from viewers to fix first line display issue
  const UI_RESERVED_LINES =
    statusBarLines +
    searchBarLines +
    debugBarLines +
    jqBarLines +
    contentPaddingLines;
  const G_SEQUENCE_TIMEOUT = 1000; // TODO: Move to config

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
    [
      visibleLines,
      maxScroll,
      maxScrollSearchMode,
      searchState.isSearching,
      setScrollOffset,
    ],
  );

  // Helper function to navigate to next search result
  const navigateToNextResult = useCallback(() => {
    if (searchState.searchResults.length === 0) return;
    nextSearchResult();
  }, [searchState.searchResults.length, nextSearchResult]);

  // Helper function to navigate to previous search result
  const navigateToPreviousResult = useCallback(() => {
    if (searchState.searchResults.length === 0) return;
    previousSearchResult();
  }, [searchState.searchResults.length, previousSearchResult]);

  // Effect to scroll to current search result when it changes
  useEffect(() => {
    if (currentSearchResult) {
      scrollToSearchResult(currentSearchResult);
    }
  }, [currentSearchResult, scrollToSearchResult]);

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
    [setScrollOffset],
  );

  // Helper function to handle search scope changes

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

      updateSearchResults(results);

      // Reset scroll to top after search
      resetScroll();
    } else {
      updateSearchResults([]);
    }
  }, [
    searchState.searchTerm,
    searchState.searchScope,
    initialData,
    schemaVisible,
    updateSearchResults, // Reset scroll to top after search
    resetScroll,
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
  }, [setJqErrorScrollOffset]);

  // Helper function to update debug info (using jotai)
  const updateDebugInfoCallback = useCallback(
    (action: string, input: string) => {
      updateDebugInfo(
        `${action} (searching: ${searchState.isSearching})`,
        input,
      );
    },
    [searchState.isSearching, updateDebugInfo],
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
    showExportDialog("simple");
  }, [
    initialData, // Show export dialog
    showExportDialog,
    setExportStatus,
  ]);

  // Handle export dialog confirmation
  const handleExportConfirm = useCallback(
    async (options: Parameters<typeof exportToFile>[1]) => {
      if (!initialData) return;

      hideExportDialog();
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
    [initialData, hideExportDialog, setExportStatus],
  );

  // Handle export dialog cancellation
  const handleExportCancel = useCallback(() => {
    hideExportDialog();
  }, [hideExportDialog]);

  // Handle jq transformation
  const handleJqTransformation = useCallback(
    async (query: string) => {
      if (!initialData) return;

      startJqTransformation(jqInput);

      try {
        const result = await transformWithJq(initialData, query);

        if (result.success) {
          completeJqTransformation({ success: true, data: result.data });
          // Reset scroll to top when jq filtering is applied successfully
          resetScroll();
        } else {
          completeJqTransformation({
            success: false,
            error: result.error || "Transformation failed",
          });
        }
      } catch (error) {
        completeJqTransformation({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [
      initialData,
      startJqTransformation,
      completeJqTransformation,
      jqInput, // Reset scroll to top when jq filtering is applied successfully
      resetScroll,
    ],
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
        exitJqMode();
        // Preserve scroll position when exiting jq mode
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
            JSON.stringify(currentDisplayData, null, JSON_INDENT).split("\n")
              .length - visibleLines,
          );
          adjustScroll(1, currentMaxScroll);
        } else if (input === "k" && !key.ctrl) {
          // Scroll up
          adjustScroll(-1, Number.MAX_SAFE_INTEGER);
        } else if (key.ctrl && input === "f") {
          // Half-page down
          const currentMaxScroll = Math.max(
            0,
            JSON.stringify(currentDisplayData, null, JSON_INDENT).split("\n")
              .length - visibleLines,
          );
          adjustScroll(halfPageLines, currentMaxScroll);
        } else if (key.ctrl && input === "b") {
          // Half-page up
          adjustScroll(-halfPageLines, Number.MAX_SAFE_INTEGER);
        } else if (input === "g" && !key.ctrl && !key.meta) {
          if (waitingForSecondG) {
            // Go to top (gg)
            scrollToTop();
            resetGSequence();
          } else {
            // First 'g' pressed
            startGSequence();
          }
        } else if (input === "G" && !key.ctrl && !key.meta) {
          // Go to bottom
          const currentMaxScroll = Math.max(
            0,
            JSON.stringify(currentDisplayData, null, JSON_INDENT).split("\n")
              .length - visibleLines,
          );
          scrollToBottom(currentMaxScroll);
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
          toggleJqView();

          // Reset scroll position when switching views to ensure proper navigation
          resetScroll();

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
        exitJqMode();
        // Preserve scroll position when exiting jq mode
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
      JSON_INDENT,
      setJqCursorPosition,
      setJqFocusMode,
      setJqInput,
      toggleJqView,
      exitJqMode, // Half-page up
      adjustScroll,
      resetGSequence, // Reset scroll position when switching views to ensure proper navigation
      resetScroll,
      scrollToBottom, // Go to top (gg)
      scrollToTop,
      setJqErrorScrollOffset, // First 'g' pressed
      startGSequence,
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
        updateDebugInfoCallback("Confirm search", input);
        startSearch(searchInput);
        resetScroll(); // Reset scroll to top after search
      } else if (key.escape) {
        // Cancel search - exit search mode entirely and clear all search state
        updateDebugInfoCallback("Cancel search", input);
        cancelSearch();
        resetScroll(); // Reset scroll to top after canceling search
      } else if (key.tab) {
        // Toggle search scope
        updateDebugInfoCallback("Toggle search scope", input);
        cycleScope();
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
        updateDebugInfoCallback(`Ignored in search mode: "${input}"`, input);
      }
    },
    [
      searchInput,
      searchCursorPosition,
      updateDebugInfoCallback,
      setSearchCursorPosition,
      setSearchInput,
      startSearch,
      cancelSearch,
      cycleScope,
      resetScroll,
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
        setIsSearching(true);
        setSearchInput("");
        setSearchCursorPosition(0);
        resetScroll();
      } else if (
        input === "q" &&
        !key.ctrl &&
        !key.meta &&
        searchState.searchTerm
      ) {
        // Return to search input mode when 'q' is pressed after search
        updateDebugInfo("Return to search input", input);
        setIsSearching(true);
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
            scrollToTop();
          }
          resetGSequence();
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
        cancelSearch();
      } else if (
        key.tab &&
        (searchState.searchTerm || searchState.isSearching)
      ) {
        // Toggle search scope when Tab is pressed and search is active
        updateDebugInfo("Toggle search scope", input);
        cycleScope();
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
        const willShowHelp = !helpVisible;
        if (willShowHelp && process.stdout.write) {
          // Complete terminal isolation - multiple clearing techniques
          process.stdout.write("\x1b[2J\x1b[3J\x1b[H\x1b[0;0H\x1b[0m"); // Clear screen, scrollback, home cursor
          process.stdout.write("\x1b[?1049h"); // Switch to alternate screen buffer
          process.stdout.write("\x1b[2J\x1b[H"); // Clear alternate buffer
          // Fill the screen with spaces to ensure complete isolation
          for (let i = 0; i < (terminalSize.height || 24); i++) {
            process.stdout.write(`${" ".repeat(terminalSize.width || 80)}\n`);
          }
          process.stdout.write("\x1b[H"); // Return to home position
        }
        setHelpVisible((prev) => !prev);
        updateDebugInfo(`Toggle help ${helpVisible ? "OFF" : "ON"}`, input);
      } else if (key.escape && helpVisible) {
        // Close help when Escape is pressed and help is visible
        if (process.stdout.write) {
          // Restore main screen buffer and clear
          process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
          process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
        }
        setHelpVisible(false);
        updateDebugInfo("Close help (Esc)", input);
      } else if (input === "J" && !key.ctrl && !key.meta) {
        // Toggle jq mode
        toggleJqMode();
        updateDebugInfo(
          `Toggle jq mode ${jqState.isActive ? "OFF" : "ON"}`,
          input,
        );
        // Preserve scroll position when toggling jq mode
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
      cycleScope,
      jqState.isActive,
      treeViewMode,
      treeViewKeyboardHandler,
      debugLogViewerVisible,
      terminalSize.height,
      terminalSize.width,
      setCollapsibleMode,
      setDebugLogViewerVisible,
      setDebugVisible,
      setHelpVisible,
      toggleJqMode,
      setLineNumbersVisible,
      setSchemaVisible,
      setScrollOffset,
      setSearchCursorPosition,
      setSearchInput,
      setIsSearching,
      setTreeViewMode,
      setWaitingForSecondG,
      cancelSearch,
      resetGSequence,
      resetScroll,
      scrollToTop,
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
      } else if (helpVisible) {
        // Handle help mode inputs - only allow help close or exit
        if (input === "?" && !key.ctrl && !key.meta) {
          if (process.stdout.write) {
            // Restore main screen buffer and clear
            process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
            process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
          }
          setHelpVisible(false);
          updateDebugInfo("Close help (?)", input);
        } else if (key.escape) {
          if (process.stdout.write) {
            // Restore main screen buffer and clear
            process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
            process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
          }
          setHelpVisible(false);
          updateDebugInfo("Close help (Esc)", input);
        }
        // Ignore all other keys when help is visible
        return;
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
      helpVisible,
      setHelpVisible,
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
      isActive:
        keyboardEnabled && !exportDialog.isVisible && !debugLogViewerVisible,
    },
  );

  return (
    <Box flexDirection="column" width="100%">
      {/* Debug Log Viewer - fullscreen modal overlay - render first to override everything */}
      {debugLogViewerVisible && (
        <DebugLogViewer
          height={terminalSize.height}
          width={terminalSize.width}
          onExit={() => setDebugLogViewerVisible(false)}
        />
      )}

      {/* Main content - hide when debug viewer is visible */}
      {!debugLogViewerVisible && (
        <>
          {/* Enhanced Help Viewer - ONLY show help, hide everything else */}
          {helpVisible && !exportDialog.isVisible && (
            <Box width="100%" height="100%">
              <HelpViewer
                mode={currentMode}
                height={terminalSize.height}
                width={terminalSize.width}
              />
            </Box>
          )}
          {/* Search bar fixed at top when in search mode */}
          {(searchState.isSearching || searchState.searchTerm) &&
            !exportDialog.isVisible &&
            !helpVisible && (
              <Box flexShrink={0} width="100%" height={searchBarHeight}>
                <SearchBar
                  searchState={searchState}
                  searchInput={searchInput}
                  searchCursorPosition={searchCursorPosition}
                />
              </Box>
            )}
          {/* jq transformation bar */}
          {jqState.isActive && !exportDialog.isVisible && !helpVisible && (
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
          {!keyboardEnabled && !exportDialog.isVisible && !helpVisible && (
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
                  ⚠️ Keyboard input unavailable (terminal access failed). Use
                  file input: jsont file.json
                </Text>
              </Box>
            </Box>
          )}
          {/* Export status bar */}
          {(exportStatus.isExporting || exportStatus.message) &&
            !exportDialog.isVisible &&
            !helpVisible && (
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
                    <Text
                      color={exportStatus.type === "success" ? "green" : "red"}
                    >
                      {exportStatus.message}
                    </Text>
                  )}
                </Box>
              </Box>
            )}
          {!exportDialog.isVisible && !helpVisible && (
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
          {debugVisible && !exportDialog.isVisible && !helpVisible && (
            <Box flexShrink={0} width="100%">
              <DebugBar keyboardEnabled={keyboardEnabled} />
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
        </>
      )}
    </Box>
  );
}
