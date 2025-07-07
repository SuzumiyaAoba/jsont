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
        error: "No input available - stdin is connected to a terminal",
        canUseKeyboard: true, // TTY mode, can use keyboard
      };
    }

    // Read all data from stdin
    const inputData = await readAllStdinData();

    if (!inputData.trim()) {
      return {
        success: false,
        data: null,
        error: "No data received from stdin",
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
 * Attempt to reinitialize stdin for keyboard input using multiple approaches
 * This implements various strategies to achieve keyboard input after pipe consumption
 */
async function reinitializeStdinForKeyboard(): Promise<boolean> {
  try {
    // Method 1: Try to open controlling terminal directly using different approaches
    if (process.platform !== "win32") {
      try {
        // Try multiple approaches to access the controlling terminal
        const terminalPaths = ["/dev/tty", "/proc/self/fd/0", "/dev/fd/0"];

        for (const termPath of terminalPaths) {
          try {
            const fs = await import("node:fs");

            // Test if the terminal path is accessible
            try {
              fs.accessSync(termPath, fs.constants.R_OK);
            } catch (accessError) {
              continue;
            }

            // Try to open the terminal device
            const termFd = fs.openSync(termPath, "r");
            const termStream = new ReadStream(termFd);

            // Set up proper raw mode handling with fallback
            termStream.setRawMode = function (mode: boolean) {
              try {
                // Try to enable raw mode on the terminal itself
                if (this.isTTY && typeof this.setRawMode === "function") {
                  return ReadStream.prototype.setRawMode.call(this, mode);
                }
              } catch (error) {
                // Expected error for non-TTY streams, silently ignore
              }
              return this;
            };

            // Ensure TTY properties are set
            Object.defineProperty(termStream, "isTTY", {
              value: true,
              writable: false,
              configurable: true,
            });

            // Clean up existing stdin listeners
            process.stdin.removeAllListeners();

            // Replace process.stdin with our terminal stream
            Object.defineProperty(process, "stdin", {
              value: termStream,
              writable: true,
              configurable: true,
            });

            return true;
          } catch (termError) {}
        }
      } catch (error) {
        // Fallback to other methods
      }

      // Method 1b: Try to re-open stdin file descriptor as TTY
      try {
        // Try to re-open stdin as a TTY stream
        const stdinFd = process.stdin.fd || 0;
        const newStdinStream = new ReadStream(stdinFd);

        // Check if this stream supports TTY operations
        if (newStdinStream.isTTY) {
          // Set up proper raw mode handling
          const originalSetRawMode = newStdinStream.setRawMode;
          newStdinStream.setRawMode = function (mode: boolean) {
            try {
              if (originalSetRawMode) {
                return originalSetRawMode.call(this, mode);
              }
            } catch (error) {
              // Silently handle setRawMode errors
            }
            return this;
          };

          // Clean up existing stdin listeners
          process.stdin.removeAllListeners();

          // Replace process.stdin with our new TTY stream
          Object.defineProperty(process, "stdin", {
            value: newStdinStream,
            writable: true,
            configurable: true,
          });

          return true;
        }
      } catch (error) {
        // Continue to next method
      }

      // Method 2: Try to use the process.stdin directly but reset its state
      try {
        // Remove all existing listeners
        process.stdin.removeAllListeners();

        // Reset stdin to readable state
        process.stdin.pause();
        process.stdin.resume();

        // Force TTY properties
        Object.defineProperty(process.stdin, "isTTY", {
          value: true,
          writable: true,
          configurable: true,
        });

        // Create a wrapper for setRawMode that handles errors gracefully
        const originalSetRawMode = process.stdin.setRawMode;
        Object.defineProperty(process.stdin, "setRawMode", {
          value: function (mode: boolean) {
            try {
              if (
                originalSetRawMode &&
                typeof originalSetRawMode === "function"
              ) {
                return originalSetRawMode.call(this, mode);
              }
            } catch (error) {
              // Silently handle setRawMode errors
            }
            return this;
          },
          writable: true,
          configurable: true,
        });

        return true;
      } catch (error) {
        // Continue to next method
      }
    }

    // Method 3: Last resort - create minimal TTY interface for Ink

    // Create a minimal stdin-like object that Ink can work with
    const minimalStdin = {
      isTTY: true,
      setRawMode: function (_mode: boolean) {
        return this;
      },
      on: function (_event: string, _listener: (...args: unknown[]) => void) {
        return this;
      },
      removeListener: function (
        _event: string,
        _listener: (...args: unknown[]) => void,
      ) {
        return this;
      },
      removeAllListeners: function () {
        return this;
      },
      pause: function () {
        return this;
      },
      resume: function () {
        return this;
      },
      read: () => null,
      readable: true,
      fd: 0,
    };

    // Replace process.stdin with our minimal implementation
    Object.defineProperty(process, "stdin", {
      value: minimalStdin,
      writable: true,
      configurable: true,
    });

    return false;
  } catch (error) {
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
        error: "File is empty or contains only whitespace",
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
        error instanceof Error ? error.message : "Unknown error reading file",
      canUseKeyboard: process.stdin.isTTY === true,
    };
  }
}
