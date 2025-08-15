import { useLineFormatting } from "@features/common/hooks/useLineFormatting";
import { useScrolling } from "@features/common/hooks/useScrolling";
import { useSearchResults } from "@features/common/hooks/useSearchResults";
import type {
  BaseViewerProps,
  ContentRenderer,
  DataProcessor,
  EmptyStateConfig,
  Highlighter,
  HighlightToken,
} from "@features/common/types/viewer";
import { Box, Text } from "ink";
import type React from "react";

interface BaseViewerComponentProps extends BaseViewerProps {
  /**
   * Function to process raw data into displayable lines
   */
  dataProcessor: DataProcessor;

  /**
   * Highlighter for syntax and search highlighting
   */
  highlighter: Highlighter;

  /**
   * Function to render the content area
   * If not provided, uses default line-by-line rendering
   */
  contentRenderer?: ContentRenderer;

  /**
   * Configuration for empty state display
   */
  emptyStateConfig: EmptyStateConfig;
}

/**
 * BaseViewer: Shared component for all viewer types
 * Eliminates duplication of scrolling, search, and line numbering logic
 */
export function BaseViewer({
  data,
  scrollOffset = 0,
  searchTerm = "",
  searchResults = [],
  currentSearchIndex = 0,
  visibleLines,
  showLineNumbers = false,
  isRegexMode = false,
  dataProcessor,
  highlighter,
  contentRenderer,
  emptyStateConfig,
}: BaseViewerComponentProps) {
  // Process data into displayable lines first
  const lines = data ? dataProcessor(data) : null;

  // Use shared hooks for common functionality (hooks must be called unconditionally)
  const { startLine, endLine } = useScrolling(
    lines?.length || 0,
    scrollOffset,
    visibleLines,
  );

  const { formatLineNumber } = useLineFormatting(lines?.length || 0);

  const { searchResultsByLine } = useSearchResults(searchResults);

  // Handle empty data state
  if (!data) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={emptyStateConfig.color || "gray"}>
          {emptyStateConfig.message}
        </Text>
      </Box>
    );
  }

  if (!lines) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color="red">Error processing data</Text>
      </Box>
    );
  }

  // Determine if a line contains the current search result
  const isCurrentResultLine = (lineIndex: number): boolean => {
    if (!searchResults.length || currentSearchIndex < 0) return false;

    const currentResult = searchResults[currentSearchIndex];
    return currentResult ? currentResult.lineIndex === lineIndex : false;
  };

  // Check if a line has any search results using pre-computed results
  const hasSearchResults = (lineIndex: number): boolean => {
    return searchResultsByLine.has(lineIndex);
  };

  // Render line with combined syntax and search highlighting using pre-computed search results
  const renderLineWithHighlighting = (
    line: string,
    originalIndex: number,
    searchTerm: string,
    isCurrentResult: boolean,
  ): React.ReactNode => {
    // First tokenize the line for syntax highlighting
    const syntaxTokens = highlighter.tokenizeLine(line);

    // Only apply search highlighting if this line has search results or searchTerm is provided
    const shouldHighlightSearch =
      searchTerm &&
      (hasSearchResults(originalIndex) || searchTerm.trim().length > 0);

    // Get current result position if this line contains the current result
    let currentResultPosition: {
      columnStart: number;
      columnEnd: number;
    } | null = null;
    if (isCurrentResult && searchResults.length && currentSearchIndex >= 0) {
      const currentResult = searchResults[currentSearchIndex];
      if (currentResult && currentResult.lineIndex === originalIndex) {
        currentResultPosition = {
          columnStart: currentResult.columnStart,
          columnEnd: currentResult.columnEnd,
        };
      }
    }

    const highlightedTokens = shouldHighlightSearch
      ? highlighter.applySearchHighlighting(
          syntaxTokens,
          searchTerm,
          isCurrentResult,
          isRegexMode,
          currentResultPosition,
        )
      : syntaxTokens;

    // Render the tokens - allow horizontal scrolling for long lines
    return (
      <Text key={originalIndex}>
        {highlightedTokens.map((token: HighlightToken, tokenIndex: number) => {
          const key = `${originalIndex}-${tokenIndex}-${token.text}`;

          if (token.isMatch) {
            return (
              <Text
                key={key}
                color={token.color}
                backgroundColor={token.color === "white" ? "yellow" : "blue"}
              >
                {token.text}
              </Text>
            );
          }

          return (
            <Text key={key} color={token.color}>
              {token.text}
            </Text>
          );
        })}
      </Text>
    );
  };

  // Calculate visible lines
  const visibleLineData = lines.slice(startLine, endLine);

  // Default content renderer
  const defaultContentRenderer: ContentRenderer = (
    _lines,
    visibleLineData,
    startLine,
    _endLine,
    formatLineNumber,
    renderLineWithHighlighting,
  ) => {
    return (
      <Box flexDirection="column">
        {visibleLineData.map((line, index) => {
          const originalIndex = startLine + index;
          const isCurrentResult = isCurrentResultLine(originalIndex);

          return (
            <Box key={originalIndex} flexDirection="row" width="100%">
              {showLineNumbers && (
                <Box marginRight={1} flexShrink={0}>
                  <Text color="gray">{formatLineNumber(originalIndex)}:</Text>
                </Box>
              )}
              <Box flexGrow={1} flexShrink={0} minWidth={0}>
                {renderLineWithHighlighting(
                  line,
                  originalIndex,
                  searchTerm,
                  isCurrentResult,
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  // Use custom renderer or default
  const renderContent = contentRenderer || defaultContentRenderer;

  // Adjust height to account for border height (2 lines: top + bottom border)
  const borderHeight = 2;
  const adjustedHeight = Math.max(1, (visibleLines || 10) - borderHeight);

  // For cases where line splitting creates more lines than the original height limit,
  // allow some flexibility to ensure content visibility
  const actualContentLines = visibleLineData.length;
  const flexibleHeight = Math.max(
    adjustedHeight,
    Math.min(actualContentLines + 2, adjustedHeight + 3),
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      width="100%"
      height={flexibleHeight}
    >
      {renderContent(
        lines,
        visibleLineData,
        startLine,
        endLine,
        formatLineNumber,
        renderLineWithHighlighting,
      )}
    </Box>
  );
}
