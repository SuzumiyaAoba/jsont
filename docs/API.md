# jsont API Documentation

jsont の主要な API、型定義、および拡張可能なインターフェースについて説明します。

## 📋 目次

- [基本型定義](#基本型定義)
- [アプリケーション状態](#アプリケーション状態)  
- [検索・フィルタリング](#検索フィルタリング)
- [設定・カスタマイズ](#設定カスタマイズ)
- [エクスポート機能](#エクスポート機能)
- [パフォーマンス](#パフォーマンス)
- [拡張性](#拡張性)

## 🔤 基本型定義

### JSON データ型

```typescript
// 基本的な JSON 値の型定義
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

### パース結果

```typescript
export interface ParseResult {
  success: boolean;
  data: JsonValue | null;
  error: string | null;
  suggestion?: string;          // エラー時の修正提案
  parseTime?: number;           // パース処理時間（ms）
  validation?: ValidationResult; // 詳細な検証結果
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;          // 具体的な修正提案
  stats?: JsonStats;           // データ統計情報
  warnings: string[];          // 非致命的な警告
}
```

### JSON 統計情報

```typescript
export interface JsonStats {
  size: number;                 // JSON文字列のサイズ（バイト）
  depth: number;               // ネストの最大深度
  keys: string[];              // 全ユニークキー一覧
  types: Record<string, number>; // 型別出現回数
}
```

## 🏗️ アプリケーション状態

### ビューモード

```typescript
export const VIEW_MODES = [
  "raw",        // プレーン JSON 表示
  "tree",       // ツリー階層表示
  "collapsible", // 折りたたみ可能表示
  "schema",     // JSON スキーマ表示
  "settings",   // 設定画面
] as const;

export type ViewMode = typeof VIEW_MODES[number];
```

### アプリケーション状態

```typescript
export interface AppState {
  data: JsonValue;              // 表示中の JSON データ
  filter: string;               // 適用中のフィルター/クエリ
  error: string | null;         // エラー状態
  selectedPath: string[];       // 現在選択中のパス
  isFilterMode: boolean;        // フィルターモード状態
  viewMode: ViewMode;          // 現在のビューモード
}
```

### キーボード入力

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

## 🔍 検索・フィルタリング

### 検索状態

```typescript
export interface SearchState {
  isSearching: boolean;         // 検索モード状態
  searchTerm: string;          // 検索文字列
  searchResults: SearchResult[]; // 検索結果一覧
  currentResultIndex: number;   // 現在選択中の結果インデックス
  searchScope: SearchScope;     // 検索範囲スコープ
  isRegexMode: boolean;        // 正規表現モード
}

export type SearchScope = "all" | "keys" | "values";

export interface SearchResult {
  lineIndex: number;           // マッチした行番号
  columnStart: number;         // マッチ開始列
  columnEnd: number;          // マッチ終了列
  matchText: string;          // マッチしたテキスト
  contextLine: string;        // コンテキスト行
  path: string[];             // JSON パス
}
```

### フィルタリング

```typescript
export interface FilterResult {
  success: boolean;
  data?: JsonValue;            // フィルタ後データ
  error?: string;             // エラー詳細
  executionTime?: number;      // 実行時間（ms）
  engine?: "jq" | "jsonata" | "native"; // 使用エンジン
}

// フィルター関数型
export type JsonFilter = (data: JsonValue, filter: string) => JsonValue;
```

### jq クエリ統合

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
  isActive: boolean;           // jq モード状態
  query: string;              // 現在のクエリ
  result?: JsonValue;         // クエリ結果
  error?: string;             // エラー詳細
  isExecuting: boolean;       // 実行中フラグ
  history: string[];          // クエリ履歴
}
```

## ⚙️ 設定・カスタマイズ

### 設定インターフェース

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

### パフォーマンス設定

```typescript
export interface PerformanceConfig {
  cacheSize: number;           // LRU キャッシュサイズ
  maxFileSize: number;         // 最大ファイルサイズ（バイト）
  virtualScrolling: boolean;   // 仮想スクロール有効化
  backgroundProcessing: boolean; // バックグラウンド処理
  memoryLimit: number;         // メモリ使用制限（MB）
}
```

## 📤 エクスポート機能

### エクスポート形式

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

### スキーマ生成

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

## ⚡ パフォーマンス

### 仮想化

```typescript
export interface VirtualItem {
  index: number;               // アイテムインデックス
  start: number;              // 開始位置（ピクセル）
  size: number;               // サイズ（ピクセル）
  key: string | number;       // ユニークキー
}

export interface VirtualScrollConfig {
  itemHeight: number;         // デフォルトアイテム高さ
  overscan: number;          // オーバースキャン項目数
  scrollingDelay: number;    // スクロール遅延（ms）
}
```

### キャッシュシステム

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

## 🔌 拡張性

### プラグインシステム（計画中）

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

### カスタムテーマ

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

## 🎯 コンポーネント Props

### JsonViewer コンポーネント

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

### TreeView コンポーネント

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

## 📊 統計・メトリクス

### パフォーマンスメトリクス

```typescript
export interface PerformanceMetrics {
  parseTime: number;           // パース時間（ms）
  renderTime: number;          // レンダー時間（ms）
  searchTime: number;          // 検索時間（ms）
  memoryUsage: number;         // メモリ使用量（MB）
  cacheHitRate: number;        // キャッシュヒット率
}

export interface UsageStatistics {
  sessionDuration: number;     // セッション時間（秒）
  commandsExecuted: number;    // 実行コマンド数
  filesProcessed: number;      // 処理ファイル数
  averageFileSize: number;     // 平均ファイルサイズ（MB）
  featuresUsed: string[];      // 使用機能一覧
}
```

## 🛠️ ユーティリティ関数

### 型ガード

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

### パス操作

```typescript
export function getValueByPath(data: JsonValue, path: string[]): JsonValue;
export function setValueByPath(data: JsonValue, path: string[], value: JsonValue): JsonValue;
export function hasPath(data: JsonValue, path: string[]): boolean;
export function getAllPaths(data: JsonValue): string[][];
```

### フォーマッティング

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

## 🔧 開発者向け情報

### 型安全性

- 全ての公開 API は厳密な TypeScript 型定義を提供
- `any` 型の使用は最小限に抑制
- ジェネリクスを活用した柔軟性と型安全性の両立

### パフォーマンス考慮事項

- 大容量データでのメモリ効率
- 遅延ロードと仮想化による UI 応答性
- LRU キャッシュによる計算結果の再利用
- バックグラウンド処理による非ブロッキング操作

### 拡張ガイドライン

- プラグインシステムでの機能追加
- カスタムエクスポーター実装
- 独自フィルタリングロジック
- テーマとスタイルのカスタマイズ

---

## 📞 サポート

API の使用方法や拡張に関する質問は、以下までお気軽にお問い合わせください：

- **GitHub Issues**: バグ報告・機能要求
- **GitHub Discussions**: 実装相談・質問
- **コードレビュー**: プルリクエストでの詳細議論

この API ドキュメントは、jsont の継続的な開発と共に更新されます。