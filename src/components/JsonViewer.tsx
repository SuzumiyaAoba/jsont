import { Box, Text } from "ink";
import React from "react";
import type { JsonValue, SearchResult } from "../types/index";
import { highlightSearchInLine } from "../utils/searchUtils";

interface JsonViewerProps {
  data: JsonValue;
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

  // Apply syntax highlighting to a single text segment
  const applySyntaxHighlight = (
    text: string,
    line: string,
  ): React.ReactNode => {
    const trimmedLine = line.trim();

    // Key-value pairs with proper bracket/brace handling
    if (trimmedLine.includes(":")) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      // Extract the value part (after colon and space)
      const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
      const value = valueMatch ? valueMatch[1] : afterColon.substring(1).trim();

      // Check if the value is a structural character
      const isStructuralValue = value === "{" || value === "[";

      // Determine what part of the line this text belongs to
      if (text === beforeColon) {
        return <Text color="blue">{text}</Text>;
      } else if (text === ": ") {
        return <Text>{text}</Text>;
      } else if (text === value || text === value?.replace(/,$/, "")) {
        let valueColor = "white";
        if (isStructuralValue) {
          valueColor = value === "{" ? "magenta" : "cyan"; // Objects: magenta, Arrays: cyan
        } else if (value?.startsWith('"') && value.endsWith('"')) {
          valueColor = "green";
        } else if (value === "true" || value === "false") {
          valueColor = "yellow";
        } else if (value === "null") {
          valueColor = "gray";
        } else if (value && /^\d+(\.\d+)?$/.test(value)) {
          valueColor = "cyan";
        }
        return <Text color={valueColor}>{text}</Text>;
      } else if (text === ",") {
        return <Text>{text}</Text>;
      }
    }

    // Structural characters (braces, brackets)
    if (
      trimmedLine === "{" ||
      trimmedLine === "}" ||
      trimmedLine === "[" ||
      trimmedLine === "]" ||
      trimmedLine === "}," ||
      trimmedLine === "],"
    ) {
      const isArrayBracket = text.includes("[") || text.includes("]");
      const color = isArrayBracket ? "cyan" : "magenta"; // Arrays: cyan, Objects: magenta
      return <Text color={color}>{text}</Text>;
    }

    // Array values (numbers, strings, etc. without keys)
    if (
      trimmedLine &&
      !trimmedLine.includes(":") &&
      trimmedLine !== "{" &&
      trimmedLine !== "}" &&
      trimmedLine !== "[" &&
      trimmedLine !== "]" &&
      trimmedLine !== "}," &&
      trimmedLine !== "],"
    ) {
      const cleanValue = trimmedLine.replace(/,$/, ""); // Remove trailing comma
      let valueColor = "white";

      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        valueColor = "green";
      } else if (cleanValue === "true" || cleanValue === "false") {
        valueColor = "yellow";
      } else if (cleanValue === "null") {
        valueColor = "gray";
      } else if (/^\d+(\.\d+)?$/.test(cleanValue)) {
        valueColor = "cyan";
      }

