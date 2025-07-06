# ライブラリ統合ガイド（2024-2025年版）

## 概要

このドキュメントは、jsont プロジェクトにおける2024-2025年選定ライブラリの詳細な実装ガイドです。最新の調査結果に基づく最適なライブラリの導入方法、設定、パフォーマンス最適化技術について説明します。

## 📋 採用ライブラリサマリー

- **状態管理**: **Jotai** (アトミック設計)
- **JSON処理**: **es-toolkit** (高性能・軽量)
- **JSONクエリ**: **jq-web + JSONata** (ハイブリッド方式)
- **仮想スクロール**: **@tanstack/react-virtual** (最新・高機能)

## 推奨ライブラリの詳細

### 1. 状態管理: Jotai

#### インストール
```bash
npm install jotai
npm install jotai-tanstack-query  # 非同期状態管理用（オプション）
```

#### 基本設定
```typescript
// src/store/atoms.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// プリミティブアトム
export const jsonDataAtom = atom<unknown>(null);
export const filterAtom = atom<string>('');
export const selectedPathAtom = atom<string[]>([]);

// 永続化アトム
export const themeAtom = atomWithStorage<'dark' | 'light'>('jsont-theme', 'dark');

// 計算アトム
export const filteredDataAtom = atom((get) => {
  const data = get(jsonDataAtom);
  const filter = get(filterAtom);
  return applyFilter(data, filter);
});

// アクションアトム
export const setFilterAtom = atom(
  null,
  (get, set, filter: string) => {
    set(filterAtom, filter);
    // 履歴更新等の副作用
  }
);
```

#### 実装戦略
```typescript
// プロジェクト初期からJotaiを採用
// アトミック設計による段階的実装

// 実装順序
const implementationOrder = {
  phase1: '基本アトム（データ・フィルタ・エラー）',
  phase2: '計算アトム（派生状態）',
  phase3: '非同期アトム（フィルタ処理）',
  phase4: '永続化アトム（設定・履歴）',
};
```

#### 利点（2024年調査結果）
- **最小バンドルサイズ**: 2KB core（CLI最適）
- **細粒度更新**: アトミック設計による最適化
- **React Compiler対応**: 2024年技術トレンド
- **開発体験**: TypeScript-first設計

### 2. JSON処理: es-toolkit + JSON5

#### インストール
```bash
npm install es-toolkit json5
# 段階的移行用の互換レイヤー
npm install es-toolkit  # es-toolkit/compat も利用可能
```

#### 基本設定
```typescript
// src/utils/jsonProcessor.ts
import { get, set, has, omit, pick, debounce, memoize } from 'es-toolkit';
import JSON5 from 'json5';

export class JsonProcessor {
  // 高性能JSON処理
  static parse = memoize((input: string) => {
    try {
      return JSON5.parse(input);
    } catch (error) {
      return JSON.parse(input);
    }
  });

  // 最適化されたパス操作
  static getValueAtPath = memoize((data: unknown, path: string[]) => {
    return get(data, path);
  });

  // デバウンス処理（es-toolkit版）
  static debouncedProcess = debounce((data: unknown, callback: Function) => {
    callback(this.processData(data));
  }, 300);
}
```

#### 実装戦略
```typescript
// プロジェクト初期からes-toolkitを採用
// 高性能なJSON処理とユーティリティ関数

// 実装アプローチ
const implementationApproach = {
  phase1: 'コアユーティリティ（get, set, has）',
  phase2: 'パフォーマンス最適化（memoize, debounce）',
  phase3: '配列処理（chunk, flatten, groupBy）',
  phase4: '高度な操作（pick, omit, merge）',
};
```

#### 利点（2024年調査結果）
- **パフォーマンス**: Lodashより20-30%高速
- **バンドルサイズ**: 大幅削減（tree-shaking最適化）
- **互換性**: es-toolkit/compat でスムーズ移行
- **現代的設計**: 最新JavaScript機能活用

### 3. ハイブリッドクエリ: jq-web + JSONata

#### インストール
```bash
npm install jq-web jsonata
npm install --save-dev @types/jsonata
```

