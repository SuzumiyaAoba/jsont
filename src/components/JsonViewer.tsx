import { Box, Text } from "ink";
import type React from "react";
import type { JsonValue } from "../types/index.js";

interface JsonViewerProps {
  data: JsonValue;
}

export function JsonViewer({ data }: JsonViewerProps) {
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

      let valueColor = "white";
      if (value && value.startsWith('"') && value.endsWith('"')) {
        valueColor = "green";
      } else if (value === "true" || value === "false") {
        valueColor = "yellow";
      } else if (value === "null") {
        valueColor = "gray";
      } else if (value && /^\d+(\.\d+)?$/.test(value)) {
        valueColor = "cyan";
      }

      return (
        <Text key={index}>
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
      return (
        <Text key={index} color="magenta">
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
        <Text key={index}>
          <Text>{line.substring(0, line.indexOf(trimmedLine))}</Text>
          <Text color={valueColor}>{cleanValue}</Text>
          {line.endsWith(",") && <Text>,</Text>}
        </Text>
      );
    }

    // Default rendering
    return <Text key={index}>{line}</Text>;
  };

  return (
    <Box flexGrow={1} flexDirection="column" padding={1}>
      <Box flexDirection="column">
        {lines.map((line, index) => renderLine(line, index))}
      </Box>
    </Box>
  );
}
