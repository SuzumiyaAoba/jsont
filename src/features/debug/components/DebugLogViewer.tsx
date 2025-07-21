/**
 * Debug Log Viewer - デバッグログを表示するコンポーネント
 */

import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DebugLogEntry, DebugLogLevel } from "../utils/debugLogger";
import { DebugLogger, setDebugViewerActive } from "../utils/debugLogger";

interface DebugLogViewerProps {
  height: number;
  width: number;
  onExit: () => void;
}

// Memoized cache for formatted log data to avoid repeated processing
const formatCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

function formatLogData(data: unknown, maxWidth: number = 80): string {
  if (typeof data === "string") {
    return data.length > maxWidth
      ? `${data.substring(0, maxWidth - 3)}...`
      : data;
  }

  if (typeof data === "object" && data !== null) {
    // Create cache key based on data and maxWidth
    const cacheKey = `${JSON.stringify(data)}-${maxWidth}`;

    // Check cache first
    if (formatCache.has(cacheKey)) {
      const cached = formatCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Clear cache if it gets too large to prevent memory leaks
    if (formatCache.size >= MAX_CACHE_SIZE) {
      formatCache.clear();
    }

    const jsonString = JSON.stringify(data, null, 2);
    let result: string;

    // Optimize processing for large JSON
    if (jsonString.length > maxWidth) {
      const lines = jsonString.split("\n");
      if (lines.length > 1) {
        // Multi-line JSON: process lines efficiently
        result = lines
          .slice(0, 10) // Limit to first 10 lines for performance
          .map((line) =>
            line.length > maxWidth
              ? `${line.substring(0, maxWidth - 3)}...`
              : line,
          )
          .join("\n");

        if (lines.length > 10) {
          result += `\n... (${lines.length - 10} more lines)`;
        }
      } else {
        // Single line: truncate
        result = `${jsonString.substring(0, maxWidth - 3)}...`;
      }
    } else {
      result = jsonString;
    }

    // Cache the result
    formatCache.set(cacheKey, result);
    return result;
  }

  const stringified = String(data);
  return stringified.length > maxWidth
    ? `${stringified.substring(0, maxWidth - 3)}...`
    : stringified;
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

  // Performance optimization: track last log count to avoid unnecessary updates
  const lastLogCountRef = useRef(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Optimized log updating: only update when there are actually new logs
  useEffect(() => {
    const updateLogs = () => {
      const stats = DebugLogger.getStats();
      const currentLogCount = stats.total;

      // Only fetch and update logs if the count has changed
      if (currentLogCount !== lastLogCountRef.current) {
        // Limit the number of logs to prevent memory issues (keep last 10000 logs)
        const allLogs = DebugLogger.getAllLogs();
        const maxLogs = 10000;
        const limitedLogs =
          allLogs.length > maxLogs ? allLogs.slice(-maxLogs) : allLogs;

        setLogs(limitedLogs);
        lastLogCountRef.current = currentLogCount;
      }
    };

    // Initial update
    updateLogs();

    // More efficient polling: check every 500ms instead of 1000ms for better responsiveness
    // but only update state when necessary
    updateIntervalRef.current = setInterval(updateLogs, 500);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  // Optimized filtering with early returns and efficient filtering
  const filteredLogs = useMemo(() => {
    // Early return if no filters applied
    if (!selectedCategory && !selectedLevel) {
      return logs;
    }

    // Use a single pass filter for better performance
    return logs.filter((log) => {
      if (selectedCategory && log.category !== selectedCategory) {
        return false;
      }
      if (selectedLevel && log.level !== selectedLevel) {
        return false;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel]);

  // Memoize layout calculations to prevent unnecessary recalculations
  const layoutCalculations = useMemo(() => {
    // ボーダー付きBoxのヘッダー(3行) + 統計行(1行) + ボーダー付きフッター(3行) = 7行を除外
    const reservedLines = 7;
    const availableLogLines = Math.max(1, height - reservedLines);

    // 各ログエントリは複数行になる可能性があるため、実際の表示可能エントリ数を計算
    // 保守的に見積もって、各エントリは最大2行（ヘッダー + データ）と仮定
    const maxEntriesPerScreen = Math.floor(availableLogLines / 2);
    const visibleLines = Math.max(1, maxEntriesPerScreen);

    return {
      reservedLines,
      availableLogLines,
      maxEntriesPerScreen,
      visibleLines,
    };
  }, [height]);

  // Memoize scroll calculations
  const scrollCalculations = useMemo(() => {
    const maxScroll = Math.max(
      0,
      filteredLogs.length - layoutCalculations.visibleLines,
    );
    return { maxScroll };
  }, [filteredLogs.length, layoutCalculations.visibleLines]);

  // Memoize visible logs slice - only recalculate when dependencies change
  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(
      scrollOffset,
      scrollOffset + layoutCalculations.visibleLines,
    );
  }, [filteredLogs, scrollOffset, layoutCalculations.visibleLines]);

  // Optimized keyboard input handling with useCallback to prevent recreations
  const handleKeyboardInput = useCallback(
    (input: string, key: { escape?: boolean }) => {
      if (input === "q" || key?.escape) {
        onExit();
        return;
      }

      const { visibleLines } = layoutCalculations;
      const { maxScroll } = scrollCalculations;

      if (key?.upArrow || input === "k") {
        setSelectedIndex((prevIndex) => {
          const newIndex = Math.max(0, prevIndex - 1);
          // スクロール調整
          if (newIndex <= scrollOffset) {
            setScrollOffset(Math.max(0, scrollOffset - 1));
          }
          return newIndex;
        });
      } else if (key?.downArrow || input === "j") {
        setSelectedIndex((prevIndex) => {
          const newIndex = Math.min(filteredLogs.length - 1, prevIndex + 1);
          // スクロール調整
          if (newIndex >= scrollOffset + visibleLines - 1) {
            setScrollOffset(Math.min(maxScroll, scrollOffset + 1));
          }
          return newIndex;
        });
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
        lastLogCountRef.current = 0; // Reset log count tracking
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
    },
    [
      onExit,
      layoutCalculations,
      scrollCalculations,
      scrollOffset,
      selectedIndex,
      filteredLogs.length,
      gSequence,
    ],
  );

  // Use the memoized keyboard handler
  useInput(handleKeyboardInput);

  // Memoized utility functions to prevent recreations
  const getLevelColor = useCallback((level: DebugLogLevel): string => {
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
  }, []);

  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString("ja-JP", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  }, []);

  // Memoize expensive operations from DebugLogger
  const stats = useMemo(() => DebugLogger.getStats(), []);
  const categories = useMemo(() => DebugLogger.getCategories(), []);

  // Memoize available width calculation
  const availableWidth = useMemo(() => Math.max(60, width - 4), [width]);

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

          // ログのヘッダー部分（時間、レベル、カテゴリ、メッセージ）
          const headerText = `[${formatTime(log.timestamp)}][${log.level.toUpperCase()}][${log.category}] ${log.message}`;

          // データ部分のフォーマット - only format if there's data to avoid unnecessary work
          const dataText =
            log.data !== undefined && log.data !== null
              ? formatLogData(log.data, availableWidth)
              : null;

          // Optimize text truncation by pre-calculating
          const displayHeaderText =
            headerText.length > availableWidth
              ? `${headerText.substring(0, availableWidth - 3)}...`
              : headerText;

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
                  {displayHeaderText}
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
