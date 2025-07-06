# 実装タスク分解（TDD対応）

## 概要

TDD（テスト駆動開発）に従い、1つのPRあたり500行前後のコード追加を目安とした実装タスクの詳細分解です。各タスクは独立して開発・テスト可能な単位に分割されています。

## Phase 1: プロジェクト基盤構築（2週間）

### T1.1: プロジェクト初期化とTypeScript設定
**推定**: ~300行（設定ファイル含む）  
**期間**: 2-3日  
**担当**: 基盤構築

#### 実装内容
- package.json設定
- tsconfig.json（strict mode）
- ES Module設定
- 基本的なディレクトリ構造

#### TDD アプローチ
```typescript
// 先にテスト作成
describe('Project Setup', () => {
  it('should have valid TypeScript configuration', () => {
    // tsconfig.json の検証
  });
  
  it('should support ES modules', () => {
    // ES Module import/export テスト
  });
});
```

#### 成果物
- `package.json`
- `tsconfig.json`
- `src/` ディレクトリ構造
- 基本的な型定義ファイル

---

### T1.2: 開発ツール統合（Biome, Husky, Vitest）
**推定**: ~250行（設定・スクリプト）  
**期間**: 2日  
**担当**: 基盤構築

#### 実装内容
- Biome設定（lint + format）
- Husky + lint-staged設定
- Vitest設定とテストランナー

#### TDD アプローチ
```typescript
// テストツール自体のテスト
describe('Development Tools', () => {
  it('should lint TypeScript files correctly', () => {
    // Biome設定テスト
  });
  
  it('should run tests with Vitest', () => {
    // テストランナー検証
  });
});
```

#### 成果物
- `biome.json`
- `.husky/` 設定
- `vitest.config.ts`
- CI用テストスクリプト

---

### T1.3: 基本ライブラリセットアップ
**推定**: ~400行（基本設定・型定義）  
**期間**: 3日  
**担当**: 基盤構築

#### 実装内容
- Ink 6.0+ セットアップ
- Jotai 2.0+ 基本設定
- es-toolkit 基本セットアップ
- 基本的な型定義

#### TDD アプローチ
```typescript
// ライブラリ統合テスト
describe('Library Integration', () => {
  it('should render Ink components', () => {
    // Ink基本コンポーネントテスト
  });
  
  it('should manage state with Jotai', () => {
    // Jotaiアトム基本テスト
  });
  
  it('should use es-toolkit utilities', () => {
    // es-toolkit関数テスト
  });
});
```

#### 成果物
- 基本的なInkアプリケーション構造
- Jotaiアトム定義
- es-toolkitユーティリティ関数

---

## Phase 2: コア機能実装（4週間）

### T2.1: JSON基本処理とパース機能
**推定**: ~450行（実装+テスト）  
**期間**: 3-4日  
**担当**: コア機能

#### 実装内容
- JSON5パーサー統合
- stdin読み込み処理
- エラーハンドリング
- データ型検証

