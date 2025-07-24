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
// Schema utilities available when needed
import { SearchBar } from "@features/search/components/SearchBar";
import { TreeView } from "@features/tree/components/TreeView";
import { useExportHandlers } from "@hooks/useExportHandlers";
import { useSearchHandlers } from "@hooks/useSearchHandlers";
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
        if (keybindings.isHelp(input, key)) {
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
        keybindings.isQuit(input, key) &&
        !searchState.isSearching &&
        !searchState.searchTerm
      ) {
        updateDebugInfo("Quit", input);
        exit();
      } else if (keybindings.isExport(input, key)) {
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
        } else if (keybindings.isSearchExit(input, key)) {
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
        // JQ mode - complete implementation with all documented shortcuts

        // Handle Enter key first (before text input) to execute jq transformation
        if (key.return) {
          handleJqTransformation(jqInput);
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
        } else if (key.escape) {
          exitJqMode();
        } else if (key.tab) {
          setJqFocusMode((prev) => (prev === "input" ? "json" : "input"));
        } else if (input === "i" && !key.ctrl && !key.meta) {
          // Return to input mode (only when not in input mode or text input didn't handle it)
          setJqFocusMode("input");
          updateDebugInfo("JQ: Return to input mode", input);
        } else if (input === "o" && !key.ctrl && !key.meta) {
          // Toggle original/result view
          toggleJqView();
          updateDebugInfo("JQ: Toggle original/result view", input);
        } else if (key.shift && key.upArrow) {
          // Scroll error messages up
          setJqErrorScrollOffset((prev) => Math.max(0, prev - 1));
          updateDebugInfo("JQ: Scroll error up", "Shift+↑");
        } else if (key.shift && key.downArrow) {
          // Scroll error messages down
          setJqErrorScrollOffset((prev) => prev + 1);
          updateDebugInfo("JQ: Scroll error down", "Shift+↓");
        } else if (jqFocusMode === "json") {
          // JSON output navigation when focus is on result
          if (keybindings.isDown(input, key)) {
            // Scroll JSON result down
            const currentMaxScroll = searchState.isSearching
              ? maxScrollSearchMode
              : maxScroll;
            adjustScroll(1, currentMaxScroll);
            updateDebugInfo("JQ JSON: Scroll down", input);
          } else if (keybindings.isUp(input, key)) {
            // Scroll JSON result up
            const currentMaxScroll = searchState.isSearching
              ? maxScrollSearchMode
              : maxScroll;
            adjustScroll(-1, currentMaxScroll);
            updateDebugInfo("JQ JSON: Scroll up", input);
          } else if (keybindings.isTop(input, key)) {
            // Go to top in JSON result (simplified, no gg sequence in JQ mode)
            scrollToTop();
            updateDebugInfo("JQ JSON: Go to top", input);
          } else if (keybindings.isBottom(input, key)) {
            // Go to bottom in JSON result
            const currentMaxScroll = searchState.isSearching
              ? maxScrollSearchMode
              : maxScroll;
            scrollToBottom(currentMaxScroll);
            updateDebugInfo("JQ JSON: Go to bottom", input);
          } else if (keybindings.isPageDown(input, key)) {
            // Page down in JSON result
            const currentMaxScroll = searchState.isSearching
              ? maxScrollSearchMode
              : maxScroll;
            adjustScroll(halfPageLines, currentMaxScroll);
            updateDebugInfo("JQ JSON: Page down", "Ctrl+f");
          } else if (keybindings.isPageUp(input, key)) {
            // Page up in JSON result
            const currentMaxScroll = searchState.isSearching
              ? maxScrollSearchMode
              : maxScroll;
            adjustScroll(-halfPageLines, currentMaxScroll);
            updateDebugInfo("JQ JSON: Page up", "Ctrl+b");
          }
        }
      } else {
        // Navigation mode - check TreeView handler first
        if (treeViewMode && treeViewKeyboardHandler) {
          // Let TreeView handle the input first
          if (treeViewKeyboardHandler(input, key)) {
            updateDebugInfo("TreeView handled", input);
            return; // TreeView handled the input
          }
        }

        // Check Collapsible mode handler
        if (collapsibleMode && collapsibleViewerRef.current) {
          // Handle collapsible-specific navigation
          if (keybindings.isDown(input, key)) {
            // Move cursor down
            collapsibleViewerRef.current.navigate({ type: "move_down" });
            updateDebugInfo("Collapsible: Move cursor down", input);
            return;
          } else if (keybindings.isUp(input, key)) {
            // Move cursor up
            collapsibleViewerRef.current.navigate({ type: "move_up" });
            updateDebugInfo("Collapsible: Move cursor up", input);
            return;
          } else if (key.return || input === " ") {
            // Toggle node
            collapsibleViewerRef.current.navigate({ type: "toggle_node" });
            updateDebugInfo("Collapsible: Toggle node", input);
            return;
          } else if (input === "o" && !key.ctrl && !key.meta) {
            // Expand node
            collapsibleViewerRef.current.navigate({ type: "expand_node" });
            updateDebugInfo("Collapsible: Expand node", input);
            return;
          } else if (input === "c" && !key.ctrl && !key.meta) {
            // Collapse node
            collapsibleViewerRef.current.navigate({ type: "collapse_node" });
            updateDebugInfo("Collapsible: Collapse node", input);
            return;
          } else if (input === "O" && !key.ctrl && !key.meta) {
            // Expand all
            collapsibleViewerRef.current.navigate({ type: "expand_all" });
            updateDebugInfo("Collapsible: Expand all", input);
            return;
          } else if (keybindings.isPageDown(input, key)) {
            // Page down
            collapsibleViewerRef.current.navigate({
              type: "page_down",
              count: halfPageLines,
            });
            updateDebugInfo("Collapsible: Page down", "Ctrl+f");
            return;
          } else if (keybindings.isPageUp(input, key)) {
            // Page up
            collapsibleViewerRef.current.navigate({
              type: "page_up",
              count: halfPageLines,
            });
            updateDebugInfo("Collapsible: Page up", "Ctrl+b");
            return;
          } else if (keybindings.isTop(input, key)) {
            // Go to top (simplified, no gg sequence in collapsible mode)
            collapsibleViewerRef.current.navigate({ type: "goto_top" });
            updateDebugInfo("Collapsible: Go to top", input);
            return;
          } else if (keybindings.isBottom(input, key)) {
            // Go to bottom
            collapsibleViewerRef.current.navigate({ type: "goto_bottom" });
            updateDebugInfo("Collapsible: Go to bottom", input);
            return;
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
        } else if (keybindings.isDown(input, key)) {
          // Line down
          updateDebugInfo("Scroll down", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(1, currentMaxScroll);
        } else if (keybindings.isUp(input, key)) {
          // Line up
          updateDebugInfo("Scroll up", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(-1, currentMaxScroll);
        } else if (keybindings.isJq(input, key)) {
          // Toggle jq mode
          toggleJqMode();
          // Reset scroll when entering/exiting jq mode to ensure first line visibility
          resetScroll();
          updateDebugInfo(
            `Toggle jq mode ${jqState.isActive ? "OFF" : "ON"}`,
            input,
          );
        } else if (keybindings.isHelp(input, key)) {
          // Toggle help visibility
          setHelpVisible((prev) => !prev);
          updateDebugInfo(`Toggle help ${helpVisible ? "OFF" : "ON"}`, input);
        } else if (keybindings.isTree(input, key)) {
          // Toggle tree view mode
          toggleTreeView();
          updateDebugInfo(
            `Toggle tree view ${treeViewMode ? "OFF" : "ON"}`,
            input,
          );
        } else if (keybindings.isSchema(input, key)) {
          // Toggle schema view
          toggleSchema();
          updateDebugInfo(
            `Toggle schema view ${schemaVisible ? "OFF" : "ON"}`,
            input,
          );
        } else if (keybindings.isCollapsible(input, key)) {
          // Toggle collapsible mode
          toggleCollapsible();
          updateDebugInfo(
            `Toggle collapsible mode ${collapsibleMode ? "OFF" : "ON"}`,
            input,
          );
        } else if (keybindings.isLineNumbers(input, key)) {
          // Toggle line numbers
          toggleLineNumbers();
          updateDebugInfo(
            `Toggle line numbers ${lineNumbersVisible ? "OFF" : "ON"}`,
            input,
          );
        } else if (keybindings.isDebug(input, key)) {
          // Toggle debug log viewer
          toggleDebugLogViewer();
          updateDebugInfo("Toggle debug log viewer", input);
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
        } else if (keybindings.isBottom(input, key)) {
          // Go to bottom
          updateDebugInfo("Go to bottom (G)", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          scrollToBottom(currentMaxScroll);
          resetGSequence();
        } else if (keybindings.isPageDown(input, key)) {
          // Page down
          updateDebugInfo("Page down (Ctrl+f)", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(halfPageLines, currentMaxScroll);
        } else if (keybindings.isPageUp(input, key)) {
          // Page up
          updateDebugInfo("Page up (Ctrl+b)", input);
          const currentMaxScroll = searchState.isSearching
            ? maxScrollSearchMode
            : maxScroll;
          adjustScroll(-halfPageLines, currentMaxScroll);
        } else if (
          keybindings.isSearchNext(input, key) &&
          searchState.searchTerm
        ) {
          // Next search result
          updateDebugInfo("Next search result (n)", input);
          nextSearchResult();
        } else if (
          keybindings.isSearchPrevious(input, key) &&
          searchState.searchTerm
        ) {
          // Previous search result
          updateDebugInfo("Previous search result (N)", input);
          previousSearchResult();
        }
      }
    },
    [
      exit,
      keybindings,
      searchState.isSearching,
      searchState.searchTerm,
      jqState.isActive,
      jqFocusMode,
      helpVisible,
      treeViewMode,
      schemaVisible,
      collapsibleMode,
      lineNumbersVisible,
      treeViewKeyboardHandler,
      waitingForSecondG,
      searchInput,
      searchCursorPosition,
      jqInput,
      jqCursorPosition,
      maxScroll,
      maxScrollSearchMode,
      halfPageLines,
      updateDebugInfo,
      updateDebugInfoCallback,
      handleExportSchema,
      handleJqTransformation,
      setHelpVisible,
      setIsSearching,
      setSearchInput,
      setSearchCursorPosition,
      resetScroll,
      startSearch,
      cancelSearch,
      cycleScope,
      exitJqMode,
      setJqFocusMode,
      setJqInput,
      setJqCursorPosition,
      toggleJqMode,
      toggleJqView,
      setJqErrorScrollOffset,
      scrollToTop,
      scrollToBottom,
      adjustScroll,
      startGSequence,
      resetGSequence,
      nextSearchResult,
      previousSearchResult,
      toggleTreeView,
      toggleSchema,
      toggleCollapsible,
      toggleLineNumbers,
      toggleDebugLogViewer,
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
                      color={exportStatus.type === "success" ? "green" : "red"}
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
