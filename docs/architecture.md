# アーキテクチャ設計書

## システム概要

`jsont` は React と Ink フレームワークを基盤とした TUI アプリケーションです。モジュラーな設計により、各機能が独立して開発・テスト・保守できる構造を採用しています。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        Entry Point                         │
│                      (src/index.tsx)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Stdin Reader  │  │  JSON Parser    │  │ Error Handler│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Main Application                       │
│                      (src/App.tsx)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  State Manager  │  │ Event Handler   │  │ Layout Logic │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
        ┌─────────────────┐ ┌─────────┐ ┌─────────────────┐
        │   StatusBar     │ │ Filter  │ │   JsonViewer    │
        │   Component     │ │ Input   │ │   Component     │
        │                 │ │ Comp.   │ │                 │
        └─────────────────┘ └─────────┘ └─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
        ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
        │ Syntax Highliter│     │ Tree Navigator  │     │ Value Renderer  │
        └─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  JSON Parser    │  │   JQ Processor  │  │ Color Themes │ │
│  │   (utils/)      │  │   (utils/)      │  │  (utils/)    │ │
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

**状態管理**:
```typescript
interface AppState {
  jsonData: unknown;           // 元のJSONデータ
  filteredData: unknown;      // フィルタ適用後のデータ
  filter: string;             // 現在のフィルタ文字列
  error: string | null;       // エラー状態
  viewMode: ViewMode;         // 表示モード
  selectedPath: JSONPath;     // 選択中のパス
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

#### JSON 処理ユーティリティ
```typescript
// src/utils/jsonParser.ts
export function parseJsonSafely(input: string): ParseResult;
export function formatJsonValue(value: unknown): string;
export function getJsonPath(data: unknown, path: string[]): unknown;
```

#### jq 統合ユーティリティ
```typescript
// src/utils/jqProcessor.ts
export function applyJqFilter(data: unknown, filter: string): FilterResult;
export function validateJqSyntax(filter: string): ValidationResult;
```

#### テーマ・スタイリングユーティリティ
```typescript
// src/utils/themes.ts
export interface ColorTheme {
  string: string;
  number: string;
  boolean: string;
  null: string;
  key: string;
}
```

## データフロー

### 1. 初期化フロー
```
stdin → JSON Parser → Validation → App State → Initial Render
```

### 2. フィルタリングフロー
```
User Input → Filter State → jq Processor → Filtered Data → Re-render
```

### 3. ナビゲーションフロー
```
Keyboard Event → Event Handler → State Update → Component Update
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

### メモリ効率化
- **遅延レンダリング**: 表示領域のみをレンダリング
- **メモ化**: 計算済み結果のキャッシュ
- **ガベージコレクション**: 不要なオブジェクトの適切な解放

### 応答性向上
- **非同期処理**: 重い処理の非同期化
- **デバウンス**: 連続入力の最適化
- **仮想スクロール**: 大量データの効率的表示

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