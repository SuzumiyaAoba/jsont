# ライブラリ機能詳細ドキュメント

## 概要

本ドキュメントでは、jsontプロジェクトで使用予定の各ライブラリについて、具体的な利用機能、実装方法、設定詳細を説明します。

---

## 1. Jotai - アトミック状態管理

### 利用予定機能

#### 1.1 基本アトム

```typescript
// src/store/atoms.ts
import { atom } from 'jotai';

// プリミティブアトム
export const jsonDataAtom = atom<unknown>(null);
export const filterAtom = atom<string>('');
export const selectedPathAtom = atom<string[]>([]);
export const errorAtom = atom<string | null>(null);
export const viewModeAtom = atom<'compact' | 'detail' | 'presentation'>('detail');
export const themeAtom = atom<'dark' | 'light'>('dark');
export const isFilterModeAtom = atom<boolean>(false);
```

#### 1.2 計算アトム（Derived Atoms）

```typescript
// 計算されたデータ
export const filteredDataAtom = atom((get) => {
  const data = get(jsonDataAtom);
  const filter = get(filterAtom);
  
  if (!data || !filter) return data;
  
  try {
    return applyFilter(data, filter);
  } catch (error) {
    return data; // フィルタエラー時は元データを返す
  }
});

// JSON統計情報
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

// 表示用データ（仮想化対応）
export const displayDataAtom = atom((get) => {
  const data = get(filteredDataAtom);
  const viewMode = get(viewModeAtom);
  
  return flattenForDisplay(data, viewMode);
});
```

#### 1.3 非同期アトム

```typescript
// 非同期フィルタ処理
export const asyncFilterAtom = atom(
  null,
  async (get, set, filter: string) => {
    const data = get(jsonDataAtom);
    if (!data) return;
    
    set(errorAtom, null);
    
    try {
      // 重い処理を非同期で実行
      const result = await processFilterAsync(data, filter);
      set(filteredDataAtom, result);
    } catch (error) {
      set(errorAtom, error.message);
    }
  }
);
```

#### 1.4 永続化アトム

```typescript
import { atomWithStorage } from 'jotai/utils';

// 設定の永続化
export const configAtom = atomWithStorage('jsont-config', {
  theme: 'dark' as const,
  fontSize: 14,
  indentSize: 2,
  showLineNumbers: true,
  keyBindings: defaultKeyBindings,
});

// フィルタ履歴の永続化
export const filterHistoryAtom = atomWithStorage<string[]>('jsont-filter-history', []);
```

#### 1.5 デバッグ用アトム

```typescript
// 開発時のデバッグ機能
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

### 実装パターン

#### カスタムフック

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

## 2. es-toolkit - 高性能ユーティリティ

### 利用予定機能

#### 2.1 配列操作

```typescript
// src/utils/arrayUtils.ts
import { chunk, uniq, groupBy, sortBy, flatten } from 'es-toolkit';

export class ArrayProcessor {
  // 大量データの分割処理
  static chunkData<T>(data: T[], size: number): T[][] {
    return chunk(data, size);
  }
  
  // 重複削除
  static removeDuplicates<T>(data: T[]): T[] {
    return uniq(data);
  }
  
  // グループ化
  static groupByKey<T>(data: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return groupBy(data, keyFn);
  }
  
  // ソート
  static sortByProperty<T>(data: T[], propertyFn: (item: T) => any): T[] {
    return sortBy(data, propertyFn);
  }
  
  // フラット化
  static flattenArray<T>(data: T[][]): T[] {
    return flatten(data);
  }
}
```

#### 2.2 オブジェクト操作

```typescript
// src/utils/objectUtils.ts
import { pick, omit, get, set, has, merge, clone } from 'es-toolkit';

export class ObjectProcessor {
  // プロパティ選択
  static selectProperties<T>(obj: T, keys: string[]): Partial<T> {
    return pick(obj, keys);
  }
  
  // プロパティ除外
  static excludeProperties<T>(obj: T, keys: string[]): Partial<T> {
    return omit(obj, keys);
  }
  
  // ネストしたプロパティアクセス
  static getNestedValue(obj: unknown, path: string): unknown {
    return get(obj, path);
  }
  
  // ネストしたプロパティ設定
  static setNestedValue(obj: unknown, path: string, value: unknown): unknown {
    return set(clone(obj), path, value);
  }
  
  // プロパティ存在確認
  static hasProperty(obj: unknown, path: string): boolean {
    return has(obj, path);
  }
  
