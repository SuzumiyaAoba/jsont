# UI/UX 設計書

## 設計コンセプト

### 核となる価値
- **効率性**: 最小限のキーストロークで最大の価値を提供
- **可視性**: 重要な情報を適切に強調表示
- **一貫性**: 予測可能で直感的な操作体験
- **アクセシビリティ**: 多様な環境とユーザーニーズに対応

### デザイン原則
- **ミニマリズム**: 必要な情報のみを表示
- **階層の明確化**: データ構造の視覚的表現
- **即座のフィードバック**: 操作結果の瞬間的な反映
- **エラー予防**: 分かりやすいガイダンス

## レイアウト設計

### 全体レイアウト
```
┌─────────────────────────────────────────────────────────────┐
│ StatusBar: jsont v1.0 | Ready | Ctrl+C to exit             │ 80x1
├─────────────────────────────────────────────────────────────┤
│ Filter: .users[] | select(.age > 25)                       │ 80x3
├─────────────────────────────────────────────────────────────┤
│ JSON Content Area                                           │ 80x(H-4)
│ {                                                           │
│   "users": [                                               │
│     {                                                       │
│       "name": "Alice",                                     │
│       "age": 30,                                           │
│       "active": true                                       │
│     },                                                      │
│     ...                                                     │
│   ]                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### レスポンシブ対応
#### 狭い画面 (幅 < 80)
- フィルタ入力を1行に短縮
- JSON表示の自動折り返し
- ステータスバーの簡略化

#### 広い画面 (幅 > 120)
- サイドパネルでのJSON構造ツリー表示
- フィルタヒストリーパネル
- 拡張ステータス情報

## カラーパレット

### ダークテーマ（デフォルト）
```scss
$bg-primary: #1e1e1e;      // メイン背景
$bg-secondary: #2d2d2d;    // セカンダリ背景
$border: #3e3e3e;          // ボーダー色

// JSON構文色
$json-string: #ce9178;     // 文字列
$json-number: #b5cea8;     // 数値
$json-boolean: #569cd6;    // ブール値
$json-null: #808080;       // null
$json-key: #9cdcfe;        // オブジェクトキー
$json-bracket: #d4d4d4;    // 括弧・記号

// UI色
$text-primary: #d4d4d4;    // メインテキスト
$text-secondary: #808080;  // セカンダリテキスト
$accent: #007acc;          // アクセント色
$warning: #ffcc02;         // 警告色
$error: #f14c4c;           // エラー色
$success: #89d185;         // 成功色
```

### ライトテーマ
```scss
$bg-primary: #ffffff;
$bg-secondary: #f3f3f3;
$border: #e1e1e1;

$json-string: #a31515;
$json-number: #098658;
$json-boolean: #0000ff;
$json-null: #808080;
$json-key: #001080;
$json-bracket: #000000;

$text-primary: #000000;
$text-secondary: #6a6a6a;
$accent: #0078d4;
$warning: #ffb900;
$error: #d83b01;
$success: #107c10;
```

## コンポーネント設計

### 統合TextInput Component（2025年版）
**目的**: 統一されたテキスト入力体験の提供

#### 設計仕様
```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isActive?: boolean;
  color?: string;
  backgroundColor?: string;
  prefix?: string;
  width?: number;
}
```

#### 視覚的設計
```
┌─────────────────────────────────────────────────────────────┐
│ > jq query: .users[] | select(.age > 25)█                 │ アクティブ状態
│ > jq query: .users[] | select(.age > 25)                  │ 非アクティブ状態
│ > jq query: [placeholder text]                            │ プレースホルダー
└─────────────────────────────────────────────────────────────┘
```

#### 状態表示
- **アクティブ**: 青色背景のカーソル、白色テキスト
- **非アクティブ**: グレー色テキスト、カーソルなし
- **プレースホルダー**: 薄いグレー色の説明文

#### カーソル動作
```typescript
// カーソル位置計算
const cursorPosition = {
  beforeCursor: text.slice(0, position),
  atCursor: text[position] || " ",
  afterCursor: text.slice(position + 1)
};
```

#### キーボードショートカット表示
```
┌─────────────────────────────────────────────────────────────┐
│ Text Input Help:                                           │
│ Ctrl+A: Beginning  Ctrl+E: End      Ctrl+F: Forward       │
│ Ctrl+B: Backward   Ctrl+K: Kill     Ctrl+U: Unix discard  │
│ Ctrl+W: Kill word  Ctrl+D: Delete   Backspace: Delete     │
│ Delete: Platform-specific behavior (macOS: left, other: right) │
└─────────────────────────────────────────────────────────────┘
```

#### 適用コンポーネント
- **SearchBar**: JSON検索・フィルタリング
- **JqQueryInput**: jqクエリ入力
- **ExportDialog**: ファイル名・パス・URL入力
- **SettingsInput**: 設定値入力（将来実装）

#### レガシー互換性
```typescript
// 旧API対応
interface LegacyTextInputStateCompat {
  value: string;  // 新: text
  cursorPosition: number;
}

