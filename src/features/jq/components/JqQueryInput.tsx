/**
 * jq Query Input Component
 */

import { useConfig } from "@core/context/ConfigContext";
import { Box, Text } from "ink";
import { renderTextWithCursor } from "../../common/components/TextInput";
import type { JqState } from "../types/jq";

interface JqQueryInputProps {
  jqState: JqState;
  queryInput: string;
  cursorPosition?: number;
  errorScrollOffset?: number;
  focusMode?: "input" | "json";
  onQueryChange?: (query: string) => void;
}

export function JqQueryInput({
  jqState,
  queryInput,
  cursorPosition = 0,
  errorScrollOffset = 0,
  focusMode = "input",
}: JqQueryInputProps) {
  const config = useConfig();

  // Get appearance settings
  const appearance = config.display.interface.appearance;
  const borderStyle = appearance.borders.style;
  const height = appearance.heights.jqInput;
  const primaryColor = appearance.colors.primary;
  const mutedColor = appearance.colors.muted;
  const textColor = appearance.colors.text.primary;
  const errorColor = appearance.colors.error;

  const getStatusColor = () => {
    if (jqState.isProcessing) return appearance.colors.warning;
    if (jqState.error) return appearance.colors.error;
    if (jqState.transformedData !== null) return appearance.colors.success;
    return appearance.borders.colors.jq;
  };

  const getStatusText = () => {
    if (jqState.isProcessing) return "Processing...";
    if (jqState.transformedData !== null) {
      const viewType = jqState.showOriginal ? "Original" : "Transformed";
      return `${viewType} JSON`;
    }
    return "Ready";
  };

  // Split error message into lines for scrolling
  const errorLines = jqState.error ? jqState.error.split("\n") : [];
  const maxErrorLines = 2; // 3 total height - 1 for border = 2 content lines
  const visibleErrorLines = errorLines.slice(
    errorScrollOffset,
    errorScrollOffset + maxErrorLines,
  );

  // Render text with cursor
  const { beforeCursor, atCursor, afterCursor } = renderTextWithCursor(
    queryInput,
    cursorPosition,
  );

  return (
    <Box
      borderStyle={borderStyle}
      borderColor={getStatusColor()}
      padding={1}
      width="100%"
      flexDirection="column"
      flexShrink={0}
      height={height}
      overflow="hidden"
    >
      <Box marginBottom={1}>
        <Text bold color={primaryColor}>
          jq Query:
        </Text>
        <Text color={mutedColor}>
          {focusMode === "input"
            ? " (Enter: apply, Esc: exit, Tab: view result)"
            : jqState.transformedData !== null
              ? " (i: edit query, Tab: edit mode, o: toggle original/transformed, j/k: scroll, gg/G: goto)"
              : " (i: edit query, Tab: edit mode, j/k: scroll, gg/G: goto)"}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={textColor} backgroundColor="black">
          {beforeCursor}
          <Text color="black" backgroundColor={textColor}>
            {atCursor}
          </Text>
          {afterCursor}
        </Text>
      </Box>

      <Box>
        <Text color={getStatusColor()}>Status: {getStatusText()}</Text>
      </Box>

      {/* Error message in scrollable box */}
      {jqState.error && (
        <Box
          borderStyle={borderStyle}
          borderColor={errorColor}
          marginTop={1}
          paddingX={1}
          paddingY={0}
          flexDirection="column"
          width="100%"
          minHeight={5}
        >
          {/* Header row */}
          <Box flexDirection="row" justifyContent="space-between">
            <Text bold color={errorColor}>
              Error:
            </Text>
            {errorLines.length > maxErrorLines && (
              <Text color={errorColor} dimColor>
                {errorScrollOffset + 1}-
                {Math.min(errorScrollOffset + maxErrorLines, errorLines.length)}
                /{errorLines.length} (Shift+↑/↓)
              </Text>
            )}
          </Box>
          {/* Content area */}
          <Box flexDirection="column" marginTop={1}>
            {visibleErrorLines.map((line, index) => (
              <Text
                key={`${line}-${errorScrollOffset + index}`}
                color={errorColor}
              >
                {line || " "}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
