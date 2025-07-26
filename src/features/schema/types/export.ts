/**
 * Export functionality type definitions
 */

export interface ExportDialogState {
  isVisible: boolean;
  mode: "simple" | "advanced";
}

export interface ExportPreferences {
  lastDirectory: string;
  defaultFilename: string;
  format: "json" | "schema" | "yaml" | "csv";
  rememberLocation: boolean;
}

export interface DataExportOptions {
  includeTransformed: boolean;
  includeOriginal: boolean;
  includeFiltered: boolean;
  format: "json" | "schema" | "yaml" | "csv";
  csvOptions?: {
    delimiter: string;
    includeHeaders: boolean;
    flattenArrays: boolean;
  };
}
