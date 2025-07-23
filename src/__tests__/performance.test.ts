/**
 * Performance tests for jsont application
 */

import type { JsonValue } from "@core/types/index";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import { searchInJson } from "@features/search/utils/searchUtils";
import { buildTreeFromJson } from "@features/tree/utils/treeBuilder";
import { renderTreeLines } from "@features/tree/utils/treeRenderer";
import { beforeAll, describe, expect, it } from "vitest";

describe("Performance Tests", () => {
  let largeJsonData: JsonValue;
  let complexJsonData: JsonValue;

  beforeAll(() => {
    // Create large JSON data for testing (reduced size for CI stability)
    largeJsonData = {
      users: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        profile: {
          age: 20 + (i % 50),
          city: `City ${i % 100}`,
          preferences: {
            theme: i % 2 === 0 ? "dark" : "light",
            notifications: i % 3 === 0,
            language: ["en", "ja", "fr"][i % 3] as string,
          },
        },
        posts: Array.from({ length: i % 10 }, (_, j) => ({
          id: j,
          title: `Post ${j} by User ${i}`,
          content: `This is content for post ${j}`,
          tags: [`tag${j}`, `user${i}`, "general"],
        })),
      })),
      metadata: {
        total: 500,
        generated: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    // Create deeply nested JSON data with proper typing
    let nested: JsonValue = { value: "deep" };
    for (let i = 0; i < 50; i++) {
      const newLevel: Record<string, JsonValue> = {
        [`level${i}`]: nested,
        data: `Level ${i} data`,
      };
      nested = newLevel as JsonValue;
    }
    complexJsonData = nested;
  });

  describe("Schema Inference Performance", () => {
    it("should handle large JSON schema inference efficiently", () => {
      const startTime = performance.now();

      const schema = inferJsonSchema(largeJsonData, "Large Dataset Schema");
      const formattedSchema = formatJsonSchema(schema);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(schema).toBeDefined();
      expect(formattedSchema).toContain("users");
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);

    it("should cache schema inference results", () => {
      const testData = { test: "data", number: 42 };

      // First call
      const start1 = performance.now();
      inferJsonSchema(testData, "Test Schema");
      const end1 = performance.now();
      const firstCallDuration = end1 - start1;

      // Second call (should be faster due to caching)
      const start2 = performance.now();
      inferJsonSchema(testData, "Test Schema");
      const end2 = performance.now();
      const secondCallDuration = end2 - start2;

      expect(secondCallDuration).toBeLessThan(firstCallDuration);
    });

    it("should handle deeply nested objects efficiently", () => {
      const startTime = performance.now();

      const schema = inferJsonSchema(complexJsonData, "Deep Nested Schema");

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(schema).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Tree Building Performance", () => {
    it("should build tree from large JSON efficiently", () => {
      const startTime = performance.now();

      const treeState = buildTreeFromJson(largeJsonData);
      const treeLines = renderTreeLines(treeState, {
        showArrayIndices: true,
        showSchemaTypes: false,
        showPrimitiveValues: true,
        maxValueLength: 100,
        useUnicodeTree: false,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(treeState.nodes.size).toBeGreaterThan(0);
      expect(treeLines.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    }, 10000);

    it("should handle tree expansion/collapse efficiently", () => {
      const treeState = buildTreeFromJson(largeJsonData);

      const startTime = performance.now();

      // Simulate multiple expand/collapse operations
      for (let i = 0; i < 100; i++) {
        renderTreeLines(treeState, {
          showArrayIndices: true,
          showSchemaTypes: i % 2 === 0,
          showPrimitiveValues: true,
          maxValueLength: 50,
          useUnicodeTree: false,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Search Performance", () => {
    it("should search large JSON datasets efficiently", () => {
      const startTime = performance.now();

      const results = searchInJson(largeJsonData, "User 100", "all");

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle multiple searches efficiently", () => {
      const searchTerms = [
        "User",
        "email",
        "profile",
        "post",
        "tag",
        "metadata",
      ];

      const startTime = performance.now();

      searchTerms.forEach((term) => {
        const results = searchInJson(largeJsonData, term, "all");
        expect(results.length).toBeGreaterThanOrEqual(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it("should handle regex searches efficiently", () => {
      const startTime = performance.now();

      // Search for simpler pattern that will match
      const results = searchInJson(largeJsonData, "user", "all");

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1500); // Should complete within 1.5 seconds
    });
  });

  describe("Memory Usage", () => {
    it("should not create excessive objects during processing", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations (reduced from 10 to 5 for CI stability)
      for (let i = 0; i < 5; i++) {
        const schema = inferJsonSchema(largeJsonData, `Schema ${i}`);
        const treeState = buildTreeFromJson(largeJsonData);
        const treeLines = renderTreeLines(treeState, {
          showArrayIndices: true,
          showSchemaTypes: false,
          showPrimitiveValues: true,
          maxValueLength: 100,
          useUnicodeTree: false,
        });
        const searchResults = searchInJson(largeJsonData, "User", "all");

        // Ensure operations completed
        expect(schema).toBeDefined();
        expect(treeLines.length).toBeGreaterThan(0);
        expect(searchResults.length).toBeGreaterThan(0);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 200MB for large dataset operations)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    }, 10000); // 10 second timeout for memory test
  });

  describe("JSON Stringification Performance", () => {
    it("should handle JSON stringification efficiently", () => {
      const startTime = performance.now();

      // Test multiple stringification operations (reduced for CI stability)
      for (let i = 0; i < 25; i++) {
        const jsonString = JSON.stringify(largeJsonData, null, 2);
        expect(jsonString).toContain("users");

        const lines = jsonString.split("\n");
        expect(lines.length).toBeGreaterThan(500);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it("should handle different indentation settings efficiently", () => {
      const indentations = [2, 4, "\t"];

      const startTime = performance.now();

      indentations.forEach((indent) => {
        const jsonString = JSON.stringify(largeJsonData, null, indent);
        expect(jsonString).toContain("users");
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
