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

  const renderJson = (obj: JsonValue, indent = 0): React.ReactNode => {
    const spaces = "  ".repeat(indent);

    if (obj === null) {
      return <Text color="gray">null</Text>;
    }

    if (typeof obj === "string") {
      return <Text color="green">"{obj}"</Text>;
    }

    if (typeof obj === "number") {
      return <Text color="cyan">{obj}</Text>;
    }

    if (typeof obj === "boolean") {
      return <Text color="yellow">{obj.toString()}</Text>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <Text>[]</Text>;
      }

      return (
        <Box flexDirection="column">
          <Text>[</Text>
          {obj.map((item, index) => (
            <Box
              key={`array-${indent}-${index}-${typeof item === "object" ? JSON.stringify(item).slice(0, 10) : String(item)}`}
            >
              <Text>{spaces} </Text>
              {renderJson(item, indent + 1)}
              {index < obj.length - 1 && <Text>,</Text>}
            </Box>
          ))}
          <Text>{spaces}]</Text>
        </Box>
      );
    }

    if (typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <Text>{"{}"}</Text>;
      }

      return (
        <Box flexDirection="column">
          <Text>{"{"}</Text>
          {keys.map((key, index) => (
            <Box key={`object-${key}`}>
              <Text>{spaces} </Text>
              <Text color="blue">"{key}"</Text>
              <Text>: </Text>
              {renderJson(obj[key] ?? null, indent + 1)}
              {index < keys.length - 1 && <Text>,</Text>}
            </Box>
          ))}
          <Text>
            {spaces}
            {"}"}
          </Text>
        </Box>
      );
    }

    return <Text>{String(obj)}</Text>;
  };

  return (
    <Box flexGrow={1} flexDirection="column" padding={1}>
      {renderJson(data)}
    </Box>
  );
}
