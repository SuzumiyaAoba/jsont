# Library Features Documentation

## Overview

This document describes the specific utilization features, implementation methods, and configuration details for each library used in the jsont project.

---

## 1. Jotai - Atomic State Management

### Planned Features

#### 1.1 Basic Atoms

```typescript
// src/store/atoms.ts
import { atom } from 'jotai';

// Primitive atoms
export const jsonDataAtom = atom<unknown>(null);
export const filterAtom = atom<string>('');
export const selectedPathAtom = atom<string[]>([]);
export const errorAtom = atom<string | null>(null);
export const viewModeAtom = atom<'compact' | 'detail' | 'presentation'>('detail');
export const themeAtom = atom<'dark' | 'light'>('dark');
export const isFilterModeAtom = atom<boolean>(false);
```

#### 1.2 Derived Atoms

```typescript
// Computed data
export const filteredDataAtom = atom((get) => {
  const data = get(jsonDataAtom);
  const filter = get(filterAtom);
  
  if (!data || !filter) return data;
  
  try {
    return applyFilter(data, filter);
  } catch (error) {
    return data; // Return original data on filter error
  }
});

// JSON statistics
export const jsonStatsAtom = atom((get) => {
  const data = get(jsonDataAtom);
  if (!data) return null;
  
  return {
    size: JSON.stringify(data).length,
    depth: calculateDepth(data),
    keys: getAllKeys(data),
    types: getTypeDistribution(data),
  };
});

// Display data (virtualization ready)
export const displayDataAtom = atom((get) => {
  const data = get(filteredDataAtom);
  const viewMode = get(viewModeAtom);
  
  return flattenForDisplay(data, viewMode);
});
```

#### 1.3 Async Atoms

```typescript
// Async filter processing
export const asyncFilterAtom = atom(
  null,
  async (get, set, filter: string) => {
    const data = get(jsonDataAtom);
    if (!data) return;
    
    set(errorAtom, null);
    
    try {
      // Execute heavy processing asynchronously
      const result = await processFilterAsync(data, filter);
      set(filteredDataAtom, result);
    } catch (error) {
      set(errorAtom, error.message);
    }
  }
);
```

#### 1.4 Persistent Atoms

```typescript
import { atomWithStorage } from 'jotai/utils';

// Persistent configuration
export const configAtom = atomWithStorage('jsont-config', {
  theme: 'dark' as const,
  fontSize: 14,
  indentSize: 2,
  showLineNumbers: true,
  keyBindings: defaultKeyBindings,
});

// Persistent filter history
export const filterHistoryAtom = atomWithStorage<string[]>('jsont-filter-history', []);
```

#### 1.5 Debug Atoms

```typescript
// Debug functionality for development
export const debugAtom = atom((get) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return {
    jsonData: get(jsonDataAtom),
    filter: get(filterAtom),
    selectedPath: get(selectedPathAtom),
    stats: get(jsonStatsAtom),
  };
});
```

### Implementation Patterns

#### Custom Hooks

```typescript
// src/hooks/useJsonStore.ts
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

export function useJsonStore() {
  const [jsonData, setJsonData] = useAtom(jsonDataAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  const filteredData = useAtomValue(filteredDataAtom);
  const stats = useAtomValue(jsonStatsAtom);
  
  return {
    jsonData,
    setJsonData,
    filter,
    setFilter,
    filteredData,
    stats,
  };
}

export function useNavigation() {
  const [selectedPath, setSelectedPath] = useAtom(selectedPathAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  
  const navigateToPath = useCallback((path: string[]) => {
    setSelectedPath(path);
  }, [setSelectedPath]);
  
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const modes = ['compact', 'detail', 'presentation'] as const;
      const currentIndex = modes.indexOf(prev);
      return modes[(currentIndex + 1) % modes.length];
    });
  }, [setViewMode]);
  
  return {
    selectedPath,
    viewMode,
    navigateToPath,
    toggleViewMode,
  };
}
```

---

