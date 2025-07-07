/**
 * Enhanced stdin handler for read-then-reinitialize approach
 * Based on how 'less' command handles stdin vs keyboard input separation
 */

import { ReadStream } from "node:tty";
import type { JsonValue } from "../types/index.js";
import { parseJsonWithValidation } from "./jsonProcessor.js";

export interface StdinReadResult {
  success: boolean;
  data: JsonValue | null;
  error: string | null;
  canUseKeyboard: boolean;
}

/**
 * Read from stdin completely, then prepare for keyboard input
 */
export async function readStdinThenReinitialize(): Promise<StdinReadResult> {
  try {
    // Check if we have stdin data available
    if (process.stdin.isTTY) {
      return {
        success: false,
        data: null,
        error:
          'No JSON input provided. Usage: echo \'{"key": "value"}\' | jsont',
        canUseKeyboard: true, // TTY mode, can use keyboard
      };
    }

    // Read all data from stdin
    const inputData = await readAllStdinData();

    if (!inputData.trim()) {
      return {
        success: false,
        data: null,
        error: "Empty input received. Please provide valid JSON data.",
        canUseKeyboard: false,
      };
    }

    // Parse the JSON
    const parseResult = parseJsonWithValidation(inputData);

    // Now try to reinitialize stdin for keyboard input
    const keyboardReady = await reinitializeStdinForKeyboard();

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      canUseKeyboard: keyboardReady,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Unknown error reading stdin",
      canUseKeyboard: false,
    };
  }
}

/**
 * Read all data from stdin without consuming the stream permanently
 */
async function readAllStdinData(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    process.stdin.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      const data = Buffer.concat(chunks).toString("utf8");
      resolve(data);
    });

    process.stdin.on("error", (error) => {
      reject(error);
    });

    // Resume stdin to start reading
    process.stdin.resume();
  });
}

/**
 * Attempt to reinitialize stdin for keyboard input
 * Uses the most reliable approach: direct TTY access via /dev/tty
 */
async function reinitializeStdinForKeyboard(): Promise<boolean> {
  try {
    // Only attempt TTY reinitialization on Unix-like systems
    if (process.platform === "win32") {
      return setupMinimalStdin();
    }

    // Try to open the controlling terminal directly
    try {
      const fs = await import("node:fs");

      // Check if /dev/tty is accessible
      fs.accessSync("/dev/tty", fs.constants.R_OK);

      // Open the terminal device
      const termFd = fs.openSync("/dev/tty", "r");
      const termStream = new ReadStream(termFd);

      // Set up safe raw mode handling
      termStream.setRawMode = function (mode: boolean) {
        try {
          if (this.isTTY && ReadStream.prototype.setRawMode) {
            return ReadStream.prototype.setRawMode.call(this, mode);
          }
        } catch {
          // Silently handle setRawMode errors
        }
        return this;
      };

      // Ensure TTY properties are set
      Object.defineProperty(termStream, "isTTY", {
        value: true,
        writable: false,
        configurable: true,
      });

      // Clean up existing stdin and replace with terminal stream
      process.stdin.removeAllListeners();
      Object.defineProperty(process, "stdin", {
        value: termStream,
        writable: true,
        configurable: true,
      });

      return true;
    } catch {
      // TTY access failed, fall back to minimal stdin
      return setupMinimalStdin();
    }
  } catch {
    return false;
  }
}

/**
 * Set up minimal stdin interface for Ink compatibility
 */
function setupMinimalStdin(): boolean {
  try {
    // Clean up existing stdin listeners
    process.stdin.removeAllListeners();

    // Override setRawMode to prevent errors
    const originalSetRawMode = process.stdin.setRawMode;
    Object.defineProperty(process.stdin, "setRawMode", {
      value: function (mode: boolean) {
        try {
          if (originalSetRawMode && typeof originalSetRawMode === "function") {
            return originalSetRawMode.call(this, mode);
          }
        } catch {
          // Silently handle setRawMode errors
        }
        return this;
      },
      writable: true,
      configurable: true,
    });

    // Ensure isTTY is set for Ink compatibility
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      writable: true,
      configurable: true,
    });

    return false; // Indicate limited keyboard support
  } catch {
    return false;
  }
}

/**
 * Read from file (alternative to stdin)
 * For file input, stdin should remain available for keyboard input
 */
export async function readFromFile(filePath: string): Promise<StdinReadResult> {
  try {
    const fs = await import("node:fs/promises");
    const inputData = await fs.readFile(filePath, "utf8");

    if (!inputData.trim()) {
      return {
        success: false,
        data: null,
        error: `File '${filePath}' is empty or contains only whitespace`,
        canUseKeyboard: true, // File mode, stdin should be available for keyboard
      };
    }

    const parseResult = parseJsonWithValidation(inputData);

    // For file input, we don't need to reinitialize stdin
    // It should be available for keyboard input as-is

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      canUseKeyboard: process.stdin.isTTY === true, // Only enable if truly a TTY
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? `Failed to read file '${filePath}': ${error.message}`
          : `Unknown error reading file '${filePath}'`,
      canUseKeyboard: process.stdin.isTTY === true,
    };
  }
}
