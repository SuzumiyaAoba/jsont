/**
 * Strict export type definitions with discriminated unions
 */

import type {
  CsvOptions,
  JsonOptions,
  SchemaOptions,
  YamlOptions,
} from "@core/utils/dataConverters";

export type ExportFormat = "json" | "schema" | "yaml" | "csv";

export interface BaseExportOptions {
  filename: string;
  outputDir: string;
}

export interface JsonExportOptions extends BaseExportOptions {
  format: "json";
  options?: JsonOptions;
}

export interface SchemaExportOptions extends BaseExportOptions {
  format: "schema";
  options: SchemaOptions; // Required for schema exports
}

export interface YamlExportOptions extends BaseExportOptions {
  format: "yaml";
  options?: YamlOptions;
}

export interface CsvExportOptions extends BaseExportOptions {
  format: "csv";
  options: CsvOptions; // Required for CSV exports
}

// Discriminated union for type-safe export options
export type StrictExportOptions =
  | JsonExportOptions
  | SchemaExportOptions
  | YamlExportOptions
  | CsvExportOptions;

// Export configuration for UI components
export interface ExportConfiguration {
  filename: string;
  outputDir: string;
  format: ExportFormat;
  jsonOptions?: JsonOptions;
  schemaOptions?: SchemaOptions;
  yamlOptions?: YamlOptions;
  csvOptions?: CsvOptions;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: keyof ExportConfiguration;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: keyof ExportConfiguration;
  message: string;
  suggestion?: string;
}

// Export result types
export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: ExportMetadata;
}

export interface ExportMetadata {
  format: ExportFormat;
  fileSize: number;
  exportTime: Date;
  originalDataSize: number;
  compressionRatio?: number;
}

// UI state types
export type InputMode = "filename" | "directory" | "format" | "options" | null;

export interface ExportDialogState {
  configuration: ExportConfiguration;
  validation: ValidationResult;
  ui: {
    inputMode: InputMode;
    selectedQuickDirIndex: number;
    customDirectoryPath: string | null;
    isProcessing: boolean;
  };
}

// Format-specific option builders
export interface FormatOptionBuilder<T> {
  buildOptions(config: ExportConfiguration): T;
  validateOptions(options: T): ValidationResult;
  getDefaultOptions(): T;
}

// Type guards for discriminated unions
export function isJsonExport(
  options: StrictExportOptions,
): options is JsonExportOptions {
  return options.format === "json";
}

export function isSchemaExport(
  options: StrictExportOptions,
): options is SchemaExportOptions {
  return options.format === "schema";
}

export function isYamlExport(
  options: StrictExportOptions,
): options is YamlExportOptions {
  return options.format === "yaml";
}

export function isCsvExport(
  options: StrictExportOptions,
): options is CsvExportOptions {
  return options.format === "csv";
}

// Utility type for extracting options type from format
export type OptionsForFormat<T extends ExportFormat> = T extends "json"
  ? JsonOptions
  : T extends "schema"
    ? SchemaOptions
    : T extends "yaml"
      ? YamlOptions
      : T extends "csv"
        ? CsvOptions
        : never;

// Helper type for creating format-specific export options
export type CreateExportOptions<T extends ExportFormat> = BaseExportOptions & {
  format: T;
  options: OptionsForFormat<T>;
};
