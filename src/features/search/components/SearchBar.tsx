import type {
  SearchScope,
  SearchState,
} from "@features/search/types/search.js";
import {
  getSearchNavigationInfo,
  getSearchScopeDisplayName,
} from "@features/search/utils/searchUtils.js";
import { Box, Text } from "ink";

interface SearchBarProps {
  searchState: SearchState;
  searchInput: string;
  onScopeChange?: (scope: SearchScope) => void;
}

export function SearchBar({
  searchState,
  searchInput,
  onScopeChange: _onScopeChange,
}: SearchBarProps) {
  const navigationInfo = getSearchNavigationInfo(
    searchState.searchResults,
    searchState.currentResultIndex,
  );

  const scopeDisplayName = getSearchScopeDisplayName(searchState.searchScope);

  return (
    <Box borderStyle="single" borderColor="yellow" padding={1} width="100%">
      <Box flexDirection="row" width="100%">
        <Box flexGrow={1}>
          {searchState.isSearching ? (
            <>
              <Text color="yellow">Search: </Text>
              <Text color="white">{searchInput}</Text>
              <Text color="yellow">█</Text>
              <Text color="gray" dimColor>
                {" "}
                (Enter: confirm, Esc: cancel, Tab: scope)
              </Text>
            </>
          ) : (
            <>
              <Text color="yellow">Search: </Text>
              <Text color="white">{searchState.searchTerm}</Text>
              <Text color="gray" dimColor>
                {" "}
                ({navigationInfo}) n: next, N: prev, s: new search, Tab: scope
              </Text>
            </>
          )}
        </Box>
        <Box marginLeft={2}>
          <Text color="cyan">[</Text>
          <Text
            color="white"
            {...(searchState.searchScope === "all" && {
              backgroundColor: "blue",
            })}
          >
            {scopeDisplayName}
          </Text>
          <Text color="cyan">]</Text>
        </Box>
      </Box>
    </Box>
  );
}
