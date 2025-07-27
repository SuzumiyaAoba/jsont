import { useConfig } from "@core/context/ConfigContext";
import type {
  AppProps,
  KeyboardHandler,
  KeyboardHandlerRegistration,
} from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { createKeybindingMatcher } from "@core/utils/keybindings";
import { CollapsibleJsonViewer } from "@features/collapsible/components/CollapsibleJsonViewer";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { ConfirmationDialog, NotificationToast } from "@features/common";
import { handleTextInput } from "@features/common/components/TextInput";
import { DebugBar } from "@features/debug/components/DebugBar";
import { DebugLogViewer } from "@features/debug/components/DebugLogViewer";
import { HelpViewer } from "@features/help/components/HelpViewer";
import { JqQueryInput } from "@features/jq/components/JqQueryInput";
import { transformWithJq } from "@features/jq/utils/jqTransform";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { ExportDialog } from "@features/schema/components/ExportDialog";
import { SchemaViewer } from "@features/schema/components/SchemaViewer";
import type { ExportOptions } from "@features/schema/utils/fileExport";
import {
  exportToFile,
  generateDefaultFilename,
} from "@features/schema/utils/fileExport";
// Schema utilities available when needed
import { SearchBar } from "@features/search/components/SearchBar";
import { SettingsViewer } from "@features/settings/components/SettingsViewer";
import { TreeView } from "@features/tree/components/TreeView";
import { useExportHandlers } from "@hooks/useExportHandlers";
import { useKeyboardHandler } from "@hooks/useKeyboardHandler";
import { useSearchHandlers } from "@hooks/useSearchHandlers";
import { useTerminalCalculations } from "@hooks/useTerminalCalculations";
import { useAtomValue, useSetAtom } from "@store/atoms";
import { isSearchingAtom } from "@store/atoms/search";
import { openSettingsAtom, settingsVisibleAtom } from "@store/atoms/settings";
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
  useCycleScope,
  useNextSearchResult,
  usePreviousSearchResult,
  useSearchCursorPosition,
  useSearchInput,
  useSearchState,
  useStartSearch,
} from "@store/hooks/useSearch";
import {
  useToggleCollapsible,
  useToggleDebugLogViewer,
  useToggleLineNumbers,
  useToggleSchema,
  useToggleTreeView,
  useUI,
} from "@store/hooks/useUI";
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
  initialViewMode,
}: AppProps) {
  // Check if we're in test environment - moved to top to avoid dependency issues
  const isTestEnvironment =
    process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";

  // Avoid unused variable warning
  void isTestEnvironment;

  // Load configuration and create keybinding matcher
  const config = useConfig();
  const keybindings = useMemo(
    () => createKeybindingMatcher(config.keybindings),
    [config.keybindings],
  );

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
  const nextSearchResult = useNextSearchResult();
  const previousSearchResult = usePreviousSearchResult();

  // Navigation and scroll state
  const [scrollOffset, setScrollOffset] = useScrollOffset();

  const [waitingForSecondG] = useWaitingForSecondG();
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
  const [exportStatus] = useExportStatus();
  const exportDialog = useExportDialog();
  const [dataExportDialog, setDataExportDialog] = useState({
    isVisible: false,
  });
  void useDebugInfo();

  // UI state
  const {
    debugVisible,
    lineNumbersVisible,
    schemaVisible,
    helpVisible,
    setHelpVisible,
    treeViewMode,
    collapsibleMode,
    debugLogViewerVisible,
    setDebugLogViewerVisible,
  } = useUI();

  // Settings state
  const settingsVisible = useAtomValue(settingsVisibleAtom);
  const openSettings = useSetAtom(openSettingsAtom);

  // UI toggle functions
  const toggleTreeView = useToggleTreeView();
  const toggleSchema = useToggleSchema();
  const toggleCollapsible = useToggleCollapsible();
  const toggleLineNumbers = useToggleLineNumbers();
  const toggleDebugLogViewer = useToggleDebugLogViewer();

  const [error] = useState<string | null>(initialError ?? null);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [treeViewKeyboardHandler, setTreeViewKeyboardHandler] =
    useState<KeyboardHandler | null>(null);

  const isInitialModeSet = useRef(false);

  // Set initial view mode if specified - only once
  useEffect(() => {
    if (initialViewMode && !isInitialModeSet.current) {
      switch (initialViewMode) {
        case "tree":
          toggleTreeView();
          break;
        case "collapsible":
          toggleCollapsible();
          break;
        case "schema":
          toggleSchema();
          break;
        case "settings":
          openSettings();
          break;
        // "raw" is the default, no action needed
      }
      isInitialModeSet.current = true;
    }
  }, [
    initialViewMode,
    toggleTreeView,
    toggleCollapsible,
    toggleSchema,
    openSettings,
  ]);

  // Clear TreeView handler when TreeView is disabled
  useEffect(() => {
    if (!treeViewMode) {
      setTreeViewKeyboardHandler(null);
    }
  }, [treeViewMode]);

  // Extract export handlers
  const { handleExportSchema, handleExportConfirm, handleExportCancel } =
    useExportHandlers({ initialData });

  // Extract terminal calculations
  const {
    terminalSize,
    visibleLines,
    searchModeVisibleLines,
    maxScroll,
    maxScrollSearchMode,
    halfPageLines,
  } = useTerminalCalculations({
    keyboardEnabled,
    error,
    searchInput,
    initialData,
    collapsibleMode,
  });

  // Extract search handlers
  useSearchHandlers({
    initialData,
    schemaVisible,
    visibleLines,
    maxScroll,
    maxScrollSearchMode,
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

  // G_SEQUENCE_TIMEOUT moved to config when needed

  // Schema and JSON lines calculation available when needed

  // Use schema lines for scroll calculation when in schema view
  // currentDataLines calculation available when needed

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

  // Data export handlers
  const handleExportData = useCallback(() => {
    setDataExportDialog({ isVisible: true });
  }, []);

  const handleDataExportConfirm = useCallback(
    async (options: ExportOptions) => {
      try {
        const result = await exportToFile(displayData as JsonValue, options);
        if (result.success) {
          // Show success notification
          console.log(`Data exported successfully to ${result.filePath}`);
        } else {
          console.error(`Export failed: ${result.error}`);
        }
      } catch (error) {
        console.error("Export error:", error);
      } finally {
        setDataExportDialog({ isVisible: false });
      }
    },
    [displayData],
  );

  const handleDataExportCancel = useCallback(() => {
    setDataExportDialog({ isVisible: false });
  }, []);

  // Helper function to handle collapsible navigation
  // Collapsible navigation handler available when needed

  // Helper function to handle scroll changes from collapsible viewer
  const handleCollapsibleScrollChange = useCallback(
    (newScrollOffset: number) => {
      setScrollOffset(newScrollOffset);
    },
    [setScrollOffset],
  );

  // Search results are now handled by useSearchHandlers hook

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

  // Force scroll reset when data changes to ensure first line visibility
  const initialDataRef = useRef(initialData);
  const displayDataRef = useRef(displayData);
  useEffect(() => {
    if (initialDataRef.current !== initialData) {
      initialDataRef.current = initialData;
      resetScroll();
    }
    if (displayDataRef.current !== displayData) {
      displayDataRef.current = displayData;
      resetScroll();
    }
  });

  // Initialize scroll to 0 on mount
  useEffect(() => {
    resetScroll();
  }, [resetScroll]);

  // Emergency scroll correction
  useEffect(() => {
    if (scrollOffset < 0 || !Number.isFinite(scrollOffset)) {
      resetScroll();
    }
  }, [scrollOffset, resetScroll]);

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

  // Use the keyboard handler hook for modular keyboard input handling
  const { handleKeyInput } = useKeyboardHandler({
    // Debug utilities
    updateDebugInfo,
    updateDebugInfoCallback,

    // App state
    helpVisible,
    setHelpVisible,

    // Search state
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

    // JQ state
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

    // Navigation state
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

    // View modes
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

    // Handlers from child components
    treeViewKeyboardHandler,
    collapsibleViewerRef,

    // Utilities
    keybindings,
    handleTextInput,
    handleExportSchema,
    handleExportData,
    exit,
  });

  // Use Ink's useInput hook for keyboard handling
  useInput(
    (input, key) => {
      // Handle keyboard input
      handleKeyInput(input, key);
    },
    {
      isActive:
        keyboardEnabled &&
        !exportDialog.isVisible &&
        !dataExportDialog.isVisible &&
        !debugLogViewerVisible &&
        !settingsVisible,
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

      {/* Main content - hide when debug viewer or export dialogs are visible */}
      {!debugLogViewerVisible &&
        !exportDialog.isVisible &&
        !dataExportDialog.isVisible && (
          <>
            {/* Enhanced Help Viewer - ONLY show help, hide everything else */}
            {helpVisible && !exportDialog.isVisible && (
              <Box width="100%" height="100%">
                <HelpViewer
                  mode={currentMode}
                  keybindings={config.keybindings}
                  height={terminalSize.height}
                  width={terminalSize.width}
                />
              </Box>
            )}
            {/* Search bar fixed at top when in search mode */}
            {(searchState.isSearching || searchState.searchTerm) &&
              !exportDialog.isVisible &&
              !helpVisible && (
                <Box flexShrink={0} width="100%">
                  <SearchBar
                    searchState={searchState}
                    searchInput={searchInput}
                    searchCursorPosition={searchCursorPosition}
                  />
                </Box>
              )}
            {/* jq transformation bar */}
            {jqState.isActive && !exportDialog.isVisible && !helpVisible && (
              <Box flexShrink={0} width="100%">
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
              <Box flexShrink={0} width="100%">
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
                <Box flexShrink={0} width="100%">
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
                        color={
                          exportStatus.type === "success" ? "green" : "red"
                        }
                      >
                        {exportStatus.message}
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
            {!exportDialog.isVisible && !helpVisible && (
              <Box flexGrow={1} width="100%">
                {treeViewMode ? (
                  <TreeView
                    data={displayData as JsonValue | null}
                    height={
                      searchState.isSearching || searchState.searchTerm
                        ? searchModeVisibleLines
                        : visibleLines
                    }
                    scrollOffset={scrollOffset}
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

            {/* Settings Dialog - fullscreen modal overlay */}
            {settingsVisible && (
              <Box
                width="100%"
                height="100%"
                justifyContent="center"
                alignItems="center"
                paddingX={1}
                paddingY={1}
              >
                <SettingsViewer
                  width={terminalSize.width - 2}
                  height={terminalSize.height - 2}
                />
              </Box>
            )}
          </>
        )}

      {/* Export Dialog - fullscreen modal overlay */}
      {exportDialog.isVisible && (
        <Box
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
          paddingX={2}
          paddingY={2}
        >
          <ExportDialog
            isVisible={exportDialog.isVisible}
            onConfirm={handleExportConfirm}
            onCancel={handleExportCancel}
            defaultFilename={generateDefaultFilename("schema")}
            defaultFormat="schema"
          />
        </Box>
      )}

      {/* Data Export Dialog - fullscreen modal overlay */}
      {dataExportDialog.isVisible && (
        <Box
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
          paddingX={2}
          paddingY={2}
        >
          <ExportDialog
            isVisible={dataExportDialog.isVisible}
            onConfirm={handleDataExportConfirm}
            onCancel={handleDataExportCancel}
            defaultFilename={generateDefaultFilename("json")}
          />
        </Box>
      )}

      {/* Global notification toast - always rendered last to be on top */}
      <NotificationToast />

      {/* Global confirmation dialog - always rendered last to be on top */}
      <ConfirmationDialog terminalWidth={terminalSize.width} />
    </Box>
  );
}
