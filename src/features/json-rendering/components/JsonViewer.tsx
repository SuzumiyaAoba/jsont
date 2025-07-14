import type { JsonValue, SearchResult } from "@core/types/index";
import {
  applySearchHighlighting,
  tokenizeLine,
} from "@features/json-rendering/utils/syntaxHighlight";
import { Box, Text } from "ink";
import type React from "react";

interface JsonViewerProps {
  data: JsonValue | null;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  visibleLines?: number;
  showLineNumbers?: boolean;
}

export function JsonViewer({
  data,
  scrollOffset = 0,
  searchTerm = "",
  searchResults = [],
  currentSearchIndex = 0,
  visibleLines,
  showLineNumbers = false,
}: JsonViewerProps) {
  if (!data) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color="gray">No JSON data to display</Text>
      </Box>
    );
  }

  // Format JSON with 2-space indentation for clean display
  const formattedJson = JSON.stringify(data, null, 2);

  // Split into lines for line-by-line rendering
  const lines = formattedJson.split("\n");

  // Use provided visibleLines or calculate fallback
  const effectiveVisibleLines =
    visibleLines || Math.max(1, (process.stdout.rows || 24) - 3);

  // Calculate which lines to display based on scroll offset
  const startLine = scrollOffset;
  const endLine = Math.min(lines.length, startLine + effectiveVisibleLines);
  const visibleLineData = lines.slice(startLine, endLine);

  // Calculate line number width based on total number of lines
  const totalLines = lines.length;
  const lineNumberWidth = totalLines.toString().length;

  // Format line number with padding
  const formatLineNumber = (lineIndex: number): string => {
    const lineNumber = lineIndex + 1; // Line numbers start from 1
    return lineNumber.toString().padStart(lineNumberWidth, " ");
  };

  // Create a Map for O(1) search result lookup by line index
  const searchResultsByLine = new Map<number, SearchResult[]>();
  searchResults.forEach((result) => {
    if (!searchResultsByLine.has(result.lineIndex)) {
      searchResultsByLine.set(result.lineIndex, []);
    }
    searchResultsByLine.get(result.lineIndex)?.push(result);
  });

  // Render line with combined syntax and search highlighting using token-based approach
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

    // Render the tokens locally
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
                backgroundColor={isCurrentResult ? "magenta" : "yellow"}
                bold={isCurrentResult}
              >
                {token.text}
              </Text>
            );
          } else {
            return (
              <Text key={key} color={token.color}>
                {token.text}
              </Text>
            );
          }
        })}
      </Text>
    );
  };

  const renderLine = (line: string, originalIndex: number): React.ReactNode => {
    // Check if this line has search results using O(1) Map lookup
    const lineSearchResults = searchResultsByLine.get(originalIndex) || [];
    const hasSearchHighlight = searchTerm && lineSearchResults.length > 0;
    const isCurrentSearchResult =
      searchResults.length > 0 &&
      searchResults[currentSearchIndex]?.lineIndex === originalIndex;

    // Use the new token-based rendering approach for both search and syntax highlighting
    return renderLineWithHighlighting(
      line,
      originalIndex,
      hasSearchHighlight ? searchTerm : "",
      isCurrentSearchResult,
    );
  };

  return (
    <Box flexGrow={1} flexDirection="column" padding={1}>
      <Box flexDirection="column">
        {visibleLineData.map((line, index) => {
          const originalIndex = startLine + index;
          const uniqueKey = `line-${originalIndex}`;
          return (
            <Box key={uniqueKey} flexDirection="row">
              {showLineNumbers && (
                <Box marginRight={1}>
                  <Text color="gray" dimColor>
                    {formatLineNumber(originalIndex)}
                  </Text>
                </Box>
              )}
              <Box flexGrow={1}>{renderLine(line, originalIndex)}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
