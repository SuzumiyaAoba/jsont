import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering/utils/jsonHighlighter";

export function JsonViewer(props: BaseViewerProps) {
  const config = useConfig();

  // Create data processor that uses configuration for indentation
  const jsonDataProcessor: DataProcessor = (data: JsonValue | null) => {
    if (!data) return null;

    try {
      // Use configuration for indentation
      const indent = config.display.json.useTabs
        ? "\t"
        : " ".repeat(config.display.json.indent);
      const formattedJson = JSON.stringify(data, null, indent);
      return formattedJson.split("\n");
    } catch {
      return ["Error: Unable to format JSON"];
    }
  };

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
}