#### TDD アプローチ
```typescript
// JSON処理のテスト先行作成
describe('JSON Processing', () => {
  it('should parse valid JSON', () => {
    const input = '{"key": "value"}';
    const result = parseJsonSafely(input);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({key: "value"});
  });
  
  it('should parse JSON5 with comments', () => {
    const input = '{"key": "value", /* comment */ }';
    const result = parseJsonSafely(input);
    expect(result.success).toBe(true);
  });
  
  it('should handle invalid JSON gracefully', () => {
    const input = '{invalid json}';
    const result = parseJsonSafely(input);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

#### 成果物
- `src/utils/jsonParser.ts`
- `src/utils/jsonParser.test.ts`
- `src/utils/stdinReader.ts`
- JSON処理関連の型定義

---

### T2.2: Jotai状態管理実装
**推定**: ~500行（アトム+テスト）  
**期間**: 4-5日  
**担当**: 状態管理

#### 実装内容
- プリミティブアトム（jsonData, filter, error等）
- 計算アトム（filteredData, stats等）
- 永続化アトム（設定・履歴）
- カスタムフック

#### TDD アプローチ
```typescript
// アトムの動作テスト
describe('Jotai State Management', () => {
  it('should store JSON data in atom', () => {
    const { result } = renderHook(() => useAtom(jsonDataAtom));
    const [data, setData] = result.current;
    
    act(() => {
      setData({key: 'value'});
    });
    
    expect(data).toEqual({key: 'value'});
  });
  
  it('should compute filtered data', () => {
    const { result } = renderHook(() => useAtomValue(filteredDataAtom));
    // 計算アトムのテスト
  });
  
  it('should persist configuration', () => {
    const { result } = renderHook(() => useAtom(configAtom));
    // 永続化テスト
  });
});
```

#### 成果物
- `src/store/atoms.ts`
- `src/store/atoms.test.ts`
- `src/hooks/useJsonStore.ts`
- `src/hooks/useJsonStore.test.ts`

---

### T2.3: 基本UI構造とレイアウト
**推定**: ~400行（コンポーネント+テスト）  
**期間**: 3-4日  
**担当**: UI実装

#### 実装内容
- メインアプリケーションコンポーネント
- 基本レイアウト構造
- StatusBarコンポーネント
- 基本的なキーボード入力処理

#### TDD アプローチ
```typescript
// UIコンポーネントのテスト
describe('Basic UI Components', () => {
  it('should render main application', () => {
    render(<App initialData={{key: 'value'}} />);
    // アプリケーション描画テスト
  });
  
  it('should display status information', () => {
    render(<StatusBar error={null} />);
    // ステータスバーテスト
  });
  
  it('should handle keyboard input', () => {
    const { user } = setup(<App initialData={{}} />);
    // キーボード入力テスト
  });
});
```

#### 成果物
- `src/App.tsx`
- `src/App.test.tsx`
- `src/components/StatusBar.tsx`
- `src/components/StatusBar.test.tsx`

---

### T2.4: JSON表示とシンタックスハイライト
**推定**: ~550行（表示ロジック+テスト）  
**期間**: 4-5日  
**担当**: UI実装

#### 実装内容
- JsonViewerコンポーネント
- react-syntax-highlighter統合
- 階層表示ロジック
- 基本的なテーマ対応

#### TDD アプローチ
```typescript
// JSON表示のテスト
describe('JSON Display', () => {
  it('should render simple JSON object', () => {
    const data = {key: 'value', number: 42};
    render(<JsonViewer data={data} />);
    
    expect(screen.getByText('key')).toBeInTheDocument();
    expect(screen.getByText('value')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
  
  it('should apply syntax highlighting', () => {
    const data = {string: 'text', boolean: true, null: null};
    render(<JsonViewer data={data} />);
    
    // 構文ハイライトの確認
    expect(screen.getByText('text')).toHaveClass('syntax-string');
    expect(screen.getByText('true')).toHaveClass('syntax-boolean');
  });
  
  it('should handle nested objects', () => {
    const data = {nested: {deep: {value: 'test'}}};
    render(<JsonViewer data={data} />);
    
    // ネスト表示テスト
  });
});
```

#### 成果物
- `src/components/JsonViewer.tsx`
- `src/components/JsonViewer.test.tsx`
- `src/utils/jsonFormatter.ts`
- `src/utils/jsonFormatter.test.ts`

---

### T2.5: 仮想スクロール統合
**推定**: ~480行（仮想化+テスト）  
**期間**: 4日  
**担当**: パフォーマンス

#### 実装内容
- @tanstack/react-virtual統合
- 大容量データ対応
- 動的サイズ計算
- スクロール制御

#### TDD アプローチ
```typescript
// 仮想スクロールのテスト
describe('Virtual Scrolling', () => {
  it('should render large dataset efficiently', () => {
    const largeData = Array(10000).fill().map((_, i) => ({id: i, value: `item-${i}`}));
    render(<VirtualizedJsonViewer data={largeData} height={400} />);
    
    // 表示領域のアイテムのみレンダリングされているかテスト
    expect(screen.getAllByTestId('json-item')).toHaveLength(lessThan(50));
  });
  
  it('should handle dynamic item sizes', () => {
    const mixedData = [
      {short: 'a'},
      {long: 'very long text content that spans multiple lines...'}
    ];
    render(<VirtualizedJsonViewer data={mixedData} height={400} />);
    
    // 動的サイズ計算テスト
  });
  
  it('should scroll to specific item', () => {
    const data = Array(1000).fill().map((_, i) => ({id: i}));
    const { result } = renderHook(() => useVirtualScroll(data));
    
    act(() => {
      result.current.scrollToIndex(500);
    });
    
    // スクロール位置テスト
  });
});
```

#### 成果物
- `src/components/VirtualizedJsonViewer.tsx`
- `src/components/VirtualizedJsonViewer.test.tsx`
- `src/hooks/useVirtualScroll.ts`
- `src/hooks/useVirtualScroll.test.ts`

---

## Phase 3: ハイブリッドクエリエンジン（4週間）

### T3.1: クエリエンジン基盤設計
**推定**: ~420行（基盤+テスト）  
**期間**: 3-4日  
**担当**: クエリエンジン

#### 実装内容
- HybridQueryProcessorクラス設計
- エンジン判定ロジック
- 統一インターフェース
- エラーハンドリング

#### TDD アプローチ
```typescript
// クエリエンジン基盤のテスト
describe('Query Engine Foundation', () => {
  it('should detect jq query patterns', () => {
    expect(HybridQueryProcessor.detectEngine('.[] | select(.age > 25)')).toBe('jq');
    expect(HybridQueryProcessor.detectEngine('.users[] | map(.name)')).toBe('jq');
  });
  
  it('should detect JSONata patterns', () => {
    expect(HybridQueryProcessor.detectEngine('$.users[age > 25]')).toBe('jsonata');
    expect(HybridQueryProcessor.detectEngine('users{name, email}')).toBe('jsonata');
  });
  
  it('should detect native patterns', () => {
    expect(HybridQueryProcessor.detectEngine('users.0.name')).toBe('native');
    expect(HybridQueryProcessor.detectEngine('data.items')).toBe('native');
  });
});
```

#### 成果物
- `src/utils/HybridQueryProcessor.ts`
- `src/utils/HybridQueryProcessor.test.ts`
- `src/types/query.ts`

---

### T3.2: jq-web統合実装
**推定**: ~380行（jq統合+テスト）  
**期間**: 3日  
**担当**: クエリエンジン

#### 実装内容
- jq-webライブラリ統合
- WebAssembly初期化処理
- jqクエリ実行機能
- パフォーマンス最適化

#### TDD アプローチ
```typescript
// jq統合のテスト
describe('jq-web Integration', () => {
  it('should execute simple jq queries', async () => {
    const data = [{name: 'Alice', age: 30}, {name: 'Bob', age: 25}];
    const result = await JqProcessor.executeQuery(data, '.[] | select(.age > 25)');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual([{name: 'Alice', age: 30}]);
  });
  
  it('should handle jq syntax errors', async () => {
    const data = {key: 'value'};
    const result = await JqProcessor.executeQuery(data, '.invalid | syntax');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it('should cache query results', async () => {
    const data = {key: 'value'};
    
    const result1 = await JqProcessor.executeQuery(data, '.key');
    const result2 = await JqProcessor.executeQuery(data, '.key');
    
    expect(result2.cached).toBe(true);
  });
});
```

#### 成果物
- `src/utils/JqProcessor.ts`
- `src/utils/JqProcessor.test.ts`
- WebAssembly初期化コード

---

### T3.3: JSONata統合実装
**推定**: ~320行（JSONata統合+テスト）  
**期間**: 2-3日  
**担当**: クエリエンジン

#### 実装内容
- JSONataライブラリ統合
- JSONataクエリ実行機能
- 式のキャッシュ機能
- エラー処理

#### TDD アプローチ
```typescript
// JSONata統合のテスト
describe('JSONata Integration', () => {
  it('should execute JSONata queries', async () => {
    const data = {users: [{name: 'Alice'}, {name: 'Bob'}]};
    const result = await JsonataProcessor.executeQuery(data, 'users.name');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['Alice', 'Bob']);
  });
  
  it('should handle complex transformations', async () => {
    const data = {items: [{price: 10, qty: 2}, {price: 5, qty: 3}]};
    const result = await JsonataProcessor.executeQuery(data, 'items{price, total: price * qty}');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      {price: 10, total: 20},
      {price: 5, total: 15}
    ]);
  });
});
```

#### 成果物
- `src/utils/JsonataProcessor.ts`
- `src/utils/JsonataProcessor.test.ts`

---

### T3.4: フィルタ入力UI実装
**推定**: ~520行（UI+テスト）  
**期間**: 4-5日  
**担当**: UI実装

#### 実装内容
- FilterInputコンポーネント
- リアルタイム構文検証
- オートコンプリート機能
- エラー表示とヒント

#### TDD アプローチ
```typescript
// フィルタ入力UIのテスト
describe('Filter Input UI', () => {
  it('should validate query syntax in real-time', async () => {
    const { user } = setup(<FilterInput onFilterChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, '.[] | invalid');
    
    expect(screen.getByText(/syntax error/i)).toBeInTheDocument();
  });
  
  it('should provide autocomplete suggestions', async () => {
    const data = {users: [{name: 'Alice'}]};
    const { user } = setup(<FilterInput data={data} onFilterChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, '.use');
    
    expect(screen.getByText('users')).toBeInTheDocument();
  });
  
  it('should execute queries on input change', async () => {
    const onFilterChange = jest.fn();
    const { user } = setup(<FilterInput onFilterChange={onFilterChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, '.key');
    
    expect(onFilterChange).toHaveBeenCalledWith('.key');
  });
});
```

#### 成果物
- `src/components/FilterInput.tsx`
- `src/components/FilterInput.test.tsx`
- `src/hooks/useQueryValidation.ts`
- `src/hooks/useQueryValidation.test.ts`

---

### T3.5: クエリ実行統合とパフォーマンス最適化
**推定**: ~450行（統合+最適化+テスト）  
**期間**: 4日  
**担当**: パフォーマンス

#### 実装内容
- リアルタイムクエリ実行
- debounce処理
- キャッシュ機能
- パフォーマンス監視

#### TDD アプローチ
```typescript
// クエリ実行とパフォーマンスのテスト
describe('Query Execution Performance', () => {
  it('should debounce rapid query changes', async () => {
    const executeQuery = jest.fn();
    const { result } = renderHook(() => useRealtimeQuery(data, executeQuery));
    
    // 連続でクエリ変更
    act(() => result.current.setQuery('.test1'));
    act(() => result.current.setQuery('.test2'));
    act(() => result.current.setQuery('.test3'));
    
    // デバウンス後に最後のクエリのみ実行されることを確認
    await waitFor(() => {
      expect(executeQuery).toHaveBeenCalledTimes(1);
      expect(executeQuery).toHaveBeenCalledWith('.test3');
    });
  });
  
  it('should cache query results for performance', async () => {
    const data = {large: Array(1000).fill({item: 'test'})};
    
    const result1 = await HybridQueryProcessor.executeQuery(data, '.large[0]');
    const result2 = await HybridQueryProcessor.executeQuery(data, '.large[0]');
    
    expect(result1.executionTime).toBeGreaterThan(result2.executionTime);
  });
});
```

#### 成果物
- `src/hooks/useRealtimeQuery.ts`
- `src/hooks/useRealtimeQuery.test.ts`
- `src/utils/queryCache.ts`
- `src/utils/queryCache.test.ts`

---

## Phase 4: インタラクティブUI（5週間）

### T4.1: キーボードナビゲーション実装
**推定**: ~480行（ナビゲーション+テスト）  
**期間**: 4日  
**担当**: UI実装

#### 実装内容
- 上下移動ナビゲーション
- 階層展開/折りたたみ
- 選択状態管理
- キーバインド設定

#### TDD アプローチ
```typescript
// キーボードナビゲーションのテスト
describe('Keyboard Navigation', () => {
  it('should navigate through JSON items with arrow keys', () => {
    const data = {a: 1, b: 2, c: 3};
    const { user } = setup(<JsonViewer data={data} />);
    
    // 下矢印キーでナビゲーション
    fireEvent.keyDown(document, {key: 'ArrowDown'});
    expect(screen.getByTestId('json-item-0')).toHaveClass('selected');
    
    fireEvent.keyDown(document, {key: 'ArrowDown'});
    expect(screen.getByTestId('json-item-1')).toHaveClass('selected');
  });
  
  it('should expand/collapse with right/left arrows', () => {
    const data = {nested: {deep: 'value'}};
    const { user } = setup(<JsonViewer data={data} />);
    
    // 右矢印で展開
    fireEvent.keyDown(document, {key: 'ArrowRight'});
    expect(screen.getByText('deep')).toBeVisible();
    
    // 左矢印で折りたたみ
    fireEvent.keyDown(document, {key: 'ArrowLeft'});
    expect(screen.getByText('deep')).not.toBeVisible();
  });
});
```

#### 成果物
- `src/hooks/useKeyboardNavigation.ts`
- `src/hooks/useKeyboardNavigation.test.ts`
- `src/components/NavigableJsonViewer.tsx`
- `src/components/NavigableJsonViewer.test.tsx`

---

### T4.2: テーマシステム実装
**推定**: ~520行（テーマ+テスト）  
**期間**: 4-5日  
**担当**: UI実装

#### 実装内容
- マルチテーマ対応（Dark, Light, Nord, Monokai）
- テーマ切り替え機能
- カスタムテーマエディタ
- テーマ永続化

#### TDD アプローチ
```typescript
// テーマシステムのテスト
describe('Theme System', () => {
  it('should apply dark theme by default', () => {
    render(<JsonViewer data={{key: 'value'}} />);
    
    expect(document.body).toHaveClass('theme-dark');
  });
  
  it('should switch themes correctly', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('light');
    });
    
    expect(document.body).toHaveClass('theme-light');
  });
  
  it('should persist theme selection', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.setTheme('nord');
    });
    
    // ページリロード後もテーマが保持されることを確認
    const { result: newResult } = renderHook(() => useTheme());
    expect(newResult.current.theme).toBe('nord');
  });
});
```

#### 成果物
- `src/utils/themes.ts`
- `src/utils/themes.test.ts`
- `src/hooks/useTheme.ts`
- `src/hooks/useTheme.test.ts`
- `src/components/ThemeSelector.tsx`
- `src/components/ThemeSelector.test.tsx`

---

### T4.3: データ操作機能（コピー・エクスポート）
**推定**: ~460行（データ操作+テスト）  
**期間**: 4日  
**担当**: 機能実装

#### 実装内容
- clipboardy統合
- 複数フォーマットエクスポート（JSON, CSV, YAML）
- 選択範囲コピー
- パス情報表示

#### TDD アプローチ
```typescript
// データ操作のテスト
describe('Data Operations', () => {
  it('should copy JSON value to clipboard', async () => {
    const mockWrite = jest.fn();
    jest.mock('clipboardy', () => ({ write: mockWrite }));
    
    const data = {key: 'value'};
    await ClipboardManager.copyValue(data, {format: 'json', pretty: true});
    
    expect(mockWrite).toHaveBeenCalledWith('{\n  "key": "value"\n}');
  });
  
  it('should export data as CSV', async () => {
    const data = [{name: 'Alice', age: 30}, {name: 'Bob', age: 25}];
    const csv = ClipboardManager.formatForExport(data, {format: 'csv'});
    
    expect(csv).toBe('"name","age"\n"Alice","30"\n"Bob","25"');
  });
  
  it('should copy JSON path', async () => {
    const path = ['users', '0', 'name'];
    const mockWrite = jest.fn();
    jest.mock('clipboardy', () => ({ write: mockWrite }));
    
    await ClipboardManager.copyPath(path);
    
    expect(mockWrite).toHaveBeenCalledWith('.users[0].name');
  });
});
```

#### 成果物
- `src/utils/ClipboardManager.ts`
- `src/utils/ClipboardManager.test.ts`
- `src/hooks/useClipboard.ts`
- `src/hooks/useClipboard.test.ts`

---

### T4.4: アクセシビリティ対応
**推定**: ~360行（a11y+テスト）  
**期間**: 3日  
**担当**: UI実装

#### 実装内容
- 高コントラストモード
- フォントサイズ調整
- スクリーンリーダー対応
- カラーブラインド対応

#### TDD アプローチ
```typescript
// アクセシビリティのテスト
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(<JsonViewer data={{key: 'value'}} />);
    
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-label');
  });
  
  it('should support keyboard-only navigation', () => {
    render(<JsonViewer data={{nested: {key: 'value'}}} />);
    
    // Tab키로 포커스 이동 가능한지 확인
    userEvent.tab();
    expect(document.activeElement).toHaveAttribute('role', 'treeitem');
  });
  
  it('should provide sufficient color contrast', () => {
    render(<JsonViewer data={{key: 'value'}} theme="high-contrast" />);
    
    // 색상 대비 검증 (실제로는 시각적 회귀 테스트 도구 사용)
    const textElement = screen.getByText('key');
    const styles = getComputedStyle(textElement);
    
    // 대비율 4.5:1 이상인지 확인
    expect(getContrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThan(4.5);
  });
});
```

#### 成果物
- `src/utils/accessibility.ts`
- `src/utils/accessibility.test.ts`
- `src/hooks/useAccessibility.ts`
- `src/hooks/useAccessibility.test.ts`

---

### T4.5: 統合テストとE2Eテスト
**推定**: ~380行（テストのみ）  
**期間**: 3日  
**担当**: QA・テスト

#### 実装内容
- メインフロー統合テスト
- パフォーマンステスト
- ユーザーシナリオテスト
- 回帰テスト

#### TDD アプローチ
```typescript
// 統合テストとE2Eテスト
describe('Integration Tests', () => {
  it('should handle complete user workflow', async () => {
    const largeJsonData = generateLargeTestData(1000);
    
    // 1. アプリケーション起動
    render(<App initialData={largeJsonData} />);
    
    // 2. フィルタ入力
    const filterInput = screen.getByRole('textbox');
    await userEvent.type(filterInput, '.users[] | select(.age > 25)');
    
    // 3. 結果確認
    await waitFor(() => {
      expect(screen.getByText(/25 matches found/)).toBeInTheDocument();
    });
    
    // 4. ナビゲーション
    fireEvent.keyDown(document, {key: 'ArrowDown'});
    
    // 5. コピー操作
    fireEvent.keyDown(document, {key: 'c'});
    
    // 6. 完了確認
    expect(screen.getByText(/copied to clipboard/)).toBeInTheDocument();
  });
  
  it('should maintain performance with large datasets', async () => {
    const largeData = Array(10000).fill().map((_, i) => ({id: i, name: `item-${i}`}));
    
    const startTime = performance.now();
    render(<App initialData={largeData} />);
    const renderTime = performance.now() - startTime;
    
    // 初期レンダリングが1秒以内
    expect(renderTime).toBeLessThan(1000);
    
    // フィルタリングが50ms以内
    const filterStart = performance.now();
    const filterInput = screen.getByRole('textbox');
    await userEvent.type(filterInput, '.[] | select(.id < 100)');
    const filterTime = performance.now() - filterStart;
    
    expect(filterTime).toBeLessThan(50);
  });
});
```

#### 成果物
- `src/__tests__/integration.test.ts`
- `src/__tests__/performance.test.ts`
- `src/__tests__/e2e.test.ts`
- テストユーティリティ関数

---

## タスク依存関係とスケジュール

### 依存関係図
```
T1.1 → T1.2 → T1.3
          ↓
