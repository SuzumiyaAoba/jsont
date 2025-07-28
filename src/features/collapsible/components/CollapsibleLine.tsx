/**
 * Individual line component for collapsible JSON viewer
 */

import type { SearchResult } from "@core/types/index";
import { Box, Text } from "ink";
import type { ReactElement } from "react";

interface Token {
  text: string;
  style: {
    color?: string;
    backgroundColor?: string;
    dim?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
  };
}

interface CollapsibleLineProps {
  line: string;
  globalLineIndex: number;
  showLineNumbers: boolean;
  lineNumberWidth: number;
  isCursorLine: boolean;
  hasSearchHighlight: boolean;
  isCurrentSearchResult: boolean;
  highlightedTokens: Token[];
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
          backgroundColor={isCursorLine ? "blue" : undefined}
          inverse={isCursorLine}
        >
          {formatLineNumber(globalLineIndex)}{" "}
        </Text>
      )}
      <Text
        backgroundColor={
          isCurrentSearchResult
            ? "yellow"
            : hasSearchHighlight
              ? "blue"
              : isCursorLine
                ? "blue"
                : undefined
        }
        inverse={isCursorLine}
      >
        {highlightedTokens.map((token, tokenIndex) => {
          const key = `${globalLineIndex}-${tokenIndex}-${token.text}`;
          return (
            <Text
              key={key}
              {...token.style}
              backgroundColor={
                token.style.backgroundColor ||
                (isCurrentSearchResult
                  ? "yellow"
                  : hasSearchHighlight
                    ? "blue"
                    : isCursorLine
                      ? "blue"
                      : undefined)
              }
            >
              {token.text}
            </Text>
          );
        })}
      </Text>
    </Box>
  );
}
