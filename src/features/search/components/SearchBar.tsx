import { Box, Text } from "ink";
import type { SearchState } from "../types/search";
import { getSearchNavigationInfo } from "../utils/searchUtils";

interface SearchBarProps {
  searchState: SearchState;
  searchInput: string;
}

export function SearchBar({ searchState, searchInput }: SearchBarProps) {
  const navigationInfo = getSearchNavigationInfo(
    searchState.searchResults,
    searchState.currentResultIndex,
  );

  return (
    <Box borderStyle="single" borderColor="yellow" padding={1} width="100%">
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
