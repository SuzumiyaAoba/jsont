/**
 * Debug Log Viewer - デバッグログを表示するコンポーネント
 */

import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState } from "react";
import type { DebugLogEntry, DebugLogLevel } from "../utils/debugLogger";
import { DebugLogger, setDebugViewerActive } from "../utils/debugLogger";

interface DebugLogViewerProps {
  height: number;
  width: number;
  onExit: () => void;
}

function formatLogData(data: unknown, maxWidth: number = 80): string {
  if (typeof data === "string") {
    return data;
  }
  if (typeof data === "object" && data !== null) {
    const jsonString = JSON.stringify(data, null, 2);
    // 長すぎる場合は改行して表示
    if (jsonString.length > maxWidth) {
      const lines = jsonString.split("\n");
      if (lines.length > 1) {
        // 既に改行されているJSONの場合、インデントを調整
        return lines
          .map((line) =>
            line.length > maxWidth
              ? `${line.substring(0, maxWidth - 3)}...`
              : line,
          )
          .join("\n");
      } else {
        // 一行の長いJSONの場合、適切な位置で改行
        const truncated = `${jsonString.substring(0, maxWidth - 3)}...`;
        return truncated;
      }
    }
    return jsonString;
  }
  return String(data);
}

export function DebugLogViewer({ height, width, onExit }: DebugLogViewerProps) {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DebugLogLevel | null>(
    null,
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gSequence, setGSequence] = useState(false);

  // デバッグビューアーがアクティブであることを通知と画面クリア
  useEffect(() => {
    // 複数の方法で画面をクリア
    console.clear();

    // より強力なターミナルクリア
    process.stdout.write("\x1b[2J"); // 画面全体クリア
    process.stdout.write("\x1b[H"); // カーソルを左上に移動
    process.stdout.write("\x1b[3J"); // スクロールバッファもクリア

    // 代替方法も試行
    if (process.stdout.cursorTo) {
      process.stdout.cursorTo(0, 0);
    }
    if (process.stdout.clearScreenDown) {
      process.stdout.clearScreenDown();
    }

    setDebugViewerActive(true);
    return () => {
      setDebugViewerActive(false);
    };
  }, []);

  // gg シーケンスのタイムアウト管理
  useEffect(() => {
    if (gSequence) {
      const timer = setTimeout(() => {
        setGSequence(false);
      }, 1000); // 1秒でリセット
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gSequence]);

  // ログを定期的に更新
  useEffect(() => {
    const updateLogs = () => {
      setLogs(DebugLogger.getAllLogs());
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  // フィルタリングされたログ
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (selectedCategory) {
      filtered = filtered.filter((log) => log.category === selectedCategory);
    }

    if (selectedLevel) {
      filtered = filtered.filter((log) => log.level === selectedLevel);
    }

    return filtered; // ログを時系列順（最新が末尾）で表示
  }, [logs, selectedCategory, selectedLevel]);

  // 表示可能な行数を動的に計算
  // ボーダー付きBoxのヘッダー(3行) + 統計行(1行) + ボーダー付きフッター(3行) = 7行を除外
  const reservedLines = 7;
  const availableLogLines = Math.max(1, height - reservedLines);

  // 各ログエントリは複数行になる可能性があるため、実際の表示可能エントリ数を計算
  // 保守的に見積もって、各エントリは最大2行（ヘッダー + データ）と仮定
  const maxEntriesPerScreen = Math.floor(availableLogLines / 2);
  const visibleLines = Math.max(1, maxEntriesPerScreen);
  const maxScroll = Math.max(0, filteredLogs.length - visibleLines);

  // 表示するログのスライス
  const visibleLogs = filteredLogs.slice(
    scrollOffset,
    scrollOffset + visibleLines,
  );

  // キーボード入力処理
  useInput((input, key) => {
    if (input === "q" || key?.escape) {
      onExit();
      return;
    }

    if (key?.upArrow || input === "k") {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      // スクロール調整
      if (selectedIndex <= scrollOffset) {
        setScrollOffset(Math.max(0, scrollOffset - 1));
      }
    } else if (key?.downArrow || input === "j") {
      setSelectedIndex(Math.min(filteredLogs.length - 1, selectedIndex + 1));
      // スクロール調整
      if (selectedIndex >= scrollOffset + visibleLines - 1) {
        setScrollOffset(Math.min(maxScroll, scrollOffset + 1));
      }
    } else if (key?.pageUp) {
      const newIndex = Math.max(0, selectedIndex - visibleLines);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, newIndex - Math.floor(visibleLines / 2)));
    } else if (key?.pageDown) {
      const newIndex = Math.min(
        filteredLogs.length - 1,
        selectedIndex + visibleLines,
      );
      setSelectedIndex(newIndex);
      setScrollOffset(
        Math.min(maxScroll, newIndex - Math.floor(visibleLines / 2)),
      );
    } else if (input === "c") {
      // フィルタをクリア
      setSelectedCategory(null);
      setSelectedLevel(null);
      setScrollOffset(0);
      setSelectedIndex(0);
    } else if (input === "C") {
      // 全ログをクリア
      DebugLogger.clearLogs();
      setLogs([]);
      setScrollOffset(0);
      setSelectedIndex(0);
    } else if (input === "r") {
      // 最新ログに移動（末尾に移動）
      const maxIndex = filteredLogs.length - 1;
      setSelectedIndex(maxIndex);
      setScrollOffset(Math.max(0, maxIndex - visibleLines + 1));
    } else if (input === "g") {
      if (gSequence) {
        // gg シーケンス完了 - 先頭に移動
        setSelectedIndex(0);
        setScrollOffset(0);
        setGSequence(false);
      } else {
        // 最初の g - シーケンス開始
        setGSequence(true);
      }
    } else if (input === "G") {
      // 末尾に移動
      const maxIndex = filteredLogs.length - 1;
      setSelectedIndex(maxIndex);
      setScrollOffset(Math.max(0, maxIndex - visibleLines + 1));
    } else {
      // 他のキー入力でgシーケンスをリセット
      if (gSequence) {
        setGSequence(false);
      }
    }
  });

  // ログレベルの色を取得
  const getLevelColor = (level: DebugLogLevel): string => {
    switch (level) {
      case "error":
        return "red";
      case "warn":
        return "yellow";
      case "info":
        return "blue";
      case "debug":
        return "gray";
      default:
        return "white";
    }
  };

  // 時間フォーマット
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("ja-JP", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // 統計情報
  const stats = DebugLogger.getStats();
  const categories = DebugLogger.getCategories();

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* ヘッダー */}
      <Box flexShrink={0} width={width} borderStyle="single" borderColor="blue">
        <Text bold color="blue">
          DEBUG LOG VIEWER ({filteredLogs.length} entries) - q:quit, c:clear
          filter, C:clear all, r:refresh
          {gSequence && <Text color="yellow"> [g-sequence]</Text>}
        </Text>
      </Box>

      {/* 統計とフィルタ情報 */}
      <Box flexShrink={0} width={width}>
        <Text>
          Total: {stats.total} | ERROR:{" "}
          <Text color="red">{stats.byLevel.error}</Text> | WARN:{" "}
          <Text color="yellow">{stats.byLevel.warn}</Text> | INFO:{" "}
          <Text color="blue">{stats.byLevel.info}</Text> | DEBUG:{" "}
          <Text color="gray">{stats.byLevel.debug}</Text>
          {selectedCategory && ` | Category: ${selectedCategory}`}
          {selectedLevel && ` | Level: ${selectedLevel.toUpperCase()}`}| Latest:
          bottom
        </Text>
      </Box>

      {/* ログ一覧 */}
      <Box flexGrow={1} flexDirection="column" width={width} overflow="hidden">
        {visibleLogs.map((log, index) => {
          const absoluteIndex = scrollOffset + index;
          const isSelected = absoluteIndex === selectedIndex;
          const levelColor = getLevelColor(log.level);

          // 利用可能な幅を計算（マージンを考慮）
          const availableWidth = Math.max(60, width - 4);

          // ログのヘッダー部分（時間、レベル、カテゴリ、メッセージ）
          const headerText = `[${formatTime(log.timestamp)}][${log.level.toUpperCase()}][${log.category}] ${log.message}`;

          // データ部分のフォーマット
          const dataText =
            log.data !== undefined && log.data !== null
              ? formatLogData(log.data, availableWidth)
              : null;

          return (
            <Box key={log.id} flexDirection="column" width={width}>
              {/* ヘッダー行 */}
              <Box width={width}>
                <Text
                  color={isSelected ? "white" : "gray"}
                  {...(isSelected ? { backgroundColor: "blue" } : {})}
                  bold={isSelected}
                >
                  {isSelected ? ">" : " "}
                </Text>
                <Text
                  color={isSelected ? "white" : levelColor}
                  {...(isSelected ? { backgroundColor: "blue" } : {})}
                >
                  {headerText.length > availableWidth
                    ? `${headerText.substring(0, availableWidth - 3)}...`
                    : headerText}
                </Text>
              </Box>

              {/* データ行（存在する場合） */}
              {dataText && (
                <Box width={width} paddingLeft={2}>
                  <Text
                    color={isSelected ? "white" : "gray"}
                    {...(isSelected ? { backgroundColor: "blue" } : {})}
                  >
                    {dataText}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* フッター */}
      <Box flexShrink={0} width={width} borderStyle="single" borderColor="blue">
        <Text>
          {selectedIndex + 1}/{filteredLogs.length} | Categories:{" "}
          {categories.join(", ") || "None"} | j/k: navigate, PageUp/PageDown:
          page scroll, gg: go to top, G: go to bottom, r: go to latest
        </Text>
      </Box>
    </Box>
  );
}
