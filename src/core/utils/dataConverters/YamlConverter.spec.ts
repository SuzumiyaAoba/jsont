/**
 * Tests for YamlConverter
 */

import { YamlConverter } from "./YamlConverter";

describe("YamlConverter", () => {
  let converter: YamlConverter;

  beforeEach(() => {
    converter = new YamlConverter();
  });

  describe("Properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("yaml");
      expect(converter.extension).toBe(".yaml");
      expect(converter.displayName).toBe("YAML");
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

    it("should validate dates", () => {
      const result = converter.validate(new Date() as any);
      expect(result.isOk()).toBe(true);
    });

    it("should handle validation errors", () => {
      // Create a circular reference which js-yaml might handle gracefully
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const result = converter.validate(circularObj);
      expect(result.isOk()).toBe(true); // js-yaml handles circular refs with skipInvalid
    });

    it("should handle functions gracefully", () => {
      const result = converter.validate((() => "test") as any);
      expect(result.isErr()).toBe(true); // Functions are not valid YAML
    });

    it("should handle symbols", () => {
      const result = converter.validate(Symbol("test") as any);
      expect(result.isErr()).toBe(true); // Symbols are not valid YAML
    });

    it("should handle complex nested arrays", () => {
      const complexData = {
        users: [
          {
            id: 1,
            name: "Alice",
            roles: ["admin", "user"],
            metadata: {
              created: "2023-01-01",
              lastLogin: null,
              preferences: {
                theme: "dark",
                language: "en",
              },
            },
          },
          {
            id: 2,
            name: "Bob",
            roles: ["user"],
            metadata: {
              created: "2023-01-02",
              lastLogin: "2023-01-15",
              preferences: {
                theme: "light",
                language: "es",
              },
            },
          },
        ],
        settings: {
          version: "1.0.0",
          features: {
            authentication: true,
            notifications: false,
          },
        },
      };

      const result = converter.validate(complexData);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("getDefaultOptions", () => {
    it("should return correct default options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
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
        expect(result.value.trim()).toBe("");
      }
    });

    it("should convert string data", () => {
      const result = converter.convert("Hello, YAML!");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.trim()).toBe("Hello, YAML!");
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
        expect(result.value).toContain("- 1");
        expect(result.value).toContain("- 2");
        expect(result.value).toContain("- three");
        expect(result.value).toContain("- true");
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
        expect(result.value).toContain("name: Alice");
        expect(result.value).toContain("age: 30");
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
        expect(result.value).toContain("user:");
        expect(result.value).toContain("profile:");
        expect(result.value).toContain("name: Alice");
        expect(result.value).toContain("age: 30");
        expect(result.value).toContain("settings:");
        expect(result.value).toContain("theme: dark");
        expect(result.value).toContain("notifications: true");
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
        expect(result.value).toContain("- name: Alice");
        expect(result.value).toContain("  age: 30");
        expect(result.value).toContain("- name: Bob");
        expect(result.value).toContain("  age: 25");
        expect(result.value).toContain("- name: Charlie");
        expect(result.value).toContain("  age: 35");
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
        expect(result.value).toContain("string: text");
        expect(result.value).toContain("number: 42");
        expect(result.value).toContain("boolean: true");
        expect(result.value).toContain("nullValue: null");
        expect(result.value).toContain("array:");
        expect(result.value).toContain("object:");
        expect(result.value).toContain("nested: value");
      }
    });

    it("should handle special YAML characters", () => {
      const data = {
        colon: "value: with colon",
        dash: "- value with dash",
        quote: '"quoted value"',
        singleQuote: "'single quoted'",
        multiline: "line1\\nline2\\nline3",
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain("colon:");
        expect(result.value).toContain("dash:");
        expect(result.value).toContain("quote:");
        expect(result.value).toContain("singleQuote:");
        expect(result.value).toContain("multiline:");
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
        expect(result.value).toContain("    level2:");
        expect(result.value).toContain("        value: test");
      }
    });

    it("should respect noRefs option", () => {
      const shared = { name: "shared" };
      const data = {
        obj1: shared,
        obj2: shared,
      };

      const result = converter.convert(data, { noRefs: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should not create references, duplicate the object
        const occurrences = (result.value.match(/name: shared/g) || []).length;
        expect(occurrences).toBe(2);
      }
    });

    it("should handle lineWidth option", () => {
      const data = {
        longString:
          "This is a very long string that should be wrapped when line width is set to a small value",
      };

      const result = converter.convert(data, { lineWidth: 30 });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain("longString:");
      }
    });

    it("should handle skipInvalid option", () => {
      const data = {
        validValue: "test",
        invalidFunction: () => "test",
        anotherValid: 42,
      };

      const result = converter.convert(data as any, { skipInvalid: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain("validValue: test");
        expect(result.value).toContain("anotherValid: 42");
        // Function should be skipped
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
        lineWidth: 50,
        noRefs: true,
        skipInvalid: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain("user:");
        expect(result.value).toContain("name: Test User");
        expect(result.value).toContain("settings:");
        expect(result.value).toContain("theme: dark");
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
        expect(result.error.format).toBe("yaml");
        expect(typeof result.error.message).toBe("string");
      }
    });

    it("should handle BigInt values", () => {
      // BigInt is not serializable by js-yaml by default
      const data = { bigNumber: BigInt(123456789012345678901234567890n) };

      const result = converter.convert(data as any);
      expect(result.isOk()).toBe(true); // js-yaml might handle this with skipInvalid
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
              // password would be omitted in real scenario
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
        expect(result.value).toContain("application:");
        expect(result.value).toContain("name: Test App");
        expect(result.value).toContain("database:");
        expect(result.value).toContain("features:");
        expect(result.value).toContain("monitoring:");
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
        expect(result.value).toContain("numbers:");
        expect(result.value).toContain("booleans:");
        expect(result.value).toContain("strings:");
        expect(result.value).toContain("nullValues:");
        expect(result.value).toContain("nested:");
        expect(result.value).toContain("deeply nested");
      }
    });
  });
});
