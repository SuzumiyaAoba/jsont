import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  ContentRenderer,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering";
import type { HighlightToken } from "@features/json-rendering/utils/syntaxHighlight";
import { useIsRegexMode } from "@store/hooks/useSearch";
import { Box, Text } from "ink";
import { memo, type ReactElement, useMemo } from "react";

/**
 * Extract tokens that fall within a specific character range
 */
function extractTokensForRange(
  tokens: HighlightToken[],
  start: number,
  end: number,
): HighlightToken[] {
  const result: HighlightToken[] = [];
  let currentPosition = 0;

  for (const token of tokens) {
    const tokenStart = currentPosition;
    const tokenEnd = currentPosition + token.text.length;

    // Check if token overlaps with the desired range
    if (tokenEnd > start && tokenStart < end) {
      // Calculate the actual slice within the token
      const sliceStart = Math.max(0, start - tokenStart);
      const sliceEnd = Math.min(token.text.length, end - tokenStart);

      if (sliceStart < sliceEnd) {
        const slicedText = token.text.substring(sliceStart, sliceEnd);
        if (slicedText) {
          result.push({
            text: slicedText,
            color: token.color,
            ...(token.isMatch !== undefined && { isMatch: token.isMatch }),
          });
        }
      }
    }

    currentPosition = tokenEnd;

    // Early exit if we've passed the end
    if (currentPosition >= end) {
      break;
    }
  }

  return result;
}