#### ハイブリッドエンジン実装
```typescript
// src/utils/hybridQueryProcessor.ts
import jq from 'jq-web';
import jsonata from 'jsonata';

export class HybridQueryProcessor {
  private static jqCache = new Map<string, unknown>();
  private static jsonataCache = new Map<string, any>();

  static async executeQuery(data: unknown, query: string): Promise<QueryResult> {
    const startTime = performance.now();
    
    try {
      // 自動エンジン判定
      const engine = this.detectQueryEngine(query);
      
      let result: unknown;
      switch (engine) {
        case 'jq':
          result = await this.executeJq(data, query);
          break;
        case 'jsonata':
          result = await this.executeJsonata(data, query);
          break;
        default:
          result = this.executeNative(data, query);
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
    if (/\||\[\]|select\(|map\(|group_by\(/.test(query)) {
      return 'jq';
    }
    
    // JSONataパターン: $ルート、配列フィルタ等
    if (/^\$|\..*\[.*\]|\{.*\}/.test(query)) {
      return 'jsonata';
    }
    
    // シンプルなパス表現はネイティブ処理
    return 'native';
  }

  private static async executeJq(data: unknown, query: string): Promise<unknown> {
    const cacheKey = this.getCacheKey(data, query);
    if (this.jqCache.has(cacheKey)) {
      return this.jqCache.get(cacheKey);
    }

    const result = await jq(data, query);
    this.setCacheWithLimit(this.jqCache, cacheKey, result);
    return result;
  }

  private static async executeJsonata(data: unknown, query: string): Promise<unknown> {
    if (this.jsonataCache.has(query)) {
      const expression = this.jsonataCache.get(query);
      return await expression.evaluate(data);
    }

    const expression = jsonata(query);
    this.setCacheWithLimit(this.jsonataCache, query, expression);
    return await expression.evaluate(data);
  }
}
```

#### 利点（2024年調査結果）
- **ベストオブボス**: jqの高機能 + JSONataの使いやすさ
- **自動最適化**: クエリに応じた最適エンジン選択
- **学習コスト**: 段階的に高度な機能を習得可能
- **パフォーマンス**: 軽量クエリは高速ネイティブ処理

### 4. 仮想スクロール: @tanstack/react-virtual

#### インストール
```bash
npm install @tanstack/react-virtual
```

#### 実装例
```typescript
// src/components/VirtualizedJsonViewer.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';

interface VirtualizedJsonViewerProps {
  data: unknown[];
  height: number;
}

export function VirtualizedJsonViewer({ data, height }: VirtualizedJsonViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const flattenedData = useMemo(() => {
    return flattenJsonForVirtualization(data);
  }, [data]);

  const virtualizer = useVirtualizer({
    count: flattenedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // 推定行高
    overscan: 10, // 表示領域外の追加レンダリング行数
  });

  return (
    <div ref={parentRef} style={{ height, overflow: 'auto' }}>
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
          >
            <JsonLine data={flattenedData[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function flattenJsonForVirtualization(data: unknown): JsonLineData[] {
  // JSONを仮想化のためにフラット化
  const result: JsonLineData[] = [];
  
  function traverse(obj: unknown, path: string[] = [], depth = 0) {
    if (Array.isArray(obj)) {
      result.push({ type: 'array-start', path, depth, value: '[' });
      obj.forEach((item, index) => {
        traverse(item, [...path, index.toString()], depth + 1);
      });
      result.push({ type: 'array-end', path, depth, value: ']' });
    } else if (obj && typeof obj === 'object') {
      result.push({ type: 'object-start', path, depth, value: '{' });
      Object.entries(obj).forEach(([key, value]) => {
        traverse(value, [...path, key], depth + 1);
      });
      result.push({ type: 'object-end', path, depth, value: '}' });
    } else {
      result.push({ type: 'value', path, depth, value: obj });
    }
  }
  
  traverse(data);
  return result;
}
```

#### 利点
- 大量データの高速表示
- 柔軟な仮想化オプション
- TypeScript完全対応
- 小さなバンドルサイズ

### 5. 構文ハイライト: react-syntax-highlighter

#### インストール
```bash
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

#### 実装例
```typescript
// src/components/SyntaxHighlighter.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonSyntaxHighlighterProps {
  code: string;
  theme: 'dark' | 'light';
  showLineNumbers?: boolean;
}