## 2. es-toolkit - High-Performance Utilities

### Planned Features

#### 2.1 Array Operations

```typescript
// src/utils/arrayUtils.ts
import { chunk, uniq, groupBy, sortBy, flatten } from 'es-toolkit';

export class ArrayProcessor {
  // Chunk large data for processing
  static chunkData<T>(data: T[], size: number): T[][] {
    return chunk(data, size);
  }
  
  // Remove duplicates
  static removeDuplicates<T>(data: T[]): T[] {
    return uniq(data);
  }
  
  // Group by key
  static groupByKey<T>(data: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return groupBy(data, keyFn);
  }
  
  // Sort by property
  static sortByProperty<T>(data: T[], propertyFn: (item: T) => any): T[] {
    return sortBy(data, propertyFn);
  }
  
  // Flatten array
  static flattenArray<T>(data: T[][]): T[] {
    return flatten(data);
  }
}
```

#### 2.2 Object Operations

```typescript
// src/utils/objectUtils.ts
import { pick, omit, get, set, has, merge, clone } from 'es-toolkit';

export class ObjectProcessor {
  // Select properties
  static selectProperties<T>(obj: T, keys: string[]): Partial<T> {
    return pick(obj, keys);
  }
  
  // Exclude properties
  static excludeProperties<T>(obj: T, keys: string[]): Partial<T> {
    return omit(obj, keys);
  }
  
  // Access nested properties
  static getNestedValue(obj: unknown, path: string): unknown {
    return get(obj, path);
  }
  
  // Set nested properties
  static setNestedValue(obj: unknown, path: string, value: unknown): unknown {
    return set(clone(obj), path, value);
  }
  
  // Check property existence
  static hasProperty(obj: unknown, path: string): boolean {
    return has(obj, path);
  }
  
  // Merge objects
  static mergeObjects<T>(...objects: T[]): T {
    return merge({}, ...objects);
  }
}
```

#### 2.3 Function Utilities

```typescript
// src/utils/functionUtils.ts
import { debounce, throttle, memoize, once } from 'es-toolkit';

export class FunctionUtils {
  // Debounce (for filter input)
  static createDebouncedFilter(
    filterFn: (filter: string) => void,
    delay: number = 300
  ) {
    return debounce(filterFn, delay);
  }
  
  // Throttle (for scroll processing)
  static createThrottledScroll(
    scrollFn: (position: number) => void,
    delay: number = 16
  ) {
    return throttle(scrollFn, delay);
  }
  
  // Memoize (for heavy calculations)
  static memoizeJsonProcessing<T extends (...args: any[]) => any>(fn: T): T {
    return memoize(fn);
  }
  
  // Execute once (for initialization)
  static onceOnly<T extends (...args: any[]) => any>(fn: T): T {
    return once(fn);
  }
}
```

#### 2.4 Performance Optimization

```typescript
// src/utils/performance.ts
import { debounce, memoize } from 'es-toolkit';

// JSON processing optimization
export const optimizedJsonProcessor = {
  // Memoized JSON parsing
  parseJson: memoize((jsonString: string) => {
    return JSON.parse(jsonString);
  }),
  
  // Memoized JSON stringification
  stringifyJson: memoize((data: unknown, space?: number) => {
    return JSON.stringify(data, null, space);
  }),
  
  // Debounced filter application
  applyFilter: debounce(async (data: unknown, filter: string) => {
    return await processFilter(data, filter);
  }, 300),
  
  // Memoized depth calculation
  calculateDepth: memoize((obj: unknown): number => {
    if (obj === null || typeof obj !== 'object') return 0;
    if (Array.isArray(obj)) {
      return obj.length > 0 ? 1 + Math.max(...obj.map(this.calculateDepth)) : 1;
    }
    const values = Object.values(obj);
    return values.length > 0 ? 1 + Math.max(...values.map(this.calculateDepth)) : 1;
  }),
};
```

---

## 3. @tanstack/react-virtual - Virtual Scrolling

### Planned Features

