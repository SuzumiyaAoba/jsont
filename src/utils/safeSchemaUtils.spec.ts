/**
 * Tests for safe schema utilities with Result types
 */

import { describe, expect, it } from "vitest";
import type { JsonValue } from "../types";
import {
  safeFormatJsonSchema,
  safeGetSchemaStats,
  safeInferJsonSchema,
} from "./schemaUtils";

describe("Safe Schema Utils", () => {
  describe("safeInferJsonSchema", () => {
    it("should infer schema from simple object", () => {
      const data: JsonValue = {
        name: "test",
        age: 30,
        active: true,
      };

      const result = safeInferJsonSchema(data, "Test Schema");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.$schema).toBe(
          "https://json-schema.org/draft/2020-12/schema",
        );
        expect(result.value.title).toBe("Test Schema");
        expect(result.value.type).toBe("object");
        expect(result.value.properties).toBeDefined();
      }
    });

    it("should infer schema from array", () => {
      const data: JsonValue = ["item1", "item2", "item3"];

      const result = safeInferJsonSchema(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("array");
        expect(result.value.items).toBeDefined();
      }
    });

    it("should infer schema from primitive types", () => {
      const stringData: JsonValue = "test string";
      const numberData: JsonValue = 42;
      const booleanData: JsonValue = true;
      const nullData: JsonValue = null;

      const stringResult = safeInferJsonSchema(stringData);
      const numberResult = safeInferJsonSchema(numberData);
      const booleanResult = safeInferJsonSchema(booleanData);
      const nullResult = safeInferJsonSchema(nullData);

      expect(stringResult.isOk()).toBe(true);
      expect(numberResult.isOk()).toBe(true);
      expect(booleanResult.isOk()).toBe(true);
      expect(nullResult.isOk()).toBe(true);

      if (stringResult.isOk()) expect(stringResult.value.type).toBe("string");
      if (numberResult.isOk()) expect(numberResult.value.type).toBe("integer");
      if (booleanResult.isOk())
        expect(booleanResult.value.type).toBe("boolean");
      if (nullResult.isOk()) expect(nullResult.value.type).toBe("null");
    });

    it("should handle undefined data", () => {
      const result = safeInferJsonSchema(undefined as unknown as JsonValue);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SCHEMA_ERROR");
        expect(result.error.message).toContain(
          "Cannot generate schema from undefined",
        );
      }
    });

    it("should infer schema for nested objects", () => {
      const data: JsonValue = {
        user: {
          profile: {
            name: "Alice",
            age: 25,
          },
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
        metadata: {
          created: "2023-01-01T00:00:00Z",
          version: 1,
        },
      };

      const result = safeInferJsonSchema(data, "Nested Schema");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("object");
        expect(result.value.title).toBe("Nested Schema");
        expect(result.value.properties).toBeDefined();
        expect(result.value.properties?.user).toBeDefined();
        expect(result.value.properties?.metadata).toBeDefined();
      }
    });

    it("should detect string formats", () => {
      const data: JsonValue = {
        email: "test@example.com",
        website: "https://example.com",
        id: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: "2023-01-01T00:00:00Z",
      };

      const result = safeInferJsonSchema(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const props = result.value.properties;
        expect(props?.email?.format).toBe("email");
        expect(props?.website?.format).toBe("uri");
        expect(props?.id?.format).toBe("uuid");
        expect(props?.createdAt?.format).toBe("date-time");
      }
    });
  });

  describe("safeFormatJsonSchema", () => {
    it("should format valid schema", () => {
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        title: "Test Schema",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["name", "age"],
      };

      const result = safeFormatJsonSchema(schema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"$schema"');
        expect(result.value).toContain('"type": "object"');
        expect(result.value).toContain('"title": "Test Schema"');
        expect(JSON.parse(result.value)).toEqual(schema);
      }
    });

    it("should handle schema with circular references", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      } as Record<string, unknown>;
      // Create circular reference
      (schema.properties as Record<string, unknown>).self = schema;

      const result = safeFormatJsonSchema(schema);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SCHEMA_ERROR");
        expect(result.error.message).toContain("Converting circular structure");
      }
    });

    it("should handle empty schema", () => {
      const schema = {
        type: "object",
        properties: {},
      };

      const result = safeFormatJsonSchema(schema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('"type": "object"');
        expect(result.value).toContain('"properties": {}');
      }
    });
  });

  describe("safeGetSchemaStats", () => {
    it("should calculate stats for simple schema", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          active: { type: "boolean" },
        },
        required: ["name"],
      };

      const result = safeGetSchemaStats(schema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalProperties).toBe(3);
        expect(result.value.maxDepth).toBeGreaterThanOrEqual(0);
        expect(result.value.typeDistribution.string).toBe(1);
        expect(result.value.typeDistribution.integer).toBe(1);
        expect(result.value.typeDistribution.boolean).toBe(1);
      }
    });

    it("should calculate stats for nested schema", () => {
      const schema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              profile: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "integer" },
                },
              },
            },
          },
          settings: {
            type: "object",
            properties: {
              theme: { type: "string" },
            },
          },
        },
      };

      const result = safeGetSchemaStats(schema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalProperties).toBeGreaterThan(3);
        expect(result.value.maxDepth).toBeGreaterThan(1);
        expect(result.value.typeDistribution.object).toBeGreaterThan(1);
        expect(result.value.typeDistribution.string).toBeGreaterThan(1);
      }
    });

    it("should calculate stats for array schema", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
          },
        },
      };

      const result = safeGetSchemaStats(schema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalProperties).toBe(2);
        expect(result.value.maxDepth).toBeGreaterThanOrEqual(1);
        expect(result.value.typeDistribution.array).toBe(1);
        expect(result.value.typeDistribution.object).toBe(1);
      }
    });

    it("should handle deeply nested schemas safely", () => {
      // Create a very deep schema to test recursion limits
      let deepSchema: Record<string, unknown> = { type: "string" };
      for (let i = 0; i < 50; i++) {
        deepSchema = {
          type: "object",
          properties: {
            nested: deepSchema,
          },
        };
      }

      const result = safeGetSchemaStats(deepSchema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.maxDepth).toBeGreaterThan(10);
        expect(result.value.typeDistribution.object).toBeGreaterThan(10);
      }
    });

    it("should detect recursion limit exceeded", () => {
      // Create an extremely deep schema that would exceed limits
      let veryDeepSchema: Record<string, unknown> = { type: "string" };
      for (let i = 0; i < 1200; i++) {
        veryDeepSchema = {
          type: "object",
          properties: {
            nested: veryDeepSchema,
          },
        };
      }

      const result = safeGetSchemaStats(veryDeepSchema);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SCHEMA_ERROR");
        expect(result.error.message).toContain(
          "Maximum recursion depth exceeded",
        );
      }
    });

    it("should handle invalid schema types gracefully", () => {
      const invalidSchema = {
        type: null, // Invalid type
        properties: {
          name: { type: "string" },
        },
      } as Record<string, unknown>;

      const result = safeGetSchemaStats(invalidSchema);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should still work, just not count the invalid type
        expect(result.value.totalProperties).toBe(1);
      }
    });
  });
});
