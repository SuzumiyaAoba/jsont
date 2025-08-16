/**
 * Comprehensive tests for JSON processor utilities
 *
 * Tests JSON/JSON5 parsing, validation, formatting, statistics calculation,
 * format detection, repair functionality, and edge cases.
 */

// JsonValue type imported but not used directly in tests
import { describe, expect, it } from "vitest";
import {
  detectJsonFormat,
  extractJsonFromText,
  formatJsonValue,
  parseJsonSafely,
  parseJsonWithValidation,
  repairJsonString,
  validateJsonStructure,
} from "./jsonProcessor";

describe("JSON Processor", () => {
  describe("parseJsonSafely", () => {
    it("should parse valid JSON successfully", () => {
      const input = '{"name": "John", "age": 30}';
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John", age: 30 });
      expect(result.error).toBeNull();
      expect(result.parseTime).toBeGreaterThan(0);
    });

    it("should parse valid JSON5 successfully", () => {
      const input = `{
        name: 'John', // comment
        age: 30,
      }`;
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John", age: 30 });
      expect(result.error).toBeNull();
    });

    it("should handle empty input", () => {
      const result = parseJsonSafely("");

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe("Input is empty or contains only whitespace");
      expect(result.suggestion).toBe("Please provide valid JSON data");
    });

    it("should handle whitespace-only input", () => {
      const result = parseJsonSafely("   \n\t   ");

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe("Input is empty or contains only whitespace");
    });

    it("should parse JSON5 with single quotes successfully", () => {
      const input = "{'name': 'John'}";
      const result = parseJsonSafely(input);

      // JSON5 can handle single quotes, so this should succeed
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John" });
    });

    it("should provide helpful error suggestions for truly invalid JSON", () => {
      const input = "{name: John}"; // Unquoted string value
      const result = parseJsonSafely(input);

      expect(result.success).toBe(false);
      expect(result.suggestion).toContain(
        "missing commas, brackets, or quotes",
      );
    });

    it("should handle unterminated strings", () => {
      const input = '{"name": "John';
      const result = parseJsonSafely(input);

      expect(result.success).toBe(false);
      expect(result.suggestion).toContain("Check for unclosed strings");
    });

    it("should parse JSON5 with trailing commas successfully", () => {
      const input = '{"name": "John",}';
      const result = parseJsonSafely(input);

      // JSON5 can handle trailing commas, so this should succeed
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "John" });
    });

    it("should handle complex nested structures", () => {
      const input = JSON.stringify({
        users: [
          { id: 1, profile: { name: "John", settings: { theme: "dark" } } },
          { id: 2, profile: { name: "Jane", settings: { theme: "light" } } },
        ],
        metadata: { total: 2, version: "1.0" },
      });

      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("users");
      expect(result.data).toHaveProperty("metadata");
    });

    it("should measure parse time accurately", () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i })),
      };
      const input = JSON.stringify(largeObject);

      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.parseTime).toBeGreaterThan(0);
      expect(result.parseTime).toBeLessThan(1000); // Should be fast
    });
  });

  describe("parseJsonWithValidation", () => {
    it("should parse and validate successfully", () => {
      const input = '{"name": "John", "age": 30}';
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.warnings).toEqual([]);
    });

    it("should return validation errors for parse failures", () => {
      const input = "invalid json";
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(false);
      expect(result.validation?.isValid).toBe(false);
      expect(result.validation?.error).toContain("JSON parsing failed");
    });

    it("should detect warnings for large structures", () => {
      const largeObject = {
        data: Array.from({ length: 2000 }, (_, i) => ({
          [`key${i}`]: `value${i}`,
        })),
      };
      const input = JSON.stringify(largeObject);

      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation?.warnings).toContain("many-keys");
    });

    it("should detect warnings for deep nesting", () => {
      const deepObject: any = {};
      let current = deepObject;

      // Create deeply nested object
      for (let i = 0; i < 20; i++) {
        current.nested = {};
        current = current.nested;
      }

      const input = JSON.stringify(deepObject);
      const result = parseJsonWithValidation(input);

      expect(result.success).toBe(true);
      expect(result.validation?.warnings).toContain("excessive-depth");
    });
  });

  describe("validateJsonStructure", () => {
    it("should validate simple objects", () => {
      const data = { name: "John", age: 30 };
      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.keys).toContain("name");
      expect(result.stats?.keys).toContain("age");
    });

    it("should detect circular references", () => {
      const data: any = { name: "John" };
      data.self = data; // Create circular reference

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("stack"); // Either "circular" or "call stack"
    });

    it("should calculate accurate statistics", () => {
      const data = {
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: "value" },
      };

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.types["string"]).toBeGreaterThan(0);
      expect(result.stats?.types["number"]).toBeGreaterThan(0);
      expect(result.stats?.types["boolean"]).toBeGreaterThan(0);
      expect(result.stats?.types["null"]).toBeGreaterThan(0);
      expect(result.stats?.types["array"]).toBeGreaterThan(0);
      expect(result.stats?.types["object"]).toBeGreaterThan(0);
    });

    it("should warn about large data size", () => {
      // Create large string to exceed size limit
      const largeString = "a".repeat(2 * 1024 * 1024); // 2MB
      const data = { content: largeString };

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("large-size");
    });

    it("should handle arrays correctly in statistics", () => {
      const data = [
        { id: 1, name: "first" },
        { id: 2, name: "second" },
        { id: 3, name: "third" },
      ];

      const result = validateJsonStructure(data);

      expect(result.isValid).toBe(true);
      expect(result.stats?.keys).toContain("id");
      expect(result.stats?.keys).toContain("name");
      expect(result.stats?.types["array"]).toBeGreaterThan(0);
      expect(result.stats?.types["object"]).toBeGreaterThan(0);
    });

    it("should handle null and primitive values", () => {
      const result = validateJsonStructure(null);

      expect(result.isValid).toBe(true);
      expect(result.stats?.types["null"]).toBe(1);
    });
  });

  describe("formatJsonValue", () => {
    it("should format primitive values correctly", () => {
      expect(formatJsonValue(null)).toBe("null");
      expect(formatJsonValue("test")).toBe('"test"');
      expect(formatJsonValue(42)).toBe("42");
      expect(formatJsonValue(true)).toBe("true");
      expect(formatJsonValue(false)).toBe("false");
    });

    it("should format arrays with summary by default", () => {
      const array = [1, 2, 3, 4, 5];
      const result = formatJsonValue(array);

      expect(result).toBe("[5 items]");
    });

    it("should format objects with summary by default", () => {
      const object = { a: 1, b: 2, c: 3 };
      const result = formatJsonValue(object);

      expect(result).toBe("{3 keys}");
    });

    it("should format full JSON when summary is disabled", () => {
      const object = { name: "John", age: 30 };
      const result = formatJsonValue(object, { summary: false });

      expect(result).toBe('{"name":"John","age":30}');
    });

    it("should format pretty JSON when requested", () => {
      const object = { name: "John", age: 30 };
      const result = formatJsonValue(object, { pretty: true, summary: false });

      expect(result).toContain("\n"); // Actual newline, not escaped
      expect(result).toContain("  ");
    });

    it("should truncate long values", () => {
      const longString = "a".repeat(2000);
      const object = { content: longString };
      const result = formatJsonValue(object, {
        summary: false,
        maxLength: 100,
      });

      expect(result).toContain("... [truncated]");
      expect(result.length).toBeLessThan(200);
    });

    it("should handle circular references gracefully", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      const result = formatJsonValue(circular, { summary: false });

      expect(result).toBe("[Circular Reference]");
    });

    it("should respect custom indent settings", () => {
      const object = { name: "John", age: 30 };
      const result = formatJsonValue(object, {
        pretty: true,
        summary: false,
        indent: 4,
      });

      expect(result).toContain("    "); // 4-space indent
    });
  });

  describe("detectJsonFormat", () => {
    it("should detect valid JSON", () => {
      const input = '{"name": "John", "age": 30}';
      const result = detectJsonFormat(input);

      expect(result).toBe("json");
    });

    it("should detect JSON5 with comments", () => {
      const input = `{
        // This is a comment
        name: "John"
      }`;
      const result = detectJsonFormat(input);

      expect(result).toBe("json5");
    });

    it("should detect JSON5 with unquoted keys", () => {
      const input = "{name: 'John', age: 30}";
      const result = detectJsonFormat(input);

      expect(result).toBe("json5");
    });

    it("should detect JSON5 with trailing commas", () => {
      const input = '{"name": "John", "age": 30,}';
      const result = detectJsonFormat(input);

      expect(result).toBe("json5");
    });

    it("should detect invalid JSON", () => {
      const input = "{name: John}";
      const result = detectJsonFormat(input);

      expect(result).toBe("invalid");
    });

    it("should handle edge cases", () => {
      expect(detectJsonFormat("")).toBe("invalid");
      expect(detectJsonFormat("null")).toBe("json");
      expect(detectJsonFormat("true")).toBe("json");
      expect(detectJsonFormat("42")).toBe("json");
      expect(detectJsonFormat('"string"')).toBe("json");
    });

    it("should detect JSON5 block comments", () => {
      const input = `{
        /* Block comment */
        "name": "John"
      }`;
      const result = detectJsonFormat(input);

      expect(result).toBe("json5");
    });
  });

  describe("repairJsonString", () => {
    it("should fix single quotes", () => {
      const input = "{'name': 'John'}";
      const result = repairJsonString(input);

      expect(result).toBe('{"name": "John"}');
    });

    it("should add quotes to unquoted keys", () => {
      const input = "{name: 'John', age: 30}";
      const result = repairJsonString(input);

      expect(result).toBe('{"name": "John", "age": 30}');
    });

    it("should remove trailing commas", () => {
      const input = '{"name": "John", "age": 30,}';
      const result = repairJsonString(input);

      expect(result).toBe('{"name": "John", "age": 30}');
    });

    it("should handle complex repairs", () => {
      const input = `{
        name: 'John',
        age: 30,
        active: true,
      }`;
      const result = repairJsonString(input);

      expect(result).toBe(`{
        "name": "John",
        "age": 30,
        "active": true
      }`);
    });

    it("should trim whitespace", () => {
      const input = "  {'name': 'John'}  ";
      const result = repairJsonString(input);

      expect(result).toBe('{"name": "John"}');
    });

    it("should handle nested objects and arrays", () => {
      const input =
        "{items: [{id: 1, name: 'first',}, {id: 2, name: 'second',}]}";
      const result = repairJsonString(input);

      expect(result).toBe(
        '{"items": [{"id": 1, "name": "first"}, {"id": 2, "name": "second"}]}',
      );
    });
  });

  describe("extractJsonFromText", () => {
    it("should extract JSON from code blocks", () => {
      const text = `
        Here's some JSON:
        \`\`\`json
        {"name": "John", "age": 30}
        \`\`\`
        And some more text.
      `;

      const result = extractJsonFromText(text);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContain('{"name": "John", "age": 30}');
    });

    it("should extract JSON5 from code blocks", () => {
      const text = `
        \`\`\`json5
        {
          name: 'John', // comment
          age: 30,
        }
        \`\`\`
      `;

      const result = extractJsonFromText(text);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((block) => block.includes("name: 'John'"))).toBe(true);
    });

    it("should extract standalone JSON objects", () => {
      const text = `
        Some text {"name": "John"} more text
        Another object {"age": 30} here
      `;

      const result = extractJsonFromText(text);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('{"name": "John"}');
      expect(result).toContain('{"age": 30}');
    });

    it("should extract arrays", () => {
      const text = "Here is an array: [1, 2, 3] and some text.";

      const result = extractJsonFromText(text);

      expect(result).toContain("[1, 2, 3]");
    });

    it("should handle multiple code blocks", () => {
      const text = `
        \`\`\`json
        {"first": "object"}
        \`\`\`
        
        Some text in between.
        
        \`\`\`json
        {"second": "object"}
        \`\`\`
      `;

      const result = extractJsonFromText(text);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result).toContain('{"first": "object"}');
      expect(result).toContain('{"second": "object"}');
    });

    it("should ignore invalid JSON candidates", () => {
      const text = "This looks like JSON {but it's not valid} here.";

      const result = extractJsonFromText(text);

      // Should not include invalid JSON
      expect(result).not.toContain("{but it's not valid}");
    });

    it("should handle empty input", () => {
      const result = extractJsonFromText("");

      expect(result).toEqual([]);
    });

    it("should handle text with no JSON", () => {
      const text = "This is just regular text with no JSON content.";

      const result = extractJsonFromText(text);

      expect(result).toEqual([]);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle very large JSON objects efficiently", () => {
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          active: i % 2 === 0,
        })),
      };

      const input = JSON.stringify(largeObject);
      const startTime = performance.now();
      const result = parseJsonSafely(input);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should be reasonably fast
    });

    it("should handle deeply nested structures", () => {
      const deepObject: any = { level: 0 };
      let current = deepObject;

      for (let i = 1; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      const input = JSON.stringify(deepObject);
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
    });

    it("should handle Unicode and special characters", () => {
      const data = {
        unicode: "👋 Hello 世界",
        emoji: "🎉🔥💯",
        special: '\\n\\t\\r\\"',
        accents: "café naïve résumé",
      };

      const input = JSON.stringify(data);
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("should handle numeric edge cases", () => {
      const data = {
        zero: 0,
        negative: -42,
        float: 3.14159,
        scientific: 1.23e-10,
        infinity: "Infinity", // JSON doesn't support Infinity directly
        large: Number.MAX_SAFE_INTEGER,
      };

      const input = JSON.stringify(data);
      const result = parseJsonSafely(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("should measure statistics accurately for complex structures", () => {
      const complexData = {
        metadata: {
          version: "1.0",
          created: "2023-01-01",
          tags: ["important", "test", "data"],
        },
        users: [
          {
            id: 1,
            profile: {
              name: "John Doe",
              email: "john@example.com",
              preferences: {
                theme: "dark",
                notifications: true,
                language: "en",
              },
            },
            posts: [
              { id: 101, title: "First Post", published: true },
              { id: 102, title: "Second Post", published: false },
            ],
          },
        ],
        settings: {
          maxUsers: 1000,
          allowRegistration: true,
          features: {
            comments: true,
            likes: true,
            sharing: false,
          },
        },
      };

      const validation = validateJsonStructure(complexData);

      expect(validation.isValid).toBe(true);
      expect(validation.stats?.depth).toBeGreaterThan(3);
      expect(validation.stats?.keys.length).toBeGreaterThan(10);
      expect(validation.stats?.types["object"]).toBeGreaterThan(5);
      expect(validation.stats?.types["array"]).toBeGreaterThan(0);
      expect(validation.stats?.types["string"]).toBeGreaterThan(5);
      expect(validation.stats?.types["number"]).toBeGreaterThan(0);
      expect(validation.stats?.types["boolean"]).toBeGreaterThan(0);
    });
  });
});
