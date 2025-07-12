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
  format: "json";
  rememberLocation: boolean;
}
