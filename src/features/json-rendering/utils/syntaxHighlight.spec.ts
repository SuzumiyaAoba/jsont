/**
 * Comprehensive tests for syntax highlighting utilities
 * Consolidated from multiple test files for better maintainability
 */

import { describe, expect, it } from "vitest";
import {
  applySearchHighlighting,
  DEFAULT_COLOR_SCHEME,
  getJsonValueColor,
  isKeyValueLine,
  isSchemaKeywordLine,
  isStructuralLine,
  parseKeyValueLine,
  tokenizeLine,
} from "./syntaxHighlight";

describe("syntaxHighlight", () => {
  describe("getJsonValueColor", () => {
    describe("basic value types", () => {
      it("should return correct colors for structural values", () => {
        expect(getJsonValueColor("{", DEFAULT_COLOR_SCHEME)).toBe("magenta");
        expect(getJsonValueColor("[", DEFAULT_COLOR_SCHEME)).toBe("cyan");
      });

      it("should return correct colors for data types", () => {
        expect(getJsonValueColor('"hello"', DEFAULT_COLOR_SCHEME)).toBe(
          "green",
        );
        expect(getJsonValueColor("true", DEFAULT_COLOR_SCHEME)).toBe("yellow");
        expect(getJsonValueColor("false", DEFAULT_COLOR_SCHEME)).toBe("yellow");
        expect(getJsonValueColor("null", DEFAULT_COLOR_SCHEME)).toBe("gray");
        expect(getJsonValueColor("123", DEFAULT_COLOR_SCHEME)).toBe("cyan");
        expect(getJsonValueColor("45.67", DEFAULT_COLOR_SCHEME)).toBe("cyan");
        expect(getJsonValueColor("other", DEFAULT_COLOR_SCHEME)).toBe("white");
      });

      it("should handle values with trailing commas", () => {
        expect(getJsonValueColor('"hello",', DEFAULT_COLOR_SCHEME)).toBe(
          "green",
        );
        expect(getJsonValueColor("true,", DEFAULT_COLOR_SCHEME)).toBe("yellow");
        expect(getJsonValueColor("123,", DEFAULT_COLOR_SCHEME)).toBe("cyan");
      });
    });

    describe("numeric values", () => {
      it("should handle negative numbers", () => {
        expect(getJsonValueColor("-123")).toBe(
          DEFAULT_COLOR_SCHEME.numberValue,
        );
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
        expect(getJsonValueColor("0.000")).toBe(
          DEFAULT_COLOR_SCHEME.numberValue,
        );
      });

      it("should reject invalid numeric formats", () => {
        // These are invalid per JSON RFC 8259
        expect(getJsonValueColor("123.")).toBe(DEFAULT_COLOR_SCHEME.default);
        expect(getJsonValueColor(".123")).toBe(DEFAULT_COLOR_SCHEME.default);
      });

      it("should reject invalid numbers", () => {
        expect(getJsonValueColor("123abc")).toBe(DEFAULT_COLOR_SCHEME.default);
        expect(getJsonValueColor("12.34.56")).toBe(
          DEFAULT_COLOR_SCHEME.default,
        );
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
  });

  describe("isKeyValueLine", () => {
    it("should correctly identify key-value lines", () => {
      expect(isKeyValueLine('"name": "John"')).toBe(true);
      expect(isKeyValueLine('"age": 30')).toBe(true);
      expect(isKeyValueLine('"valid": true')).toBe(true);
    });

    it("should handle keys containing colons", () => {
      expect(isKeyValueLine('"url:endpoint": "https://api.example.com"')).toBe(
        true,
      );
      expect(isKeyValueLine('"time:stamp": "2023-01-01T00:00:00"')).toBe(true);
      expect(isKeyValueLine('"config:server:port": 8080')).toBe(true);
    });

    it("should handle escaped quotes in keys", () => {
      expect(isKeyValueLine('"key\\"with\\"quotes": "value"')).toBe(true);
      expect(isKeyValueLine('"path\\\\to\\\\file": "/usr/bin"')).toBe(true);
    });

    it("should reject structural lines", () => {
      expect(isKeyValueLine("{")).toBe(false);
      expect(isKeyValueLine("}")).toBe(false);
      expect(isKeyValueLine("[")).toBe(false);
      expect(isKeyValueLine("]")).toBe(false);
      expect(isKeyValueLine("},")).toBe(false);
      expect(isKeyValueLine("],")).toBe(false);
    });

    it("should reject array values", () => {
      expect(isKeyValueLine('"string value"')).toBe(false);
      expect(isKeyValueLine("123")).toBe(false);
      expect(isKeyValueLine("true")).toBe(false);
      expect(isKeyValueLine("null")).toBe(false);
    });

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

  describe("isStructuralLine", () => {
    it("should identify structural characters", () => {
      expect(isStructuralLine("{")).toBe(true);
      expect(isStructuralLine("}")).toBe(true);
      expect(isStructuralLine("[")).toBe(true);
      expect(isStructuralLine("]")).toBe(true);
      expect(isStructuralLine("},")).toBe(true);
      expect(isStructuralLine("],")).toBe(true);
    });

    it("should not identify content lines as structural", () => {
      expect(isStructuralLine('"key": "value"')).toBe(false);
      expect(isStructuralLine("123")).toBe(false);
      expect(isStructuralLine("true")).toBe(false);
    });
  });

  describe("isSchemaKeywordLine", () => {
    it("should identify schema keyword lines", () => {
      expect(isSchemaKeywordLine('"$schema": "http://json-schema.org"')).toBe(
        true,
      );
      expect(isSchemaKeywordLine('"title": "Schema Title"')).toBe(true);
      expect(isSchemaKeywordLine('"description": "Schema Description"')).toBe(
        true,
      );
      expect(isSchemaKeywordLine('"type": "object"')).toBe(true);
    });

    it("should not identify regular property lines as schema keywords", () => {
      expect(isSchemaKeywordLine('"name": "John"')).toBe(false);
      expect(isSchemaKeywordLine('"value": 123')).toBe(false);
    });
  });

  describe("parseKeyValueLine", () => {
    it("should parse simple key-value pairs", () => {
      const result = parseKeyValueLine('"name": "John"');
      expect(result.beforeColon).toBe('"name"');
      expect(result.afterColon).toBe(': "John"');
      expect(result.value).toBe('"John"');
      expect(result.isStructuralValue).toBe(false);
    });

    it("should parse keys containing colons", () => {
      const result = parseKeyValueLine(
        '"url:endpoint": "https://api.example.com"',
      );
      expect(result.beforeColon).toBe('"url:endpoint"');
      expect(result.afterColon).toBe(': "https://api.example.com"');
      expect(result.value).toBe('"https://api.example.com"');
      expect(result.isStructuralValue).toBe(false);
    });

    it("should parse complex keys with multiple colons", () => {
      const result = parseKeyValueLine('"config:server:port": 8080');
      expect(result.beforeColon).toBe('"config:server:port"');
      expect(result.afterColon).toBe(": 8080");
      expect(result.value).toBe("8080");
      expect(result.isStructuralValue).toBe(false);
    });

    it("should handle escaped quotes in keys", () => {
      const result = parseKeyValueLine('"key\\"with\\"quotes": "value"');
      expect(result.beforeColon).toBe('"key\\"with\\"quotes"');
      expect(result.afterColon).toBe(': "value"');
      expect(result.value).toBe('"value"');
      expect(result.isStructuralValue).toBe(false);
    });

    it("should identify structural values", () => {
      const result1 = parseKeyValueLine('"object": {');
      expect(result1.isStructuralValue).toBe(true);
      expect(result1.value).toBe("{");

      const result2 = parseKeyValueLine('"array": [');
      expect(result2.isStructuralValue).toBe(true);
      expect(result2.value).toBe("[");
    });

    it("should handle values containing colons", () => {
      const result = parseKeyValueLine('"timestamp": "2023-01-01T10:30:45Z"');
      expect(result.beforeColon).toBe('"timestamp"');
      expect(result.value).toBe('"2023-01-01T10:30:45Z"');
    });

    it("should handle lines with trailing commas", () => {
      const result = parseKeyValueLine('"name": "John",');
      expect(result.beforeColon).toBe('"name"');
      expect(result.value).toBe('"John"');
    });

    it("should handle whitespace around colons", () => {
      const result1 = parseKeyValueLine('"key"  :  "value"');
      expect(result1.beforeColon).toBe('"key"  ');
      expect(result1.value).toBe('"value"');

      const result2 = parseKeyValueLine('"key":"value"');
      expect(result2.beforeColon).toBe('"key"');
      expect(result2.value).toBe('"value"');
    });

    it("should handle keys with spaces", () => {
      const result = parseKeyValueLine('"key with spaces": "value"');
      expect(result.beforeColon).toBe('"key with spaces"');
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

  describe("tokenizeLine", () => {
    it("should tokenize simple key-value lines", () => {
      const tokens = tokenizeLine('"name": "John"');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"name"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: '"John"',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
    });

    it("should tokenize keys containing colons", () => {
      const tokens = tokenizeLine('"url:endpoint": "https://api.example.com"');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"url:endpoint"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: '"https://api.example.com"',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
    });

    it("should tokenize complex keys with multiple colons", () => {
      const tokens = tokenizeLine('"config:server:port": 8080');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"config:server:port"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: "8080",
        color: DEFAULT_COLOR_SCHEME.numberValue,
      });
    });

    it("should handle structural values", () => {
      const tokens = tokenizeLine('"object": {');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"object"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: "{",
        color: DEFAULT_COLOR_SCHEME.structuralObject,
      });
    });

    it("should handle lines with trailing commas", () => {
      const tokens = tokenizeLine('"name": "John",');
      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toEqual({
        text: '"name"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: '"John"',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
      expect(tokens[3]).toEqual({
        text: ",",
        color: DEFAULT_COLOR_SCHEME.default,
      });
    });

    it("should handle structural lines", () => {
      const tokens1 = tokenizeLine("{");
      expect(tokens1).toHaveLength(1);
      expect(tokens1[0]).toEqual({
        text: "{",
        color: DEFAULT_COLOR_SCHEME.structuralObject,
      });

      const tokens2 = tokenizeLine("[");
      expect(tokens2).toHaveLength(1);
      expect(tokens2[0]).toEqual({
        text: "[",
        color: DEFAULT_COLOR_SCHEME.structuralArray,
      });
    });

    it("should handle array values", () => {
      const tokens = tokenizeLine('  "array value"');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({
        text: "  ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[1]).toEqual({
        text: '"array value"',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
    });

    it("should handle empty lines", () => {
      const tokens = tokenizeLine("");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        text: "",
        color: DEFAULT_COLOR_SCHEME.default,
      });
    });

    it("should handle values with colons", () => {
      const tokens = tokenizeLine('"timestamp": "2023-01-01T10:30:45Z"');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({
        text: '"timestamp"',
        color: DEFAULT_COLOR_SCHEME.key,
      });
      expect(tokens[1]).toEqual({
        text: ": ",
        color: DEFAULT_COLOR_SCHEME.default,
      });
      expect(tokens[2]).toEqual({
        text: '"2023-01-01T10:30:45Z"',
        color: DEFAULT_COLOR_SCHEME.stringValue,
      });
    });

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

  describe("applySearchHighlighting", () => {
    it("should apply search highlighting to tokens", () => {
      const tokens = [
        { text: "Hello ", color: "white" },
        { text: "World", color: "white" },
      ];
      const result = applySearchHighlighting(tokens, "World");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ text: "Hello ", color: "white" });
      expect(result[1]).toEqual({
        text: "World",
        color: "black",
        isMatch: true,
      });
    });

    it("should handle multiple matches", () => {
      const tokens = [{ text: "test test test", color: "white" }];
      const result = applySearchHighlighting(tokens, "test");
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        text: "test",
        color: "black",
        isMatch: true,
      });
      expect(result[1]).toEqual({ text: " ", color: "white" });
      expect(result[2]).toEqual({
        text: "test",
        color: "black",
        isMatch: true,
      });
      expect(result[3]).toEqual({ text: " ", color: "white" });
      expect(result[4]).toEqual({
        text: "test",
        color: "black",
        isMatch: true,
      });
    });

    it("should be case insensitive", () => {
      const tokens = [{ text: "Hello World", color: "white" }];
      const result = applySearchHighlighting(tokens, "world");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ text: "Hello ", color: "white" });
      expect(result[1]).toEqual({
        text: "World",
        color: "black",
        isMatch: true,
      });
    });

    it("should return original tokens when no matches", () => {
      const tokens = [{ text: "Hello World", color: "white" }];
      const result = applySearchHighlighting(tokens, "xyz");
      expect(result).toEqual(tokens);
    });

    it("should return original tokens for empty search term", () => {
      const tokens = [{ text: "Hello World", color: "white" }];
      const result = applySearchHighlighting(tokens, "");
      expect(result).toEqual(tokens);
    });

    it("should handle current result highlighting", () => {
      const tokens = [{ text: "Hello World", color: "white" }];
      const result = applySearchHighlighting(tokens, "World", true);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        text: "World",
        color: "white",
        isMatch: true,
      });
    });
  });
});
