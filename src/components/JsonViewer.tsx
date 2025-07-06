import { Box, Text } from "ink";
import type React from "react";
import { useTheme } from "../hooks/useTheme.js";
import type { JsonValue } from "../types/index.js";

interface JsonViewerProps {
  data: JsonValue;
  themeName?: string;
}

export function JsonViewer({ data, themeName }: JsonViewerProps) {
  const { getColor } = useTheme(themeName);

  if (!data) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={getColor("null")}>No JSON data to display</Text>
      </Box>
    );
  }

  // Format JSON with 2-space indentation for clean display
  const formattedJson = JSON.stringify(data, null, 2);

  // Split into lines for line-by-line rendering
  const lines = formattedJson.split("\n");

  const renderLine = (line: string, index: number): React.ReactNode => {
    // Apply syntax highlighting based on content
    const trimmedLine = line.trim();

    // Key-value pairs
    if (trimmedLine.includes(":")) {
      const colonIndex = line.indexOf(":");
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex);

      // Extract the value part (after colon and space)
      const valueMatch = afterColon.match(/:\s*(.+?)(?:,\s*)?$/);
      const value = valueMatch ? valueMatch[1] : afterColon.substring(1).trim();

      let valueColor = getColor("text");
      if (value && value.startsWith('"') && value.endsWith('"')) {
        valueColor = getColor("strings");
      } else if (value === "true" || value === "false") {
        valueColor = getColor("booleans");
      } else if (value === "null") {
        valueColor = getColor("null");
      } else if (value && /^\d+(\.\d+)?$/.test(value)) {
        valueColor = getColor("numbers");
      }

      return (
        <Text key={index}>
          <Text color={getColor("keys")}>{beforeColon}</Text>
          <Text color={getColor("text")}>: </Text>
          <Text color={valueColor}>{value || ""}</Text>
          {line.endsWith(",") && <Text color={getColor("text")}>,</Text>}
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
      return (
        <Text key={index} color={getColor("structural")}>
          {line}
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
      trimmedLine !== "]"
    ) {
      const cleanValue = trimmedLine.replace(/,$/, ""); // Remove trailing comma
      let valueColor = getColor("text");

      if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
        valueColor = getColor("strings");
      } else if (cleanValue === "true" || cleanValue === "false") {
        valueColor = getColor("booleans");
      } else if (cleanValue === "null") {
        valueColor = getColor("null");
      } else if (/^\d+(\.\d+)?$/.test(cleanValue)) {
        valueColor = getColor("numbers");
      }

      return (
        <Text key={index}>
          <Text color={getColor("text")}>
            {line.substring(0, line.indexOf(trimmedLine))}
          </Text>
          <Text color={valueColor}>{cleanValue}</Text>
          {line.endsWith(",") && <Text color={getColor("text")}>,</Text>}
        </Text>
      );
    }

    // Default rendering
    return (
      <Text key={index} color={getColor("text")}>
        {line}
      </Text>
    );
  };

  return (
    <Box flexGrow={1} flexDirection="column" padding={1}>
      <Box flexDirection="column">
        {lines.map((line, index) => renderLine(line, index))}
      </Box>
    </Box>
  );
}
