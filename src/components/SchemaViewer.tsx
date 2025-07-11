import { Box, Text } from "ink";
import React from "react";
import type { JsonValue, SearchResult } from "../types/index";
import {
  formatJsonSchema,
  handleSchemaError,
  inferJsonSchema,
} from "../utils/schemaUtils";
import { highlightSearchInLine } from "../utils/searchUtils";

interface SchemaViewerProps {
  data: JsonValue;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  visibleLines?: number;
  showLineNumbers?: boolean;
}

export function SchemaViewer({
  data,
  scrollOffset = 0,
  searchTerm = "",
  searchResults = [],
  currentSearchIndex = 0,
  visibleLines,
  showLineNumbers = false,
}: SchemaViewerProps) {
  if (!data) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color="gray">No JSON data to generate schema</Text>
      </Box>
    );
  }

  // Generate JSON Schema from the data with error handling
  let formattedSchema: string;
  try {
    const schema = inferJsonSchema(data, "JSON Schema");
    formattedSchema = formatJsonSchema(schema);
  } catch (error) {
    // Fallback to error display if schema generation fails
    formattedSchema = handleSchemaError(
      error instanceof Error ? error : new Error("Schema generation failed"),
    );
  }

  // Split into lines for line-by-line rendering
  const lines = formattedSchema.split("\n");

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

  // Apply schema syntax highlighting to a single text segment
  const applySchemaHighlight = (
    text: string,
    line: string,
  ): React.ReactNode => {
    const trimmedLine = line.trim();

    // Schema-specific keywords
    if (
      trimmedLine.includes('"$schema":') ||
      trimmedLine.includes('"title":') ||
      trimmedLine.includes('"description":')
    ) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      if (text === beforeColon) {
        return <Text color="blue">{text}</Text>;
      } else if (text === ": ") {
        return <Text>{text}</Text>;
      } else if (
        text.includes(afterColon.substring(1).trim().replace(/,$/, ""))
      ) {
        return <Text color="green">{text}</Text>;
      } else if (text === ",") {
        return <Text>{text}</Text>;
      }
    }

    // Type definitions
    if (trimmedLine.includes('"type":')) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      if (text === beforeColon) {
        return <Text color="blue">{text}</Text>;
      } else if (text === ": ") {
        return <Text>{text}</Text>;
      } else if (
        text.includes(afterColon.substring(1).trim().replace(/,$/, ""))
      ) {
        return <Text color="yellow">{text}</Text>;
      } else if (text === ",") {
        return <Text>{text}</Text>;
      }
    }

    // Property names (but not special keywords)
    if (
      trimmedLine.includes(":") &&
      !trimmedLine.includes('"$') &&
      !trimmedLine.includes('"additionalProperties"') &&
      !trimmedLine.includes('"required"')
    ) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
      const value = valueMatch ? valueMatch[1] : afterColon.substring(1).trim();

      const isStructuralValue = value === "{" || value === "[";

      if (text === beforeColon) {
        return <Text color="cyan">{text}</Text>;
      } else if (text === ": ") {
        return <Text>{text}</Text>;
      } else if (text === value || text === value?.replace(/,$/, "")) {
        let valueColor = "white";
        if (isStructuralValue) {
          valueColor = value === "{" ? "magenta" : "cyan";
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
      const color = isArrayBracket ? "cyan" : "magenta";
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
      const cleanValue = trimmedLine.replace(/,$/, "");
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

  // Render line with search highlighting and schema syntax highlighting combined
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
          const syntaxHighlighted = applySchemaHighlight(part.text, line);

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

    // Apply syntax highlighting for JSON Schema
    return renderSchemaLine(line, originalIndex);
  };

  const renderSchemaLine = (
    line: string,
    originalIndex: number,
  ): React.ReactNode => {
    const trimmedLine = line.trim();

    // Schema-specific keywords
    if (
      trimmedLine.includes('"$schema":') ||
      trimmedLine.includes('"title":') ||
      trimmedLine.includes('"description":')
    ) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      return (
        <Text key={originalIndex}>
          <Text color="blue">{beforeColon}</Text>
          <Text>: </Text>
          <Text color="green">{afterColon.substring(1).trim()}</Text>
          {line.endsWith(",") && <Text>,</Text>}
        </Text>
      );
    }

    // Type definitions
    if (trimmedLine.includes('"type":')) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      return (
        <Text key={originalIndex}>
          <Text color="blue">{beforeColon}</Text>
          <Text>: </Text>
          <Text color="yellow">{afterColon.substring(1).trim()}</Text>
          {line.endsWith(",") && <Text>,</Text>}
        </Text>
      );
    }

    // Property names (but not special keywords)
    if (
      trimmedLine.includes(":") &&
      !trimmedLine.includes('"$') &&
      !trimmedLine.includes('"additionalProperties"') &&
      !trimmedLine.includes('"required"')
    ) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
      const value = valueMatch ? valueMatch[1] : afterColon.substring(1).trim();

      const isStructuralValue = value === "{" || value === "[";

      let valueColor = "white";
      if (isStructuralValue) {
        valueColor = value === "{" ? "magenta" : "cyan";
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
          <Text color="cyan">{beforeColon}</Text>
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
      const isArrayBracket = trimmedLine === "[" || trimmedLine === "]";
      const color = isArrayBracket ? "cyan" : "magenta";

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
      const cleanValue = trimmedLine.replace(/,$/, "");
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
          const uniqueKey = `schema-line-${originalIndex}`;
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
