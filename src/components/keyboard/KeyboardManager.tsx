/**
 * Centralized keyboard input management
 * Handles all keyboard events and delegates to appropriate handlers
 */

import type { JsonValue } from "@core/types/index";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { handleTextInput } from "@features/common/components/TextInput";
import { transformWithJq } from "@features/jq/utils/jqTransform";
import { useKeyboardHandler } from "@hooks/useKeyboardHandler";
import { useAppState } from "@components/providers/AppStateProvider";
import { useInput, useApp } from "ink";
import type { ReactElement, RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

interface KeyboardManagerProps {
  keyboardEnabled: boolean;
  initialData: JsonValue;
  displayData: JsonValue;
  currentMode: string;
  treeViewKeyboardHandler: any;
  collapsibleViewerRef: RefObject<{
    navigate: (action: NavigationAction) => void;
  }>;
  safeSetTreeViewKeyboardHandler: (handler: any) => void;
}

export function KeyboardManager({
  keyboardEnabled,
  initialData,
  displayData,
  currentMode,
  treeViewKeyboardHandler,
  collapsibleViewerRef,
  safeSetTreeViewKeyboardHandler,
}: KeyboardManagerProps): ReactElement {
  const {
    config,
    keybindings,
    searchState,
    searchInput,
    setSearchInput,
    searchCursorPosition,
    setSearchCursorPosition,
    setIsSearching,
    startSearch,
    cancelSearch,
    cycleScope,
    nextSearchResult,
    previousSearchResult,
    jqState,
    jqInput,
    setJqInput,
    jqCursorPosition,
    setJqCursorPosition,
    jqFocusMode,
    setJqFocusMode,
    setJqErrorScrollOffset,
    exitJqMode,
    toggleJqMode,
    toggleJqView,
    startJqTransformation,
    completeJqTransformation,
    waitingForSecondG,
    adjustScroll,
    scrollToTop,
    scrollToBottom,
    resetScroll,
    resetGSequence,
    startGSequence,
    ui,
    toggleTreeView,
    toggleCollapsible,
    toggleSchema,
    toggleLineNumbers,
    toggleDebugLogViewer,
    openSettings,
    updateDebugInfo,
    exportHandlers,
    exportDialog,
    dataExportDialog,
    setDataExportDialog,
    terminalCalculations,
  } = useAppState();

  const { helpVisible, setHelpVisible } = ui;
  const { maxScroll, maxScrollSearchMode, halfPageLines } = terminalCalculations;

  const { exit } = useApp();

  // Handle data export
  const handleExportData = useCallback(() => {
    setDataExportDialog({ isVisible: true });
  }, [setDataExportDialog]);

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
      jqInput,
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
    treeViewMode: ui.treeViewMode,
    collapsibleMode: ui.collapsibleMode,
    schemaVisible: ui.schemaVisible,
    lineNumbersVisible: ui.lineNumbersVisible,
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
    handleExportSchema: exportHandlers.handleExportSchema,
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
        !ui.debugLogViewerVisible &&
        !ui.settingsVisible,
    },
  );

  return <></>;
}