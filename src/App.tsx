import { useConfig } from "@core/context/ConfigContext";
import type {
  AppProps,
  KeyboardHandler,
  KeyboardHandlerRegistration,
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
import { generateDefaultFilename } from "@features/schema/utils/fileExport";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { SearchBar } from "@features/search/components/SearchBar";
import {
  searchInJson,
  searchInJsonSchema,
} from "@features/search/utils/searchUtils";
import { TreeView } from "@features/tree/components/TreeView";
import { useExportHandlers } from "@hooks/useExportHandlers";
import { useTerminalCalculations } from "@hooks/useTerminalCalculations";
import { useSetAtom } from "@store/atoms";
import { isSearchingAtom } from "@store/atoms/search";
import { useUpdateDebugInfo } from "@store/hooks";
import { useDebugInfo } from "@store/hooks/useDebug";
import { useExportDialog, useExportStatus } from "@store/hooks/useExport";
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
 * Main application component for the JSON TUI Viewer - Simplified Refactored Version
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
  const _config = useConfig();

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
  const [_waitingForSecondG, _setWaitingForSecondG] = useWaitingForSecondG();
  const resetScroll = useResetScroll();
  const _scrollToTop = useScrollToTop();
  const _scrollToBottom = useScrollToBottom();
  const _adjustScroll = useAdjustScroll();
  const _startGSequence = useStartGSequence();
  const _resetGSequence = useResetGSequence();

  // JQ transformation state
  const jqState = useJqState();
  const [jqInput, setJqInput] = useJqInput();
  const [jqCursorPosition, setJqCursorPosition] = useJqCursorPosition();
  const [jqFocusMode, setJqFocusMode] = useJqFocusMode();
  const [jqErrorScrollOffset, setJqErrorScrollOffset] =
    useJqErrorScrollOffset();
  const exitJqMode = useExitJqMode();
  const toggleJqMode = useToggleJqMode();
  const _toggleJqView = useToggleJqView();
  const startJqTransformation = useStartJqTransformation();
  const completeJqTransformation = useCompleteJqTransformation();

  // Export and debug state
  const [exportStatus] = useExportStatus();
  const exportDialog = useExportDialog();
  const [_debugInfo] = useDebugInfo();

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

  const [_treeViewKeyboardHandler, setTreeViewKeyboardHandler] =
    useState<KeyboardHandler | null>(null);

  // Extract export handlers
  const { handleExportSchema, handleExportConfirm, handleExportCancel } =
    useExportHandlers({ initialData });

  // Extract terminal calculations
  const {
    terminalSize,
    searchBarHeight,
    visibleLines,
    searchModeVisibleLines,
    maxScroll,
    maxScrollSearchMode,
    halfPageLines,
    JSON_INDENT,
  } = useTerminalCalculations({
    keyboardEnabled,
    error,
    searchInput,
    initialData,
  });

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

  const collapsibleViewerRef = useRef<{
    navigate: (action: NavigationAction) => void;
  } | null>(null);

  const { exit } = useApp();

  const _G_SEQUENCE_TIMEOUT = 1000; // TODO: Move to config

  // Calculate schema lines when in schema view mode
  const schemaLines = useMemo(() => {
    if (!initialData || !schemaVisible) return 0;
    const schema = inferJsonSchema(initialData, "JSON Schema");
    const formattedSchema = formatJsonSchema(schema);
    return formattedSchema.split("\n").length;
  }, [initialData, schemaVisible]);

  const jsonLines = initialData
    ? JSON.stringify(initialData, null, JSON_INDENT).split("\n").length
    : 0;

  // Use schema lines for scroll calculation when in schema view
  const _currentDataLines = schemaVisible ? schemaLines : jsonLines;

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
  const _navigateToNextResult = useCallback(() => {
    if (searchState.searchResults.length === 0) return;
    nextSearchResult();
  }, [searchState.searchResults.length, nextSearchResult]);

  // Helper function to navigate to previous search result
  const _navigateToPreviousResult = useCallback(() => {
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
  const _handleCollapsibleNavigation = useCallback(
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

  // Update search results when search term or view mode changes
  useEffect(() => {
    if (searchState.searchTerm && initialData) {
      // Use appropriate search function based on current view mode
      const results = schemaVisible
        ? searchInJsonSchema(
            initialData as any,
            searchState.searchTerm,
            searchState.searchScope,
          )
        : searchInJson(
            initialData as any,
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

  // Consolidated keyboard input handling
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
        // Search input mode
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
      } else if (jqState.isActive) {
        // JQ input mode - simplified version of the original logic
        if (key.return) {
          handleJqTransformation(jqInput);
        } else if (key.escape) {
          exitJqMode();
        } else if (key.tab) {
          setJqFocusMode((prev) => (prev === "input" ? "json" : "input"));
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
        }
      } else {
        // Navigation mode - simplified version
        if (input === "s" && !key.ctrl && !key.meta) {
          // Start search mode
          updateDebugInfo("Start search mode", input);
          setIsSearching(true);
          setSearchInput("");
          setSearchCursorPosition(0);
          resetScroll();
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
        } else if (input === "J" && !key.ctrl && !key.meta) {
          // Toggle jq mode
          toggleJqMode();
          updateDebugInfo(
            `Toggle jq mode ${jqState.isActive ? "OFF" : "ON"}`,
            input,
          );
        } else if (input === "?" && !key.ctrl && !key.meta) {
          // Toggle help visibility
          setHelpVisible((prev) => !prev);
          updateDebugInfo(`Toggle help ${helpVisible ? "OFF" : "ON"}`, input);
        }
        // Add other essential navigation keys as needed...
      }
    },
    [
      exit,
      searchState.isSearching,
      searchState.searchTerm,
      jqState.isActive,
      jqFocusMode,
      helpVisible,
      searchInput,
      searchCursorPosition,
      jqInput,
      jqCursorPosition,
      maxScroll,
      maxScrollSearchMode,
      updateDebugInfo,
      updateDebugInfoCallback,
      handleExportSchema,
      handleJqTransformation,
      setHelpVisible,
      setIsSearching,
      setSearchInput,
      setSearchCursorPosition,
      setScrollOffset,
      resetScroll,
      startSearch,
      cancelSearch,
      cycleScope,
      exitJqMode,
      setJqFocusMode,
      setJqInput,
      setJqCursorPosition,
      toggleJqMode,
    ],
  );

  // Use Ink's useInput hook for keyboard handling
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
