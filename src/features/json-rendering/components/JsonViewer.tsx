import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering/utils/jsonHighlighter";

// Define the data processor for JSON formatting
const jsonDataProcessor: DataProcessor = (data: JsonValue | null) => {
  if (!data) return null;

  try {
    // Format JSON with 2-space indentation for clean display
    const formattedJson = JSON.stringify(data, null, 2);
    return formattedJson.split("\n");
  } catch {
    return ["Error: Unable to format JSON"];
  }
};

export function JsonViewer(props: BaseViewerProps) {
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
