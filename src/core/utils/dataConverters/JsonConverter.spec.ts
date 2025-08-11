/**
 * Tests for JsonConverter
 */

import { JsonConverter } from "@core/utils/dataConverters/JsonConverter";

describe("JsonConverter", () => {
  let converter: JsonConverter;

  beforeEach(() => {
    converter = new JsonConverter();
  });

  describe("Properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("json");
      expect(converter.extension).toBe(".json");
      expect(converter.displayName).toBe("JSON");
    });
  });

  describe("validate", () => {
    it("should validate null data", () => {
      const result = converter.validate(null);
      expect(result.isOk()).toBe(true);
    });

    it("should validate undefined data", () => {
      const result = converter.validate(undefined as any);
      expect(result.isOk()).toBe(true);
    });

    it("should validate simple objects", () => {
      const result = converter.validate({ name: "test", age: 30 });
      expect(result.isOk()).toBe(true);
    });

    it("should validate arrays", () => {
      const result = converter.validate([1, 2, 3, "test"]);
      expect(result.isOk()).toBe(true);
    });

    it("should validate nested objects", () => {
      const result = converter.validate({
        user: {
          profile: {
            name: "Alice",
            settings: {
              theme: "dark",
              notifications: true,
            },
          },
        },
      });
      expect(result.isOk()).toBe(true);
    });

    it("should validate strings", () => {
      const result = converter.validate("simple string");
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

    it("should handle circular references gracefully", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const result = converter.validate(circularObj as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION_ERROR");
        expect(result.error.format).toBe("json");
      }
    });

    it("should handle functions gracefully", () => {
      const result = converter.validate((() => "test") as any);
      // JSON.stringify can actually handle functions - it converts them to undefined
      expect(result.isOk()).toBe(true);
    });

    it("should handle symbols", () => {
      const result = converter.validate(Symbol("test") as any);
      // JSON.stringify can actually handle symbols - it converts them to undefined
      expect(result.isOk()).toBe(true);
    });

    it("should handle dates", () => {
      const result = converter.validate(new Date() as any);
      expect(result.isOk()).toBe(true);
    });

    it("should handle BigInt values", () => {
      const data = { bigNumber: BigInt(123456789012345678901234567890n) };
      const result = converter.validate(data as any);
      expect(result.isErr()).toBe(true); // BigInt is not serializable by JSON.stringify
    });
  });

  describe("getDefaultOptions", () => {
    it("should return correct default options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        indent: 2,
      });
    });
  });

  describe("convert - basic data types", () => {
    it("should convert null data", () => {
      const result = converter.convert(null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("null");
      }
    });

    it("should convert undefined data", () => {
      const result = converter.convert(undefined as any);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // undefined in JSON.stringify becomes undefined, not an empty string
        expect(result.value).toBe(undefined);
      }
    });

    it("should convert string data", () => {
      const result = converter.convert("Hello, JSON!");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe('"Hello, JSON!"');
      }
    });

    it("should convert number data", () => {
      const result = converter.convert(42);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("42");
      }
    });

    it("should convert boolean data", () => {
      const result = converter.convert(true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("true");
      }
    });

    it("should convert array data", () => {
      const result = converter.convert([1, 2, "three", true]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain("1");
        expect(result.value).toContain("2");
        expect(result.value).toContain('"three"');
        expect(result.value).toContain("true");
      }
    });

    it("should convert empty array", () => {
      const result = converter.convert([]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("[]");
      }
    });

    it("should convert simple object", () => {
      const result = converter.convert({ name: "Alice", age: 30 });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"name": "Alice"');
        expect(result.value).toContain('"age": 30');
      }
    });

    it("should convert empty object", () => {
      const result = converter.convert({});
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("{}");
      }
    });
  });

  describe("convert - complex data", () => {
    it("should convert nested objects", () => {
      const data = {
        user: {
          profile: {
            name: "Alice",
            age: 30,
          },
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"user"');
        expect(result.value).toContain('"profile"');
        expect(result.value).toContain('"name": "Alice"');
        expect(result.value).toContain('"age": 30');
        expect(result.value).toContain('"settings"');
        expect(result.value).toContain('"theme": "dark"');
        expect(result.value).toContain('"notifications": true');
      }
    });

    it("should convert array of objects", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 },
      ];

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"name": "Alice"');
        expect(result.value).toContain('"age": 30');
        expect(result.value).toContain('"name": "Bob"');
        expect(result.value).toContain('"age": 25');
        expect(result.value).toContain('"name": "Charlie"');
        expect(result.value).toContain('"age": 35');
      }
    });

    it("should handle mixed data types", () => {
      const data = {
        string: "text",
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, "two", true],
        object: {
          nested: "value",
        },
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"string": "text"');
        expect(result.value).toContain('"number": 42');
        expect(result.value).toContain('"boolean": true');
        expect(result.value).toContain('"nullValue": null');
        expect(result.value).toContain('"array"');
        expect(result.value).toContain('"object"');
        expect(result.value).toContain('"nested": "value"');
      }
    });

    it("should handle special JSON characters", () => {
      const data = {
        quotes: 'Text with "quotes"',
        backslashes: "Text\\with\\backslashes",
        newlines: "Text\nwith\nnewlines",
        unicode: "Text with unicode: 🚀",
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"quotes"');
        expect(result.value).toContain('"backslashes"');
        expect(result.value).toContain('"newlines"');
        expect(result.value).toContain('"unicode"');
        expect(result.value).toContain("🚀");
      }
    });
  });

  describe("convert - with custom options", () => {
    it("should use custom indent", () => {
      const data = {
        level1: {
          level2: {
            value: "test",
          },
        },
      };

      const result = converter.convert(data, { indent: 4 });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should use 4 spaces for indentation
        expect(result.value).toContain('    "level1"');
        expect(result.value).toContain('        "level2"');
        expect(result.value).toContain('            "value"');
      }
    });

    it("should handle zero indent (compact)", () => {
      const data = { name: "test", value: 42 };

      const result = converter.convert(data, { indent: 0 });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should be compact without newlines
        expect(result.value).toBe('{"name":"test","value":42}');
      }
    });

    it("should handle string indent", () => {
      const data = { name: "test", nested: { value: 42 } };

      const result = converter.convert(data, { indent: "\t" } as any);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // JSON.stringify with Number("\t") converts to NaN, which means no formatting
        // String indents don't work with JSON.stringify - it needs a number
        expect(result.value).toContain('"name"');
        expect(result.value).toContain('"nested"');
      }
    });

    it("should handle all options together", () => {
      const data = {
        user: {
          name: "Test User",
          settings: {
            theme: "dark",
          },
        },
      };

      const result = converter.convert(data, {
        indent: 3,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"user"');
        expect(result.value).toContain('"name": "Test User"');
        expect(result.value).toContain('"settings"');
        expect(result.value).toContain('"theme": "dark"');
        // Should use 3 spaces for indentation
        expect(result.value).toContain('   "user"');
      }
    });
  });

  describe("Error handling", () => {
    it("should handle conversion errors", () => {
      // Create a circular reference
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const result = converter.convert(circularObj);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("CONVERSION_ERROR");
        expect(result.error.format).toBe("json");
        expect(typeof result.error.message).toBe("string");
      }
    });

    it("should handle BigInt values", () => {
      // BigInt is not serializable by JSON.stringify by default
      const data = { bigNumber: BigInt(123456789012345678901234567890n) };

      const result = converter.convert(data as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("CONVERSION_ERROR");
        expect(result.error.format).toBe("json");
      }
    });

    it("should provide meaningful error messages", () => {
      const circularObj: any = { test: "value" };
      circularObj.circular = circularObj;

      const result = converter.convert(circularObj);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Integration tests", () => {
    it("should handle real-world complex data", () => {
      const complexData = {
        application: {
          name: "Test App",
          version: "1.0.0",
          environment: "production",
          database: {
            host: "localhost",
            port: 5432,
            credentials: {
              username: "admin",
            },
            pools: [
              { name: "read", size: 10 },
              { name: "write", size: 5 },
            ],
          },
          features: {
            authentication: true,
            logging: {
              level: "info",
              outputs: ["console", "file"],
              rotation: {
                enabled: true,
                maxSize: "100MB",
                maxFiles: 7,
              },
            },
            cache: {
              type: "redis",
              ttl: 3600,
              hosts: [
                "redis-1.example.com",
                "redis-2.example.com",
                "redis-3.example.com",
              ],
            },
          },
          monitoring: {
            metrics: {
              enabled: true,
              interval: 30,
              endpoints: ["/health", "/metrics", "/ready"],
            },
            alerts: [
              {
                name: "High CPU",
                threshold: 80,
                action: "email",
              },
              {
                name: "Memory Usage",
                threshold: 90,
                action: "slack",
              },
            ],
          },
        },
      };

      const result = converter.convert(complexData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"application"');
        expect(result.value).toContain('"name": "Test App"');
        expect(result.value).toContain('"database"');
        expect(result.value).toContain('"features"');
        expect(result.value).toContain('"monitoring"');
        expect(result.value.length).toBeGreaterThan(100);
      }
    });

    it("should maintain data integrity through conversion", () => {
      const originalData = {
        numbers: [1, 2, 3, 0, -1, 3.14, -2.5],
        booleans: [true, false],
        strings: [
          "",
          "simple",
          "with spaces",
          "with-dashes",
          "with_underscores",
        ],
        nullValues: [null],
        nested: {
          deep: {
            deeper: {
              value: "deeply nested",
            },
          },
        },
      };

      const result = converter.convert(originalData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Verify all data is present
        expect(result.value).toContain('"numbers"');
        expect(result.value).toContain('"booleans"');
        expect(result.value).toContain('"strings"');
        expect(result.value).toContain('"nullValues"');
        expect(result.value).toContain('"nested"');
        expect(result.value).toContain('"deeply nested"');

        // Verify JSON can be parsed back
        const parsed = JSON.parse(result.value);
        expect(parsed).toEqual(originalData);
      }
    });

    it("should handle edge cases", () => {
      const edgeCases = {
        emptyString: "",
        emptyArray: [],
        emptyObject: {},
        zero: 0,
        negativeZero: -0,
        infinity: null, // JSON doesn't support Infinity, use null
        specialChars: '\n\t\r"\\',
        unicode: "🌟⭐✨",
      };

      const result = converter.convert(edgeCases);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.emptyString).toBe("");
        expect(parsed.emptyArray).toEqual([]);
        expect(parsed.emptyObject).toEqual({});
        expect(parsed.zero).toBe(0);
        expect(parsed.unicode).toBe("🌟⭐✨");
      }
    });
  });

  describe("Performance considerations", () => {
    it("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      }));

      const result = converter.convert(largeArray);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"id": 0');
        expect(result.value).toContain('"id": 999');
        expect(result.value).toContain('"name": "Item 0"');
        expect(result.value).toContain('"name": "Item 999"');
      }
    });

    it("should handle deeply nested objects", () => {
      let deepObj: any = { value: "deep" };
      for (let i = 0; i < 50; i++) {
        deepObj = { level: i, nested: deepObj };
      }

      const result = converter.convert(deepObj);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"level": 49');
        expect(result.value).toContain('"value": "deep"');
      }
    });
  });
});
