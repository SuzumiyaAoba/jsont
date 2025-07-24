import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering/utils/jsonHighlighter";
import { memo, type ReactElement, useMemo } from "react";

export const JsonViewer = memo(function JsonViewer(
  props: BaseViewerProps,
): ReactElement {
  const config = useConfig();

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

        return lines;
      } catch {
        return ["Error: Unable to format JSON"];
      }
    },
    [config.display.json.useTabs, config.display.json.indent],
  );

  return (
    <BaseViewer
      {...props}
      dataProcessor={jsonDataProcessor}
      highlighter={jsonHighlighter}
      emptyStateConfig={{
        message: "No JSON data to display",
        color: "gray",
      }}
    />
  );
});
