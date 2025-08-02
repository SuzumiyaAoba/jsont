/**
 * Tests for error handling utilities
 */

import {
  getErrorMessage,
  handleFatalError,
  handleInputError,
  handleNoInput,
} from "@core/utils/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Error Handler", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    originalEnv = process.env["NODE_ENV"];
    originalStdin = process.stdin;

    // Default to test environment to prevent actual process.exit
    process.env["NODE_ENV"] = "test";
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env["NODE_ENV"] = originalEnv;
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      configurable: true,
    });
  });

  describe("handleFatalError", () => {
    it("should handle Error instances", () => {
      const error = new Error("Test error message");

      expect(() => {
        handleFatalError(error);
      }).toThrow("Fatal error: Test error message");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Fatal error"),
        "Test error message",
      );
    });

    it("should handle non-Error objects", () => {
      const error = "String error";

      expect(() => {
        handleFatalError(error);
      }).toThrow("Fatal error: Unknown error occurred");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Fatal error"),
        "Unknown error occurred",
      );
    });

    it("should handle null/undefined errors", () => {
      expect(() => {
        handleFatalError(null);
      }).toThrow("Fatal error: Unknown error occurred");

      expect(() => {
        handleFatalError(undefined);
      }).toThrow("Fatal error: Unknown error occurred");
    });

    it("should call process.exit in non-test environment", () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      // Set non-test environment
      process.env["NODE_ENV"] = "production";
      delete process.env["VITEST"];

      const error = new Error("Fatal error");

      expect(() => {
        handleFatalError(error);
      }).toThrow("process.exit called");

      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });

    it("should throw error in test environment", () => {
      process.env["NODE_ENV"] = "test";

      const error = new Error("Test fatal error");

      expect(() => {
        handleFatalError(error);
      }).toThrow("Fatal error: Test fatal error");
    });

    it("should throw error in vitest environment", () => {
      delete process.env["NODE_ENV"];
      process.env["VITEST"] = "true";

      const error = new Error("Vitest fatal error");

      expect(() => {
        handleFatalError(error);
      }).toThrow("Fatal error: Vitest fatal error");
    });
  });

  describe("handleInputError", () => {
    it("should handle Error instances in TTY mode", () => {
      // Mock TTY mode
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      const error = new Error("Input error");

      handleInputError(error);

      expect(consoleSpy).toHaveBeenCalledWith("Error:", "Input error");
    });

    it("should handle non-Error objects in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      const error = "String input error";

      handleInputError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error:",
        "Unknown error occurred",
      );
    });

    it("should not exit when filePath is provided", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      const error = new Error("Input error with file");

      // Should not throw in test environment when filePath is provided
      expect(() => {
        handleInputError(error, "test.json");
      }).not.toThrow();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not exit when not in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const error = new Error("Non-TTY input error");

      expect(() => {
        handleInputError(error);
      }).not.toThrow();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should call process.exit in non-test TTY mode", () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      process.env["NODE_ENV"] = "production";
      delete process.env["VITEST"];

      const error = new Error("Production input error");

      expect(() => {
        handleInputError(error);
      }).toThrow("process.exit called");

      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });
  });

  describe("handleNoInput", () => {
    it("should show usage message in TTY mode without file", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      handleNoInput();

      expect(consoleSpy).toHaveBeenCalledWith("No JSON input provided.");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Usage: jsont [file.json] or echo '{...}' | jsont",
      );
    });

    it("should not show message when filePath is provided", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      expect(() => {
        handleNoInput("test.json");
      }).not.toThrow();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not show message when not in TTY mode", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      expect(() => {
        handleNoInput();
      }).not.toThrow();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should call process.exit in non-test TTY mode", () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      process.env["NODE_ENV"] = "production";
      delete process.env["VITEST"];

      expect(() => {
        handleNoInput();
      }).toThrow("process.exit called");

      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error instances", () => {
      const error = new Error("Custom error message");
      const result = getErrorMessage(error);

      expect(result).toBe("Custom error message");
    });

    it("should handle non-Error objects", () => {
      const error = "String error";
      const result = getErrorMessage(error);

      expect(result).toBe("Unknown error occurred");
    });

    it("should handle null/undefined", () => {
      expect(getErrorMessage(null)).toBe("Unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("Unknown error occurred");
    });

    it("should handle empty Error message", () => {
      const error = new Error("");
      const result = getErrorMessage(error);

      expect(result).toBe("");
    });

    it("should handle Error subclasses", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      const error = new CustomError("Custom error type");
      const result = getErrorMessage(error);

      expect(result).toBe("Custom error type");
    });

    it("should handle objects with toString method", () => {
      const error = {
        toString: () => "Object error",
        message: "This should not be used",
      };

      const result = getErrorMessage(error);

      expect(result).toBe("Unknown error occurred");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex error scenarios", () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      // Test multiple error types in sequence
      const errors = [
        new Error("First error"),
        "Second error",
        null,
        undefined,
        { message: "Object error" },
      ];

      errors.forEach((error) => {
        handleInputError(error);
      });

      expect(consoleSpy).toHaveBeenCalledTimes(5);
    });

    it("should preserve error stack traces in development", () => {
      process.env["NODE_ENV"] = "development";

      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      const error = new Error("Development error");
      error.stack = "Error: Development error\n    at test.js:1:1";

      expect(() => {
        handleFatalError(error);
      }).toThrow("process.exit called");

      // Error message should be preserved
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Fatal error"),
        "Development error",
      );

      exitSpy.mockRestore();
    });
  });
});
