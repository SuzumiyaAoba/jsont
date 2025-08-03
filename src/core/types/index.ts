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
  viewMode: ViewMode;
}

// JSON statistics types
export interface JsonStats {
  size: number;
  depth: number;
  keys: string[];
  types: Record<string, number>;
}

// JSON processing types
export interface ParseResult {
  success: boolean;
  data: JsonValue | null;
  error: string | null;
  suggestion?: string | undefined;
  parseTime?: number;
  validation?: ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  stats?: JsonStats;
  warnings: string[];
}

export interface EnhancedParseResult extends ParseResult {
  validation: ValidationResult;
}

// Theme types
export type Theme = "dark" | "light";

// View mode types - single source of truth
export const VIEW_MODES = [
  "raw",
  "tree",
  "collapsible",
  "schema",
  "settings",
] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

// Filter result types
export interface FilterResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  executionTime?: number;
  engine?: "jq" | "jsonata" | "native";
}

// Remove duplicate ValidationResult interface - already defined above

// Component prop types
export interface JsonViewerProps {
  data: JsonValue;
  selectedPath?: string[];
  onPathSelect?: (path: string[]) => void;
  theme?: Theme;
  viewMode?: ViewMode;
}

export interface StatusBarProps {
  error: string | null;
  stats?: JsonStats | null;
  theme?: Theme;
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

// Search types
export interface SearchState {
  isSearching: boolean;
  searchTerm: string;
  searchResults: SearchResult[];
  currentResultIndex: number;
}

export interface SearchResult {
  lineIndex: number;
  columnStart: number;
  columnEnd: number;
  matchText: string;
  contextLine: string;
}

// Keyboard input types
export interface KeyboardInput {
  name?: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  pageUp?: boolean;
  pageDown?: boolean;
  return?: boolean;
  escape?: boolean;
  tab?: boolean;
}

export interface TreeLineData {
  id: string;
  depth: number;
  path: string[];
  key?: string;
  value?: JsonValue;
  type: "object" | "array" | "value" | "property";
  isExpanded?: boolean;
  hasChildren?: boolean;
}

// Export default to satisfy ES module requirements
export default {};
