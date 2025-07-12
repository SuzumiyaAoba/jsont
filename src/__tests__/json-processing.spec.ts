/**
 * JSON Processing Tests (TDD)
 * T2.1: JSON基本処理とパース機能
 */

import {
  parseJsonSafely,
  parseJsonWithValidation,
  validateJsonStructure,
} from "@features/json-rendering/utils/jsonProcessor";
import { describe, expect, it } from "vitest";

describe("JSON Processing - Enhanced Parser", () => {
  describe("parseJsonSafely", () => {
    it("should parse valid JSON", () => {
      const input = '{"key": "value", "number": 42}';
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: "value", number: 42 });
      expect(result.error).toBeNull();
    });

    it("should parse JSON5 with comments", () => {
      const input = `{
        "key": "value", // inline comment
        /* block comment */
        "number": 42,
      }`;
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: "value", number: 42 });
    });

    it("should parse JSON5 with trailing commas", () => {
      const input = `{
        "array": [1, 2, 3,],
        "object": {
          "nested": "value",
        },
      }`;
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        array: [1, 2, 3],
        object: { nested: "value" },
      });
    });

    it("should parse JSON5 with unquoted keys", () => {
      const input = `{
        unquoted: "value",
        $special: 123,
        _underscore: true
      }`;
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        unquoted: "value",
        $special: 123,
        _underscore: true,
      });
    });

    it("should handle invalid JSON gracefully", () => {
      const input = "{invalid json syntax}";
      const result = parseJsonSafely(input);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain("parsing failed");
    });

    it("should handle empty input", () => {
      const result = parseJsonSafely("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should handle whitespace-only input", () => {
      const result = parseJsonSafely("   \n  \t  ");

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should provide detailed error information", () => {
      const input = `{
        "key": "value"
        "missing": "comma"
      }`;
      const result = parseJsonSafely(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.parseTime).toBeGreaterThan(0);
    });
  });

  describe("parseJsonWithValidation", () => {
    it("should parse and validate simple object", () => {
      const input = '{"name": "test", "count": 5}';
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.stats).toBeDefined();
      expect(result.validation.stats?.size).toBeGreaterThan(0);
      expect(result.validation.stats?.depth).toBe(1);
    });

    it("should validate nested object depth", () => {
      const input = `{
        "level1": {
          "level2": {
            "level3": {
              "value": "deep"
            }
          }
        }
      }`;
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation.stats?.depth).toBe(4);
    });

    it("should detect excessive depth potential", () => {
      // Create deeply nested object with 20 levels
      let nested: unknown = "deep";
      for (let i = 0; i < 20; i++) {
        nested = { [`level${i}`]: nested };
      }
      const input = JSON.stringify(nested);
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toBeDefined();
      expect(result.validation.warnings).toContain("excessive-depth");
    });

    it("should validate large data size", () => {
      const largeArray = Array(10000)
        .fill(0)
        .map((_, i) => ({ id: i, value: `item-${i}`.repeat(20) }));
      const input = JSON.stringify(largeArray);
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation.stats?.size).toBeGreaterThan(1024 * 1024);
      if (result.validation.warnings) {
        expect(result.validation.warnings).toContain("large-size");
      }
    });
  });

  describe("validateJsonStructure", () => {
    it("should validate basic JSON types", () => {
      const data = {
        string: "text",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { key: "value" },
      };

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats?.types["string"]).toBe(2); // "text" and "value"
      expect(result.stats?.types["number"]).toBe(4); // 42, 1, 2, 3
      expect(result.stats?.types["boolean"]).toBe(1);
      expect(result.stats?.types["null"]).toBe(1);
    });

    it("should calculate correct depth for nested structures", () => {
      const data = {
        a: {
          b: {
            c: {
              d: "deep",
            },
          },
        },
      };

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats?.depth).toBe(4);
    });

    it("should count total keys correctly", () => {
      const data = {
        user: {
          name: "John",
          profile: {
            age: 30,
            email: "john@example.com",
          },
        },
        settings: {
          theme: "dark",
        },
      };

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats?.keys).toEqual([
        "age",
        "email",
        "name",
        "profile",
        "settings",
        "theme",
        "user",
      ]);
    });

    it("should detect potentially problematic structures", () => {
      const veryDeepData = Array(20)
        .fill(0)
        .reduce((acc, _, i) => ({ [`level${i}`]: acc }), { value: "deep" });

      const result = validateJsonStructure(veryDeepData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("excessive-depth");
    });

    it("should handle invalid data gracefully", () => {
      const circularRef: Record<string, unknown> = { a: 1 };
      circularRef["self"] = circularRef;

      const result = validateJsonStructure(
        circularRef as import("@core/types/index.js").JsonValue,
      );

      expect(result.isValid).toBe(false);
      expect(result.error?.toLowerCase()).toMatch(/circular|call stack/);
    });
  });
});

describe("JSON Processing - Error Handling", () => {
  it("should handle malformed JSON with detailed errors", () => {
    const testCases = [
      { input: '{"unclosed": "string', expectedError: "end of input" },
      { input: '{"missing": value}', expectedError: "invalid character" },
    ];

    testCases.forEach(({ input, expectedError }) => {
      const result = parseJsonSafely(input);
      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain(
        expectedError.toLowerCase(),
      );
    });
  });

  it("should provide helpful suggestions for common mistakes", () => {
    const input = '{"key": unquoted_value}'; // unquoted value that's not a valid identifier
    const result = parseJsonSafely(input);

    expect(result.success).toBe(false);
    expect(result.suggestion).toBeDefined();
    expect(result.suggestion).toContain("quote");
  });

  it("should handle extremely large inputs", () => {
    const largeInput = JSON.stringify(
      Array(100000)
        .fill(0)
        .map((_, i) => ({ id: i })),
    );

    const result = parseJsonSafely(largeInput);

    expect(result.success).toBe(true);
    expect(result.parseTime).toBeDefined();
  });

  it("should handle non-UTF8 characters", () => {
    const input = '{"emoji": "🚀", "unicode": "\\u2603"}';
    const result = parseJsonSafely(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ emoji: "🚀", unicode: "☃" });
  });
});
