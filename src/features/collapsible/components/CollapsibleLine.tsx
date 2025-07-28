/**
 * Individual line component for collapsible JSON viewer
 */

import type { SearchResult } from "@core/types/index";
import type { HighlightToken } from "@features/json-rendering/utils/syntaxHighlight";
import { Box, Text } from "ink";
import type { ReactElement } from "react";

interface CollapsibleLineProps {
  line: string;
  globalLineIndex: number;
  showLineNumbers: boolean;
  lineNumberWidth: number;
  isCursorLine: boolean;
  hasSearchHighlight: boolean;
  isCurrentSearchResult: boolean;
  highlightedTokens: HighlightToken[];
  searchTerm: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
}

export function CollapsibleLine({
  globalLineIndex,
  showLineNumbers,
  lineNumberWidth,
  isCursorLine,
  hasSearchHighlight,
  isCurrentSearchResult,
  highlightedTokens,
}: CollapsibleLineProps): ReactElement {
  const formatLineNumber = (lineIndex: number): string => {
    const lineNumber = lineIndex + 1;
    return lineNumber.toString().padStart(lineNumberWidth, " ");
  };

  return (
    <Box key={`line-${globalLineIndex}`}>
      {showLineNumbers && (
        <Text
          color="gray"
          {...(isCursorLine ? { backgroundColor: "blue" } : {})}
          inverse={isCursorLine}
        >
          {formatLineNumber(globalLineIndex)}{" "}
        </Text>
      )}
      <Text
        {...(isCurrentSearchResult
          ? { backgroundColor: "yellow" }
          : hasSearchHighlight
            ? { backgroundColor: "blue" }
            : isCursorLine
              ? { backgroundColor: "blue" }
              : {})}
        inverse={isCursorLine}
      >
        {highlightedTokens.map((token, tokenIndex) => {
          const key = `${globalLineIndex}-${tokenIndex}-${token.text}`;
          return (
            <Text
              key={key}
              color={token.color}
              {...(isCurrentSearchResult
                ? { backgroundColor: "yellow" }
                : hasSearchHighlight
                  ? { backgroundColor: "blue" }
                  : isCursorLine
                    ? { backgroundColor: "blue" }
                    : {})}
            >
              {token.text}
            </Text>
          );
        })}
      </Text>
    </Box>
  );
}
