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
    await reinitializeStdinForKeyboard();

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      canUseKeyboard: true, // Force enable keyboard for pipe input - let AppService handle final validation
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
    let hasEnded = false;

    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
    };

    const onEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        cleanup();
        const data = Buffer.concat(chunks).toString("utf8");
        resolve(data);
      }
    };

    const onError = (error: Error) => {
      if (!hasEnded) {
        hasEnded = true;
        cleanup();
        reject(error);
      }
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.removeListener("end", onEnd);
      process.stdin.removeListener("error", onError);
    };

    process.stdin.on("data", onData);
    process.stdin.on("end", onEnd);
    process.stdin.on("error", onError);

    // Resume stdin to start reading
    process.stdin.resume();

    // Set a timeout to prevent hanging if no data is available
    setTimeout(() => {
      if (!hasEnded) {
        hasEnded = true;
        cleanup();
        reject(new Error("Timeout: No data received from stdin"));
      }
    }, 5000); // 5 second timeout
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
    } catch (_error) {
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
    const fs = await import("node:fs");

    // First, try to access the controlling terminal through various paths
    const terminalPaths = [
      "/dev/tty", // Standard controlling terminal (most reliable)
      "/dev/console", // System console
    ];

    for (const termPath of terminalPaths) {
      try {
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
          } else {
            throw new Error("No setRawMode function");
          }
        } catch (_rawModeError) {
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

        return true;
      } catch (_pathError) {}
    }

    // If all terminal device approaches failed, try creating a mock stdin that
    // can work with Ink but doesn't provide actual keyboard input
    return await setupMockStdinForInk();
  } catch (_error) {
    return await setupMinimalStdin();
  }
}

/**
 * Set up a mock stdin that works with Ink but indicates keyboard is not available
 * This allows the app to run but disables keyboard functionality gracefully
 */
async function setupMockStdinForInk(): Promise<boolean> {
  try {
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
      value: function (_mode: boolean) {
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

    return false; // Indicate that keyboard input is not actually available
  } catch (_error) {
    return await setupMinimalStdin();
  }
}

/**
 * Set up stdin for Ink compatibility in file mode
 * This is simpler than the full reinitialize process since stdin hasn't been consumed
 */
async function setupStdinForInkCompatibility(): Promise<boolean> {
  try {
    // Force TTY properties for Ink compatibility
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Provide a working setRawMode function
    if (!process.stdin.setRawMode) {
      Object.defineProperty(process.stdin, "setRawMode", {
        value: function (mode: boolean) {
          try {
            // Try to actually set raw mode if possible
            if (this.isTTY && typeof this.setRawMode === "function") {
              return this.setRawMode(mode);
            }
          } catch {
            // Silently handle setRawMode errors
          }
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    // Provide required ref/unref functions for Ink
    if (!process.stdin.ref) {
      Object.defineProperty(process.stdin, "ref", {
        value: function () {
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    if (!process.stdin.unref) {
      Object.defineProperty(process.stdin, "unref", {
        value: function () {
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    // Ensure stdin is readable and resumed
    Object.defineProperty(process.stdin, "readable", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Resume stdin to make it available for reading
    if (process.stdin.resume) {
      process.stdin.resume();
    }

    return true;
  } catch {
    return false;
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

    // For file input, we still need to ensure stdin is properly set up for Ink
    // Even though we didn't consume stdin, it might need TTY setup for useInput to work
    const keyboardAvailable = await setupStdinForInkCompatibility();

    return {
      success: parseResult.success,
      data: parseResult.data,
      error: parseResult.error,
      canUseKeyboard: keyboardAvailable, // Use actual keyboard setup result
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
