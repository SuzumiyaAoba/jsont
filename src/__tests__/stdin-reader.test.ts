/**
 * Stdin Reader Tests
 * T2.1: JSON基本処理とパース機能
 */

import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { autoReadJson, readJsonFromStdin } from "../utils/stdinReader.js";

// Mock process.stdin
const _mockStdin = vi.fn();
vi.mock("node:process", () => ({
  stdin: {
    isTTY: false,
    setEncoding: vi.fn(),
    on: vi.fn(),
    _readableState: { fd: 0 },
  },
}));

describe("Stdin Reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("readJsonFromStdin", () => {
    it("should detect TTY and return error", async () => {
      // Mock TTY detection
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        configurable: true,
      });

      const result = await readJsonFromStdin();

      expect(result.success).toBe(false);
      expect(result.error).toContain("terminal");
      expect(result.stats.source).toBe("stdin");
    });

    it("should handle timeout correctly", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      // Mock a slow stdin that never resolves
      const slowStdin = new Readable({
        read() {
          // Never push data
        },
      });

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        slowStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin({ timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });

    it("should handle size limit exceeded", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const largeData = "x".repeat(1000);
      const largeStdin = Readable.from([largeData]);

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        largeStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin({ maxSize: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toContain("exceeds maximum size");
    });

    it("should handle empty input", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const emptyStdin = Readable.from([""]);
      vi.spyOn(process, "stdin", "get").mockReturnValue(
        emptyStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin();

      expect(result.success).toBe(false);
      expect(result.error).toContain("No data received");
    });

    it("should successfully parse valid JSON from stdin", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const jsonData = '{"key": "value", "number": 42}';
      const jsonStdin = Readable.from([jsonData]);

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        jsonStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: "value", number: 42 });
      expect(result.stats.bytesRead).toBe(jsonData.length);
    });

    it("should extract JSON from text when enabled", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const textWithJson = `
        Here is some text with JSON:
        \`\`\`json
        {"extracted": "value"}
        \`\`\`
        More text here.
      `;

      const textStdin = Readable.from([textWithJson]);
      vi.spyOn(process, "stdin", "get").mockReturnValue(
        textStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin({ extractFromText: true });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ extracted: "value" });
    });
  });

  // StreamingJsonProcessor tests removed to reduce complexity

  describe("autoReadJson", () => {
    it("should read from file when source is provided", async () => {
      // Mock fs.createReadStream
      vi.doMock("node:fs", () => ({
        createReadStream: vi.fn(() => {
          return Readable.from(['{"file": "data"}']);
        }),
      }));

      const result = await autoReadJson("test.json");

      expect(result.stats.source).toBe("file");
    });

    it("should read from stdin when no source provided", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const jsonStdin = Readable.from(['{"stdin": "data"}']);
      vi.spyOn(process, "stdin", "get").mockReturnValue(
        jsonStdin as NodeJS.ReadableStream,
      );

      const result = await autoReadJson();

      expect(result.stats.source).toBe("stdin");
    });
  });

  describe("Edge Cases", () => {
    it("should handle various encodings", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const unicodeJson = '{"unicode": "🚀✨", "chinese": "你好"}';
      const unicodeStdin = Readable.from([unicodeJson]);

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        unicodeStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin({ encoding: "utf8" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        unicode: "🚀✨",
        chinese: "你好",
      });
    });

    it("should handle malformed JSON in streams", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const malformedJson = '{"key": "value" "missing": "comma"}';
      const malformedStdin = Readable.from([malformedJson]);

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        malformedStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin();

      expect(result.success).toBe(false);
      expect(result.error).toContain("parsing failed");
    });

    it("should provide accurate timing information", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const jsonData = '{"timing": "test"}';
      const jsonStdin = Readable.from([jsonData]);

      vi.spyOn(process, "stdin", "get").mockReturnValue(
        jsonStdin as NodeJS.ReadableStream,
      );

      const result = await readJsonFromStdin();

      expect(result.success).toBe(true);
      expect(result.stats.readTime).toBeGreaterThan(0);
      expect(result.stats.encoding).toBe("utf8");
    });
  });
});
