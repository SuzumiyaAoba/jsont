/**
 * Search state atoms
 */

import type {
  SearchResult,
  SearchScope,
  SearchState,
} from "@features/search/types/search";
import { atom } from "jotai";

// Individual search atoms
export const searchInputAtom = atom<string>("");
export const searchCursorPositionAtom = atom<number>(0);
export const isSearchingAtom = atom<boolean>(false);
export const searchTermAtom = atom<string>("");
export const searchResultsAtom = atom<SearchResult[]>([]);
export const currentResultIndexAtom = atom<number>(0);
export const searchScopeAtom = atom<SearchScope>("all");
const isRegexModeAtom = atom<boolean>(false);

// Derived search state atom (for compatibility)
export const searchStateAtom = atom<SearchState>((get) => ({
  isSearching: get(isSearchingAtom),
  searchTerm: get(searchTermAtom),
  searchResults: get(searchResultsAtom),
  currentResultIndex: get(currentResultIndexAtom),
  searchScope: get(searchScopeAtom),
  isRegexMode: get(isRegexModeAtom),
}));

// Search actions
export const startSearchAtom = atom(null, (_, set, term: string) => {
  set(searchTermAtom, term);
  set(isSearchingAtom, false); // Exit search input mode after confirming search
  set(currentResultIndexAtom, 0);
});

export const cancelSearchAtom = atom(null, (_, set) => {
  set(isSearchingAtom, false);
  set(searchTermAtom, "");
  set(searchResultsAtom, []);
  set(currentResultIndexAtom, 0);
  set(searchInputAtom, "");
  set(searchCursorPositionAtom, 0);
});

export const updateSearchResultsAtom = atom(
  null,
  (
    _,
    set,
    {
      results,
      isRegexMode,
    }: { results: SearchResult[]; isRegexMode?: boolean },
  ) => {
    set(searchResultsAtom, results);
    set(currentResultIndexAtom, 0);
    if (isRegexMode !== undefined) {
      set(isRegexModeAtom, isRegexMode);
    }
  },
);
export const toggleRegexModeAtom = atom(null, (get, set) => {
  set(isRegexModeAtom, !get(isRegexModeAtom));
});

export const isRegexModeAtom_ = atom((get) => get(isRegexModeAtom));

export const nextSearchResultAtom = atom(null, (get, set) => {
  const results = get(searchResultsAtom);
  const current = get(currentResultIndexAtom);
  if (results.length > 0) {
    const newIndex = (current + 1) % results.length;
    set(currentResultIndexAtom, newIndex);
  }
});

export const previousSearchResultAtom = atom(null, (get, set) => {
  const results = get(searchResultsAtom);
  const current = get(currentResultIndexAtom);
  if (results.length > 0) {
    const newIndex = current === 0 ? results.length - 1 : current - 1;
    set(currentResultIndexAtom, newIndex);
  }
});

const SEARCH_SCOPES: SearchScope[] = ["all", "keys", "values"] as const;

export const cycleScopeAtom = atom(null, (get, set) => {
  const currentScope = get(searchScopeAtom);
  const currentIndex = SEARCH_SCOPES.indexOf(currentScope);
  const nextIndex = (currentIndex + 1) % SEARCH_SCOPES.length;
  const nextScope = SEARCH_SCOPES[nextIndex] ?? "keys";
  set(searchScopeAtom, nextScope);
});

// Computed atoms for search status
export const hasSearchResultsAtom = atom((get) => {
  const results = get(searchResultsAtom);
  return results.length > 0;
});

export const currentSearchResultAtom = atom((get) => {
  const results = get(searchResultsAtom);
  const index = get(currentResultIndexAtom);
  return results[index] || null;
});
