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

export function DebugLogViewer({ height, width, onExit }: DebugLogViewerProps) {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DebugLogLevel | null>(
    null,
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gSequence, setGSequence] = useState(false);

  // デバッグビューアーがアクティブであることを通知
  useEffect(() => {
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

  // 表示可能な行数（ヘッダーとフッターを除く）
  const visibleLines = height - 4;
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
      <Box width={width} borderStyle="single" borderColor="blue">
        <Text bold color="blue">
          DEBUG LOG VIEWER ({filteredLogs.length} entries) - q:quit, c:clear
          filter, C:clear all, r:refresh
          {gSequence && <Text color="yellow"> [g-sequence]</Text>}
        </Text>
      </Box>

      {/* 統計とフィルタ情報 */}
      <Box width={width}>
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
      <Box flexDirection="column" width={width} height={visibleLines}>
        {visibleLogs.map((log, index) => {
          const absoluteIndex = scrollOffset + index;
          const isSelected = absoluteIndex === selectedIndex;
          const levelColor = getLevelColor(log.level);

          return (
            <Box key={log.id} width={width}>
              <Text
                color={isSelected ? "white" : "gray"}
                backgroundColor={isSelected ? "blue" : undefined}
                bold={isSelected}
              >
                {isSelected ? ">" : " "}
              </Text>
              <Text color={isSelected ? "white" : levelColor}>
                [{formatTime(log.timestamp)}]
              </Text>
              <Text color={isSelected ? "white" : "cyan"}>
                [{log.level.toUpperCase()}]
              </Text>
              <Text color={isSelected ? "white" : "magenta"}>
                [{log.category}]
              </Text>
              <Text color={isSelected ? "white" : "white"}>{log.message}</Text>
              {log.data && (
                <Text color={isSelected ? "white" : "gray"}>
                  {typeof log.data === "string"
                    ? log.data
                    : JSON.stringify(log.data)}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {/* フッター */}
      <Box width={width} borderStyle="single" borderColor="blue">
        <Text>
          {selectedIndex + 1}/{filteredLogs.length} | Categories:{" "}
          {categories.join(", ") || "None"} | j/k: navigate, PageUp/PageDown:
          page scroll, gg: go to top, G: go to bottom, r: go to latest
        </Text>
      </Box>
    </Box>
  );
}
