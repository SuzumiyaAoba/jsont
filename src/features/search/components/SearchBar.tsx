import { useConfig } from "@core/context/ConfigContext";
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
  const config = useConfig();

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

  // Get appearance settings
  const appearance = config.display.interface.appearance;
  const borderStyle = appearance.borders.style;
  const borderColor = appearance.borders.colors.search;
  const height = appearance.heights.searchBar;
  const labelColor = appearance.colors.secondary;
  const textColor = appearance.colors.text.primary;
  const mutedColor = appearance.colors.muted;
  const primaryColor = appearance.colors.primary;

  return (
    <Box
      borderStyle={borderStyle}
      borderColor={borderColor}
      padding={1}
      width="100%"
      height={height}
      overflow="hidden"
    >
      <Box flexDirection="row" width="100%">
        <Box flexGrow={1}>
          {searchState.isSearching ? (
            <>
              <Text color={labelColor}>Search: </Text>
              <Text color={textColor}>
                {beforeCursor}
                <Text color="black" backgroundColor={labelColor}>
                  {atCursor}
                </Text>
                {afterCursor}
              </Text>
              <Text color={mutedColor} dimColor>
                {" "}
                (Enter: confirm, Esc: cancel, Tab: scope, Ctrl+R: regex)
              </Text>
            </>
          ) : (
            <>
              <Text color={labelColor}>Search: </Text>
              <Text color={textColor}>{searchState.searchTerm}</Text>
              <Text color={mutedColor} dimColor>
                {" "}
                ({navigationInfo}) n: next, N: prev, /: new search, Tab: scope
              </Text>
            </>
          )}
        </Box>
        <Box marginLeft={2}>
          <Text color={primaryColor}>[</Text>
          <Text
            color={textColor}
            {...(searchState.searchScope === "all" && {
              backgroundColor: appearance.colors.info,
            })}
          >
            {scopeDisplayName}
          </Text>
          <Text color={primaryColor}>]</Text>
          <Text color={mutedColor}> </Text>
          <Text color={primaryColor}>[</Text>
          <Text
            color={
              searchState.isRegexMode ? appearance.colors.success : mutedColor
            }
            {...(searchState.isRegexMode && {
              backgroundColor: "darkGreen",
            })}
          >
            {regexModeDisplayName}
          </Text>
          <Text color={primaryColor}>]</Text>
        </Box>
      </Box>
    </Box>
  );
});
