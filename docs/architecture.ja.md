# アーキテクチャ設計書（改訂版）

## システム概要

`jsont` は React と Ink フレームワークを基盤とした高性能 TUI アプリケーションです。モジュラーな設計により、各機能が独立して開発・テスト・保守できる構造を採用し、最適化されたライブラリを活用してパフォーマンスと機能性を向上させています。

## 採用ライブラリスタック（2024-2025年版）

### コア技術スタック
- **TUI Framework**: Ink 6.0+ (React-based TUI)
- **State Management**: Jotai 2.0+ (アトミック・軽量)
- **JSON Processing**: es-toolkit + JSON5 (高性能・軽量)
- **JSON Query**: jq-web + JSONata (ハイブリッド方式)
- **Virtual Scrolling**: @tanstack/react-virtual 3.0+ (最新・高機能)
- **Syntax Highlighting**: react-syntax-highlighter 15.0+ (多テーマ対応)
- **Clipboard**: clipboardy 4.0+ (クロスプラットフォーム)
- **File System**: node:fs/promises (Node.js標準)

### 選定理由と期待効果
| ライブラリ | 選定理由 | 期待効果 |
|-----------|---------|----------|
| **Jotai** | CLIアプリ最適化、アトミック設計 | バンドルサイズ削減、細粒度管理 |
| **es-toolkit** | Lodashより高性能・軽量 | 20-30%性能向上、軽量化 |
| **ハイブリッドクエリ** | 使いやすさと高機能の両立 | 学習コスト削減、柔軟性向上 |

## アーキテクチャ図（改訂版）

```
┌─────────────────────────────────────────────────────────────┐
│                        Entry Point                         │
│                      (src/index.tsx)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Stdin Reader  │  │ JSON5 Parser    │  │ Error Handler│ │
│  │   (fs/promises) │  │   (json5)       │  │ (enhanced)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Main Application                       │
│                      (src/App.tsx)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  State Manager  │  │ Event Handler   │  │ Layout Logic │ │
│  │   (Zustand)     │  │   (Ink hooks)   │  │ (Ink + CSS)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
        ┌─────────────────┐ ┌─────────┐ ┌─────────────────┐
        │   StatusBar     │ │ Filter  │ │   JsonViewer    │
        │   Component     │ │ Input   │ │   Component     │
        │ (Enhanced UI)   │ │ (jq-web)│ │ (Virtualized)   │
        └─────────────────┘ └─────────┘ └─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
        ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
        │ Syntax Highliter│     │ Virtual Scroller│     │ Value Renderer  │
        │react-syntax-high│     │@tanstack/virtual│     │   (Optimized)   │
        └─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Enhanced Utility Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  JSON Processor │  │   JQ Processor  │  │ Data Export  │ │
│  │(Lodash + JSON5) │  │   (jq-web)      │  │ (clipboardy) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Theme Manager  │  │ Performance     │  │ Navigation   │ │
│  │  (Multi-theme)  │  │  (Memoization)  │  │ (Keyboard)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## レイヤー設計

### 1. Entry Point Layer

**責務**: アプリケーションの初期化と外部インターフェース

**コンポーネント**:
- `src/index.tsx`: メインエントリーポイント
- Stdin Reader: 標準入力からのデータ読み込み
- JSON Parser: 入力データのパース
- Error Handler: 初期化時のエラー処理

**設計原則**:
- 単一責任の原則: 入力処理のみに集中
- エラーファースト: 不正入力の早期検出
- 非ブロッキング: TTY検出による適切な入力処理

### 2. Application Layer

**責務**: アプリケーション全体の状態管理と調整

**コンポーネント**:
- `src/App.tsx`: メインアプリケーションコンポーネント
- State Manager: グローバル状態の管理
- Event Handler: キーボード入力の処理
- Layout Logic: コンポーネント配置の制御

**状態管理（Jotai）**:
```typescript
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// プリミティブアトム（アトミック設計）
export const jsonDataAtom = atom<unknown>(null);
export const filterAtom = atom<string>('');
export const selectedPathAtom = atom<string[]>([]);
export const errorAtom = atom<string | null>(null);
export const viewModeAtom = atom<'compact' | 'detail' | 'presentation'>('detail');
export const isFilterModeAtom = atom<boolean>(false);

// 永続化アトム
export const themeAtom = atomWithStorage<'dark' | 'light'>('jsont-theme', 'dark');
export const filterHistoryAtom = atomWithStorage<string[]>('jsont-filter-history', []);

