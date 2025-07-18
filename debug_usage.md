# Debug Log Viewer - 使用方法

## 概要

TreeViewコンポーネントの表示と内部データの不一致を調査するため、アプリケーション内でデバッグログを蓄積・閲覧できるシステムを構築しました。

## 使用方法

### 1. アプリケーションの起動

```bash
NODE_ENV=development npm run dev package.json
```

### 2. TreeViewモードの有効化

- `T` キーを押してTreeViewモードに入る
- この時点でデバッグログが蓄積される

### 3. デバッグログビューアーの起動

- `D` キーを押してデバッグログビューアーを開く
- フルスクリーンでデバッグログが表示される

### 4. デバッグログビューアーの操作

- `j` / `k` または `↑` / `↓` : 上下移動
- `Page Up` / `Page Down` : ページ移動
- `gg` : 先頭に移動（vim式のダブルg）
- `G` : 末尾に移動
- `c` : フィルタをクリア
- `C` : 全ログをクリア
- `r` : 最新ログに移動（末尾へ）
- `q` または `Escape` : デバッグログビューアーを終了

## 確認すべき項目

### 1. TreeView初期化時

**カテゴリ**: `TreeView-Init`

- `INITIAL SETUP - Data has keywords:` - 受信したkeywordsデータ
- `INITIAL SCROLL CALCULATION` - スクロール位置の計算結果

### 2. ツリー状態の更新

**カテゴリ**: `TreeView-TreeState`

- `TREE STATE UPDATE - Keywords children:` - ツリーノードのkeywords子要素

### 3. 可視性の確認

**カテゴリ**: `TreeView-Visibility`

- `SCROLL:` - 現在のスクロール位置
- `KEYWORDS IN VISIBLE:` - 表示されているkeywords要素の数
- `VISIBLE KEYWORDS:` - 表示されているkeywords要素の詳細
- `FIRST 15 VISIBLE LINES:` - 表示されている最初の15行

### 4. レンダリング処理

**カテゴリ**: `TreeView-Render`

- `ACTUAL RENDER MAP:` - 各keywords要素のレンダリング情報
- `RENDER:` - 各keywords要素のテキスト生成結果

### 5. テキストレンダリング

**カテゴリ**: `TreeView-TextRender`

- `TEXT RENDER:` - 最終的なテキスト生成結果
- `TEXT DETAILS:` - テキストレンダリングの詳細情報

## 問題の特定方法

### 1. データ整合性の確認

1. `TreeView-Init` カテゴリで受信したkeywordsデータを確認
2. `TreeView-TreeState` カテゴリでツリーノードのkeywords要素を確認
3. 両者が一致しているか確認

### 2. 表示問題の特定

1. `TreeView-Visibility` カテゴリで表示されているkeywords要素を確認
2. `keywords.0` が表示されているか確認
3. `keywords.1` の値が正しいか確認

### 3. レンダリング問題の特定

1. `TreeView-Render` カテゴリで各要素のレンダリング情報を確認
2. `TreeView-TextRender` カテゴリで最終的なテキストが正しいか確認

## 期待される動作

正常な場合、以下のような情報が表示されるはずです：

```
[TreeView-Init] INITIAL SETUP - Data has keywords: ["json","tui","terminal","cli","viewer","jq","jsonata"]
[TreeView-TreeState] TREE STATE UPDATE - Keywords children: keywords.0:0="json", keywords.1:1="tui", keywords.2:2="terminal", ...
[TreeView-Visibility] KEYWORDS IN VISIBLE: 7
[TreeView-Visibility] VISIBLE KEYWORDS: keywords.0:0="json", keywords.1:1="tui", keywords.2:2="terminal", ...
[TreeView-Render] ACTUAL RENDER MAP: keywords.0, key="0", value="json", index=4, lineIndex=24
[TreeView-TextRender] TEXT RENDER: keywords.0, key="0", value="json", text="│  ├─ 0: json"
```

## 問題の報告

デバッグログを確認後、以下の情報を報告してください：

1. `TreeView-Init` カテゴリの `INITIAL SETUP` ログ
2. `TreeView-Visibility` カテゴリの `KEYWORDS IN VISIBLE` と `VISIBLE KEYWORDS` ログ
3. `TreeView-Render` カテゴリの keywords 関連ログ
4. 実際の画面表示で見える内容

これらの情報により、表示と内部データの不一致の原因を特定できます。