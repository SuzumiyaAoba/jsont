/**
 * Search functionality type definitions
 */

export interface SearchState {
  isSearching: boolean;
  searchTerm: string;
  searchResults: SearchResult[];
  currentResultIndex: number;
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
}
