# jsont API Documentation

This document describes the main APIs, type definitions, and extensible interfaces of jsont.

## 📋 Table of Contents

- [Basic Type Definitions](#basic-type-definitions)
- [Application State](#application-state)  
- [Search & Filtering](#search--filtering)
- [Settings & Customization](#settings--customization)
- [Export Features](#export-features)
- [Performance](#performance)
- [Extensibility](#extensibility)

## 🔤 Basic Type Definitions

### JSON Data Types

```typescript
// Basic JSON value type definitions
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
```

### Parse Results

```typescript
export interface ParseResult {
  success: boolean;
  data: JsonValue | null;
  error: string | null;
  suggestion?: string;          // Error correction suggestions
  parseTime?: number;           // Parse processing time (ms)
  validation?: ValidationResult; // Detailed validation results
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;          // Specific correction suggestions
  stats?: JsonStats;           // Data statistics
  warnings: string[];          // Non-fatal warnings
}
```

### JSON Statistics

```typescript
export interface JsonStats {
  size: number;                 // JSON string size (bytes)
  depth: number;               // Maximum nesting depth
  keys: string[];              // List of all unique keys
  types: Record<string, number>; // Occurrence count by type
}
```

## 🏗️ Application State

### View Modes

```typescript
export const VIEW_MODES = [
  "raw",        // Plain JSON display
  "tree",       // Tree hierarchy display
  "collapsible", // Collapsible display
  "schema",     // JSON schema display
  "settings",   // Settings screen
] as const;

export type ViewMode = typeof VIEW_MODES[number];
```

### Application State

```typescript
export interface AppState {
  data: JsonValue;              // Currently displayed JSON data
  filter: string;               // Applied filter/query
  error: string | null;         // Error state
  selectedPath: string[];       // Currently selected path
  isFilterMode: boolean;        // Filter mode state
  viewMode: ViewMode;          // Current view mode
}
```

### Keyboard Input

```typescript
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
```

## 🔍 Search & Filtering

### Search State

```typescript
export interface SearchState {
  isSearching: boolean;         // Search mode state
  searchTerm: string;          // Search string
  searchResults: SearchResult[]; // Search results list
  currentResultIndex: number;   // Current selected result index
  searchScope: SearchScope;     // Search scope
  isRegexMode: boolean;        // Regular expression mode
}

export type SearchScope = "all" | "keys" | "values";

export interface SearchResult {
  lineIndex: number;           // Matched line number
  columnStart: number;         // Match start column
  columnEnd: number;          // Match end column
  matchText: string;          // Matched text
  contextLine: string;        // Context line
  path: string[];             // JSON path
}
```

### Filtering

```typescript
export interface FilterResult {
  success: boolean;
  data?: JsonValue;            // Filtered data
  error?: string;             // Error details
  executionTime?: number;      // Execution time (ms)
  engine?: "jq" | "jsonata" | "native"; // Engine used
}

// Filter function type
export type JsonFilter = (data: JsonValue, filter: string) => JsonValue;
```

### jq Query Integration

```typescript
export interface JqQueryResult {
  success: boolean;
  result?: JsonValue;
  error?: string;
  executionTime: number;
  query: string;
  engine: "jq" | "jsonata";
}

export interface JqState {
  isActive: boolean;           // jq mode state
  query: string;              // Current query
  result?: JsonValue;         // Query result
  error?: string;             // Error details
  isExecuting: boolean;       // Execution flag
  history: string[];          // Query history
}
```

## ⚙️ Settings & Customization

### Configuration Interface

```typescript
export interface Config {
  display: DisplayConfig;
  keybindings: KeybindingConfig;
  performance: PerformanceConfig;
  features: FeatureConfig;
}

export interface DisplayConfig {
  interface: {
    showLineNumbers: boolean;
    useUnicodeTree: boolean;
    theme: "dark" | "light";
    fontSize: number;
  };
  json: {
    indent: number;
    useTabs: boolean;
    maxValueLength: number;
  };
  tree: {
    showArrayIndices: boolean;
    showPrimitiveValues: boolean;
    expandLevel: number;
  };
}

export interface KeybindingConfig {
  navigation: {
    up: string;
    down: string;
    left: string;
    right: string;
    pageUp: string;
    pageDown: string;
    goToTop: string;
    goToBottom: string;
  };
  search: {
    start: string;
    next: string;
    previous: string;
    toggleRegex: string;
    cycleScope: string;
  };
  actions: {
    help: string;
    quit: string;
    settings: string;
    export: string;
    jqMode: string;
  };
}
```

### Performance Settings

```typescript
export interface PerformanceConfig {
  cacheSize: number;           // LRU cache size
  maxFileSize: number;         // Maximum file size (bytes)
  virtualScrolling: boolean;   // Enable virtual scrolling
  backgroundProcessing: boolean; // Background processing
  memoryLimit: number;         // Memory usage limit (MB)
}
```

## 📤 Export Features

### Export Formats

```typescript
export type ExportFormat = 
  | "json" 
  | "yaml" 
  | "csv" 
  | "xml" 
  | "sql" 
  | "json-schema";

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  outputPath: string;
  prettify: boolean;
  includeMetadata: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
  executionTime?: number;
}
```

### Schema Generation

```typescript
export interface SchemaGenerationOptions {
  title?: string;
  description?: string;
  includeExamples: boolean;
  strictTypes: boolean;
  additionalProperties: boolean;
}

export interface JsonSchema {
  $schema: string;
  title?: string;
  description?: string;
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  examples?: JsonValue[];
}
```

## ⚡ Performance

### Virtualization

```typescript
export interface VirtualItem {
  index: number;               // Item index
  start: number;              // Start position (pixels)
  size: number;               // Size (pixels)
  key: string | number;       // Unique key
}

export interface VirtualScrollConfig {
  itemHeight: number;         // Default item height
  overscan: number;          // Overscan item count
  scrollingDelay: number;    // Scrolling delay (ms)
}
```

### Cache System

```typescript
export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
}
```

## 🔌 Extensibility

### Plugin System (Planned)

```typescript
export interface Plugin {
  name: string;
  version: string;
  description: string;
  activate: (context: PluginContext) => void;
  deactivate: () => void;
}

export interface PluginContext {
  registerFilter: (name: string, filter: JsonFilter) => void;
  registerExporter: (format: string, exporter: DataExporter) => void;
  registerCommand: (command: string, handler: CommandHandler) => void;
}

export type DataExporter = (
  data: JsonValue, 
  options: ExportOptions
) => Promise<ExportResult>;

export type CommandHandler = (args: string[]) => Promise<void>;
```

### Custom Themes

```typescript
export interface ThemeDefinition {
  name: string;
  colors: ColorScheme;
  syntax: SyntaxHighlighting;
}

export interface ColorScheme {
  background: string;
  foreground: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
}

export interface SyntaxHighlighting {
  string: string;
  number: string;
  boolean: string;
  null: string;
  key: string;
  punctuation: string;
}
```

## 🎯 Component Props

### JsonViewer Component

```typescript
export interface JsonViewerProps {
  data: JsonValue;
  selectedPath?: string[];
  onPathSelect?: (path: string[]) => void;
  theme?: Theme;
  viewMode?: ViewMode;
  showLineNumbers?: boolean;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  scrollOffset?: number;
  visibleLines?: number;
}
```

### TreeView Component

```typescript
export interface TreeViewProps {
  data: JsonValue | null;
  height?: number;
  width?: number;
  searchTerm?: string;
  scrollOffset?: number;
  options?: Partial<TreeDisplayOptions>;
  onKeyboardHandlerReady?: (
    handler: (input: string, key: KeyboardInput) => boolean
  ) => void;
}

export interface TreeDisplayOptions {
  showArrayIndices: boolean;
  showPrimitiveValues: boolean;
  maxValueLength: number;
  useUnicodeTree: boolean;
  showSchemaTypes: boolean;
}
```

## 📊 Statistics & Metrics

### Performance Metrics

```typescript
export interface PerformanceMetrics {
  parseTime: number;           // Parse time (ms)
  renderTime: number;          // Render time (ms)
  searchTime: number;          // Search time (ms)
  memoryUsage: number;         // Memory usage (MB)
  cacheHitRate: number;        // Cache hit rate
}

export interface UsageStatistics {
  sessionDuration: number;     // Session time (seconds)
  commandsExecuted: number;    // Number of commands executed
  filesProcessed: number;      // Number of files processed
  averageFileSize: number;     // Average file size (MB)
  featuresUsed: string[];      // List of features used
}
```

## 🛠️ Utility Functions

### Type Guards

```typescript
export function isJsonObject(value: JsonValue): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue): value is JsonArray {
  return Array.isArray(value);
}

export function isPrimitive(value: JsonValue): value is string | number | boolean | null {
  return value === null || typeof value !== "object";
}
```

### Path Operations

```typescript
export function getValueByPath(data: JsonValue, path: string[]): JsonValue;
export function setValueByPath(data: JsonValue, path: string[], value: JsonValue): JsonValue;
export function hasPath(data: JsonValue, path: string[]): boolean;
export function getAllPaths(data: JsonValue): string[][];
```

### Formatting

```typescript
export interface FormatterOptions {
  pretty?: boolean;
  indent?: number;
  colors?: boolean;
  maxDepth?: number;
}

export type JsonFormatter = (
  data: JsonValue,
  options?: FormatterOptions
) => string;
```

---

## 🔧 Developer Information

### Type Safety

- All public APIs provide strict TypeScript type definitions
- Use of `any` type is minimized
- Balance flexibility and type safety through generics

### Performance Considerations

- Memory efficiency for large data
- UI responsiveness through lazy loading and virtualization
- Computation result reuse via LRU cache
- Non-blocking operations through background processing

### Extension Guidelines

- Feature addition through plugin system
- Custom exporter implementation
- Custom filtering logic
- Theme and style customization

---

## 📞 Support

For questions about API usage or extensions, please feel free to contact us:

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Implementation consultation and questions
- **Code Review**: Detailed discussion in pull requests

This API documentation is updated continuously with the ongoing development of jsont.