/**
 * Schema feature barrel exports
 */

export { ExportDialog } from "./components/ExportDialog";
// Components
export { SchemaViewer } from "./components/SchemaViewer";
// Types - Export
export type {
  DataExportOptions,
  ExportDialogState as ExportDialogStateBasic,
  ExportPreferences,
} from "./types/export";
// Types - Schema
export type {
  BaseSchemaProperties,
  JsonSchema,
  JsonSchemaProperty,
  SchemaInferenceOptions,
  SchemaViewerProps,
} from "./types/schema";

// Types - Strict Export
export type {
  BaseExportOptions,
  CreateExportOptions,
  CsvExportOptions,
  ExportConfiguration,
  ExportDialogState as ExportDialogStateStrict,
  ExportFormat,
  ExportMetadata,
  ExportResult,
  FormatOptionBuilder,
  InputMode,
  JsonExportOptions,
  OptionsForFormat,
  SchemaExportOptions,
  StrictExportOptions,
  ValidationError,
  ValidationResult,
  ValidationWarning,
  YamlExportOptions,
} from "./types/strictExport";

// Type guards from strict export
export {
  isCsvExport,
  isJsonExport,
  isSchemaExport,
  isYamlExport,
} from "./types/strictExport";
export * from "./utils/exportValidation";
export * from "./utils/fileExport";
// Utils
export * from "./utils/schemaUtils";
