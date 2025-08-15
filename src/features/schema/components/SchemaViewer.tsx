import type { JsonValue } from "@core/types/index";
import { BaseViewer } from "@features/common";
import type {
  BaseViewerProps,
  DataProcessor,
} from "@features/common/types/viewer";
import { jsonHighlighter } from "@features/json-rendering/utils/jsonHighlighter";
import {
  formatJsonSchema,
  handleSchemaError,
  inferJsonSchema,
} from "@features/schema";
import { useIsRegexMode } from "@store/hooks/useSearch";

// Define the data processor for schema generation
const schemaDataProcessor: DataProcessor = (data: JsonValue | null) => {
  if (!data) return null;

  try {
    // Generate JSON Schema from the data with error handling
    const schema = inferJsonSchema(data, "JSON Schema");
    const formattedSchema = formatJsonSchema(schema);
    return formattedSchema.split("\n");
  } catch (error) {
    // Fallback to error display if schema generation fails
    const errorMessage = handleSchemaError(
      error instanceof Error ? error : new Error("Schema generation failed"),
    );
    return errorMessage.split("\n");
  }
};

export function SchemaViewer(props: BaseViewerProps) {
  const isRegexMode = useIsRegexMode();

  return (
    <BaseViewer
      {...props}
      isRegexMode={isRegexMode}
      dataProcessor={schemaDataProcessor}
      highlighter={jsonHighlighter}
      emptyStateConfig={{
        message: "No JSON data to generate schema",
        color: "gray",
      }}
    />
  );
}
