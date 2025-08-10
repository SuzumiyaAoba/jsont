/**
 * Tests for CsvConverter
 */

import { CsvConverter } from "./CsvConverter";

describe("CsvConverter", () => {
  let converter: CsvConverter;

  beforeEach(() => {
    converter = new CsvConverter();
  });

  describe("Properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("csv");
      expect(converter.extension).toBe(".csv");
      expect(converter.displayName).toBe("CSV");
    });
  });

  describe("validate", () => {
    it("should validate null data", () => {
      const result = converter.validate(null);
      expect(result.isOk()).toBe(true);
    });

    it("should validate undefined data", () => {
      const result = converter.validate(null as any);
      expect(result.isOk()).toBe(true);
    });

    it("should validate arrays", () => {
      const result = converter.validate([1, 2, 3]);
      expect(result.isOk()).toBe(true);
    });

    it("should validate empty arrays", () => {
      const result = converter.validate([]);
      expect(result.isOk()).toBe(true);
    });

    it("should validate objects", () => {
      const result = converter.validate({ name: "test", age: 30 });
      expect(result.isOk()).toBe(true);
    });

    it("should validate strings", () => {
      const result = converter.validate("test string");
      expect(result.isOk()).toBe(true);
    });

    it("should validate numbers", () => {
      const result = converter.validate(42);
      expect(result.isOk()).toBe(true);
    });

    it("should validate booleans", () => {
      const result = converter.validate(true);
      expect(result.isOk()).toBe(true);
    });

    it("should reject functions", () => {
      const result = converter.validate((() => {}) as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION_ERROR");
        expect(result.error.message).toBe(
          "Data type not suitable for CSV conversion",
        );
        expect(result.error.format).toBe("csv");
      }
    });

    it("should reject symbols", () => {
      const result = converter.validate(Symbol("test") as any);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getDefaultOptions", () => {
    it("should return correct default options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        delimiter: ",",
        includeHeaders: true,
        flattenArrays: true,
      });
    });
  });

  describe("convert - null/undefined data", () => {
    it("should handle null data", () => {
      const result = converter.convert(null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("");
      }
    });

    it("should handle undefined data", () => {
      const result = converter.convert(undefined as any);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("");
      }
    });
  });

  describe("convert - primitive values", () => {
    it("should convert string with headers", () => {
      const result = converter.convert("test value");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("value\ntest value");
      }
    });

    it("should convert string without headers", () => {
      const result = converter.convert("test value", { includeHeaders: false });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("test value");
      }
    });

    it("should convert number with headers", () => {
      const result = converter.convert(42);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("value\n42");
      }
    });

    it("should convert boolean with headers", () => {
      const result = converter.convert(true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("value\ntrue");
      }
    });

    it("should escape special characters in primitive values", () => {
      const result = converter.convert('value with "quotes" and, comma');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('value\n"value with ""quotes"" and, comma"');
      }
    });
  });

  describe("convert - arrays of primitives", () => {
    it("should convert simple array with headers", () => {
      const result = converter.convert([1, 2, 3]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("value\n1\n2\n3");
      }
    });

    it("should convert simple array without headers", () => {
      const result = converter.convert([1, 2, 3], { includeHeaders: false });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("1\n2\n3");
      }
    });

    it("should convert empty array", () => {
      const result = converter.convert([]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("");
      }
    });

    it("should handle array with special characters", () => {
      const result = converter.convert([
        'value with "quotes"',
        "value with, comma",
      ]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          'value\n"value with ""quotes"""\n"value with, comma"',
        );
      }
    });

    it("should convert mixed primitive types", () => {
      const result = converter.convert([1, "text", true, null]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("value\n1\ntext\ntrue\nnull");
      }
    });
  });

  describe("convert - arrays of objects", () => {
    it("should convert simple object array", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ];
      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("age,name\n30,Alice\n25,Bob");
      }
    });

    it("should convert object array without headers", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ];
      const result = converter.convert(data, { includeHeaders: false });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("30,Alice\n25,Bob");
      }
    });

    it("should handle objects with different keys", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", email: "bob@example.com" },
        { age: 25, city: "New York" },
      ];
      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          "age,city,email,name\n30,,,Alice\n,,bob@example.com,Bob\n25,New York,,",
        );
      }
    });

    it("should use custom delimiter", () => {
      const data = [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ];
      const result = converter.convert(data, { delimiter: ";" });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("a;b\n1;2\n3;4");
      }
    });

    it("should handle nested objects with flattening", () => {
      const data = [
        { name: "Alice", profile: { age: 30, city: "NYC" } },
        { name: "Bob", profile: { age: 25, city: "LA" } },
      ];
      const result = converter.convert(data, { flattenArrays: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          "name,profile.age,profile.city\nAlice,30,NYC\nBob,25,LA",
        );
      }
    });

    it("should handle nested objects without flattening", () => {
      const data = [{ name: "Alice", profile: { age: 30, city: "NYC" } }];
      const result = converter.convert(data, { flattenArrays: false });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("name,profile\nAlice,[object Object]");
      }
    });

    it("should handle arrays within objects", () => {
      const data = [
        { name: "Alice", skills: ["JavaScript", "Python"] },
        { name: "Bob", skills: ["Java", "C++", "Go"] },
      ];
      const result = converter.convert(data, { flattenArrays: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          "name,skills\nAlice,JavaScript; Python\nBob,Java; C++; Go",
        );
      }
    });

    it("should handle mixed types in array", () => {
      const data = [{ name: "Alice" }, "not an object"];
      const result = converter.convert(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Mixed types in array");
      }
    });
  });

  describe("convert - single object", () => {
    it("should convert single object", () => {
      const data = { name: "Alice", age: 30, active: true };
      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("active,age,name\ntrue,30,Alice");
      }
    });

    it("should convert empty object", () => {
      const result = converter.convert({});
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("");
      }
    });

    it("should handle deeply nested object", () => {
      const data = {
        user: {
          profile: {
            personal: {
              name: "Alice",
              age: 30,
            },
          },
        },
      };
      const result = converter.convert(data, { flattenArrays: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          "user.profile.personal.age,user.profile.personal.name\n30,Alice",
        );
      }
    });
  });

  describe("escapeCsvValue", () => {
    it("should escape values with commas", () => {
      const escaped = (converter as any).escapeCsvValue(
        "value, with comma",
        ",",
      );
      expect(escaped).toBe('"value, with comma"');
    });

    it("should escape values with quotes", () => {
      const escaped = (converter as any).escapeCsvValue(
        'value with "quotes"',
        ",",
      );
      expect(escaped).toBe('"value with ""quotes"""');
    });

    it("should escape values with newlines", () => {
      const escaped = (converter as any).escapeCsvValue(
        "value\nwith\nnewlines",
        ",",
      );
      expect(escaped).toBe('"value\nwith\nnewlines"');
    });

    it("should escape values with multiple special characters", () => {
      const escaped = (converter as any).escapeCsvValue(
        'complex, "value"\nwith all',
        ",",
      );
      expect(escaped).toBe('"complex, ""value""\nwith all"');
    });

    it("should not escape simple values", () => {
      const escaped = (converter as any).escapeCsvValue("simple value", ",");
      expect(escaped).toBe("simple value");
    });

    it("should handle different delimiters", () => {
      const escaped = (converter as any).escapeCsvValue(
        "value; with semicolon",
        ";",
      );
      expect(escaped).toBe('"value; with semicolon"');
    });

    it("should handle empty values", () => {
      const escaped = (converter as any).escapeCsvValue("", ",");
      expect(escaped).toBe("");
    });
  });

  describe("flattenObject", () => {
    it("should flatten simple nested object", () => {
      const flattened = (converter as any).flattenObject({
        user: { name: "Alice", age: 30 },
      });
      expect(flattened).toEqual({
        "user.name": "Alice",
        "user.age": 30,
      });
    });

    it("should flatten deeply nested object", () => {
      const flattened = (converter as any).flattenObject({
        a: { b: { c: { d: "deep" } } },
      });
      expect(flattened).toEqual({
        "a.b.c.d": "deep",
      });
    });

    it("should handle arrays in objects", () => {
      const flattened = (converter as any).flattenObject({
        user: { skills: ["JavaScript", "Python"] },
      });
      expect(flattened).toEqual({
        "user.skills": "JavaScript; Python",
      });
    });

    it("should handle arrays with objects", () => {
      const flattened = (converter as any).flattenObject({
        user: {
          projects: [
            { name: "Project1", status: "active" },
            { name: "Project2", status: "completed" },
          ],
        },
      });
      expect(flattened).toEqual({
        "user.projects":
          '{"name":"Project1","status":"active"}; {"name":"Project2","status":"completed"}',
      });
    });

    it("should handle null and undefined values", () => {
      const flattened = (converter as any).flattenObject({
        a: null,
        b: undefined,
        c: { d: null, e: undefined },
      });
      expect(flattened).toEqual({
        a: null,
        b: undefined,
        "c.d": null,
        "c.e": undefined,
      });
    });

    it("should handle empty objects", () => {
      const flattened = (converter as any).flattenObject({});
      expect(flattened).toEqual({});
    });

    it("should handle mixed data types", () => {
      const flattened = (converter as any).flattenObject({
        string: "text",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: "value" },
        nullValue: null,
      });
      expect(flattened).toEqual({
        string: "text",
        number: 42,
        boolean: true,
        array: "1; 2; 3",
        "object.nested": "value",
        nullValue: null,
      });
    });

    it("should handle with prefix", () => {
      const flattened = (converter as any).flattenObject(
        { name: "Alice", details: { age: 30 } },
        "user",
      );
      expect(flattened).toEqual({
        "user.name": "Alice",
        "user.details.age": 30,
      });
    });
  });

  describe("Integration tests", () => {
    it("should handle complex real-world data", () => {
      const data = [
        {
          id: 1,
          name: "Alice Johnson",
          email: "alice@example.com",
          profile: {
            age: 30,
            location: "New York, NY",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
          skills: ["JavaScript", "Python", "React"],
          projects: [
            { name: "Website", status: "active" },
            { name: "Mobile App", status: "completed" },
          ],
        },
        {
          id: 2,
          name: "Bob Smith",
          email: "bob@example.com",
          profile: {
            age: 25,
            location: "San Francisco, CA",
            preferences: {
              theme: "light",
              notifications: false,
            },
          },
          skills: ["Java", "Spring", "Docker"],
          projects: [{ name: "API Service", status: "active" }],
        },
      ];

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const lines = result.value.split("\n");
        expect(lines).toHaveLength(3); // header + 2 data rows
        expect(lines[0]).toContain("email");
        expect(lines[0]).toContain("profile.age");
        expect(lines[0]).toContain("skills");
        expect(lines[1]).toContain("alice@example.com");
        expect(lines[2]).toContain("bob@example.com");
      }
    });

    it("should handle all CSV options together", () => {
      const data = [
        { name: "Alice", details: { age: 30 } },
        { name: "Bob", details: { age: 25 } },
      ];

      const result = converter.convert(data, {
        delimiter: ";",
        includeHeaders: false,
        flattenArrays: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("[object Object];Alice\n[object Object];Bob");
      }
    });
  });
});
