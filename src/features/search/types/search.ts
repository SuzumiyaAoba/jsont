/**
 * Search functionality type definitions
 */

export type SearchScope = "all" | "keys" | "values";

export interface SearchState {
  isSearching: boolean;
  searchTerm: string;
  searchResults: SearchResult[];
  currentResultIndex: number;
  searchScope: SearchScope;
}

export interface SearchResult {
  lineIndex: number;
  columnStart: number;
  columnEnd: number;
  matchText: string;
  contextLine: string;
}

export interface SearchBarProps {
  searchState: SearchState;
  searchInput: string;
  onScopeChange?: (scope: SearchScope) => void;
}
