/**
 * Content router component
 * Handles switching between TreeView, CollapsibleView, SchemaView, and JsonView
 */

import { useAppState } from "@components/providers/AppStateProvider";
import type { AppMode, KeyboardHandlerRegistration } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { CollapsibleJsonViewer } from "@features/collapsible/components/CollapsibleJsonViewer";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { DebugBar } from "@features/debug/components/DebugBar";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { SchemaViewer } from "@features/schema/components/SchemaViewer";
import { EnhancedTreeView } from "@features/tree/components/EnhancedTreeView";
import { Box } from "ink";
import type { ReactElement, RefObject } from "react";
import { useCallback, useMemo } from "react";

interface ContentRouterProps {
  displayData: JsonValue;
  keyboardEnabled?: boolean;
  currentMode: AppMode;
  safeSetTreeViewKeyboardHandler: KeyboardHandlerRegistration;
  collapsibleViewerRef: RefObject<{
    navigate: (action: NavigationAction) => void;
  } | null>;
}

export function ContentRouter({
  displayData,
  keyboardEnabled = false,
  currentMode: _currentMode,
  safeSetTreeViewKeyboardHandler,
  collapsibleViewerRef,
}: ContentRouterProps): ReactElement | null {
  const {
    ui,
    searchState,
    jqState,
    scrollOffset,
    setScrollOffset,
    exportDialog,
    terminalCalculations,
  } = useAppState();

  const {
    treeViewMode,
    collapsibleMode,
    schemaVisible,
    lineNumbersVisible,
    debugVisible,
    helpVisible,
  } = ui;

  const { visibleLines, searchModeVisibleLines, jqBarHeight } =
    terminalCalculations;

  // Handle scroll changes for collapsible viewer
  const handleCollapsibleScrollChange = useCallback(
    (newOffset: number) => {
      setScrollOffset(newOffset);
    },
    [setScrollOffset],
  );

  // Calculate effective visible lines based on search state and JQ state
  const effectiveVisibleLines = useMemo(() => {
    let lines = visibleLines;

    // Adjust for SearchBar when active
    if (searchState.isSearching || searchState.searchTerm) {
      lines = searchModeVisibleLines;
    }

    // Additional adjustment for JQ Query when active
    if (jqState.isActive) {
      lines = Math.max(1, lines - jqBarHeight);
    }

    return lines;
  }, [
    visibleLines,
    searchModeVisibleLines,
    searchState.isSearching,
    searchState.searchTerm,
    jqState.isActive,
    jqBarHeight,
  ]);

  // Don't show content when help is visible (it's handled by ModalManager)
  if (helpVisible) {
    return null;
  }

  return (
    <>
      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column">
        {treeViewMode ? (
          <EnhancedTreeView
            data={displayData as JsonValue | null}
            height={effectiveVisibleLines}
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
            visibleLines={effectiveVisibleLines}
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
            visibleLines={effectiveVisibleLines}
            showLineNumbers={lineNumbersVisible}
          />
        ) : (
          <JsonViewer
            data={displayData as JsonValue | null}
            scrollOffset={scrollOffset}
            searchTerm={searchState.searchTerm}
            searchResults={searchState.searchResults}
            currentSearchIndex={searchState.currentResultIndex}
            visibleLines={effectiveVisibleLines}
            showLineNumbers={lineNumbersVisible}
          />
        )}
      </Box>

      {/* Debug bar - conditionally rendered based on debugVisible */}
      {debugVisible && !exportDialog.isVisible && (
        <Box flexShrink={0} width="100%">
          <DebugBar keyboardEnabled={keyboardEnabled} />
        </Box>
      )}
    </>
  );
}