export function JsonSyntaxHighlighter({
  code,
  theme,
  showLineNumbers = true,
}: JsonSyntaxHighlighterProps) {
  return (
    <SyntaxHighlighter
      language="json"
      style={theme === 'dark' ? vscDarkPlus : vs}
      showLineNumbers={showLineNumbers}
      customStyle={{
        margin: 0,
        padding: '16px',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
```

#### 利点
- 豊富なテーマ選択
- 行番号表示
- コピー機能
- カスタマイズ可能

### 6. クリップボード操作: clipboardy

#### インストール
```bash
npm install clipboardy
```

#### 実装例
```typescript
// src/utils/clipboard.ts
import clipboardy from 'clipboardy';

export class ClipboardManager {
  static async copyJson(data: unknown, options: ExportOptions = {}) {
    const formatted = this.formatForClipboard(data, options);
    await clipboardy.write(formatted);
  }

  static async copyJsonPath(path: string[]) {
    const pathString = path.map(p => `["${p}"]`).join('');
    await clipboardy.write(pathString);
  }

  static async copyValue(value: unknown) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await clipboardy.write(stringValue);
  }

  private static formatForClipboard(data: unknown, options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, options.pretty ? 2 : 0);
      case 'csv':
        return this.convertToCSV(data);
      case 'yaml':
        return this.convertToYAML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private static convertToCSV(data: unknown[]): string {
    if (!Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }

    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => 
      headers.map(header => JSON.stringify(item[header] || ''))
    );

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private static convertToYAML(data: unknown): string {
    // 簡易YAML変換（本格的な実装はyamlライブラリを使用）
    return JSON.stringify(data, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/^\{$/gm, '')
      .replace(/^\}$/gm, '');
  }
}
```

#### 利点
- クロスプラットフォーム対応
- 非同期API
- 軽量
- 高信頼性

## 統合のベストプラクティス

### 1. 段階的実装戦略

```typescript
// Phase 1: プロジェクト基盤構築
const phase1Dependencies = [
  'jotai',             // 状態管理
  'es-toolkit',        // JSON処理ユーティリティ
  'json5',             // JSON拡張対応
  'ink',               // TUIフレームワーク
];

// Phase 2: コア機能実装
const implementationPlan = {
  week1: 'Jotaiアトム基本実装',
  week2: 'es-toolkit JSON処理実装',
  week3: '仮想スクロール統合',
  week4: '基本UI・構文ハイライト',
};

// Phase 3: 高度な機能
const advancedFeatures = [
  '@tanstack/react-virtual',     // 仮想スクロール
  'react-syntax-highlighter',    // 構文ハイライト
  'jq-web',                      // jq統合
  'jsonata',                     // JSONata統合
];
```

### 2. バンドルサイズ最適化

```typescript
// Tree-shaking最適化のインポート
import { debounce, get, set } from 'es-toolkit';  // 高性能・軽量
import { atom, useAtom } from 'jotai';            // 最小バンドル

// 遅延ローディング
const JsonViewer = lazy(() => import('./components/JsonViewer'));
const HybridQueryEngine = lazy(() => import('./utils/hybridQueryProcessor'));

// バンドル最適化目標
export const bundleTargets = {
  // 初期目標
  coreBundle: '< 100KB',
  lazyLoaded: '< 200KB (全機能込み)',
  
  // ライブラリ別サイズ
  jotai: '5KB (core)',
  esToolkit: '20-30KB (使用分のみ)',
  ink: '40KB',
};
```

### 3. パフォーマンス監視

```typescript
// パフォーマンス計測
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return Promise.resolve(fn()).then(result => {
    const duration = performance.now() - start;
    console.log(`${name}: ${duration}ms`);
    return result;
  });
}
```

### 4. エラーハンドリング

```typescript
// ライブラリエラーの統一処理
export class LibraryError extends Error {
  constructor(
    message: string,
    public library: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}

export function handleLibraryError(error: Error, library: string): LibraryError {
  return new LibraryError(
    `Error in ${library}: ${error.message}`,
    library,
    error
  );
}
```

## 今後の拡張検討

### 1. Web Worker統合
```typescript
// src/workers/jsonProcessor.worker.ts
import { expose } from 'comlink';

const jsonProcessor = {
  async processLargeJson(data: unknown, filter: string) {
    // 重い処理をWorkerで実行
    return await processJsonWithJq(data, filter);
  }
};

expose(jsonProcessor);
```

### 2. プラグインシステム
```typescript
// src/plugins/pluginSystem.ts
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  
  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }
  
  activate(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.activate(this.createContext());
    }
  }
}
```

### 3. 設定管理
```typescript
// src/config/configManager.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Config {
  theme: string;
  fontSize: number;
  keyBindings: Record<string, string>;
  plugins: string[];
}

export const useConfigStore = create<Config>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 14,
      keyBindings: defaultKeyBindings,
      plugins: [],
    }),
    {
      name: 'jsont-config',
    }
  )
);
```

## まとめ

推奨ライブラリの統合により、以下の改善が期待できます：

1. **パフォーマンス向上**: 仮想スクロールとメモ化によるレスポンス改善
2. **機能拡張**: jq統合による高度なフィルタリング
3. **開発効率**: TypeScript-firstライブラリによる型安全性
4. **保守性**: 確立されたライブラリによる安定性
5. **拡張性**: プラグインシステムによるカスタマイズ性

段階的な導入により、リスクを最小限に抑えながら機能を向上させることができます。