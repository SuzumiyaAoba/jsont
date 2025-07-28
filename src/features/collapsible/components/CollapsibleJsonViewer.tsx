/**
 * Collapsible JSON viewer component - Refactored with modular hooks
 */

import type { JsonValue, SearchResult } from "@core/types/index";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { Box } from "ink";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import {
  useCollapsibleNavigation,
  useCollapsibleState,
  useDisplayLines,
  useSearchHighlighting,
} from "../hooks";
import { CollapsibleLine } from "./CollapsibleLine";

interface CollapsibleJsonViewerProps {
  data: JsonValue | null;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  visibleLines?: number;
  showLineNumbers?: boolean;
  onNavigate?: (action: NavigationAction) => void;
  onScrollChange?: (newScrollOffset: number) => void;
}

export const CollapsibleJsonViewer = forwardRef<
  { navigate: (action: NavigationAction) => void },
  CollapsibleJsonViewerProps
>(function CollapsibleJsonViewer(
  {
    data,
    scrollOffset = 0,
    searchTerm = "",
    searchResults = [],
    currentSearchIndex = 0,
    visibleLines,
    showLineNumbers = false,
    onNavigate,
    onScrollChange,
  },
  ref,
) {
  // Use custom hooks for state management
  const { collapsibleState, setCollapsibleState, config } =
    useCollapsibleState(data);
  const displayLines = useDisplayLines(collapsibleState, config);
  const { searchResultsByLine, renderLineWithHighlighting } =
    useSearchHighlighting(searchTerm, searchResults, scrollOffset);

  // Calculate effective visible lines
  const effectiveVisibleLines = Math.max(
    1,
    visibleLines || Math.max(10, displayLines.length),
  );

  // Set up navigation handling
  const { handleNavigationAction } = useCollapsibleNavigation(
    collapsibleState,
    setCollapsibleState,
    scrollOffset,
    effectiveVisibleLines,
    onNavigate,
    onScrollChange,
  );

  // Expose navigation function to parent via ref
  useImperativeHandle(ref, () => ({
    navigate: handleNavigationAction,
  }));

  // Calculate visible range
  const startLine = scrollOffset;
  const endLine = Math.min(
    startLine + effectiveVisibleLines,
    displayLines.length,
  );

  const visibleLineData = displayLines.slice(startLine, endLine);
  const visibleNodes = collapsibleState.flattenedNodes.slice(
    startLine,
    endLine,
  );

  // Calculate line number formatting
  const totalLines = displayLines.length;
  const lineNumberWidth = totalLines.toString().length;

  // Memoized line rendering
  const renderedLines = useMemo(() => {
    return visibleLineData
      .map((line, index) => {
        const originalIndex = index;
        const node = visibleNodes[index];
        const globalLineIndex = startLine + index;

        if (!node || !line) return null;

        const uniqueKey = `collapsible-line-${globalLineIndex}`;
        const lineSearchResults =
          searchResultsByLine.get(globalLineIndex) || [];
        const hasSearchHighlight = searchTerm && lineSearchResults.length > 0;
        const isCurrentSearchResult =
          hasSearchHighlight &&
          searchResults.length > 0 &&
          currentSearchIndex < searchResults.length &&
          searchResults[currentSearchIndex]?.line === globalLineIndex;

        const { highlightedTokens, isCursorLine } = renderLineWithHighlighting(
          line,
          node,
          originalIndex,
          collapsibleState.cursorPosition,
          startLine,
        );

        return (
          <CollapsibleLine
            key={uniqueKey}
            line={line}
            globalLineIndex={globalLineIndex}
            showLineNumbers={showLineNumbers}
            lineNumberWidth={lineNumberWidth}
            isCursorLine={isCursorLine}
            hasSearchHighlight={hasSearchHighlight}
            isCurrentSearchResult={isCurrentSearchResult}
            highlightedTokens={highlightedTokens}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
          />
        );
      })
      .filter(Boolean);
  }, [
    visibleLineData,
    visibleNodes,
    startLine,
    searchResultsByLine,
    searchTerm,
    searchResults,
    currentSearchIndex,
    renderLineWithHighlighting,
    collapsibleState.cursorPosition,
    showLineNumbers,
    lineNumberWidth,
  ]);

  return <Box flexDirection="column">{renderedLines}</Box>;
});
