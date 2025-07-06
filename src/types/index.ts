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

// Remove duplicate ValidationResult interface - already defined above

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

// F2: Simple Navigation Types
export interface NavigationItem {
  key: string;
  value: JsonValue;
  path: string[];
  depth: number;
  type: "property" | "array-item" | "value";
  isExpandable: boolean;
  isExpanded?: boolean;
}

// Original navigation state interface
export interface NavigationState {
  selectedPath: string[];
  canNavigateUp: boolean;
  canNavigateDown: boolean;
}

// F2 Navigation state interface
export interface F2NavigationState {
  selectedIndex: number;
  currentPath: string[];
  scrollOffset: number;
  isNavigable: boolean;
  flatItems: NavigationItem[];
}

export interface NavigationOptions {
  pageSize?: number;
  viewportHeight?: number;
  enableKeyboardNavigation?: boolean;
  initialSelectedIndex?: number;
}

export interface NavigationActions {
  navigateUp: () => void;
  navigateDown: () => void;
  navigatePageUp: () => void;
  navigatePageDown: () => void;
  navigateHome: () => void;
  navigateEnd: () => void;
  setSelectedIndex: (index: number) => void;
  getVisibleItems: () => NavigationItem[];
  getPathString: () => string;
}

export type NavigationHook = F2NavigationState & NavigationActions;

// Export default to satisfy ES module requirements
export default {};
