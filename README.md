# jsont

高性能なターミナル JSON ビューワー - インタラクティブなデータ探索とクエリ機能を提供

[![Node.js CI](https://github.com/SuzumiyaAoba/jsont/actions/workflows/ci.yml/badge.svg)](https://github.com/SuzumiyaAoba/jsont/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/jsont.svg)](https://badge.fury.io/js/jsont)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern Terminal User Interface (TUI) JSON viewer built with React and Ink, offering advanced query capabilities, interactive exploration, and comprehensive data export options.

## ✨ 主要機能

### 🔍 高度な表示モード
- **ツリービュー**: 階層構造を直感的に表示・操作
- **折りたたみビュー**: 構文ハイライト付きコンパクト表示
- **スキーマビュー**: JSONスキーマの自動生成・表示
- **Raw ビュー**: プレーンJSONの行番号付き表示

### 🚀 パワフルな検索・クエリ機能
- **スコープ別検索**: キー、値、または全体から選択可能
- **正規表現サポート**: 柔軟なパターンマッチング
- **jq クエリエンジン**: 強力なデータ変換・抽出
- **リアルタイムプレビュー**: 入力中の即座な結果表示

### 📊 データエクスポート
- **多形式対応**: JSON, YAML, CSV, XML, SQL形式での出力
- **JSONスキーマ**: データ構造からスキーマを自動生成
- **SQLテーブル変換**: 構造化データのSQL DDL生成

### ⚡ パフォーマンス最適化
- **大容量ファイル対応**: 数百MBのJSONファイルも高速処理
- **仮想化スクロール**: メモリ効率的な表示
- **キャッシュシステム**: 処理済みデータの高速再利用
- **バックグラウンド処理**: ノンブロッキングなデータ処理

### 🎨 カスタマイズ性
- **インタラクティブ設定**: ライブプレビュー付き設定エディタ
- **YAML設定**: ホットリロード対応の設定ファイル
- **キーバインド**: vim風のキーボードナビゲーション
- **テーマ**: ダーク・ライトモード対応

### 🛠️ 開発者向け機能
- **デバッグモード**: パフォーマンス監視・トラブルシューティング
- **ヘルプシステム**: コンテキスト感応型ヘルプ
- **設定エクスポート**: チーム間での設定共有
- **詳細ログ**: 開発・運用時の詳細な動作ログ

## 📦 インストール

### npm経由（推奨）
```bash
npm install -g jsont
```

### ローカルプロジェクトに追加
```bash
npm install jsont
npx jsont data.json
```

### 開発版のビルド
```bash
git clone https://github.com/SuzumiyaAoba/jsont.git
cd jsont
npm install
npm run build
npm link
```

### 動作要件
- **Node.js**: 18.0.0 以上
- **npm**: 8.0.0 以上
- **Terminal**: ANSI カラー対応ターミナル

## 🚀 使用方法

### 基本的な使用法

```bash
# ファイルから読み込み
jsont data.json
jsont /path/to/large-dataset.json

# 標準入力から読み込み
echo '{"name": "John", "age": 30, "skills": ["JavaScript", "TypeScript"]}' | jsont
cat complex-data.json | jsont

# APIレスポンスを直接表示
curl -s https://api.github.com/users/octocat | jsont
curl -s https://jsonplaceholder.typicode.com/posts/1 | jsont

# パイプライン処理での活用
jq '.users[]' large-data.json | jsont
aws ec2 describe-instances --output json | jsont
```

### 高度な使用例

```bash
# jqクエリとの組み合わせ
echo '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}' | jsont
# アプリ内でJキーを押してクエリモード: .users[] | select(.age > 25)

# 大容量ログファイルの分析
tail -f application.log | jq -c '. | select(.level == "ERROR")' | jsont

# Kubernetes リソースの調査
kubectl get pods -o json | jsont
```

### 🎛️ 表示モード

| モード | キー | 説明 | 用途 |
|--------|------|------|------|
| **ツリービュー** | `T` (デフォルト) | 階層構造を展開・折りたたみ可能 | 構造の理解、大容量データの探索 |
| **折りたたみビュー** | `C` | 構文ハイライト付きコンパクト表示 | コード確認、小規模データの詳細表示 |
| **スキーマビュー** | `S` | 自動生成されたJSONスキーマ | API仕様確認、データ構造の文書化 |
| **Rawビュー** | `R` | プレーンJSON（行番号付き） | コピー・ペースト、構文確認 |

### ⌨️ キーボードショートカット

#### 🧭 ナビゲーション
| キー | 機能 | 説明 |
|------|------|------|
| `j` / `k` | 上下移動 | vim風のナビゲーション |
| `↑` / `↓` | 上下移動 | 矢印キーでの移動 |
| `h` / `l` | 展開/折りたたみ | ツリーモードでの階層操作 |
| `←` / `→` | 展開/折りたたみ | 矢印キーでの階層操作 |
| `gg` | 先頭へ | データの最上部に移動 |
| `G` | 末尾へ | データの最下部に移動 |
| `Ctrl+f` / `Ctrl+b` | ページ移動 | 半ページ単位でのスクロール |

#### 🔍 検索・フィルタ
| キー | 機能 | 説明 |
|------|------|------|
| `/` | 検索モード | インクリメンタル検索の開始 |
| `Tab` | スコープ切替 | All → Keys → Values → All |
| `R` | 正規表現モード | 正規表現検索の切り替え |
| `n` / `N` | 検索結果移動 | 次/前の検索結果へ移動 |
| `Esc` | 検索終了 | 検索モードの終了 |

#### 🎨 表示切替
| キー | 機能 | 説明 |
|------|------|------|
| `T` | ツリービュー | 階層構造表示の切り替え |
| `C` | 折りたたみビュー | コンパクト表示の切り替え |
| `S` | スキーマビュー | JSONスキーマ表示 |
| `L` | 行番号表示 | 行番号の表示/非表示 |
| `D` | デバッグモード | デバッグ情報の表示 |

#### ⚡ アクション
| キー | 機能 | 説明 |
|------|------|------|
| `J` | jqクエリモード | jq/JSONataクエリの実行 |
| `E` | スキーマエクスポート | JSONスキーマのファイル出力 |
| `Shift+E` | データエクスポート | 多形式でのデータ出力 |
| `,` | 設定画面 | インタラクティブな設定編集 |
| `?` | ヘルプ | コンテキスト感応型ヘルプ |
| `q` | 終了 | アプリケーションの終了 |

#### 🔄 検索機能の詳細
- **スコープ検索**: `Tab`キーで検索範囲を循環切替
  - `All`: 全体から検索
  - `Keys`: キー名のみから検索
  - `Values`: 値のみから検索
- **正規表現**: `R`キーで正規表現モードを切り替え
- **リアルタイム**: 入力と同時にマッチング結果を表示

## ⚙️ 設定・カスタマイズ

### インタラクティブ設定

アプリケーション内で `,` キーを押すと、インタラクティブな設定画面が開きます：

- **リアルタイムプレビュー**: 設定変更の即座確認
- **入力検証**: 不正な値の事前チェック
- **カテゴリ分類**: 機能別の整理された設定項目
- **ヘルプ表示**: 各設定項目の詳細説明

### 設定ファイル

`~/.config/jsont/config.yaml` を作成してカスタマイズ：

```yaml
# 表示設定
display:
  interface:
    showLineNumbers: true          # 行番号の表示
    useUnicodeTree: true          # Unicode文字での樹形図
  json:
    indent: 2                     # インデント幅
    useTabs: false               # タブ文字の使用
  tree:
    showArrayIndices: true        # 配列インデックスの表示
    showPrimitiveValues: true     # プリミティブ値の表示
    maxValueLength: 100          # 値の最大表示長

# キーバインド設定
keybindings:
  navigation:
    up: "k"                      # 上移動
    down: "j"                    # 下移動
    pageUp: "ctrl+b"            # ページアップ
    pageDown: "ctrl+f"          # ページダウン
    goToTop: "gg"               # 先頭へ移動
    goToBottom: "G"             # 末尾へ移動
  search:
    start: "/"                  # 検索開始
    next: "n"                   # 次の結果
    previous: "N"               # 前の結果
    toggleRegex: "R"            # 正規表現切替
    cycleScope: "tab"           # スコープ切替
  actions:
    help: "?"                   # ヘルプ表示
    quit: "q"                   # 終了
    settings: ","               # 設定画面
    export: "E"                 # エクスポート
    jqMode: "J"                 # jqモード

# パフォーマンス設定
performance:
  cacheSize: 200               # LRUキャッシュサイズ
  maxFileSize: 104857600       # 最大ファイルサイズ (100MB)
  virtualScrolling: true        # 仮想スクロール有効化
  backgroundProcessing: true    # バックグラウンド処理
```

### 設定の詳細説明

#### 表示設定 (`display`)
- **showLineNumbers**: ファイル内容に行番号を表示
- **useUnicodeTree**: 樹形図にUnicode文字（├─└）を使用
- **indent**: JSON整形時のインデント文字数
- **maxValueLength**: 長い値の切り詰め表示文字数

#### パフォーマンス設定 (`performance`)
- **cacheSize**: 処理結果のキャッシュ保持数
- **maxFileSize**: 処理可能な最大ファイルサイズ
- **virtualScrolling**: 大容量データの効率的表示

### 設定の即座適用

設定ファイルの変更は自動で検出され、アプリケーションの再起動なしに適用されます。

## 💡 実用例・使用シーン

### 🌐 API開発・デバッグ

```bash
# REST APIのレスポンス確認
curl -s https://jsonplaceholder.typicode.com/posts/1 | jsont
# → 構造化されたレスポンスをツリービューで確認

# GraphQL APIのクエリ結果
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "{ users { id name email } }"}' \
  https://api.example.com/graphql | jsont

# エラーレスポンスの詳細分析
curl -s https://api.example.com/failing-endpoint | jsont
# → エラー構造をスキーマビューで確認、ドキュメント化
```

### 🔍 ログ分析・監視

```bash
# 構造化ログの分析
tail -f /var/log/app/structured.log | jq -c 'select(.level=="ERROR")' | jsont
# → エラーログのリアルタイム監視

# 特定条件でのフィルタリング
cat audit.log | jq -c 'select(.timestamp > "2024-01-01")' | jsont
# → 時系列でのデータ分析

# Elasticsearch/OpenSearchの結果
curl -s 'localhost:9200/logs/_search' | jsont
# → 検索結果の構造解析
```

### ☁️ クラウド・インフラ管理

```bash
# AWS CLI出力の解析
aws ec2 describe-instances --output json | jsont
# → インスタンス情報をツリーで整理確認

aws s3api list-objects --bucket my-bucket --output json | jsont
# → S3オブジェクトの一覧を構造化表示

# Kubernetes リソースの調査
kubectl get pods -o json | jsont
# → Pod詳細情報の階層表示

kubectl describe service my-service -o json | jsont
# → サービス設定の構造確認

# Terraform state ファイルの分析
terraform show -json | jsont
# → インフラ状態の可視化
```

### 📊 データ処理・変換の流れ

#### 1. jq/JSONataクエリ処理
```bash
# 1. JSONTでデータを開く
cat users.json | jsont

# 2. アプリ内でJキーを押してクエリモード
# 3. jqクエリを入力: .users[] | select(.age > 25) | {name, email}
# 4. 結果をリアルタイムプレビュー
# 5. Enterで結果を確定、新しいビューで表示
```

#### 2. スキーマ生成・文書化
```bash
# 1. API仕様の確認
curl -s https://api.example.com/users/1 | jsont

# 2. Sキーでスキーマビューに切替
# 3. 自動生成されたJSONスキーマを確認
# 4. Eキーでスキーマをファイルにエクスポート
# → api-user-schema.json として保存
```

#### 3. データエクスポート・共有
```bash
# 1. データの処理・フィルタリング
cat large-dataset.json | jsont

# 2. 必要なデータ部分を特定・抽出
# 3. Shift+E でエクスポートダイアログ
# 4. 出力形式選択:
#   - JSON: プログラム処理用
#   - CSV: Excel分析用
#   - YAML: 設定ファイル用
#   - XML: レガシーシステム連携用
#   - SQL: データベース投入用
```

### ⚙️ 設定管理・チーム協業

#### インタラクティブ設定の活用
```bash
# 1. jsontを起動してコンマキーを押す
echo '{}' | jsont
# ↓ , キー押下

# 2. 設定画面で以下を調整:
#   - 表示設定: 行番号、インデント、樹形図スタイル
#   - キーバインド: 操作キーのカスタマイズ
#   - パフォーマンス: ファイルサイズ制限、キャッシュサイズ

# 3. Ctrl+S で設定保存
# 4. チーム内で設定ファイル共有
cp ~/.config/jsont/config.yaml ./team-jsont-config.yaml
```

### 🎯 実際のワークフロー例

#### API開発者の1日
```bash
# 朝: APIヘルスチェック
curl -s https://api.company.com/health | jsont

# 午前: 新機能開発のレスポンス確認
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.company.com/v2/users | jsont
# → Sキーでスキーマ確認 → Eキーでドキュメント生成

# 午後: パフォーマンステスト結果分析
cat load-test-results.json | jsont
# → Jキーでjqクエリ → .results[] | select(.responseTime > 1000)
# → 遅いAPIエンドポイントを特定

# 夕方: エラーログ調査
tail -100 /var/log/api/errors.log | jq -c . | jsont
# → エラーパターンの分析・レポート作成
```

#### DevOps エンジニアの監視業務
```bash
# システム状態の確認
kubectl get pods -A -o json | jsont
# → クラスター全体の Pod 状況を階層表示

# 設定ファイルの検証
cat kubernetes/production/deployment.yaml | yq eval -o=json | jsont
# → YAML設定をJSON変換して構造確認

# メトリクス分析
curl -s 'http://prometheus:9090/api/v1/query?query=up' | jsont
# → Prometheusメトリクスの構造化表示
```

## 🏗️ 技術仕様・アーキテクチャ

### システム要件
- **Node.js**: 18.0.0 以上
- **npm**: 8.0.0 以上
- **メモリ**: 512MB 以上推奨（大容量ファイル処理時）
- **ターミナル**: ANSI カラー対応、UTF-8 文字対応

### パフォーマンス特性

| 項目 | 仕様 | 備考 |
|------|------|------|
| **最大ファイルサイズ** | 100MB | 設定で変更可能 |
| **処理速度** | <100ms | 1MBファイルの初回読み込み |
| **メモリ使用量** | <200MB | 10MBファイル処理時 |
| **検索応答性** | <16ms | リアルタイム検索の応答 |
| **キャッシュ効率** | 95%+ | 再表示時のヒット率 |

### 対応データ形式

- **JSON**: 標準的なJSON形式
- **JSON5**: コメント、末尾カンマ対応の拡張JSON
- **JSONL/NDJSON**: 改行区切りJSON（ストリーミング対応）
- **Minified JSON**: 圧縮された1行JSON

### エクスポート対応形式

| 形式 | 拡張子 | 用途 |
|------|--------|------|
| **JSON** | `.json` | API、設定ファイル |
| **YAML** | `.yaml`, `.yml` | Kubernetes、CI/CD設定 |
| **CSV** | `.csv` | Excel分析、データ可視化 |
| **XML** | `.xml` | レガシーシステム連携 |
| **SQL** | `.sql` | データベーステーブル定義 |
| **JSON Schema** | `.schema.json` | API仕様、バリデーション |

### アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│                 UI Layer                    │
├─────────────────────────────────────────────┤
│ Features: Tree│Search│Export│Settings│Help  │
├─────────────────────────────────────────────┤
│          Core Processing Engine             │
├─────────────────────────────────────────────┤
│    State Management (Jotai)               │
├─────────────────────────────────────────────┤
│  Terminal I/O │ File System │ Clipboard     │
└─────────────────────────────────────────────┘
```

## 🤝 コントリビューション

### 開発環境セットアップ
```bash
git clone https://github.com/SuzumiyaAoba/jsont.git
cd jsont
npm install
npm run dev  # 開発モードで起動
```

### テスト実行
```bash
npm run test          # 全テスト実行
npm run test:watch    # 監視モードでテスト
npm run test:ui       # テストUIで実行
npm run test:ci       # CI環境でのテスト
```

### コード品質管理
```bash
npm run check         # Biome による lint + format チェック
npm run check:write   # 自動修正適用
npm run type-check    # TypeScript 型チェック
```

### プルリクエスト

1. Fork してフィーチャーブランチを作成
2. 変更を実装（テストを含む）
3. `npm run check` でコード品質を確認
4. プルリクエストを作成

### Issue 報告

- **Bug Report**: 再現手順、期待動作、実際の動作を明記
- **Feature Request**: ユースケース、期待効果を具体的に記載
- **Performance Issue**: ファイルサイズ、処理時間、システム仕様を併記

## 📊 ロードマップ

### 🎯 近日実装予定
- [ ] **プラグインシステム**: カスタムフィルター・エクスポーター
- [ ] **テーマシステム**: カスタムカラースキーム対応
- [ ] **API モード**: RESTful API としての利用
- [ ] **Webインターフェース**: ブラウザベースのGUI

### 🔮 将来構想
- [ ] **リアルタイム協業**: 複数人でのデータ探索
- [ ] **AI アシスタント**: 自然言語でのクエリ生成
- [ ] **データベース連携**: 直接DB接続・クエリ実行
- [ ] **可視化機能**: グラフ・チャート生成

## 📄 ライセンス

**MIT License** - 詳細は [LICENSE](LICENSE) ファイルを参照

---

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトに支えられています：

- [React](https://react.dev/) + [Ink](https://github.com/vadimdemedes/ink) - TUI フレームワーク
- [Jotai](https://jotai.org/) - アトミック状態管理
- [node-jq](https://github.com/sanack/node-jq) - jq クエリエンジン
- [es-toolkit](https://github.com/toss/es-toolkit) - 高性能ユーティリティ
- [TypeScript](https://www.typescriptlang.org/) - 型安全な開発環境

---

<div align="center">

**⭐ このプロジェクトが役立った場合は、GitHub でスターをお願いします！**

[![GitHub Repo stars](https://img.shields.io/github/stars/SuzumiyaAoba/jsont?style=social)](https://github.com/SuzumiyaAoba/jsont/stargazers)

</div>