T2.1 → T2.2 → T2.3 → T2.4
                ↓      ↓
              T2.5 → T3.1 → T3.2
                          ↓
                     T3.3 → T3.4 → T3.5
                                    ↓
                     T4.1 → T4.2 → T4.3 → T4.4 → T4.5
```

### 実装優先順位
1. **Phase 1** (基盤): 全ての後続タスクの前提条件
2. **T2.1, T2.2** (JSON処理・状態管理): コア機能の基盤
3. **T2.3, T2.4** (UI基本): ユーザー体験の基本
4. **T2.5** (仮想スクロール): パフォーマンス要件
5. **Phase 3** (クエリエンジン): 主要機能
6. **Phase 4** (インタラクティブUI): UX向上

### リスク軽減策
- 各タスクにテストファーストで十分なカバレッジ確保
- 独立したPRで段階的にマージ
- パフォーマンステストを継続的に実行
- 早期のプロトタイプでユーザーフィードバック収集

---

## まとめ

- **総タスク数**: 18タスク
- **推定総コード量**: ~7,200行（テスト含む）
- **平均PRサイズ**: ~400行（目標の500行以内）
- **開発期間**: 約15週間（3-4ヶ月）

各タスクはTDD原則に従い、テストファーストで実装されます。独立性を保ちつつ、段階的に機能を積み上げる設計となっています。