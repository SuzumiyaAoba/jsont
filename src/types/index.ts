/**
 * Type definitions for jsont application
 */

// Basic JSON types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

// Application state types
export interface AppState {
  data: JsonValue;
  filter: string;
  error: string | null;
  selectedPath: string[];
  isFilterMode: boolean;
  viewMode: "compact" | "detail" | "presentation";
}

// JSON statistics types
export interface JsonStats {
  size: number;
  depth: number;
  keys: string[];
  types: Record<string, number>;
}

// Theme types
export type Theme = "dark" | "light";

// View mode types
export type ViewMode = "compact" | "detail" | "presentation";

// Filter result types
export interface FilterResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  executionTime?: number;
  engine?: "jq" | "jsonata" | "native";
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

// Component prop types
export interface JsonViewerProps {
  data: JsonValue;
  selectedPath?: string[];
  onPathSelect?: (path: string[]) => void;
  theme?: Theme;
  viewMode?: ViewMode;
}

export interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface StatusBarProps {
  error: string | null;
  stats?: JsonStats | null;
  theme?: Theme;
}

// Navigation types
export interface NavigationState {
  selectedPath: string[];
  canNavigateUp: boolean;
  canNavigateDown: boolean;
}

// Virtual scrolling types
export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  key: string | number;
}

export interface JsonLineData {
  type:
    | "value"
    | "object-start"
    | "object-end"
    | "array-start"
    | "array-end"
    | "property";
  path: string[];
  depth: number;
  value: JsonValue;
  key?: string;
}

// Utility function types
export type JsonPathGetter = (data: JsonValue, path: string[]) => JsonValue;
export type JsonFilter = (data: JsonValue, filter: string) => JsonValue;
export type JsonFormatter = (
  data: JsonValue,
  options?: FormatterOptions,
) => string;

export interface FormatterOptions {
  pretty?: boolean;
  indent?: number;
  colors?: boolean;
}

// Export default to satisfy ES module requirements
export default {};
