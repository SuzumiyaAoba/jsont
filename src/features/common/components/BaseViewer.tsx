import { useLineFormatting } from "@features/common/hooks/useLineFormatting";
import { useScrolling } from "@features/common/hooks/useScrolling";
import { useSearchResults } from "@features/common/hooks/useSearchResults";
import type {
  BaseViewerProps,
  ContentRenderer,
  DataProcessor,
  EmptyStateConfig,
} from "@features/common/types/viewer";
import {
  applySearchHighlighting,
  tokenizeLine,
} from "@features/json-rendering/utils/syntaxHighlight";
import { Box, Text } from "ink";
import type React from "react";

interface BaseViewerComponentProps extends BaseViewerProps {
  /**
   * Function to process raw data into displayable lines
   */
  dataProcessor: DataProcessor;

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
  dataProcessor,
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

  useSearchResults(searchResults); // Call hook even if not used to maintain hook order

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

  // Render line with combined syntax and search highlighting
  const renderLineWithHighlighting = (
    line: string,
    originalIndex: number,
    searchTerm: string,
    isCurrentResult: boolean,
  ): React.ReactNode => {
    // First tokenize the line for syntax highlighting
    const syntaxTokens = tokenizeLine(line, "");

    // Then apply search highlighting to the tokens
    const highlightedTokens = applySearchHighlighting(
      syntaxTokens,
      searchTerm,
      isCurrentResult,
    );

    // Render the tokens
    return (
      <Text
        key={originalIndex}
        {...(isCurrentResult ? { backgroundColor: "blue" } : {})}
      >
        {highlightedTokens.map((token, tokenIndex) => {
          const key = `${originalIndex}-${tokenIndex}-${token.text}`;

          if (token.isMatch) {
            return (
              <Text
                key={key}
                color={token.color}
                backgroundColor={isCurrentResult ? "blue" : "yellow"}
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
            <Box key={originalIndex} flexDirection="row">
              {showLineNumbers && (
                <Text color="gray">{formatLineNumber(originalIndex)}: </Text>
              )}
              {renderLineWithHighlighting(
                line,
                originalIndex,
                searchTerm,
                isCurrentResult,
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Use custom renderer or default
  const renderContent = contentRenderer || defaultContentRenderer;

  return (
    <Box flexGrow={1} flexDirection="column">
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
