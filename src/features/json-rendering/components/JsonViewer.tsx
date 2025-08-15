import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering";
import { useIsRegexMode } from "@store/hooks/useSearch";
import { memo, type ReactElement, useMemo } from "react";

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
        const processedLines = lines.flatMap((line) => {
          if (line.length <= maxLineLength) {
            return [line];
          }
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

          return chunks;
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

  return (
    <BaseViewer
      {...props}
      isRegexMode={isRegexMode}
      dataProcessor={jsonDataProcessor}
      highlighter={jsonHighlighter}
      emptyStateConfig={{
        message: "No JSON data to display",
        color: "gray",
      }}
    />
  );
});
