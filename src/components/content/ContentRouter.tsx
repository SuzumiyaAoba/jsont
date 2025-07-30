/**
 * Content router component
 * Handles switching between TreeView, CollapsibleView, SchemaView, and JsonView
 */

import type { JsonValue } from "@core/types/index";
import { CollapsibleJsonViewer } from "@features/collapsible/components/CollapsibleJsonViewer";
import { DebugBar } from "@features/debug/components/DebugBar";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { SchemaViewer } from "@features/schema/components/SchemaViewer";
import { TreeView } from "@features/tree/components/TreeView";
import { useAppState } from "@components/providers/AppStateProvider";
import { Box } from "ink";
import type { ReactElement } from "react";
import { useCallback, useRef } from "react";

interface ContentRouterProps {
  displayData: JsonValue;
  keyboardEnabled: boolean;
  currentMode: string;
  safeSetTreeViewKeyboardHandler: (handler: any) => void;
}

export function ContentRouter({
  displayData,
  keyboardEnabled,
  currentMode,
  safeSetTreeViewKeyboardHandler,
}: ContentRouterProps): ReactElement {
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

  const collapsibleViewerRef = useRef<{ scrollToLine: (line: number) => void }>(
    null,
  );

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

  // Don't show content when help is visible (it's handled by ModalManager)
  if (helpVisible) {
    return <></>;
  }

  return (
    <>
      {/* Main content area */}
      <Box flexGrow={1} flexDirection="column">
        {treeViewMode ? (
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