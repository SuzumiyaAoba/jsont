/**
 * Tests for stdin handling utilities
 */

import type { JsonValue } from "@core/types/index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFromFile, readStdinThenReinitialize } from "../stdinHandler";

// Mock dependencies
vi.mock("@features/json-rendering/utils/jsonProcessor", () => ({
  parseJsonWithValidation: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("node:fs", () => ({
  accessSync: vi.fn(),
  openSync: vi.fn(),
  closeSync: vi.fn(),
  constants: { R_OK: 4, W_OK: 2 },
}));

vi.mock("node:tty", () => ({
  ReadStream: vi.fn().mockImplementation(() => ({
    setRawMode: vi.fn().mockReturnThis(),
    isTTY: true,
  })),
}));

import { readFile } from "node:fs/promises";
import { parseJsonWithValidation } from "@features/json-rendering/utils/jsonProcessor";

describe("Stdin Handler", () => {
  let mockParseJson: ReturnType<typeof vi.mocked>;
  let mockReadFile: ReturnType<typeof vi.mocked>;
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    mockParseJson = vi.mocked(parseJsonWithValidation);
    mockReadFile = vi.mocked(readFile);

    // Save original process.stdin
    originalStdin = process.stdin;

    // Mock process.stdin
    const mockStdin = {
      isTTY: false,
      on: vi.fn(),
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
      resume: vi.fn(),
      setRawMode: vi.fn().mockReturnThis(),
    };

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original process.stdin
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
    vi.resetAllMocks();
  });

  describe("readStdinThenReinitialize", () => {
    it("should return error when stdin is TTY (no piped input)", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("No JSON input provided");
      expect(result.canUseKeyboard).toBe(true);
    });

    it("should handle successful JSON parsing from stdin", async () => {
      const testData: JsonValue = { test: "data" };
      const jsonString = JSON.stringify(testData);

      mockParseJson.mockReturnValue({
        success: true,
        data: testData,
        error: null,
      });

      // Mock stdin data events
      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      mockStdin.on.mockImplementation((event: string, callback: () => void) => {
        if (event === "data") {
          setTimeout(() => callback(Buffer.from(jsonString)), 0);
        } else if (event === "end") {
          setTimeout(() => callback(), 10);
        }
        return mockStdin;
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.error).toBe(null);
      expect(result.canUseKeyboard).toBe(true);
      expect(mockParseJson).toHaveBeenCalledWith(jsonString);
    });

    it("should handle empty stdin input", async () => {
      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      mockStdin.on.mockImplementation((event: string, callback: () => void) => {
        if (event === "data") {
          setTimeout(() => callback(Buffer.from("")), 0);
        } else if (event === "end") {
          setTimeout(() => callback(), 10);
        }
        return mockStdin;
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("Empty input received");
      expect(result.canUseKeyboard).toBe(false);
    });

    it("should handle JSON parsing errors", async () => {
      const invalidJson = "{ invalid json";

      mockParseJson.mockReturnValue({
        success: false,
        data: null,
        error: "Invalid JSON format",
      });

      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      mockStdin.on.mockImplementation((event: string, callback: () => void) => {
        if (event === "data") {
          setTimeout(() => callback(Buffer.from(invalidJson)), 0);
        } else if (event === "end") {
          setTimeout(() => callback(), 10);
        }
        return mockStdin;
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toBe("Invalid JSON format");
      expect(result.canUseKeyboard).toBe(true); // Still force enable keyboard
    });

    it("should handle stdin read timeout", async () => {
      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      // Don't emit any events to trigger timeout
      mockStdin.on.mockImplementation(() => mockStdin);

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("Timeout");
      expect(result.canUseKeyboard).toBe(false);
    }, 10000);

    it("should handle stdin error events", async () => {
      const testError = new Error("Stdin read error");

      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      mockStdin.on.mockImplementation((event: string, callback: () => void) => {
        if (event === "error") {
          setTimeout(() => callback(testError), 0);
        }
        return mockStdin;
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("Stdin read error");
      expect(result.canUseKeyboard).toBe(false);
    });

    it("should handle multiple data chunks", async () => {
      const testData: JsonValue = { large: "data object" };
      const jsonString = JSON.stringify(testData);
      const chunk1 = jsonString.slice(0, 10);
      const chunk2 = jsonString.slice(10);

      mockParseJson.mockReturnValue({
        success: true,
        data: testData,
        error: null,
      });

      const mockStdin = process.stdin;
      mockStdin.isTTY = false;

      let dataCallbackCount = 0;
      mockStdin.on.mockImplementation((event: string, callback: () => void) => {
        if (event === "data") {
          setTimeout(() => {
            dataCallbackCount++;
            if (dataCallbackCount === 1) {
              callback(Buffer.from(chunk1));
              // Immediately send second chunk
              setTimeout(() => callback(Buffer.from(chunk2)), 0);
            }
          }, 0);
        } else if (event === "end") {
          setTimeout(() => callback(), 20);
        }
        return mockStdin;
      });

      const result = await readStdinThenReinitialize();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(mockParseJson).toHaveBeenCalledWith(jsonString);
    });
  });

  describe("readFromFile", () => {
    it("should successfully read and parse JSON file", async () => {
      const testData: JsonValue = { file: "data" };
      const jsonString = JSON.stringify(testData);
      const filePath = "test.json";

      mockReadFile.mockResolvedValue(jsonString);
      mockParseJson.mockReturnValue({
        success: true,
        data: testData,
        error: null,
      });

      const result = await readFromFile(filePath);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.error).toBe(null);
      expect(result.canUseKeyboard).toBe(true);
      expect(mockReadFile).toHaveBeenCalledWith(filePath, "utf8");
      expect(mockParseJson).toHaveBeenCalledWith(jsonString);
    });

    it("should handle empty file", async () => {
      const filePath = "empty.json";

      mockReadFile.mockResolvedValue("");

      const result = await readFromFile(filePath);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("empty or contains only whitespace");
      expect(result.canUseKeyboard).toBe(true);
    });

    it("should handle whitespace-only file", async () => {
      const filePath = "whitespace.json";

      mockReadFile.mockResolvedValue("   \n\t  \n");

      const result = await readFromFile(filePath);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("empty or contains only whitespace");
      expect(result.canUseKeyboard).toBe(true);
    });

    it("should handle file read errors", async () => {
      const filePath = "nonexistent.json";
      const fileError = new Error("ENOENT: no such file or directory");

      mockReadFile.mockRejectedValue(fileError);

      const result = await readFromFile(filePath);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("Failed to read file");
      expect(result.error).toContain(filePath);
      expect(result.canUseKeyboard).toBe(true);
    });

    it("should handle JSON parsing errors from file", async () => {
      const filePath = "invalid.json";
      const invalidJson = "{ invalid json }";

      mockReadFile.mockResolvedValue(invalidJson);
      mockParseJson.mockReturnValue({
        success: false,
        data: null,
        error: "JSON parse error",
      });

      const result = await readFromFile(filePath);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toBe("JSON parse error");
      expect(result.canUseKeyboard).toBe(true);
    });

    it("should handle unknown errors gracefully", async () => {
      const filePath = "test.json";

      mockReadFile.mockRejectedValue("String error");

      const result = await readFromFile(filePath);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("Unknown error reading file");
      expect(result.canUseKeyboard).toBe(true);
    });
  });
});
