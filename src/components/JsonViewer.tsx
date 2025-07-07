import { Box, Text } from "ink";
import type React from "react";
import type { JsonValue, SearchResult } from "../types/index.js";
import { highlightSearchInLine } from "../utils/searchUtils.js";

interface JsonViewerProps {
  data: JsonValue;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
}

export function JsonViewer({
  data,
  scrollOffset = 0,
  searchTerm = "",
  searchResults = [],
  currentSearchIndex = 0,
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

  // Calculate visible area (subtract 2 for StatusBar height and padding)
  const terminalHeight = process.stdout.rows || 24;
  const visibleLines = Math.max(1, terminalHeight - 3); // Reserve space for StatusBar and padding

  // Calculate which lines to display based on scroll offset
  const startLine = scrollOffset;
  const endLine = Math.min(lines.length, startLine + visibleLines);
  const visibleLineData = lines.slice(startLine, endLine);

  // Render line with search highlighting
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
        {...(isCurrentResult ? { backgroundColor: "yellow" } : {})}
      >
        {highlightedParts.map((part, partIndex) => (
          <Text
            key={`${originalIndex}-${partIndex}-${part.text}`}
            color={part.isMatch ? "black" : "white"}
            {...(part.isMatch
              ? { backgroundColor: isCurrentResult ? "red" : "yellow" }
              : {})}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  const renderLine = (line: string, originalIndex: number): React.ReactNode => {
    // Check if this line has search results
    const lineSearchResults = searchResults.filter(
      (result) => result.lineIndex === originalIndex,
    );
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
          const uniqueKey = `line-${startLine + index}`;
          return (
            <Box key={uniqueKey}>{renderLine(line, startLine + index)}</Box>
          );
        })}
      </Box>
    </Box>
  );
}
