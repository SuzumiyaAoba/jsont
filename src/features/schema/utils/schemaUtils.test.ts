import {
  formatJsonSchema,
  getSchemaStats,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { describe, expect, it } from "vitest";

describe("JSON Schema Utils", () => {
  describe("inferJsonSchema", () => {
    it("should infer schema for primitive types", () => {
      // String
      const stringSchema = inferJsonSchema("hello");
      expect(stringSchema.type).toBe("string");
      expect(stringSchema.title).toBe("Generated Schema");

      // Number
      const numberSchema = inferJsonSchema(42);
      expect(numberSchema.type).toBe("integer");

      // Float
      const floatSchema = inferJsonSchema(3.14);
      expect(floatSchema.type).toBe("number");

      // Boolean
      const boolSchema = inferJsonSchema(true);
      expect(boolSchema.type).toBe("boolean");

      // Null
      const nullSchema = inferJsonSchema(null);
      expect(nullSchema.type).toBe("null");
    });

    it("should infer schema for simple objects", () => {
      const data = {
        name: "John",
        age: 30,
        active: true,
      };

      const schema = inferJsonSchema(data);
      expect(schema.type).toBe("object");
      expect(schema.properties).toBeDefined();
      expect(schema.properties?.["name"]?.type).toBe("string");
      expect(schema.properties?.["age"]?.type).toBe("integer");
      expect(schema.properties?.["active"]?.type).toBe("boolean");
      expect(schema.required).toEqual(["name", "age", "active"]);
    });

    it("should infer schema for arrays", () => {
      const stringArray = ["hello", "world"];
      const stringArraySchema = inferJsonSchema(stringArray);
      expect(stringArraySchema.type).toBe("array");
      expect(stringArraySchema.items?.type).toBe("string");

      const numberArray = [1, 2, 3];
      const numberArraySchema = inferJsonSchema(numberArray);
      expect(numberArraySchema.type).toBe("array");
      expect(numberArraySchema.items?.type).toBe("integer");

      const mixedArray = [1, "two", true];
      const mixedArraySchema = inferJsonSchema(mixedArray);
      expect(mixedArraySchema.type).toBe("array");
      // Should pick the most common type or first type
      expect(mixedArraySchema.items).toBeDefined();
    });

    it("should infer schema for nested objects", () => {
      const data = {
        user: {
          profile: {
            name: "Alice",
            settings: {
              theme: "dark",
              notifications: true,
            },
          },
          posts: [
            { title: "Post 1", views: 100 },
            { title: "Post 2", views: 200 },
          ],
        },
      };

      const schema = inferJsonSchema(data);
      expect(schema.type).toBe("object");
      expect(schema.properties?.["user"]?.type).toBe("object");
      expect(schema.properties?.["user"]?.properties?.["profile"]?.type).toBe(
        "object",
      );
      expect(schema.properties?.["user"]?.properties?.["posts"]?.type).toBe(
        "array",
      );
      expect(
        schema.properties?.["user"]?.properties?.["posts"]?.items?.type,
      ).toBe("object");
    });

    it("should detect string formats", () => {
      const emailData = { email: "test@example.com" };
      const emailSchema = inferJsonSchema(emailData);
      expect(emailSchema.properties?.["email"]?.format).toBe("email");

      const urlData = { website: "https://example.com" };
      const urlSchema = inferJsonSchema(urlData);
      expect(urlSchema.properties?.["website"]?.format).toBe("uri");

      const dateData = { created: "2023-01-01T00:00:00Z" };
      const dateSchema = inferJsonSchema(dateData);
      expect(dateSchema.properties?.["created"]?.format).toBe("date-time");

      const uuidData = { id: "123e4567-e89b-12d3-a456-426614174000" };
      const uuidSchema = inferJsonSchema(uuidData);
      expect(uuidSchema.properties?.["id"]?.format).toBe("uuid");
    });

    it("should handle empty arrays", () => {
      const data = { items: [] };
      const schema = inferJsonSchema(data);
      expect(schema.properties?.["items"]?.type).toBe("array");
      expect(schema.properties?.["items"]?.items?.type).toBe("string"); // default fallback
    });

    it("should handle complex nested structures", () => {
      const data = {
        users: [
          {
            id: 1,
            name: "John",
            email: "john@example.com",
            preferences: {
              notifications: true,
              theme: "dark",
            },
            tags: ["admin", "user"],
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          lastUpdated: "2023-01-01T00:00:00Z",
        },
      };

      const schema = inferJsonSchema(data);
      expect(schema.type).toBe("object");
      expect(schema.properties?.["users"]?.type).toBe("array");
      expect(schema.properties?.["users"]?.items?.type).toBe("object");
      expect(schema.properties?.["metadata"]?.type).toBe("object");

      const userSchema = schema.properties?.["users"]?.items;
      expect(userSchema?.properties?.["email"]?.format).toBe("email");
      expect(userSchema?.properties?.["tags"]?.type).toBe("array");
      expect(userSchema?.properties?.["preferences"]?.type).toBe("object");
    });
  });

  describe("formatJsonSchema", () => {
    it("should format schema as JSON string", () => {
      const schema = inferJsonSchema({ name: "test", value: 123 });
      const formatted = formatJsonSchema(schema);

      expect(formatted).toContain('"$schema"');
      expect(formatted).toContain('"type": "object"');
      expect(formatted).toContain('"properties"');
      expect(typeof formatted).toBe("string");

      // Should be valid JSON
      expect(() => JSON.parse(formatted)).not.toThrow();
    });
  });

  describe("getSchemaStats", () => {
    it("should calculate schema statistics", () => {
      const data = {
        user: {
          name: "John",
          profile: {
            age: 30,
            settings: ["dark", "notifications"],
          },
        },
        posts: [
          { title: "Post 1", views: 100 },
          { title: "Post 2", views: 200 },
        ],
      };

      const schema = inferJsonSchema(data);
      const stats = getSchemaStats(schema);

      expect(stats.totalProperties).toBeGreaterThan(0);
      expect(stats.maxDepth).toBeGreaterThan(1);
      expect(stats.typeDistribution).toHaveProperty("object");
      expect(stats.typeDistribution).toHaveProperty("string");
      expect(stats.typeDistribution).toHaveProperty("array");
      expect(stats.typeDistribution).toHaveProperty("integer");
    });

    it("should handle simple schemas", () => {
      const schema = inferJsonSchema("simple string");
      const stats = getSchemaStats(schema);

      expect(stats.totalProperties).toBe(0);
      expect(stats.maxDepth).toBe(0);
      expect(stats.typeDistribution).toHaveProperty("string");
      expect(stats.typeDistribution["string"]).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const schema = inferJsonSchema(null);
      expect(schema.type).toBe("null");
    });

    it("should handle empty objects", () => {
      const schema = inferJsonSchema({});
      expect(schema.type).toBe("object");
      expect(schema.properties).toEqual({});
      expect(schema.required).toEqual([]);
    });

    it("should handle objects with null values", () => {
      const data = { value: null, name: "test" };
      const schema = inferJsonSchema(data);
      expect(schema.properties?.["value"]?.type).toBe("null");
      expect(schema.properties?.["name"]?.type).toBe("string");
    });

    it("should handle arrays with mixed types", () => {
      const data = [1, "string", true, null, { key: "value" }];
      const schema = inferJsonSchema(data);
      expect(schema.type).toBe("array");
      expect(schema.items).toBeDefined();
    });

    it("should use custom title when provided", () => {
      const schema = inferJsonSchema({ test: true }, "Custom Title");
      expect(schema.title).toBe("Custom Title");
    });

    it("should detect integer vs number types correctly", () => {
      const integerData = { count: 42 };
      const integerSchema = inferJsonSchema(integerData);
      expect(integerSchema.properties?.["count"]?.type).toBe("integer");

      const floatData = { score: 95.5 };
      const floatSchema = inferJsonSchema(floatData);
      expect(floatSchema.properties?.["score"]?.type).toBe("number");
    });
  });
});
