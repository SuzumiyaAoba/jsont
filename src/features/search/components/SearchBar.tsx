import type {
  SearchScope,
  SearchState,
} from "@features/search/types/search.js";
import {
  getRegexModeDisplayName,
  getSearchNavigationInfo,
  getSearchScopeDisplayName,
} from "@features/search/utils/searchUtils.js";
import { Box, Text } from "ink";
import { memo, useMemo } from "react";
import { renderTextWithCursor } from "../../common/components/TextInput";

interface SearchBarProps {
  searchState: SearchState;
  searchInput: string;
  searchCursorPosition?: number;
  onScopeChange?: (scope: SearchScope) => void;
}

export const SearchBar = memo(function SearchBar({
  searchState,
  searchInput,
  searchCursorPosition = 0,
  onScopeChange: _onScopeChange,
}: SearchBarProps) {
  const navigationInfo = useMemo(
    () =>
      getSearchNavigationInfo(
        searchState.searchResults,
        searchState.currentResultIndex,
      ),
    [searchState.searchResults, searchState.currentResultIndex],
  );

  const scopeDisplayName = useMemo(
    () => getSearchScopeDisplayName(searchState.searchScope),
    [searchState.searchScope],
  );

  const regexModeDisplayName = useMemo(
    () => getRegexModeDisplayName(searchState.isRegexMode),
    [searchState.isRegexMode],
  );

  // Render search input with cursor - memoized
  const { beforeCursor, atCursor, afterCursor } = useMemo(
    () => renderTextWithCursor(searchInput, searchCursorPosition),
    [searchInput, searchCursorPosition],
  );

  return (
    <Box
      borderStyle="single"
      borderColor="yellow"
      padding={1}
      width="100%"
      height={3}
      overflow="hidden"
    >
      <Box flexDirection="row" width="100%">
        <Box flexGrow={1}>
          {searchState.isSearching ? (
            <>
              <Text color="yellow">Search: </Text>
              <Text color="white">
                {beforeCursor}
                <Text color="black" backgroundColor="yellow">
                  {atCursor}
                </Text>
                {afterCursor}
              </Text>
              <Text color="gray" dimColor>
                {" "}
                (Enter: confirm, Esc: cancel, Tab: scope, Ctrl+R: regex)
              </Text>
            </>
          ) : (
            <>
              <Text color="yellow">Search: </Text>
              <Text color="white">{searchState.searchTerm}</Text>
              <Text color="gray" dimColor>
                {" "}
                ({navigationInfo}) n: next, N: prev, /: new search, Tab: scope
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
          <Text color="gray"> </Text>
          <Text color="cyan">[</Text>
          <Text
            color={searchState.isRegexMode ? "green" : "gray"}
            {...(searchState.isRegexMode && {
              backgroundColor: "darkGreen",
            })}
          >
            {regexModeDisplayName}
          </Text>
          <Text color="cyan">]</Text>
        </Box>
      </Box>
    </Box>
  );
});
