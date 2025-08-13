# Contributing to jsont

jsont プロジェクトへの貢献を歓迎します！このドキュメントでは、プロジェクトへの効果的な貢献方法について説明します。

## 🚀 開発環境のセットアップ

### 前提条件
- **Node.js**: 18.0.0 以上
- **npm**: 8.0.0 以上
- **Git**: 最新版推奨

### セットアップ手順
```bash
# 1. リポジトリをフォーク・クローン
git clone https://github.com/YOUR_USERNAME/jsont.git
cd jsont

# 2. 依存関係のインストール
npm install

# 3. 開発モードで起動
npm run dev

# 4. テスト実行
npm run test
```

## 📋 開発ワークフロー

### ブランチ戦略
- `master`: 本番用ブランチ（プルリクエストのターゲット）
- `feature/功能名`: 新機能開発用ブランチ
- `fix/修正内容`: バグ修正用ブランチ
- `docs/内容`: ドキュメント更新用ブランチ

### 開発手順
```bash
# 1. 最新のmasterから開発ブランチを作成
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# 2. 変更を実装
# コード実装、テスト作成

# 3. コード品質チェック
npm run check        # lint + format + type check
npm run test:run     # 全テストの実行

# 4. コミット
git add .
git commit -m "feat: implement new feature"

# 5. プッシュとプルリクエスト作成
git push origin feature/your-feature-name
```

## 🧪 テスト戦略

### テスト実行
```bash
npm run test          # 監視モードでテスト
npm run test:run      # 一度だけテスト実行
npm run test:ui       # テストUIで実行
npm run test:ci       # CI環境向け実行（メモリ最適化）
```

### テスト作成ガイドライン
- **単体テスト**: 各機能・ユーティリティ関数は `.spec.ts` ファイルで網羅
- **統合テスト**: 機能間の連携は `src/integration/` 下に配置
- **パフォーマンステスト**: 大容量データ処理の性能確認
- **カバレッジ**: 新規コードは 85% 以上のテストカバレッジを維持

### テスト例
```typescript
// src/features/search/utils/searchUtils.spec.ts
describe('searchInJsonWithScope', () => {
  it('should search in keys only when scope is keys', () => {
    const data = { name: "test", value: "name" };
    const results = searchInJsonWithScope(data, "name", "keys");
    expect(results).toHaveLength(1);
    expect(results[0].path).toEqual(["name"]);
  });
  
  it('should handle complex nested structures', () => {
    const data = { users: [{ profile: { name: "Alice" } }] };
    const results = searchInJsonWithScope(data, "Alice", "values");
    expect(results[0].path).toEqual(["users", "0", "profile", "name"]);
  });
});
```

## 💻 コード品質基準

### TypeScript
- **strictest設定**: `@tsconfig/strictest` の設定を継承
- **型安全性**: `any` 型の使用は最小限に抑制
- **インターフェース**: 明確な型定義とドキュメント化

### コードスタイル（Biome）
```bash
npm run check        # 全チェック（lint + format + type）
npm run check:write  # 自動修正適用
npm run lint         # リント実行
npm run format       # フォーマット実行
```

### アーキテクチャ原則
- **機能駆動設計**: 機能単位での実装とテスト
- **クリーンアーキテクチャ**: レイヤー分離と依存性の管理
- **パフォーマンス重視**: 大容量データでも快適な動作
- **拡張性**: プラグインシステムやカスタマイズ機能への対応

## 🐛 Issue と プルリクエスト

### Issue 報告
新しいIssueを作成する際は、以下のテンプレートを使用してください：

#### Bug Report
```markdown
## 🐛 バグ概要
バグの簡潔な説明

## 📋 再現手順
1. `echo '{"test": true}' | jsont` を実行
2. `S` キーを押す
3. エラーが発生

## 💡 期待する動作
正常にスキーマビューが表示される

## 😵 実際の動作
エラーメッセージが表示される

## 🔧 環境情報
- OS: macOS 14.1
- Node.js: v18.19.0
- jsont version: 1.0.0
- ターミナル: iTerm2
```

