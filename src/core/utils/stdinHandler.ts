/**
 * Enhanced stdin handler for read-then-reinitialize approach
 * Based on how 'less' command handles stdin vs keyboard input separation
 */

import { ReadStream } from "node:tty";
import type { JsonValue } from "@core/types/index";
import { parseJsonWithValidation } from "@features/json-rendering/utils/jsonProcessor";

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
    const keyboardAvailable = await reinitializeStdinForKeyboard();

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      canUseKeyboard: keyboardAvailable, // Use actual keyboard availability
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
 * Uses a more reliable approach that works better with pipes
 */
async function reinitializeStdinForKeyboard(): Promise<boolean> {
  try {
    // For Windows, use minimal setup
    if (process.platform === "win32") {
      return await setupMinimalStdin();
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
    } catch (error) {
      const isTestEnvironment =
        process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
      if (!isTestEnvironment) {
        console.log(
          "🔧 [STDIN] /dev/tty access failed:",
          error instanceof Error ? error.message : String(error),
        );
      }
      // TTY access failed, try alternative approach
      return await setupEnhancedStdin();
    }
  } catch {
    return false;
  }
}

/**
 * Enhanced stdin setup that works better after reading from pipes
 * Uses a more direct approach that tries to access the controlling terminal
 */
async function setupEnhancedStdin(): Promise<boolean> {
  try {
    const isTestEnvironment =
      process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
    if (!isTestEnvironment) {
      console.log("🔧 [STDIN] Setting up enhanced stdin for keyboard input");
    }

    const fs = await import("node:fs");

    // First, try to access the controlling terminal through various paths
    const terminalPaths = [
      "/dev/tty", // Standard controlling terminal (most reliable)
      "/dev/console", // System console
    ];

    for (const termPath of terminalPaths) {
      try {
        if (!isTestEnvironment) {
          console.log(`🔧 [STDIN] Trying terminal path: ${termPath}`);
        }

        // Check if this path exists and is accessible
        fs.accessSync(termPath, fs.constants.R_OK | fs.constants.W_OK);

        // Open the terminal device for both reading and writing
        const termFd = fs.openSync(termPath, "r+");
        const termStream = new ReadStream(termFd);

        // Test if this is actually a TTY that supports raw mode
        try {
          if (termStream.setRawMode) {
            termStream.setRawMode(true);
            termStream.setRawMode(false);
            if (!isTestEnvironment) {
              console.log(`✅ [STDIN] ${termPath} supports raw mode`);
            }
          } else {
            throw new Error("No setRawMode function");
          }
        } catch (rawModeError) {
          if (!isTestEnvironment) {
            console.log(
              `❌ [STDIN] ${termPath} doesn't support raw mode:`,
              rawModeError instanceof Error
                ? rawModeError.message
                : String(rawModeError),
            );
          }
          fs.closeSync(termFd);
          continue;
        }

        // Set up TTY properties
        Object.defineProperty(termStream, "isTTY", {
          value: true,
          writable: false,
          configurable: true,
        });

        // Add ref/unref functions if missing
        if (!termStream.ref) {
          Object.defineProperty(termStream, "ref", {
            value: function () {
              return this;
            },
            writable: true,
            configurable: true,
          });
        }

        if (!termStream.unref) {
          Object.defineProperty(termStream, "unref", {
            value: function () {
              return this;
            },
            writable: true,
            configurable: true,
          });
        }

        // Clean up existing stdin and replace
        process.stdin.removeAllListeners();
        Object.defineProperty(process, "stdin", {
          value: termStream,
          writable: true,
          configurable: true,
        });

        if (!isTestEnvironment) {
          console.log(
            `✅ [STDIN] Successfully using ${termPath} for keyboard input`,
          );
        }
        return true;
      } catch (pathError) {
        if (!isTestEnvironment) {
          console.log(
            `❌ [STDIN] ${termPath} failed:`,
            pathError instanceof Error ? pathError.message : String(pathError),
          );
        }
      }
    }

    // If all terminal device approaches failed, try creating a mock stdin that
    // can work with Ink but doesn't provide actual keyboard input
    if (!isTestEnvironment) {
      console.log(
        "🔧 [STDIN] No terminal devices available, setting up mock stdin",
      );
    }
    return await setupMockStdinForInk();
  } catch (error) {
    const isTestEnvironment =
      process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
    if (!isTestEnvironment) {
      console.log(
        "🔧 [STDIN] Enhanced stdin setup failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
    return await setupMinimalStdin();
  }
}

/**
 * Set up a mock stdin that works with Ink but indicates keyboard is not available
 * This allows the app to run but disables keyboard functionality gracefully
 */
async function setupMockStdinForInk(): Promise<boolean> {
  try {
    const isTestEnvironment =
      process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
    if (!isTestEnvironment) {
      console.log("🔧 [STDIN] Setting up mock stdin for Ink compatibility");
    }

    const { Readable } = await import("node:stream");

    // Create a readable stream that satisfies Ink's requirements but doesn't receive input
    const mockStdin = new Readable({
      read() {
        // Do nothing - this stream won't receive actual input
      },
    });

    // Add TTY properties to satisfy Ink
    Object.defineProperty(mockStdin, "isTTY", {
      value: true,
      writable: false,
      configurable: true,
    });

    // Add a setRawMode function that doesn't do anything
    Object.defineProperty(mockStdin, "setRawMode", {
      value: function (mode: boolean) {
        if (!isTestEnvironment) {
          console.log(
            `🔧 [STDIN] Mock setRawMode(${mode}) - no actual raw mode available`,
          );
        }
        return this;
      },
      writable: true,
      configurable: true,
    });

    // Add ref/unref functions
    Object.defineProperty(mockStdin, "ref", {
      value: function () {
        return this;
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(mockStdin, "unref", {
      value: function () {
        return this;
      },
      writable: true,
      configurable: true,
    });

    // Replace process.stdin
    process.stdin.removeAllListeners();
    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
      configurable: true,
    });

    if (!isTestEnvironment) {
      console.log(
        "⚠️  [STDIN] Mock stdin setup complete - keyboard input not available",
      );
    }
    return false; // Indicate that keyboard input is not actually available
  } catch (error) {
    const isTestEnvironment =
      process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
    if (!isTestEnvironment) {
      console.log(
        "❌ [STDIN] Mock stdin setup failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
    return await setupMinimalStdin();
  }
}

/**
 * Set up minimal stdin interface for Ink compatibility
 */
async function setupMinimalStdin(): Promise<boolean> {
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
      canUseKeyboard: true, // Always enable keyboard for file input
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? `Failed to read file '${filePath}': ${error.message}`
          : `Unknown error reading file '${filePath}'`,
      canUseKeyboard: true, // Always enable keyboard for file input
    };
  }
}
