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
import { TreeView } from "@features/tree/components/TreeView";
import { Box } from "ink";
import type { ReactElement, RefObject } from "react";
import { useCallback } from "react";

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

  const { visibleLines, searchModeVisibleLines } = terminalCalculations;

  // Handle scroll changes for collapsible viewer
  const handleCollapsibleScrollChange = useCallback(
    (newOffset: number) => {
      setScrollOffset(newOffset);
    },
    [setScrollOffset],
  );

  // Calculate effective visible lines based on search state
  const effectiveVisibleLines =
    searchState.isSearching || searchState.searchTerm
      ? searchModeVisibleLines
      : visibleLines;

  // Feature flag for engine-enhanced components
  const useEngineEnhancedComponents =
    process.env["NODE_ENV"] === "development" ||
    process.env["USE_ENGINE_COMPONENTS"] === "true";

  // Don't show content when help is visible (it's handled by ModalManager)
  if (helpVisible) {
    return null;
  }

  return (
    <>
      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column">
        {treeViewMode ? (
          useEngineEnhancedComponents ? (
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
          ) : (
            <TreeView
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
          )
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
