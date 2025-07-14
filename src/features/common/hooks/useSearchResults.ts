import type { SearchResult } from "@core/types/index";
import { useMemo } from "react";

/**
 * Hook for organizing search results by line index
 * Provides O(1) lookup for search results per line
 */
export function useSearchResults(searchResults: SearchResult[]) {
  const searchResultsByLine = useMemo(() => {
    const map = new Map<number, SearchResult[]>();

    searchResults.forEach((result) => {
      if (!map.has(result.lineIndex)) {
        map.set(result.lineIndex, []);
      }
      map.get(result.lineIndex)?.push(result);
    });

    return map;
  }, [searchResults]);

  return { searchResultsByLine };
}