// 計算アトム（派生状態）
export const filteredDataAtom = atom((get) => {
  const data = get(jsonDataAtom);
  const filter = get(filterAtom);
  
  if (!data || !filter) return data;
  
  try {
    return applyHybridQuery(data, filter); // ハイブリッドクエリエンジン
  } catch (error) {
    return data;
  }
});

// JSON統計アトム
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

// 表示用データアトム（仮想化対応）
export const displayDataAtom = atom((get) => {
  const data = get(filteredDataAtom);
  const viewMode = get(viewModeAtom);
  
  return flattenForVirtualization(data, viewMode);
});

// 非同期アクションアトム
export const applyFilterAtom = atom(
  null,
  async (get, set, filter: string) => {
    const data = get(jsonDataAtom);
    if (!data) return;
    
    set(errorAtom, null);
    
    try {
      // ハイブリッドクエリエンジンで非同期処理
      const result = await HybridQueryProcessor.executeQuery(data, filter);
      if (result.success) {
        set(filteredDataAtom, result.data);
        set(filterAtom, filter);
        
        // 履歴に追加
        const history = get(filterHistoryAtom);
        if (!history.includes(filter)) {
          set(filterHistoryAtom, [...history, filter]);
        }
      } else {
        set(errorAtom, result.error);
      }
    } catch (error) {
      set(errorAtom, error.message);
    }
  }
);

// カスタムフック
export function useJsonStore() {
  return {
    jsonData: useAtomValue(jsonDataAtom),
    setJsonData: useSetAtom(jsonDataAtom),
    filter: useAtomValue(filterAtom),
    filteredData: useAtomValue(filteredDataAtom),
    stats: useAtomValue(jsonStatsAtom),
    applyFilter: useSetAtom(applyFilterAtom),
  };
}
```

### 3. Component Layer

**責務**: UI コンポーネントの実装と表示ロジック

#### StatusBar Component
- アプリケーション状態の表示
- エラーメッセージの表示
- 操作ヒントの提供

#### FilterInput Component
- jq フィルタの入力と表示
- フィルタ結果のプレビュー
- 構文エラーの表示

#### JsonViewer Component
- JSON データの階層表示
- 構文ハイライト
- インタラクティブなナビゲーション

**設計パターン**:
- **Composition Pattern**: 小さなコンポーネントの組み合わせ
- **Render Props**: 柔軟な表示ロジックの提供
- **Higher-Order Components**: 共通機能の抽象化

### 4. Utility Layer

**責務**: 再利用可能な汎用機能の提供

#### JSON 処理ユーティリティ（es-toolkit版）
```typescript
// src/utils/jsonParser.ts
import JSON5 from 'json5';
import { get, set, has, omit, pick, debounce, memoize } from 'es-toolkit';

export interface ParseResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    size: number;
    depth: number;
    keys: string[];
  };
}

