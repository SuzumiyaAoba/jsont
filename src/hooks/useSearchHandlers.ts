/**
 * Search handling logic and result navigation
 */

import {
  searchInJson,
  searchInJsonSchema,
} from "@features/search/utils/searchUtils";
import { useResetScroll, useScrollOffset } from "@store/hooks/useNavigation";
import {
  useCurrentSearchResult,
  useSearchState,
  useUpdateSearchResults,
} from "@store/hooks/useSearch";
import { useCallback, useEffect } from "react";

interface UseSearchHandlersProps {
  initialData: unknown;
  schemaVisible: boolean;
  visibleLines: number;
  maxScroll: number;
  maxScrollSearchMode: number;
}

export function useSearchHandlers({
  initialData,
  schemaVisible,
  visibleLines,
  maxScroll,
  maxScrollSearchMode,
}: UseSearchHandlersProps) {
  const searchState = useSearchState();
  const updateSearchResults = useUpdateSearchResults();
  const resetScroll = useResetScroll();
  const [_scrollOffset, setScrollOffset] = useScrollOffset();
  const currentSearchResult = useCurrentSearchResult();

  // Helper function to scroll to search result
  const scrollToSearchResult = useCallback(
    (result: (typeof searchState.searchResults)[0]) => {
      if (result) {
        const targetLine = Math.max(
          0,
          result.lineIndex - Math.floor(visibleLines / 2),
        );
        const currentMaxScroll = searchState.isSearching
          ? maxScrollSearchMode
          : maxScroll;
        setScrollOffset(Math.min(currentMaxScroll, targetLine));
      }
    },
    [
      visibleLines,
      maxScroll,
      maxScrollSearchMode,
      searchState.isSearching,
      setScrollOffset,
    ],
  );

  // Effect to scroll to current search result when it changes
  useEffect(() => {
    if (currentSearchResult) {
      scrollToSearchResult(currentSearchResult);
    }
  }, [currentSearchResult, scrollToSearchResult]);

  // Update search results when search term or view mode changes
  useEffect(() => {
    if (searchState.searchTerm && initialData) {
      // Use appropriate search function based on current view mode
      const results = schemaVisible
        ? searchInJsonSchema(
            initialData as any,
            searchState.searchTerm,
            searchState.searchScope,
          )
        : searchInJson(
            initialData as any,
            searchState.searchTerm,
            searchState.searchScope,
          );

      updateSearchResults(results);

      // Reset scroll to top after search
      resetScroll();
    } else {
      updateSearchResults([]);
    }
  }, [
    searchState.searchTerm,
    searchState.searchScope,
    initialData,
    schemaVisible,
    updateSearchResults,
    resetScroll,
  ]);

  return {
    scrollToSearchResult,
  };
}