#### Feature Request
```markdown
## 🚀 機能概要
新機能の簡潔な説明

## 🎯 ユースケース
この機能がどのような場面で必要か

## 💡 提案する実装
可能であれば実装案を提示

## 📄 追加情報
参考資料やサンプルがあれば記載
```

### プルリクエスト
- **コミットメッセージ**: Conventional Commits 形式を使用
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント更新
  - `refactor:` リファクタリング
  - `test:` テスト追加・修正
  - `perf:` パフォーマンス改善
- **説明**: 変更内容、理由、テスト方法を明記
- **レビュー**: コードレビューでのフィードバックに対応

### プルリクエストテンプレート
```markdown
## 📝 概要
変更内容の概要

## 🔧 変更種別
- [ ] 新機能 (feat)
- [ ] バグ修正 (fix)
- [ ] ドキュメント (docs)
- [ ] リファクタリング (refactor)
- [ ] テスト (test)
- [ ] パフォーマンス (perf)

## 🧪 テスト
- [ ] 新しいテストを追加
- [ ] 既存のテストが通過
- [ ] 手動テストを実施

## 📋 チェックリスト
- [ ] `npm run check` が通過
- [ ] テストカバレッジが維持されている
- [ ] ドキュメントが更新されている
- [ ] 破壊的変更がある場合は明記
```

## 🎯 開発ガイドライン

### 機能開発
1. **機能要求の理解**: Issue やディスカッションで要求を明確化
2. **設計検討**: 既存アーキテクチャとの整合性を確認
3. **プロトタイプ**: 小さなプロトタイプで概念実証
4. **テスト駆動開発**: テストを先に作成してから実装
5. **パフォーマンス確認**: 大容量データでの動作検証
6. **ドキュメント更新**: README やヘルプの更新

### コードレビュー
- **建設的フィードバック**: 改善提案と理由を明確に
- **知識共有**: なぜその実装が良いか・悪いかを説明
- **学習機会**: レビューを通じてお互いのスキル向上
- **迅速な対応**: レビュー依頼から24時間以内に初回レスポンス

## 🔧 よくある問題と解決策

### パフォーマンステスト失敗
```bash
# メモリ使用量の最適化
NODE_OPTIONS="--max-old-space-size=6144" npm run test:ci

# 特定のテストをスキップ
npm run test -- --exclude="performance"
```

### TypeScript エラー
```bash
# 型チェックのみ実行
npm run type-check

# 増分ビルド
npx tsc --incremental
```

### Import エラー
- パスエイリアスは `@/*`, `@core/*`, `@features/*` を使用
- 拡張子なしインポートが必須（ビルドシステム要件）

## 🌟 貢献の認識

### Contributors
すべての貢献者は README の Contributors セクションに掲載されます。

### 貢献の種類
- **コード**: 新機能、バグ修正、リファクタリング
- **ドキュメント**: README、ガイド、コメントの改善
- **テスト**: テスト追加、テストケース改善
- **Issue**: バグ報告、機能要求、質問
- **レビュー**: コードレビュー、設計ディスカッション
- **翻訳**: 多言語対応、ローカライゼーション

## 📞 コミュニケーション

### 質問・相談
- **GitHub Issues**: バグ報告、機能要求
- **GitHub Discussions**: 設計相談、使用方法の質問
- **Pull Request**: コードに関する詳細な議論

### 連絡方法
- 日本語・英語どちらでも対応可能
- 技術的な質問は Issue で公開討論を推奨
- 設計に関する大きな変更は Discussion で事前相談

---

## 🙏 感謝

jsont プロジェクトへの貢献をお考えいただき、ありがとうございます！
あなたの貢献が、多くの開発者の生産性向上に役立ちます。

質問や不明点がございましたら、遠慮なく Issue を作成してください。
一緒により良いツールを作りましょう！