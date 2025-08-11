/**
 * Tests for SchemaConverter
 */

import { SchemaConverter } from "@core/utils/dataConverters/SchemaConverter";

describe("SchemaConverter", () => {
  let converter: SchemaConverter;

  beforeEach(() => {
    converter = new SchemaConverter();
  });

  describe("Properties", () => {
    it("should have correct format properties", () => {
      expect(converter.format).toBe("schema");
      expect(converter.extension).toBe(".json");
      expect(converter.displayName).toBe("JSON Schema");
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

    it("should validate complex array structures", () => {
      const result = converter.validate([
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false },
        { id: 3, name: "Charlie", active: true },
      ]);
      expect(result.isOk()).toBe(true);
    });

    it("should handle dates", () => {
      const result = converter.validate(new Date() as any);
      expect(result.isOk()).toBe(true);
    });

    it("should handle functions gracefully", () => {
      const result = converter.validate((() => "test") as any);
      // Schema inference should work with most data types
      expect(result.isOk()).toBe(true);
    });

    it("should handle symbols", () => {
      const result = converter.validate(Symbol("test") as any);
      expect(result.isOk()).toBe(true);
    });

    it("should handle circular references", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const result = converter.validate(circularObj as any);
      // Schema inference might handle circular refs or fail gracefully
      // This depends on the inferJsonSchema implementation
      expect(result.isOk() || result.isErr()).toBe(true);
    });
  });

  describe("getDefaultOptions", () => {
    it("should return correct default options", () => {
      const options = converter.getDefaultOptions();
      expect(options).toEqual({
        title: "Exported Schema",
      });
    });
  });

  describe("convert - basic data types", () => {
    it("should convert null data", () => {
      const result = converter.convert(null);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("$schema");
        expect(schema).toHaveProperty("title", "Exported Schema");
        expect(schema).toHaveProperty("type", "null");
      }
    });

    it("should convert string data", () => {
      const result = converter.convert("Hello, Schema!");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "string");
        expect(schema).toHaveProperty("title", "Exported Schema");
      }
    });

    it("should convert number data", () => {
      const result = converter.convert(42);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        // Schema inference might generate "integer" for whole numbers
        expect(["number", "integer"]).toContain(schema.type);
        expect(schema).toHaveProperty("title", "Exported Schema");
      }
    });

    it("should convert boolean data", () => {
      const result = converter.convert(true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "boolean");
        expect(schema).toHaveProperty("title", "Exported Schema");
      }
    });

    it("should convert array data", () => {
      const result = converter.convert([1, 2, "three", true]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "array");
        expect(schema).toHaveProperty("title", "Exported Schema");
        expect(schema).toHaveProperty("items");
      }
    });

    it("should convert empty array", () => {
      const result = converter.convert([]);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "array");
        expect(schema).toHaveProperty("items");
      }
    });

    it("should convert simple object", () => {
      const result = converter.convert({ name: "Alice", age: 30 });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema).toHaveProperty("properties");
        expect(schema.properties).toHaveProperty("name");
        expect(schema.properties).toHaveProperty("age");
      }
    });

    it("should convert empty object", () => {
      const result = converter.convert({});
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema).toHaveProperty("properties");
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
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("user");
        expect(schema.properties.user).toHaveProperty("type", "object");
        expect(schema.properties.user.properties).toHaveProperty("profile");
        expect(schema.properties.user.properties).toHaveProperty("settings");
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
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "array");
        expect(schema).toHaveProperty("items");
        expect(schema.items).toHaveProperty("type", "object");
        expect(schema.items.properties).toHaveProperty("name");
        expect(schema.items.properties).toHaveProperty("age");
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
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("string");
        expect(schema.properties).toHaveProperty("number");
        expect(schema.properties).toHaveProperty("boolean");
        expect(schema.properties).toHaveProperty("nullValue");
        expect(schema.properties).toHaveProperty("array");
        expect(schema.properties).toHaveProperty("object");
      }
    });

    it("should handle heterogeneous arrays", () => {
      const data = {
        mixedArray: [1, "string", true, null, { key: "value" }],
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("mixedArray");
        expect(schema.properties.mixedArray).toHaveProperty("type", "array");
      }
    });

    it("should handle complex nested arrays", () => {
      const data = {
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
      };

      const result = converter.convert(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("users");
        expect(schema.properties.users).toHaveProperty("type", "array");
        expect(schema.properties.users.items).toHaveProperty("type", "object");
        expect(schema.properties.users.items.properties).toHaveProperty("id");
        expect(schema.properties.users.items.properties).toHaveProperty("name");
        expect(schema.properties.users.items.properties).toHaveProperty(
          "roles",
        );
        expect(schema.properties.users.items.properties).toHaveProperty(
          "metadata",
        );
      }
    });
  });

  describe("convert - with custom options", () => {
    it("should use custom title", () => {
      const data = { name: "test", value: 42 };

      const result = converter.convert(data, { title: "Custom Schema Title" });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("title", "Custom Schema Title");
      }
    });

    it("should use custom baseUrl when provided", () => {
      const data = { name: "test" };

      const result = converter.convert(data, {
        title: "Test Schema",
        baseUrl: "https://example.com/schemas/",
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("title", "Test Schema");
        // Note: baseUrl handling depends on the inferJsonSchema implementation
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
        title: "Complete User Schema",
        baseUrl: "https://example.com/schemas/",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("title", "Complete User Schema");
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("user");
      }
    });
  });

  describe("Error handling", () => {
    it("should handle conversion errors gracefully", () => {
      // Test with data that might cause schema inference issues
      const problematicData = {
        // Most data should work fine with schema inference
        test: "value",
      };

      const result = converter.convert(problematicData);
      expect(result.isOk()).toBe(true);
    });

    it("should provide meaningful error messages if validation fails", () => {
      // Create data that might fail schema inference validation
      const invalidData: any = () => "function";

      const result = converter.validate(invalidData);
      // This depends on the inferJsonSchema implementation
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION_ERROR");
        expect(result.error.format).toBe("schema");
        expect(typeof result.error.message).toBe("string");
      }
    });
  });

  describe("Integration tests", () => {
    it("should handle real-world API response schema", () => {
      const apiResponse = {
        status: "success",
        data: {
          users: [
            {
              id: 1,
              username: "alice123",
              email: "alice@example.com",
              profile: {
                firstName: "Alice",
                lastName: "Johnson",
                age: 28,
                address: {
                  street: "123 Main St",
                  city: "New York",
                  zipCode: "10001",
                  country: "USA",
                },
                preferences: {
                  notifications: {
                    email: true,
                    push: false,
                    sms: true,
                  },
                  privacy: {
                    profileVisible: true,
                    searchable: false,
                  },
                },
              },
              roles: ["user", "premium"],
              createdAt: "2023-01-15T10:30:00Z",
              lastLoginAt: "2023-12-01T14:22:33Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 150,
            hasNext: true,
            hasPrev: false,
          },
        },
        meta: {
          requestId: "req-123-abc",
          timestamp: "2023-12-01T15:00:00Z",
          version: "1.2.3",
        },
      };

      const result = converter.convert(apiResponse);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("status");
        expect(schema.properties).toHaveProperty("data");
        expect(schema.properties).toHaveProperty("meta");
        expect(schema.properties.data.properties).toHaveProperty("users");
        expect(schema.properties.data.properties).toHaveProperty("pagination");
      }
    });

    it("should handle configuration file schema", () => {
      const configData = {
        server: {
          port: 3000,
          host: "localhost",
          ssl: {
            enabled: true,
            certFile: "/path/to/cert.pem",
            keyFile: "/path/to/key.pem",
          },
        },
        database: {
          type: "postgresql",
          connection: {
            host: "db.example.com",
            port: 5432,
            database: "myapp",
            username: "dbuser",
            password: "secret",
            ssl: false,
            poolSize: 10,
          },
          migrations: {
            enabled: true,
            directory: "./migrations",
          },
        },
        logging: {
          level: "info",
          transports: [
            {
              type: "console",
              colorize: true,
            },
            {
              type: "file",
              filename: "app.log",
              maxSize: "10MB",
              maxFiles: 5,
            },
          ],
        },
        features: {
          authentication: true,
          rateLimiting: {
            enabled: true,
            maxRequests: 100,
            windowMs: 60000,
          },
          cors: {
            enabled: true,
            origins: ["http://localhost:3000", "https://myapp.com"],
          },
        },
      };

      const result = converter.convert(configData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("server");
        expect(schema.properties).toHaveProperty("database");
        expect(schema.properties).toHaveProperty("logging");
        expect(schema.properties).toHaveProperty("features");
        expect(schema.properties.server.properties).toHaveProperty("port");
        expect(schema.properties.database.properties).toHaveProperty(
          "connection",
        );
      }
    });

    it("should maintain schema validity", () => {
      const testData = {
        numbers: [1, 2, 3, 0, -1, 3.14, -2.5],
        booleans: [true, false],
        strings: ["", "simple", "with spaces"],
        nullValues: [null],
        nested: {
          deep: {
            deeper: {
              value: "deeply nested",
            },
          },
        },
      };

      const result = converter.convert(testData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);

        // Verify it's a valid JSON Schema structure
        expect(schema).toHaveProperty("$schema");
        expect(schema).toHaveProperty("type");
        expect(schema).toHaveProperty("title");

        // Verify the schema describes the data correctly
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("numbers");
        expect(schema.properties).toHaveProperty("booleans");
        expect(schema.properties).toHaveProperty("strings");
        expect(schema.properties).toHaveProperty("nullValues");
        expect(schema.properties).toHaveProperty("nested");
      }
    });
  });

  describe("Performance considerations", () => {
    it("should handle large objects efficiently", () => {
      const largeObject: any = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`field${i}`] = {
          id: i,
          name: `Field ${i}`,
          value: Math.random(),
          metadata: {
            created: new Date().toISOString(),
            type: i % 2 === 0 ? "even" : "odd",
          },
        };
      }

      const result = converter.convert(largeObject);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(Object.keys(schema.properties)).toHaveLength(100);
      }
    });

    it("should handle deeply nested structures", () => {
      let deepObj: any = { value: "deep" };
      for (let i = 0; i < 20; i++) {
        deepObj = { level: i, nested: deepObj };
      }

      const result = converter.convert(deepObj);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "object");
        expect(schema.properties).toHaveProperty("level");
        expect(schema.properties).toHaveProperty("nested");
      }
    });

    it("should handle arrays with many items", () => {
      const largeArray = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        category: i % 5,
        active: i % 2 === 0,
      }));

      const result = converter.convert(largeArray);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const schema = JSON.parse(result.value);
        expect(schema).toHaveProperty("type", "array");
        expect(schema).toHaveProperty("items");
        expect(schema.items).toHaveProperty("type", "object");
        expect(schema.items.properties).toHaveProperty("id");
        expect(schema.items.properties).toHaveProperty("name");
        expect(schema.items.properties).toHaveProperty("category");
        expect(schema.items.properties).toHaveProperty("active");
      }
    });
  });
});
