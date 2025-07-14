/**
 * Edge case tests for syntax highlighting utilities
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_SCHEME,
  getJsonValueColor,
  isKeyValueLine,
  parseKeyValueLine,
  tokenizeLine,
} from "./syntaxHighlight";

describe("syntaxHighlight edge cases", () => {
  describe("getJsonValueColor - numeric values", () => {
    it("should handle negative numbers", () => {
      expect(getJsonValueColor("-123")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
      expect(getJsonValueColor("-123.456")).toBe(
        DEFAULT_COLOR_SCHEME.numberValue,
      );
      expect(getJsonValueColor("-0")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
    });

    it("should handle scientific notation", () => {
      expect(getJsonValueColor("1.23e-4")).toBe(
        DEFAULT_COLOR_SCHEME.numberValue,
      );
      expect(getJsonValueColor("1.23E+10")).toBe(
        DEFAULT_COLOR_SCHEME.numberValue,
      );
      expect(getJsonValueColor("1e5")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
      expect(getJsonValueColor("-1.5e-10")).toBe(
        DEFAULT_COLOR_SCHEME.numberValue,
      );
    });

    it("should handle zero values", () => {
      expect(getJsonValueColor("0")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
      expect(getJsonValueColor("0.0")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
      expect(getJsonValueColor("0.000")).toBe(DEFAULT_COLOR_SCHEME.numberValue);
    });

    it("should reject invalid numeric formats", () => {
      // These are invalid per JSON RFC 8259
      expect(getJsonValueColor("123.")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor(".123")).toBe(DEFAULT_COLOR_SCHEME.default);
    });

    it("should reject invalid numbers", () => {
      expect(getJsonValueColor("123abc")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("12.34.56")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("")).toBe(DEFAULT_COLOR_SCHEME.default);

      // Leading zeros are invalid in JSON (except for 0 itself)
      expect(getJsonValueColor("01")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("007")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("-01")).toBe(DEFAULT_COLOR_SCHEME.default);

      // Invalid exponent formats
      expect(getJsonValueColor("1e")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("1E")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("1e+")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("1e-")).toBe(DEFAULT_COLOR_SCHEME.default);

      // Multiple signs
      expect(getJsonValueColor("++123")).toBe(DEFAULT_COLOR_SCHEME.default);
      expect(getJsonValueColor("--123")).toBe(DEFAULT_COLOR_SCHEME.default);
    });
  });

  describe("complex key handling", () => {
    it("should handle keys with spaces", () => {
      const result = parseKeyValueLine('"key with spaces": "value"');
      expect(result.beforeColon).toBe('"key with spaces"');
      expect(result.value).toBe('"value"');
    });

    it("should handle keys with escaped quotes", () => {
      const result = parseKeyValueLine('"key\\"with\\"quotes": "value"');
      expect(result.beforeColon).toBe('"key\\"with\\"quotes"');
      expect(result.value).toBe('"value"');
    });

    it("should handle keys with backslashes", () => {
      const result = parseKeyValueLine('"path\\\\to\\\\file": "value"');
      expect(result.beforeColon).toBe('"path\\\\to\\\\file"');
      expect(result.value).toBe('"value"');
    });

    it("should handle keys with Unicode", () => {
      const result = parseKeyValueLine('"unicode_\\u0041": "value"');
      expect(result.beforeColon).toBe('"unicode_\\u0041"');
      expect(result.value).toBe('"value"');
    });

    it("should handle keys with special characters", () => {
      const result = parseKeyValueLine('"special@#$%^&*()": "value"');
      expect(result.beforeColon).toBe('"special@#$%^&*()"');
      expect(result.value).toBe('"value"');
    });
  });

  describe("complex value handling", () => {
    it("should handle empty strings", () => {
      const result = parseKeyValueLine('"key": ""');
      expect(result.value).toBe('""');
      expect(getJsonValueColor('""')).toBe(DEFAULT_COLOR_SCHEME.stringValue);
    });

    it("should handle JSON strings containing colons", () => {
      const result = parseKeyValueLine(
        '"config": "{\\"nested\\":\\"value\\"}"',
      );
      expect(result.beforeColon).toBe('"config"');
      expect(result.value).toBe('"{\\"nested\\":\\"value\\"}"');
    });

    it("should handle URLs in values", () => {
      const result = parseKeyValueLine(
        '"url": "https://example.com:8080/path"',
      );
      expect(result.beforeColon).toBe('"url"');
      expect(result.value).toBe('"https://example.com:8080/path"');
    });

    it("should handle values with escape sequences", () => {
      const result = parseKeyValueLine('"text": "line1\\nline2\\tindented"');
      expect(result.value).toBe('"line1\\nline2\\tindented"');
    });
  });

  describe("tokenizeLine edge cases", () => {
    it("should handle negative numbers", () => {
      const tokens = tokenizeLine('"count": -123');
      expect(tokens).toHaveLength(3);
      expect(tokens[2]).toEqual({
        text: "-123",
        color: DEFAULT_COLOR_SCHEME.numberValue,
      });
    });

    it("should handle scientific notation", () => {
      const tokens = tokenizeLine('"value": 1.23e-4');
      expect(tokens).toHaveLength(3);
      expect(tokens[2]).toEqual({
        text: "1.23e-4",
        color: DEFAULT_COLOR_SCHEME.numberValue,
      });
    });

    it("should handle complex keys", () => {
      const tokens = tokenizeLine('"key with spaces": "value"');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"key with spaces"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
    });

    it("should handle empty values", () => {
      const tokens = tokenizeLine('"empty": ""');
      expect(tokens).toHaveLength(3);
      expect(tokens[2]).toEqual({
        text: '""',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
    });

    it("should handle whitespace-only lines", () => {
      const tokens = tokenizeLine("   ");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        text: "   ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
    });
  });

  describe("isKeyValueLine edge cases", () => {
    it("should handle complex keys correctly", () => {
      expect(isKeyValueLine('"key with spaces": "value"')).toBe(true);
      expect(isKeyValueLine('"key\\"with\\"quotes": "value"')).toBe(true);
      expect(isKeyValueLine('"path\\\\to\\\\file": "value"')).toBe(true);
    });

    it("should handle malformed JSON gracefully", () => {
      expect(isKeyValueLine('"unclosed string: "value"')).toBe(false);
      expect(isKeyValueLine('"key": "unclosed string')).toBe(true); // Still has valid separator
    });

    it("should handle edge whitespace cases", () => {
      expect(isKeyValueLine('  "key"  :  "value"  ')).toBe(true);
      expect(isKeyValueLine('"key":"value"')).toBe(true);
    });
  });
});
