import { Box, Text } from "ink";
import type { SearchState } from "../types/app.js";
import { getSearchNavigationInfo } from "../utils/searchUtils.js";

interface SearchBarProps {
  searchState: SearchState;
  searchInput: string;
}

export function SearchBar({ searchState, searchInput }: SearchBarProps) {
  if (!searchState.isSearching && !searchState.searchTerm) {
    return null;
  }

  const navigationInfo = getSearchNavigationInfo(
    searchState.searchResults,
    searchState.currentResultIndex,
  );

  return (
    <Box borderStyle="single" borderColor="yellow" padding={1}>
      <Box flexGrow={1}>
        {searchState.isSearching ? (
          <>
            <Text color="yellow">Search: </Text>
            <Text color="white">{searchInput}</Text>
            <Text color="yellow">█</Text>
            <Text color="gray" dimColor>
              {" "}
              (Enter: confirm, Esc: cancel)
            </Text>
          </>
        ) : (
          <>
            <Text color="yellow">Search: </Text>
            <Text color="white">{searchState.searchTerm}</Text>
            <Text color="gray" dimColor>
              {" "}
              ({navigationInfo}) n: next, N: prev, s: new search
            </Text>
          </>
        )}
      </Box>
    </Box>
  );
}