// 自動変換機能
convertLegacyState(legacy) → TextInputState
convertToLegacyState(state) → LegacyTextInputStateCompat
```

### StatusBar Component
**目的**: アプリケーション状態とナビゲーション情報の表示

**レイアウト**:
```
┌─────────────────────────────────────────────────────────────┐
│ [APP] jsont │ [STATUS] ● Ready │ [INFO] 1.2K lines │ [HELP] ?│
└─────────────────────────────────────────────────────────────┘
```

**状態表示**:
- ● Ready (緑): 正常状態
- ● Processing (黄): 処理中
- ● Error (赤): エラー状態
- ○ Disconnected (グレー): 非アクティブ

### FilterInput Component
**目的**: jq フィルタの入力と結果プレビュー

**通常状態**:
```
┌─────────────────────────────────────────────────────────────┐
│ Filter: .users[] | select(.age > 25)                       │
│ ✓ 23 matches found                                         │
└─────────────────────────────────────────────────────────────┘
```

**エラー状態**:
```
┌─────────────────────────────────────────────────────────────┐
│ Filter: .users[] | invalid_syntax                          │
│ ✗ Syntax error at position 12: unexpected token           │
└─────────────────────────────────────────────────────────────┘
```

**編集モード**:
```
┌─────────────────────────────────────────────────────────────┐
│ Filter: .users[] | select(.age > _                         │
│ Suggestions: .age, .name, .email, .active                  │
└─────────────────────────────────────────────────────────────┘
```

### JsonViewer Component
**目的**: JSON データの構造化表示

**基本表示**:
```json
{
  "users": [
    {
      "name": "Alice",
      "age": 30,
      "email": "alice@example.com",
      "active": true,
      "metadata": null
    }
  ],
  "total": 1
}
```

**展開/折りたたみ状態**:
```json
{
  "users": [...3 items],     // 折りたたみ状態
  "metadata": {              // 展開状態
    "version": "1.0",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "total": 3
}
```

**選択状態**:
```json
{
  "users": [
    {
      ▶ "name": "Alice",           // 選択行（ハイライト）
      "age": 30,
      "active": true
    }
  ]
}
```

## インタラクション設計

### キーボードナビゲーション

#### 基本移動
- `↑/↓`: 行間移動
- `Page Up/Down`: ページスクロール
- `Home/End`: ドキュメント先頭/末尾
- `Ctrl+↑/↓`: 高速スクロール

#### 階層操作
- `→`: ノード展開
- `←`: ノード折りたたみ
- `Space`: 展開/折りたたみトグル
- `Enter`: 値の詳細表示

#### 検索・フィルタ
- `/`: インクリメンタル検索開始
- `Tab`: フィルタ入力モード切り替え
- `Ctrl+F`: 詳細検索ダイアログ
- `Esc`: 検索/フィルタモード終了

#### クイックアクション
- `c`: 選択値をクリップボードにコピー
- `p`: JSON パスをコピー
- `e`: エクスポートメニュー
- `?`: ヘルプ表示

### マウス操作（将来対応）
- **クリック**: ノード選択
- **ダブルクリック**: 展開/折りたたみ
- **右クリック**: コンテキストメニュー
- **ホイール**: スクロール

## 表示モード

### コンパクトモード
- 最小限の空白
- 簡略化されたUI要素
- 小さい画面に最適化

### 詳細モード（デフォルト）
- 適切な余白と視覚的階層
- 完全な機能セット
- 読みやすさを重視

### プレゼンテーションモード
- 大きなフォント
- 高コントラスト
- デモや説明用途に最適

## アクセシビリティ

### 視覚的配慮
- **高コントラスト対応**: 十分な色彩コントラスト比
- **カラーブラインド対応**: 色に依存しない情報表現
- **フォントサイズ**: スケーラブルなフォント設定

### 操作性配慮
- **キーボード完全対応**: マウス不要の操作
- **ショートカット表示**: 文脈的ヘルプ
- **一貫した操作**: 予測可能なキーバインド

### 情報伝達
- **明確なフィードバック**: 操作結果の即座通知
- **エラーメッセージ**: 具体的で実行可能な指示
- **進捗表示**: 長時間処理の可視化

## パフォーマンス配慮

### 描画最適化
- **仮想スクロール**: 表示領域のみレンダリング
- **差分更新**: 変更部分のみ再描画
- **遅延レンダリング**: オンデマンド要素生成

### 応答性維持
- **非ブロッキング操作**: UI操作の中断なし
- **プログレッシブローディング**: 段階的コンテンツ表示
- **デバウンス処理**: 連続入力の最適化

### メモリ効率
- **要素の再利用**: DOM要素プーリング
- **適切なクリーンアップ**: 不要リソースの解放
- **メモリ監視**: 使用量の継続的モニタリング