export function parseJsonSafely(input: string): ParseResult {
  try {
    // JSON5を使用してコメントや末尾カンマに対応
    const data = JSON5.parse(input);
    return {
      success: true,
      data,
      metadata: {
        size: JSON.stringify(data).length,
        depth: getObjectDepth(data),
        keys: getAllKeys(data),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export function formatJsonValue(value: unknown): string;
export function getJsonPath(data: unknown, path: string[]): unknown;
export function setJsonPath(data: unknown, path: string[], value: unknown): unknown;
export function getObjectDepth(obj: unknown): number;
export function getAllKeys(obj: unknown): string[];
```

#### ハイブリッドクエリエンジン（jq-web + JSONata）
```typescript
// src/utils/hybridQueryProcessor.ts
import jq from 'jq-web';
import jsonata from 'jsonata';

export interface FilterResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export class HybridQueryProcessor {
  static async executeQuery(data: unknown, query: string): Promise<FilterResult> {
    const startTime = performance.now();
    
    try {
      // クエリエンジンの自動判定
      const engine = this.detectQueryEngine(query);
      
      let result: unknown;
      switch (engine) {
        case 'jq':
          result = await jq(data, query);
          break;
        case 'jsonata':
          const expression = jsonata(query);
          result = await expression.evaluate(data);
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
        executionTime: performance.now() - startTime,
      };
    }
  }
  
  private static detectQueryEngine(query: string): 'jq' | 'jsonata' | 'native' {
    // jqパターン: パイプ、select、map等
    if (/\||\[\]|select\(|map\(|group_by\(/.test(query)) return 'jq';
    
    // JSONataパターン: $ルート、配列フィルタ等  
    if (/^\$|\..*\[.*\]|\{.*\}/.test(query)) return 'jsonata';
    
    // シンプルなパス表現
    return 'native';
  }
  
  private static executeNativeQuery(data: unknown, query: string): unknown {
    // 軽量なパス表現処理
    const path = query.replace(/^\$\.?/, '').split('.');
    let result = data;
    
    for (const segment of path) {
      if (result == null) break;
      result = (result as any)[segment];
    }
    
    return result;
  }
}

export function validateQuerySyntax(query: string): ValidationResult;
export function getQueryAutoComplete(query: string, data: unknown): string[];
```

#### テーマ・スタイリングユーティリティ（多テーマ対応）
```typescript
// src/utils/themes.ts
export interface ColorTheme {
  name: string;
  background: string;
  foreground: string;
  
  // JSON syntax colors
  string: string;
  number: string;
  boolean: string;
  null: string;
  key: string;
  bracket: string;
  
  // UI colors
  accent: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
  
  // Interactive colors
  selected: string;
  focused: string;
  disabled: string;
}

export const themes: Record<string, ColorTheme> = {
  dark: { /* VSCode Dark theme */ },
  light: { /* VSCode Light theme */ },
  nord: { /* Nord theme */ },
  monokai: { /* Monokai theme */ },
};

export function getTheme(name: string): ColorTheme;
export function createCustomTheme(base: ColorTheme, overrides: Partial<ColorTheme>): ColorTheme;
```

#### パフォーマンスユーティリティ（es-toolkit版）
```typescript
// src/utils/performance.ts
import { debounce, throttle, memoize } from 'es-toolkit';

export const debounceFilter = debounce((filter: string, callback: Function) => {
  callback(filter);
}, 300);

export const memoizedJsonParse = memoize(JSON.parse);
export const memoizedJsonStringify = memoize(JSON.stringify);

export class VirtualizedRenderer {
  private visibleItems: number = 50;
  private itemHeight: number = 20;
  
  constructor(containerHeight: number) {
    this.visibleItems = Math.ceil(containerHeight / this.itemHeight) + 5;
  }
  
  getVisibleRange(scrollTop: number): [number, number] {
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.min(start + this.visibleItems, this.totalItems);
    return [start, end];
  }
}
```

#### クリップボード・エクスポートユーティリティ
```typescript
// src/utils/clipboard.ts
import clipboardy from 'clipboardy';

export interface ExportOptions {
  format: 'json' | 'csv' | 'yaml' | 'path';
  pretty: boolean;
  selection?: JSONPath;
}

export async function copyToClipboard(data: unknown, options: ExportOptions): Promise<void> {
  const formatted = formatForExport(data, options);
  await clipboardy.write(formatted);
}

export function formatForExport(data: unknown, options: ExportOptions): string;
export function getJsonPath(data: unknown, path: JSONPath): string;
```

## 統合TextInputシステム（2025年版）

### TextInput アーキテクチャの統合

2025年初頭に実施された大規模リファクタリングにより、従来の分散していたテキスト入力ロジックが統一されました：

#### 統合前の構造
- `utils/textInput.ts`: 低レベルのテキスト入力ユーティリティ
- `features/common/components/TextInput.tsx`: React コンポーネント実装
- 各コンポーネント: 独自のテキスト入力ロジック

#### 統合後の統一アーキテクチャ
```typescript
// src/features/common/components/TextInput.tsx
export interface TextInputState {
  text: string;
  cursorPosition: number;
}

export interface TextInputActions {
  setText: (text: string) => void;
  setCursorPosition: (position: number) => void;
}

// 統一されたテキスト入力ハンドラー
export function handleTextInput(
  state: TextInputState,
  actions: TextInputActions,
  key: KeyboardEvent,
  input?: string,
): boolean;

// React フック統合
export function useTextInput(initialValue: string): {
  state: TextInputState;
  setValue: (value: string) => void;
  setCursorPosition: (position: number) => void;
  handleKeyInput: TextInputKeyHandler;
  getDisplayText: (isActive: boolean, placeholder?: string) => DisplayText;
};
```

#### 強化されたキーボードショートカット

**Emacs風ショートカット**:
- **Ctrl+A**: 行の先頭に移動 (Beginning of line)
- **Ctrl+E**: 行の末尾に移動 (End of line)
- **Ctrl+F**: カーソルを右に移動 (Forward char)
- **Ctrl+B**: カーソルを左に移動 (Backward char)
- **Ctrl+K**: カーソルから行末まで削除 (Kill line)
- **Ctrl+U**: 行の先頭からカーソルまで削除 (Unix line discard)
- **Ctrl+W**: 単語を後方削除 (Backward kill word)
- **Ctrl+D**: カーソル位置の文字を削除 (Delete char)

**プラットフォーム対応**:
- **macOS**: Delete キーは Backspace として動作
- **その他**: Delete キーは前方削除として動作

#### レガシー互換性

統合プロセスでは既存のAPIとの互換性を維持：

```typescript
// レガシー状態フォーマットのサポート
export interface LegacyTextInputStateCompat {
  value: string;  // 旧: value → 新: text
  cursorPosition: number;
}

export function convertLegacyState(legacy: LegacyTextInputStateCompat): TextInputState;
export function convertToLegacyState(state: TextInputState): LegacyTextInputStateCompat;
```

## インポートシステム近代化

### TypeScript パスエイリアス導入

#### 必須エイリアス使用規則
```typescript
// ✅ 必須: クロス機能インポートでのエイリアス使用
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";
import { SearchBar } from "@features/search/components/SearchBar";
import { TextInput } from "@features/common/components/TextInput";

// ❌ 禁止: クロス機能での相対パス
import { JsonViewer } from "../../../features/json-rendering/components/JsonViewer";
```

#### エイリアス構成
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@core/*": ["core/*"],
      "@features/*": ["features/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

#### インポート組織化ルール
1. **外部ライブラリ**: React, Ink, その他のnpmパッケージ
2. **内部モジュール**: @core, @features エイリアス
3. **相対インポート**: 同一機能内での ./relative パス

```typescript
// 推奨インポート順序
import { Box, Text, useInput } from "ink";
import { useCallback, useState } from "react";

import type { AppProps } from "@core/types/app";
import { handleTextInput } from "@features/common/components/TextInput";
import { JsonViewer } from "@features/json-rendering/components/JsonViewer";

import { localHelper } from "./helpers";
```

## データフロー

### 1. 初期化フロー
```
stdin → JSON Parser → Validation → App State → Initial Render
```

### 2. フィルタリングフロー
```
User Input → TextInput System → Filter State → jq Processor → Filtered Data → Re-render
```

### 3. ナビゲーションフロー
```
Keyboard Event → TextInput Handler → Event Handler → State Update → Component Update
```

### 4. TextInput統合フロー（新規）
```
Keyboard Input → handleTextInput() → TextInputActions → State Update → Display Refresh
                     ↑
            Emacs shortcuts + Platform detection
```

## モジュール分割戦略

### コア機能モジュール
- **Display Module**: JSON 表示とレンダリング
- **Filter Module**: 検索とフィルタリング機能
- **Navigation Module**: キーボードナビゲーション
- **Theme Module**: カラーリングとテーマ

### 拡張可能モジュール
- **Export Module**: 各種フォーマットでのエクスポート
- **Plugin Module**: 将来的なプラグインシステム
- **Config Module**: 設定管理

## パフォーマンス設計

### メモリ効率化（改善版）
- **仮想スクロール**: @tanstack/react-virtual による表示領域のみレンダリング
- **メモ化**: Lodash memoize による計算結果のキャッシュ
- **データ分割**: 大きなJSONの段階的読み込み
- **ガベージコレクション**: React.memo と useCallback による不要レンダリング防止

### 応答性向上（改善版）
- **非同期処理**: jq-web による非ブロッキングフィルタリング
- **デバウンス**: 300ms デバウンスによる連続入力の最適化
- **Web Worker**: 重い処理の分離実行（将来対応）
- **プログレッシブローディング**: 大容量データの段階的表示

### パフォーマンス最適化技術
```typescript
// React.memo を使用したコンポーネントの最適化
const JsonViewerMemo = React.memo(JsonViewer, (prevProps, nextProps) => {
  return isEqual(prevProps.data, nextProps.data) && 
         prevProps.selectedPath === nextProps.selectedPath;
});

// useMemo を使用したデータ処理の最適化
const processedData = useMemo(() => {
  return processJsonData(jsonData, filter);
}, [jsonData, filter]);

// useCallback を使用したイベントハンドラの最適化
const handleKeyPress = useCallback((key: string) => {
  navigationHandler(key);
}, [navigationHandler]);
```

## セキュリティ設計

### 入力検証
- JSON 構文の厳密な検証
- jq フィルタの安全性チェック
- メモリ使用量の制限

### エラー処理
- Graceful degradation
- 適切なエラーメッセージ
- アプリケーションクラッシュの防止

## テスト戦略

### ユニットテスト
- 各ユーティリティ関数のテスト
- コンポーネントの分離テスト
- エラーケースの網羅

### 統合テスト
- データフローの端から端までのテスト
- 実際のJSON ファイルを使用したテスト
- パフォーマンステスト

### E2E テスト
- 実際のユースケースのシミュレーション
- 複雑な操作シーケンスのテスト