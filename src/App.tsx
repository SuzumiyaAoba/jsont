import { ContentRouter } from "@components/content/ContentRouter";
import { KeyboardManager } from "@components/keyboard/KeyboardManager";
import { ModalManager } from "@components/modals/ModalManager";
import {
  AppStateProvider,
  useAppState,
} from "@components/providers/AppStateProvider";
import { StatusBarManager } from "@components/status/StatusBarManager";
import type {
  AppMode,
  AppProps,
  KeyboardHandler,
  KeyboardHandlerRegistration,
} from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { ConfirmationDialog, NotificationToast } from "@features/common";
import { Box } from "ink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Main application component for the JSON TUI Viewer - Refactored with Modular Components
 *
 * @param initialData - JSON data to display
 * @param initialError - Initial error message to display
 * @param keyboardEnabled - Whether keyboard navigation is enabled
 */
export function App({
  initialData = null,
  initialError = null,
  keyboardEnabled = false,
  initialViewMode,
}: AppProps) {
  return (
    <AppStateProvider
      initialData={initialData}
      initialError={initialError}
      keyboardEnabled={keyboardEnabled}
    >
      <AppContent
        initialData={initialData}
        initialError={initialError}
        keyboardEnabled={keyboardEnabled}
        initialViewMode={initialViewMode}
      />
    </AppStateProvider>
  );
}

/**
 * Internal component that contains the main app logic
 */
function AppContent({
  initialData = null,
  initialError = null,
  keyboardEnabled = false,
  initialViewMode,
}: AppProps) {
  const {
    ui,
    jqState,
    searchState,
    toggleTreeView,
    toggleCollapsible,
    toggleSchema,
    openSettings,
    terminalCalculations,
  } = useAppState();

  const [treeViewKeyboardHandler, setTreeViewKeyboardHandler] =
    useState<KeyboardHandler | null>(null);

  const collapsibleViewerRef = useRef<{
    navigate: (action: NavigationAction) => void;
  } | null>(null);

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
    if (!ui.treeViewMode) {
      setTreeViewKeyboardHandler(null);
    }
  }, [ui.treeViewMode]);

  // Prevent invalid calls to TreeView handler during registration
  const safeSetTreeViewKeyboardHandler =
    useCallback<KeyboardHandlerRegistration>(
      (handler: KeyboardHandler | null) => {
        setTreeViewKeyboardHandler(() => handler);
      },
      [],
    );

  // Determine which data to display
  const displayData = useMemo((): JsonValue => {
    if (
      jqState.isActive &&
      jqState.transformedData !== null &&
      !jqState.showOriginal
    ) {
      return jqState.transformedData as JsonValue;
    }
    return initialData ?? null;
  }, [
    jqState.isActive,
    jqState.transformedData,
    jqState.showOriginal,
    initialData,
  ]);

  // Determine current mode for help system
  const currentMode = useMemo((): AppMode => {
    if (searchState.isSearching || searchState.searchTerm) {
      return "search" as const;
    } else if (ui.treeViewMode) {
      return "tree" as const;
    } else if (jqState.isActive) {
      return "filter" as const;
    } else if (ui.collapsibleMode) {
      return "collapsible" as const;
    } else if (ui.schemaVisible) {
      return "schema" as const;
    } else {
      return "raw" as const;
    }
  }, [
    searchState.isSearching,
    searchState.searchTerm,
    ui.treeViewMode,
    jqState.isActive,
    ui.collapsibleMode,
    ui.schemaVisible,
  ]);

  return (
    <ModalManager
      currentMode={currentMode}
      displayData={displayData}
      initialError={initialError}
    >
      <Box flexDirection="column" width="100%">
        {/* Status bars and warnings */}
        <StatusBarManager keyboardEnabled={keyboardEnabled} />

        {/* Main content router */}
        <ContentRouter
          displayData={displayData}
          keyboardEnabled={keyboardEnabled}
          currentMode={currentMode}
          safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
          collapsibleViewerRef={collapsibleViewerRef}
        />

        {/* Keyboard input manager */}
        <KeyboardManager
          keyboardEnabled={keyboardEnabled}
          initialData={initialData}
          displayData={displayData}
          currentMode={currentMode}
          treeViewKeyboardHandler={treeViewKeyboardHandler}
          collapsibleViewerRef={collapsibleViewerRef}
          safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
        />

        {/* Global notification toast - always rendered last to be on top */}
        <NotificationToast />

        {/* Global confirmation dialog - always rendered last to be on top */}
        <ConfirmationDialog
          terminalWidth={terminalCalculations.terminalSize.width}
        />
      </Box>
    </ModalManager>
  );
}
