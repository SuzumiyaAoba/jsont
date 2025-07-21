/**
 * Search state hooks using jotai atoms
 */

import {
  cancelSearchAtom,
  currentResultIndexAtom,
  currentSearchResultAtom,
  cycleScopeAtom,
  hasSearchResultsAtom,
  isSearchingAtom,
  nextSearchResultAtom,
  previousSearchResultAtom,
  searchCursorPositionAtom,
  searchInputAtom,
  searchResultsAtom,
  searchScopeAtom,
  searchStateAtom,
  searchTermAtom,
  startSearchAtom,
  updateSearchResultsAtom,
} from "@store/atoms/search";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useSearchInput = () => useAtom(searchInputAtom);
export const useSearchCursorPosition = () => useAtom(searchCursorPositionAtom);
export const useIsSearching = () => useAtom(isSearchingAtom);
export const useSearchTerm = () => useAtom(searchTermAtom);
export const useSearchResults = () => useAtom(searchResultsAtom);
export const useCurrentResultIndex = () => useAtom(currentResultIndexAtom);
export const useSearchScope = () => useAtom(searchScopeAtom);

// Read-only hooks
export const useSearchState = () => useAtomValue(searchStateAtom);
export const useHasSearchResults = () => useAtomValue(hasSearchResultsAtom);
export const useCurrentSearchResult = () =>
  useAtomValue(currentSearchResultAtom);

// Action hooks
export const useStartSearch = () => useSetAtom(startSearchAtom);
export const useCancelSearch = () => useSetAtom(cancelSearchAtom);
export const useUpdateSearchResults = () => useSetAtom(updateSearchResultsAtom);
export const useNextSearchResult = () => useSetAtom(nextSearchResultAtom);
export const usePreviousSearchResult = () =>
  useSetAtom(previousSearchResultAtom);
export const useCycleScope = () => useSetAtom(cycleScopeAtom);