  // オブジェクトマージ
  static mergeObjects<T>(...objects: T[]): T {
    return merge({}, ...objects);
  }
}
```

#### 2.3 関数ユーティリティ

```typescript
// src/utils/functionUtils.ts
import { debounce, throttle, memoize, once } from 'es-toolkit';

export class FunctionUtils {
  // デバウンス（フィルタ入力用）
  static createDebouncedFilter(
    filterFn: (filter: string) => void,
    delay: number = 300
  ) {
    return debounce(filterFn, delay);
  }
  
  // スロットル（スクロール処理用）
  static createThrottledScroll(
    scrollFn: (position: number) => void,
    delay: number = 16
  ) {
    return throttle(scrollFn, delay);
  }
  
  // メモ化（重い計算用）
  static memoizeJsonProcessing<T extends (...args: any[]) => any>(fn: T): T {
    return memoize(fn);
  }
  
  // 一度だけ実行（初期化用）
  static onceOnly<T extends (...args: any[]) => any>(fn: T): T {
    return once(fn);
  }
}
```

#### 2.4 パフォーマンス最適化

```typescript
// src/utils/performance.ts
import { debounce, memoize } from 'es-toolkit';

// JSON処理の最適化
export const optimizedJsonProcessor = {
  // メモ化されたJSONパース
  parseJson: memoize((jsonString: string) => {
    return JSON.parse(jsonString);
  }),
  
  // メモ化されたJSONストリンガイ
  stringifyJson: memoize((data: unknown, space?: number) => {
    return JSON.stringify(data, null, space);
  }),
  
  // デバウンスされたフィルタ適用
  applyFilter: debounce(async (data: unknown, filter: string) => {
    return await processFilter(data, filter);
  }, 300),
  
  // メモ化された深度計算
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

## 3. @tanstack/react-virtual - 仮想スクロール

### 利用予定機能

#### 3.1 基本的な仮想スクロール

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
      // アイテムタイプに応じた推定高さ
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
    overscan: 10, // 表示領域外の追加レンダリング数
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

#### 3.2 動的サイズ対応

```typescript
// 動的サイズ計算
export function useDynamicSizeVirtualizer(data: JsonDisplayItem[]) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = data[index];
      // 内容に基づく動的サイズ計算
      return calculateItemHeight(item);
    },
    // 測定後のサイズ調整
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

#### 3.3 スクロール制御

```typescript
// スクロール制御機能
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

#### 3.4 パフォーマンス最適化

```typescript
// メモ化されたバーチャライザー
export const MemoizedVirtualizedViewer = React.memo(VirtualizedJsonViewer, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.height === nextProps.height &&
    isEqual(prevProps.data, nextProps.data)
  );
});

// オーバースキャンの動的調整
export function useAdaptiveOverscan(itemCount: number) {
  return useMemo(() => {
    if (itemCount < 100) return 5;
    if (itemCount < 1000) return 10;
    return 20;
  }, [itemCount]);
}
```

---

## 4. jq-web + JSONata - ハイブリッドクエリエンジン

### 利用予定機能

#### 4.1 統合クエリプロセッサ

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
      // クエリタイプの自動判定
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
    // jqパターンの検出
    const jqPatterns = [
      /^\..*\|/, // パイプ演算子
      /select\(/, // select関数
      /map\(/, // map関数
      /group_by\(/, // group_by関数
      /reduce/, // reduce関数
      /\[\]/, // 配列インデックス
    ];
    
    if (jqPatterns.some(pattern => pattern.test(query))) {
      return 'jq';
    }
    
    // JSONataパターンの検出
    const jsonataPatterns = [
      /^\$/, // ルート参照
      /\[.*\]/, // 配列フィルタ
      /\{.*\}/, // オブジェクト構築
      /\?/, // 条件演算子
    ];
    
    if (jsonataPatterns.some(pattern => pattern.test(query))) {
      return 'jsonata';
    }
    
    // シンプルなパス表現はネイティブ処理
    return 'native';
  }
  
  private static async executeJqQuery(data: unknown, query: string): Promise<unknown> {
    // キャッシュチェック
    const cacheKey = `${JSON.stringify(data)}_${query}`;
    if (this.jqCache.has(cacheKey)) {
      return this.jqCache.get(cacheKey);
    }
    
    const result = await jq(data, query);
    
    // 結果をキャッシュ（メモリ使用量制限）
    if (this.jqCache.size > 100) {
      const firstKey = this.jqCache.keys().next().value;
      this.jqCache.delete(firstKey);
    }
    this.jqCache.set(cacheKey, result);
    
    return result;
  }
  
  private static async executeJsonataQuery(data: unknown, query: string): Promise<unknown> {
    // キャッシュチェック
    if (this.jsonataCache.has(query)) {
      const expression = this.jsonataCache.get(query);
      return await expression.evaluate(data);
    }
    
    const expression = jsonata(query);
    
    // 式をキャッシュ
    if (this.jsonataCache.size > 100) {
      const firstKey = this.jsonataCache.keys().next().value;
      this.jsonataCache.delete(firstKey);
    }
    this.jsonataCache.set(query, expression);
    
    return await expression.evaluate(data);
  }
  
  private static executeNativeQuery(data: unknown, query: string): unknown {
    // シンプルなパス表現をネイティブ処理
    const path = query.replace(/^\$\.?/, '').split('.');
    let result = data;
    
    for (const segment of path) {
      if (result == null) break;
      
      if (segment.includes('[') && segment.includes(']')) {
        // 配列インデックス処理
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

#### 4.2 クエリ検証とオートコンプリート

```typescript
// クエリ検証機能
export class QueryValidator {
  static validateJqSyntax(query: string): ValidationResult {
    try {
      // 基本的なjq構文チェック
      const commonErrors = [
        { pattern: /\|\s*$/, message: 'パイプ演算子の後に式が必要です' },
        { pattern: /\(\s*$/, message: '括弧が閉じられていません' },
        { pattern: /\[\s*$/, message: '配列インデックスが閉じられていません' },
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
    
    // データ構造からの候補生成
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      keys.forEach(key => {
        suggestions.push(`.${key}`);
        suggestions.push(`."${key}"`);
      });
    }
    
    // 一般的なjq関数
    const jqFunctions = [
      'select()', 'map()', 'filter()', 'sort()', 'group_by()',
      'length', 'keys', 'values', 'type', 'empty',
    ];
    
    suggestions.push(...jqFunctions);
    
    // 現在のクエリに基づくフィルタリング
    return suggestions.filter(s => s.startsWith(query.split(' ').pop() || ''));
  }
}
```

#### 4.3 リアルタイムクエリ実行

```typescript
// リアルタイムクエリフック
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

## 5. clipboardy - クリップボード操作

### 利用予定機能

#### 5.1 基本的なクリップボード操作

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
      // 数値インデックスの場合
      if (/^\d+$/.test(segment)) {
        return `[${segment}]`;
      }
      // 特殊文字を含む場合
      if (/[^a-zA-Z0-9_]/.test(segment)) {
        return `["${segment}"]`;
      }
      // 通常のプロパティ
      return `.${segment}`;
    }).join('');
  }
  
  private static convertToYaml(value: unknown): string {
    // 簡易YAML変換
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
      throw new Error('CSV変換には配列データが必要です');
    }
    
    if (value.length === 0) {
      return '';
    }
    
    // ヘッダー行の生成
    const headers = Object.keys(value[0] || {});
    const headerRow = headers.map(h => `"${h}"`).join(',');
    
    // データ行の生成
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

#### 5.2 クリップボード操作のUI統合

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
      // 成功フィードバック（短時間表示）
      setError('コピーしました');
      setTimeout(() => setError(null), 2000);
    } else {
      setError(result.error || 'コピーに失敗しました');
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

## 6. react-syntax-highlighter - 構文ハイライト

### 利用予定機能

#### 6.1 JSON構文ハイライト

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
          {collapsed ? '展開' : '折りたたみ'}
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
          ... {lines.length - displayLines.length} 行が省略されています
        </div>
      )}
    </div>
  );
}
```

#### 6.2 テーマカスタマイズ

```typescript
// カスタムテーマ定義
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

## 実装優先順位

### Phase 1: 基本機能（Week 1-2）
1. Jotai基本状態管理
2. es-toolkit基本ユーティリティ
3. @tanstack/react-virtual基本実装

### Phase 2: 高度機能（Week 3-4）
1. ハイブリッドクエリエンジン
2. クリップボード統合
3. 構文ハイライト

### Phase 3: 最適化（Week 5-6）
1. パフォーマンス最適化
2. キャッシュ機能
3. エラーハンドリング強化

---

## まとめ

各ライブラリの具体的な利用機能を定義し、実装方針を明確化しました。段階的な導入により、リスクを最小限に抑えながら機能向上を図ることができます。