#### 3.1 Basic Virtual Scrolling

```typescript
// src/components/VirtualizedJsonViewer.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useCallback } from 'react';

interface VirtualizedJsonViewerProps {
  data: JsonDisplayItem[];
  height: number;
  onItemClick?: (item: JsonDisplayItem, index: number) => void;
}

export function VirtualizedJsonViewer({
  data,
  height,
  onItemClick,
}: VirtualizedJsonViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      // Estimated height based on item type
      const item = data[index];
      switch (item.type) {
        case 'object-start':
        case 'array-start':
          return 24;
        case 'property':
          return 24;
        case 'value':
          return item.value?.toString().length > 50 ? 48 : 24;
        default:
          return 24;
      }
    }, [data]),
    overscan: 10, // Additional rendering outside visible area
  });
  
  return (
    <div
      ref={parentRef}
      style={{
        height,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            onClick={() => onItemClick?.(data[virtualItem.index], virtualItem.index)}
          >
            <JsonLine item={data[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Dynamic Size Support

```typescript
// Dynamic size calculation
export function useDynamicSizeVirtualizer(data: JsonDisplayItem[]) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = data[index];
      // Dynamic size calculation based on content
      return calculateItemHeight(item);
    },
    // Size adjustment after measurement
    measureElement: (element) => {
      return element.getBoundingClientRect().height;
    },
  });
  
  return { parentRef, virtualizer };
}

function calculateItemHeight(item: JsonDisplayItem): number {
  const baseHeight = 24;
  const indentHeight = item.depth * 16;
  
  if (item.type === 'value' && typeof item.value === 'string') {
    const lineCount = Math.ceil(item.value.length / 80);
    return baseHeight * lineCount + indentHeight;
  }
  
  return baseHeight + indentHeight;
}
```

#### 3.3 Scroll Control

```typescript
// Scroll control functionality
export function useScrollControl(virtualizer: any) {
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'center') => {
    virtualizer.scrollToIndex(index, { align });
  }, [virtualizer]);
  
  const scrollToTop = useCallback(() => {
    virtualizer.scrollToOffset(0);
  }, [virtualizer]);
  
  const scrollToBottom = useCallback(() => {
    const totalSize = virtualizer.getTotalSize();
    virtualizer.scrollToOffset(totalSize);
  }, [virtualizer]);
  
  return {
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}
```

#### 3.4 Performance Optimization

```typescript
// Memoized virtualizer
export const MemoizedVirtualizedViewer = React.memo(VirtualizedJsonViewer, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.height === nextProps.height &&
    isEqual(prevProps.data, nextProps.data)
  );
});

// Dynamic overscan adjustment
export function useAdaptiveOverscan(itemCount: number) {
  return useMemo(() => {
    if (itemCount < 100) return 5;
    if (itemCount < 1000) return 10;
    return 20;
  }, [itemCount]);
}
```

---

## 4. jq-web + JSONata - Hybrid Query Engine

### Planned Features

#### 4.1 Integrated Query Processor

```typescript
// src/utils/queryProcessor.ts
import jq from 'jq-web';
import jsonata from 'jsonata';

export interface QueryResult {
  success: boolean;
  data?: unknown;
  error?: string;
  engine: 'jq' | 'jsonata' | 'native';
  executionTime: number;
}

export class HybridQueryProcessor {
  private static jqCache = new Map<string, any>();
  private static jsonataCache = new Map<string, any>();
  
  static async executeQuery(data: unknown, query: string): Promise<QueryResult> {
    const startTime = performance.now();
    
    try {
      // Automatic query type detection
      const engine = this.detectQueryEngine(query);
      
      let result: unknown;
      switch (engine) {
        case 'jq':
          result = await this.executeJqQuery(data, query);
          break;
        case 'jsonata':
          result = await this.executeJsonataQuery(data, query);
          break;
        default:
          result = this.executeNativeQuery(data, query);
      }
      
      return {
        success: true,
        data: result,
        engine,
        executionTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        engine: 'unknown',
        executionTime: performance.now() - startTime,
      };
    }
  }
  