      if (text === cleanValue || text === `${cleanValue},`) {
        return <Text color={valueColor}>{text}</Text>;
      } else if (text === ",") {
        return <Text>{text}</Text>;
      }
    }

    // Default rendering with no special color
    return <Text>{text}</Text>;
  };

  // Render line with search highlighting and syntax highlighting combined
  const renderLineWithSearch = (
    line: string,
    originalIndex: number,
    searchTerm: string,
    isCurrentResult: boolean,
  ): React.ReactNode => {
    const highlightedParts = highlightSearchInLine(line, searchTerm);

    return (
      <Text
        key={originalIndex}
        {...(isCurrentResult ? { backgroundColor: "blue" } : {})}
      >
        {highlightedParts.map((part, partIndex) => {
          const syntaxHighlighted = applySyntaxHighlight(part.text, line);

          if (part.isMatch) {
            // For search matches, override syntax highlighting with search colors
            return (
              <Text
                key={`${originalIndex}-${partIndex}-${part.text}`}
                color={isCurrentResult ? "white" : "black"}
                backgroundColor={isCurrentResult ? "magenta" : "yellow"}
                bold={isCurrentResult}
              >
                {part.text}
              </Text>
            );
          } else {
            // For non-matches, preserve syntax highlighting
            return (
              <React.Fragment
                key={`${originalIndex}-${partIndex}-${part.text}`}
              >
                {syntaxHighlighted}
              </React.Fragment>
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

    // If we have search highlights, use highlighted rendering
    if (hasSearchHighlight) {
      return renderLineWithSearch(
        line,
        originalIndex,
        searchTerm,
        isCurrentSearchResult,
      );
    }
    // Apply syntax highlighting based on content
    const trimmedLine = line.trim();

    // Key-value pairs with proper bracket/brace handling
    if (trimmedLine.includes(":")) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      // Extract the value part (after colon and space)
      const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
      const value = valueMatch ? valueMatch[1] : afterColon.substring(1).trim();

      // Check if the value is a structural character
      const isStructuralValue = value === "{" || value === "[";

      let valueColor = "white";
      if (isStructuralValue) {
        // Use different colors for different structural characters
        valueColor = value === "{" ? "magenta" : "cyan"; // Objects: magenta, Arrays: cyan
      } else if (value?.startsWith('"') && value.endsWith('"')) {
        valueColor = "green";
      } else if (value === "true" || value === "false") {
        valueColor = "yellow";
      } else if (value === "null") {
        valueColor = "gray";
      } else if (value && /^\d+(\.\d+)?$/.test(value)) {
        valueColor = "cyan";
      }

      return (
        <Text key={originalIndex}>
          <Text color="blue">{beforeColon}</Text>
          <Text>: </Text>
          <Text color={valueColor}>{value || ""}</Text>
          {line.endsWith(",") && <Text>,</Text>}
        </Text>
      );
    }

    // Structural characters (braces, brackets)
    if (
      trimmedLine === "{" ||
      trimmedLine === "}" ||
      trimmedLine === "[" ||
      trimmedLine === "]"
    ) {
      // Use different colors for different structural characters
      const isArrayBracket = trimmedLine === "[" || trimmedLine === "]";
      const color = isArrayBracket ? "cyan" : "magenta"; // Arrays: cyan, Objects: magenta

      return (
        <Text key={originalIndex} color={color}>
          {line}
        </Text>
      );
    }

    // Handle lines with closing brackets/braces that might have commas
    if (trimmedLine === "}," || trimmedLine === "],") {
      const isArrayBracket = trimmedLine.startsWith("]");
      const color = isArrayBracket ? "cyan" : "magenta";
      const bracket = trimmedLine.charAt(0);

      return (
        <Text key={originalIndex}>
          <Text>{line.substring(0, line.indexOf(trimmedLine))}</Text>
          <Text color={color}>{bracket}</Text>
          <Text>,</Text>
        </Text>
      );
    }

    // Array values (numbers, strings, etc. without keys)
    if (
      trimmedLine &&
      !trimmedLine.includes(":") &&
      trimmedLine !== "{" &&
      trimmedLine !== "}" &&
      trimmedLine !== "[" &&
      trimmedLine !== "]" &&
      trimmedLine !== "}," &&
      trimmedLine !== "],"
    ) {
      const cleanValue = trimmedLine.replace(/,$/, ""); // Remove trailing comma
      let valueColor = "white";

      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        valueColor = "green";
      } else if (cleanValue === "true" || cleanValue === "false") {
        valueColor = "yellow";
      } else if (cleanValue === "null") {
        valueColor = "gray";
      } else if (/^\d+(\.\d+)?$/.test(cleanValue)) {
        valueColor = "cyan";
      }

      return (
        <Text key={originalIndex}>
          <Text>{line.substring(0, line.indexOf(trimmedLine))}</Text>
          <Text color={valueColor}>{cleanValue}</Text>
          {line.endsWith(",") && <Text>,</Text>}
        </Text>
      );
    }

    // Default rendering
    return <Text key={originalIndex}>{line}</Text>;
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
