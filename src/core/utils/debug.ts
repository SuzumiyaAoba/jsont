/**
 * Debug Utilities
 */

import { DEBUG_PREFIX } from "@core/config/constants";
import type { JsonValue } from "@core/types/index";
import type { StdinReadResult } from "@core/utils/stdinHandler";

export class DebugLogger {
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled = !!process.env["DEBUG"];
  }

  /**
   * Log JSON read statistics
   */
  logReadStats(result: StdinReadResult): void {
    if (!this.isEnabled || !result.success) {
      return;
    }

    console.error(
      `${DEBUG_PREFIX} Read result: ${result.success ? "success" : "failed"}, keyboard: ${result.canUseKeyboard}`,
    );
  }

  /**
   * Log JSON data (if not too large)
   */
  logJsonData(data: JsonValue): void {
    if (!this.isEnabled) {
      return;
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      // Only log if reasonably small (< 1KB)
      if (jsonString.length < 1024) {
        console.error(`${DEBUG_PREFIX} JSON data:`, jsonString);
      } else {
        console.error(
          `${DEBUG_PREFIX} JSON data: [${jsonString.length} characters]`,
        );
      }
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Failed to stringify JSON data:`, error);
    }
  }

  /**
   * Log general debug message
   */
  log(message: string, ...args: unknown[]): void {
    if (!this.isEnabled) {
      return;
    }

    console.error(`${DEBUG_PREFIX} ${message}`, ...args);
  }
}
