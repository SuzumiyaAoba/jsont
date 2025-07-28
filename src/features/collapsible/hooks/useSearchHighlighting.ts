/**
 * Hook for search result highlighting in collapsible view
 */

import type { SearchResult } from "@core/types/index";
import {
  applySearchHighlighting,
  tokenizeLine,
} from "@features/json-rendering/utils/syntaxHighlight";
import { useCallback, useMemo } from "react";

export function useSearchHighlighting(
  searchTerm: string,
  searchResults: SearchResult[],
) {
  // Create a map of search results by line for efficient lookup
  const searchResultsByLine = useMemo(() => {
    const map = new Map<number, SearchResult[]>();
    for (const result of searchResults) {
      const lineResults = map.get(result.lineIndex) || [];
      lineResults.push(result);
      map.set(result.lineIndex, lineResults);
    }
    return map;
  }, [searchResults]);

  // Function to render a line with search highlighting
  const renderLineWithHighlighting = useCallback(
    (
      line: string,
      node: { id: string },
      originalIndex: number,
      cursorPosition: { nodeId: string } | null,
      startLine: number,
    ) => {
      const globalLineIndex = startLine + originalIndex;
      const lineSearchResults = searchResultsByLine.get(globalLineIndex) || [];
      const isCursorLine = cursorPosition?.nodeId === node.id;

      // Tokenize the line for syntax highlighting
      const syntaxTokens = tokenizeLine(line, "");

      // Apply search highlighting to tokens
      const highlightedTokens = applySearchHighlighting(
        syntaxTokens,
        searchTerm,
        lineSearchResults.length > 0,
      );

      return {
        highlightedTokens,
        isCursorLine,
        hasSearchHighlight: searchTerm && lineSearchResults.length > 0,
      };
    },
    [searchTerm, searchResultsByLine],
  );

  return {
    searchResultsByLine,
    renderLineWithHighlighting,
  };
}
