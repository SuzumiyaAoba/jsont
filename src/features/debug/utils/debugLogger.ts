/**
 * Debug Logger - アプリケーション内でデバッグログを蓄積・管理するシステム
 */

export type DebugLogLevel = "info" | "warn" | "error" | "debug";

export interface DebugLogEntry {
  id: string;
  timestamp: Date;
  level: DebugLogLevel;
  category: string;
  message: string;
  data?: unknown;
}

class DebugLoggerClass {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 1000; // 最大ログ数
  private isDebugViewerActive = false; // デバッグビューアーがアクティブかどうか

  /**
   * デバッグビューアーの状態を設定
   */
  setDebugViewerActive(active: boolean): void {
    this.isDebugViewerActive = active;
  }

  /**
   * ログを追加
   */
  log(
    level: DebugLogLevel,
    category: string,
    message: string,
    data?: unknown,
  ): void {
    // デバッグビューアーがアクティブな場合はログを追加しない
    if (this.isDebugViewerActive) {
      return;
    }

    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    // 最大ログ数を超えた場合、古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 開発環境では通常のconsole.logにも出力
    if (process.env["NODE_ENV"] === "development") {
      const prefix = `[${level.toUpperCase()}] [${category}]`;
      console.log(`${prefix} ${message}`, data ? data : "");
    }
  }

  /**
   * デバッグレベルのログ
   */
  debug(category: string, message: string, data?: unknown): void {
    this.log("debug", category, message, data);
  }

  /**
   * 情報レベルのログ
   */
  info(category: string, message: string, data?: unknown): void {
    this.log("info", category, message, data);
  }

  /**
   * 警告レベルのログ
   */
  warn(category: string, message: string, data?: unknown): void {
    this.log("warn", category, message, data);
  }

  /**
   * エラーレベルのログ
   */
  error(category: string, message: string, data?: unknown): void {
    this.log("error", category, message, data);
  }

  /**
   * 全ログを取得
   */
  getAllLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  /**
   * カテゴリ別ログを取得
   */
  getLogsByCategory(category: string): DebugLogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * レベル別ログを取得
   */
  getLogsByLevel(level: DebugLogLevel): DebugLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * 最新のログを取得
   */
  getRecentLogs(count: number = 50): DebugLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * ログをクリア
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 利用可能なカテゴリを取得
   */
  getCategories(): string[] {
    const categories = new Set(this.logs.map((log) => log.category));
    return Array.from(categories).sort();
  }

  /**
   * ログ統計を取得
   */
  getStats(): {
    total: number;
    byLevel: Record<DebugLogLevel, number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<DebugLogLevel, number> = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    const byCategory: Record<string, number> = {};

    this.logs.forEach((log) => {
      byLevel[log.level]++;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
    };
  }
}

// シングルトンインスタンス
export const DebugLogger = new DebugLoggerClass();

// 便利な関数をエクスポート
export const debugLog = (category: string, message: string, data?: unknown) =>
  DebugLogger.debug(category, message, data);
export const infoLog = (category: string, message: string, data?: unknown) =>
  DebugLogger.info(category, message, data);
export const warnLog = (category: string, message: string, data?: unknown) =>
  DebugLogger.warn(category, message, data);
export const errorLog = (category: string, message: string, data?: unknown) =>
  DebugLogger.error(category, message, data);

// デバッグビューアー状態管理
export const setDebugViewerActive = (active: boolean) =>
  DebugLogger.setDebugViewerActive(active);
