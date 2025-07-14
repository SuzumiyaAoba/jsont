/**
 * Tests for syntax highlighting utilities
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_SCHEME,
  isKeyValueLine,
  parseKeyValueLine,
  tokenizeLine,
} from "./syntaxHighlight";

describe("syntaxHighlight", () => {
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
  });
});