  private static detectQueryEngine(query: string): 'jq' | 'jsonata' | 'native' {
    // jq pattern detection
    const jqPatterns = [
      /^\..*\|/, // Pipe operator
      /select\(/, // select function
      /map\(/, // map function
      /group_by\(/, // group_by function
      /reduce/, // reduce function
      /\[\]/, // array index
    ];
    
    if (jqPatterns.some(pattern => pattern.test(query))) {
      return 'jq';
    }
    
    // JSONata pattern detection
    const jsonataPatterns = [
      /^\$/, // Root reference
      /\[.*\]/, // Array filter
      /\{.*\}/, // Object construction
      /\?/, // Conditional operator
    ];
    
    if (jsonataPatterns.some(pattern => pattern.test(query))) {
      return 'jsonata';
    }
    
    // Simple path expressions use native processing
    return 'native';
  }
  
  private static async executeJqQuery(data: unknown, query: string): Promise<unknown> {
    // Cache check
    const cacheKey = `${JSON.stringify(data)}_${query}`;
    if (this.jqCache.has(cacheKey)) {
      return this.jqCache.get(cacheKey);
    }
    
    const result = await jq(data, query);
    
    // Cache result (with memory usage limit)
    if (this.jqCache.size > 100) {
      const firstKey = this.jqCache.keys().next().value;
      this.jqCache.delete(firstKey);
    }
    this.jqCache.set(cacheKey, result);
    
    return result;
  }
  
  private static async executeJsonataQuery(data: unknown, query: string): Promise<unknown> {
    // Cache check
    if (this.jsonataCache.has(query)) {
      const expression = this.jsonataCache.get(query);
      return await expression.evaluate(data);
    }
    
    const expression = jsonata(query);
    
    // Cache expression
    if (this.jsonataCache.size > 100) {
      const firstKey = this.jsonataCache.keys().next().value;
      this.jsonataCache.delete(firstKey);
    }
    this.jsonataCache.set(query, expression);
    
    return await expression.evaluate(data);
  }
  
  private static executeNativeQuery(data: unknown, query: string): unknown {
    // Native processing for simple path expressions
    const path = query.replace(/^\$\.?/, '').split('.');
    let result = data;
    
    for (const segment of path) {
      if (result == null) break;
      
      if (segment.includes('[') && segment.includes(']')) {
        // Array index processing
        const [key, indexStr] = segment.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        result = (result as any)[key]?.[index];
      } else {
        result = (result as any)[segment];
      }
    }
    
    return result;
  }
}
```

#### 4.2 Query Validation and Autocompletion

```typescript
// Query validation functionality
export class QueryValidator {
  static validateJqSyntax(query: string): ValidationResult {
    try {
      // Basic jq syntax check
      const commonErrors = [
        { pattern: /\|\s*$/, message: 'Expression required after pipe operator' },
        { pattern: /\(\s*$/, message: 'Unclosed parenthesis' },
        { pattern: /\[\s*$/, message: 'Unclosed array index' },
      ];
      
      for (const { pattern, message } of commonErrors) {
        if (pattern.test(query)) {
          return { isValid: false, error: message };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
  
  static getAutoComplete(query: string, data: unknown): string[] {
    const suggestions: string[] = [];
    
    // Generate suggestions from data structure
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      keys.forEach(key => {
        suggestions.push(`.${key}`);
        suggestions.push(`."${key}"`);
      });
    }
    
    // Common jq functions
    const jqFunctions = [
      'select()', 'map()', 'filter()', 'sort()', 'group_by()',
      'length', 'keys', 'values', 'type', 'empty',
    ];
    
    suggestions.push(...jqFunctions);
    
    // Filter based on current query
    return suggestions.filter(s => s.startsWith(query.split(' ').pop() || ''));
  }
}
```

#### 4.3 Real-time Query Execution

```typescript
// Real-time query hook
export function useRealtimeQuery(data: unknown) {
  const [query, setQuery] = useAtom(filterAtom);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const debouncedExecute = useMemo(
    () => debounce(async (data: unknown, query: string) => {
      if (!query.trim()) {
        setResult(null);
        return;
      }
      
      setIsProcessing(true);
      try {
        const result = await HybridQueryProcessor.executeQuery(data, query);
        setResult(result);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedExecute(data, query);
  }, [data, query, debouncedExecute]);
  
  return {
    query,
    setQuery,
    result,
    isProcessing,
  };
}
```

---

## 5. clipboardy - Clipboard Operations

### Planned Features

#### 5.1 Basic Clipboard Operations

```typescript
// src/utils/clipboard.ts
import clipboardy from 'clipboardy';

export interface CopyOptions {
  format: 'json' | 'yaml' | 'csv' | 'text' | 'path';
  pretty: boolean;
  selection?: unknown;
  path?: string[];
}

export class ClipboardManager {
  static async copyValue(value: unknown, options: CopyOptions = { format: 'json', pretty: true }) {
    try {
      const formatted = this.formatValue(value, options);
      await clipboardy.write(formatted);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async copyPath(path: string[]) {
    try {
      const pathString = this.formatPath(path);
      await clipboardy.write(pathString);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async copyQuery(data: unknown, query: string) {
    try {
      const result = await HybridQueryProcessor.executeQuery(data, query);
      if (result.success) {
        const formatted = JSON.stringify(result.data, null, 2);
        await clipboardy.write(formatted);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  private static formatValue(value: unknown, options: CopyOptions): string {
    switch (options.format) {
      case 'json':
        return JSON.stringify(value, null, options.pretty ? 2 : 0);
      
      case 'yaml':
        return this.convertToYaml(value);
      
      case 'csv':
        return this.convertToCsv(value);
      
      case 'text':
        return String(value);
      
      case 'path':
        return this.formatPath(options.path || []);
      
      default:
        return JSON.stringify(value, null, 2);
    }
  }
  
  private static formatPath(path: string[]): string {
    return path.map(segment => {
      // Numeric index case
      if (/^\d+$/.test(segment)) {
        return `[${segment}]`;
      }
      // Special characters case
      if (/[^a-zA-Z0-9_]/.test(segment)) {
        return `["${segment}"]`;
      }
      // Regular property
      return `.${segment}`;
    }).join('');
  }
  
  private static convertToYaml(value: unknown): string {
    // Simple YAML conversion
    const json = JSON.stringify(value, null, 2);
    return json
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/^\s*{$/gm, '')
      .replace(/^\s*}$/gm, '')
      .replace(/^\s*\[$/gm, '- ')
      .replace(/^\s*\]$/gm, '');
  }
  
  private static convertToCsv(value: unknown): string {
    if (!Array.isArray(value)) {
      throw new Error('CSV conversion requires array data');
    }
    
    if (value.length === 0) {
      return '';
    }
    
    // Generate header row
    const headers = Object.keys(value[0] || {});
    const headerRow = headers.map(h => `"${h}"`).join(',');
    
    // Generate data rows
    const dataRows = value.map(item =>
      headers.map(header => {
        const cellValue = (item as any)[header];
        const stringValue = cellValue == null ? '' : String(cellValue);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
  }
}
```

#### 5.2 UI Integration for Clipboard Operations

```typescript
// src/hooks/useClipboard.ts
import { useCallback } from 'react';
import { useSetAtom } from 'jotai';

export function useClipboard() {
  const setError = useSetAtom(errorAtom);
  
  const copyWithFeedback = useCallback(async (
    copyFn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    const result = await copyFn();
    
    if (result.success) {
      // Success feedback (brief display)
      setError('Copied to clipboard');
      setTimeout(() => setError(null), 2000);
    } else {
      setError(result.error || 'Copy failed');
    }
  }, [setError]);
  
  const copyValue = useCallback((value: unknown, options?: CopyOptions) => {
    return copyWithFeedback(() => ClipboardManager.copyValue(value, options));
  }, [copyWithFeedback]);
  
  const copyPath = useCallback((path: string[]) => {
    return copyWithFeedback(() => ClipboardManager.copyPath(path));
  }, [copyWithFeedback]);
  
  const copyQuery = useCallback((data: unknown, query: string) => {
    return copyWithFeedback(() => ClipboardManager.copyQuery(data, query));
  }, [copyWithFeedback]);
  
  return {
    copyValue,
    copyPath,
    copyQuery,
  };
}
```

---

## 6. react-syntax-highlighter - Syntax Highlighting

### Planned Features

#### 6.1 JSON Syntax Highlighting

```typescript
// src/components/SyntaxHighlightedJson.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SyntaxHighlightedJsonProps {
  data: unknown;
  theme: 'dark' | 'light';
  showLineNumbers?: boolean;
  maxLines?: number;
  collapsible?: boolean;
}

export function SyntaxHighlightedJson({
  data,
  theme,
  showLineNumbers = true,
  maxLines = 1000,
  collapsible = false,
}: SyntaxHighlightedJsonProps) {
  const jsonString = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);
  
  const lines = useMemo(() => {
    return jsonString.split('\n');
  }, [jsonString]);
  
  const [collapsed, setCollapsed] = useState(false);
  const [displayLines, setDisplayLines] = useState(lines);
  
  useEffect(() => {
    if (collapsed && collapsible) {
      setDisplayLines(lines.slice(0, 10));
    } else if (lines.length > maxLines) {
      setDisplayLines(lines.slice(0, maxLines));
    } else {
      setDisplayLines(lines);
    }
  }, [lines, collapsed, collapsible, maxLines]);
  
  return (
    <div className="syntax-highlighted-json">
      {collapsible && lines.length > 10 && (
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      )}
      
      <SyntaxHighlighter
        language="json"
        style={theme === 'dark' ? vscDarkPlus : vs}
        showLineNumbers={showLineNumbers}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'JetBrains Mono, Fira Code, SF Mono, monospace',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'inherit',
          },
        }}
      >
        {displayLines.join('\n')}
      </SyntaxHighlighter>
      
      {lines.length > displayLines.length && (
        <div className="truncated-indicator">
          ... {lines.length - displayLines.length} lines truncated
        </div>
      )}
    </div>
  );
}
```

#### 6.2 Theme Customization

```typescript
// Custom theme definitions
export const customJsonThemes = {
  jsontDark: {
    'code[class*="language-"]': {
      color: '#d4d4d4',
      background: '#1e1e1e',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    'token.string': {
      color: '#ce9178',
    },
    'token.number': {
      color: '#b5cea8',
    },
    'token.boolean': {
      color: '#569cd6',
    },
    'token.null': {
      color: '#808080',
    },
    'token.property': {
      color: '#9cdcfe',
    },
    'token.punctuation': {
      color: '#d4d4d4',
    },
  },
  
  jsontLight: {
    'code[class*="language-"]': {
      color: '#000000',
      background: '#ffffff',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    'token.string': {
      color: '#a31515',
    },
    'token.number': {
      color: '#098658',
    },
    'token.boolean': {
      color: '#0000ff',
    },
    'token.null': {
      color: '#808080',
    },
    'token.property': {
      color: '#001080',
    },
    'token.punctuation': {
      color: '#000000',
    },
  },
};
```

---

## Implementation Priority

### Phase 1: Basic Features (Week 1-2)
1. Basic Jotai state management
2. es-toolkit basic utilities
3. @tanstack/react-virtual basic implementation

### Phase 2: Advanced Features (Week 3-4)
1. Hybrid query engine
2. Clipboard integration
3. Syntax highlighting

### Phase 3: Optimization (Week 5-6)
1. Performance optimization
2. Caching functionality
3. Enhanced error handling

---

## Summary

Specific utilization features for each library have been defined, and implementation policies have been clarified. Through staged introduction, feature improvements can be achieved while minimizing risks.