export const JsonViewer = memo(function JsonViewer(
  props: BaseViewerProps,
): ReactElement {
  const config = useConfig();
  const isRegexMode = useIsRegexMode();

  // Create data processor that uses configuration for indentation - memoized
  const jsonDataProcessor: DataProcessor = useMemo(
    () => (data: JsonValue | null) => {
      if (!data) return null;

      try {
        // Use configuration for indentation
        const indent = config.display.json.useTabs
          ? "\t"
          : " ".repeat(config.display.json.indent);
        const formattedJson = JSON.stringify(data, null, indent);
        const lines = formattedJson.split("\n");

        // Handle long lines by applying maxLineLength limit for better display
        const maxLineLength = config.display.json.maxLineLength;
        const processedLines: string[] = [];

        lines.forEach((line) => {
          if (line.length <= maxLineLength) {
            processedLines.push(line);
          } else {
            // Split long lines at word boundaries when possible
            const chunks: string[] = [];
            let remaining = line;

            while (remaining.length > maxLineLength) {
              let splitIndex = maxLineLength;
              // Try to find a good break point (space, comma, etc.)
              const breakPoint = remaining.lastIndexOf(" ", maxLineLength);
              if (breakPoint > maxLineLength * 0.7) {
                splitIndex = breakPoint + 1;
              }

              chunks.push(remaining.substring(0, splitIndex));
              remaining = remaining.substring(splitIndex);
            }

            if (remaining.length > 0) {
              chunks.push(remaining);
            }

            processedLines.push(...chunks);
          }
        });

        return processedLines;
      } catch {
        return ["Error: Unable to format JSON"];
      }
    },
    [
      config.display.json.useTabs,
      config.display.json.indent,
      config.display.json.maxLineLength,
    ],
  );

  // Create a custom content renderer that handles syntax highlighting for split lines
  const customContentRenderer: ContentRenderer | undefined = useMemo(() => {
    if (!props.data) return undefined;

    // Pre-process the original JSON data to create a mapping of lines to tokens
    try {
      const indent = config.display.json.useTabs
        ? "\t"
        : " ".repeat(config.display.json.indent);
      const formattedJson = JSON.stringify(props.data, null, indent);
      const originalLines = formattedJson.split("\n");
      const maxLineLength = config.display.json.maxLineLength;

      // Create a mapping from split lines back to original line tokens
      const lineTokenMap = new Map<number, HighlightToken[]>();
      let currentDisplayLineIndex = 0;

      originalLines.forEach((originalLine) => {
        const originalTokens = jsonHighlighter.tokenizeLine(originalLine);

        if (originalLine.length <= maxLineLength) {
          lineTokenMap.set(currentDisplayLineIndex, originalTokens);
          currentDisplayLineIndex++;
        } else {
          // Split the line and map tokens to each chunk
          let currentPosition = 0;
          let remaining = originalLine;

          while (remaining.length > maxLineLength) {
            let splitIndex = maxLineLength;
            const breakPoint = remaining.lastIndexOf(" ", maxLineLength);
            if (breakPoint > maxLineLength * 0.7) {
              splitIndex = breakPoint + 1;
            }

            const chunk = remaining.substring(0, splitIndex);
            const chunkTokens = extractTokensForRange(
              originalTokens,
              currentPosition,
              currentPosition + chunk.length,
            );

            lineTokenMap.set(currentDisplayLineIndex, chunkTokens);
            currentDisplayLineIndex++;

            remaining = remaining.substring(splitIndex);
            currentPosition += splitIndex;
          }

          if (remaining.length > 0) {
            const remainingTokens = extractTokensForRange(
              originalTokens,
              currentPosition,
              currentPosition + remaining.length,
            );
            lineTokenMap.set(currentDisplayLineIndex, remainingTokens);
            currentDisplayLineIndex++;
          }
        }
      });

      // Return the custom renderer
      return (
        allLines: string[],
        visibleLineData: string[],
        startLine: number,
        _endLine: number,
        formatLineNumber: (index: number) => string,
        _renderLineWithHighlighting: (
          line: string,
          originalIndex: number,
          searchTerm: string,
          isCurrentResult: boolean,
        ) => React.ReactNode,
      ) => {
        // Build line mapping for display line index to original line number
        // Use the same improved logic as BaseViewer
        const lineMapping = new Map<number, number>();
        let currentOriginalLine = 1;

        for (let i = 0; i < allLines.length; i++) {
          const line = allLines[i];

          if (!line) continue;

          // Use the same improved heuristics as BaseViewer for line continuation detection
          const isLikelyContinuation =
            i > 0 &&
            allLines[i - 1] &&
            line.match(/^\s+/) &&
            !line.includes(":") &&
            !line.includes("{") &&
            !line.includes("}") &&
            !line.includes("[") &&
            !line.includes("]") &&
            !line.includes('"') &&
            !allLines[i - 1]!.match(/[,{}[\]"]\s*$/);

          if (!isLikelyContinuation) {
            lineMapping.set(i, currentOriginalLine);
            currentOriginalLine++;
          } else {
            const prevOriginalLine =
              lineMapping.get(i - 1) || currentOriginalLine - 1;
            lineMapping.set(i, prevOriginalLine);
          }
        }

        return (
          <Box flexDirection="column">
            {visibleLineData.map((line, index) => {
              const displayLineIndex = startLine + index;
              const originalLineNumber =
                lineMapping.get(displayLineIndex) || displayLineIndex + 1;

              // Get pre-computed tokens for this line
              const tokens = lineTokenMap.get(displayLineIndex) || [
                { text: line, color: "white" },
              ];

              return (
                <Box key={displayLineIndex} flexDirection="row" width="100%">
                  {props.showLineNumbers && (
                    <Box marginRight={1} flexShrink={0}>
                      <Text color="gray">
                        {formatLineNumber(originalLineNumber - 1)}:
                      </Text>
                    </Box>
                  )}
                  <Box flexGrow={1} flexShrink={0} minWidth={0}>
                    <Text>
                      {tokens.map((token, tokenIndex) => {
                        const key = `${displayLineIndex}-${tokenIndex}-${token.text}`;
                        return (
                          <Text key={key} color={token.color}>
                            {token.text}
                          </Text>
                        );
                      })}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      };
    } catch {
      return undefined; // Fallback to default renderer
    }
  }, [
    props.data,
    props.showLineNumbers,
    config.display.json.useTabs,
    config.display.json.indent,
    config.display.json.maxLineLength,
  ]);

  return (
    <BaseViewer
      {...props}
      isRegexMode={isRegexMode}
      dataProcessor={jsonDataProcessor}
      highlighter={jsonHighlighter}
      {...(customContentRenderer && { contentRenderer: customContentRenderer })}
      emptyStateConfig={{
        message: "No JSON data to display",
        color: "gray",
      }}
    />
  );
});
