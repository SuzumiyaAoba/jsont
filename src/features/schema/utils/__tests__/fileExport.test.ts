/**
 * Tests for enhanced file export utilities with multiple format support
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  exportToFile,
  generateDefaultFilename,
  validateExportOptions,
} from "../fileExport";

// Test data
const testData = {
  users: [
    { id: 1, name: "Alice", age: 30, active: true },
    { id: 2, name: "Bob", age: 25, active: false },
    { id: 3, name: "Charlie", age: 35, active: true },
  ],
  metadata: {
    total: 3,
    lastUpdated: "2024-01-01T00:00:00Z",
  },
};

const tempDir = "/tmp/jsont-test-exports";

describe("Enhanced File Export", () => {
  beforeEach(async () => {
    // Create temp directory for tests
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(files.map((file) => fs.unlink(join(tempDir, file))));
      await fs.rmdir(tempDir);
    } catch {
      // Directory might not exist or be empty
    }
  });

  describe("JSON Export", () => {
    it("should export JSON data to file", async () => {
      const result = await exportToFile(testData, {
        filename: "test-data.json",
        outputDir: tempDir,
        format: "json",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "test-data.json"));

      const content = await fs.readFile(result.filePath!, "utf8");
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testData);
    });

    it("should add .json extension if missing", async () => {
      const result = await exportToFile(testData, {
        filename: "test-data",
        outputDir: tempDir,
        format: "json",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "test-data.json"));
    });
  });

  describe("YAML Export", () => {
    it("should export YAML data to file", async () => {
      const result = await exportToFile(testData, {
        filename: "test-data.yaml",
        outputDir: tempDir,
        format: "yaml",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "test-data.yaml"));

      const content = await fs.readFile(result.filePath!, "utf8");
      expect(content).toContain("users:");
      expect(content).toContain("- id: 1");
      expect(content).toContain("name: Alice");
    });

    it("should add .yaml extension if missing", async () => {
      const result = await exportToFile(testData, {
        filename: "test-data",
        outputDir: tempDir,
        format: "yaml",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "test-data.yaml"));
    });
  });

  describe("CSV Export", () => {
    it("should export array data to CSV", async () => {
      const arrayData = [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "London" },
      ];

      const result = await exportToFile(arrayData, {
        filename: "users.csv",
        outputDir: tempDir,
        format: "csv",
        csvOptions: {
          delimiter: ",",
          includeHeaders: true,
          flattenArrays: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "users.csv"));

      const content = await fs.readFile(result.filePath!, "utf8");
      const lines = content.split("\n");
      expect(lines[0]).toBe("age,city,name"); // Headers sorted alphabetically
      expect(lines[1]).toBe("30,New York,Alice");
      expect(lines[2]).toBe("25,London,Bob");
    });

    it("should handle nested objects in CSV", async () => {
      const nestedData = [
        { name: "Alice", profile: { age: 30, active: true } },
        { name: "Bob", profile: { age: 25, active: false } },
      ];

      const result = await exportToFile(nestedData, {
        filename: "nested.csv",
        outputDir: tempDir,
        format: "csv",
        csvOptions: { flattenArrays: true },
      });

      expect(result.success).toBe(true);
      const content = await fs.readFile(result.filePath!, "utf8");
      expect(content).toContain("profile.age");
      expect(content).toContain("profile.active");
    });

    it("should add .csv extension if missing", async () => {
      const result = await exportToFile([{ name: "test" }], {
        filename: "test-data",
        outputDir: tempDir,
        format: "csv",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "test-data.csv"));
    });
  });

  describe("Schema Export", () => {
    it("should export JSON Schema", async () => {
      const result = await exportToFile(testData, {
        filename: "schema.json",
        outputDir: tempDir,
        format: "schema",
        baseUrl: "https://example.com/schema",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(join(tempDir, "schema.json"));

      const content = await fs.readFile(result.filePath!, "utf8");
      const schema = JSON.parse(content);
      expect(schema.$schema).toBe("https://example.com/schema");
      expect(schema.type).toBe("object");
      expect(schema.properties).toHaveProperty("users");
      expect(schema.properties).toHaveProperty("metadata");
    });
  });

  describe("Default filename generation", () => {
    it("should generate filename with correct extensions", () => {
      const jsonFilename = generateDefaultFilename("json");
      expect(jsonFilename).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      );

      const yamlFilename = generateDefaultFilename("yaml");
      expect(yamlFilename).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.yaml$/,
      );

      const csvFilename = generateDefaultFilename("csv");
      expect(csvFilename).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/,
      );
    });

    it("should default to JSON extension", () => {
      const filename = generateDefaultFilename();
      expect(filename).toMatch(/\.json$/);
    });
  });

  describe("Validation", () => {
    it("should validate valid export options", () => {
      const result = validateExportOptions({
        filename: "valid-file.json",
        outputDir: "/valid/path",
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject filenames with forbidden characters", () => {
      const result = validateExportOptions({
        filename: "invalid<file>.json",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("forbidden characters");
    });

    it("should reject paths with directory traversal", () => {
      const result = validateExportOptions({
        outputDir: "/path/../traversal",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("security reasons");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid output directory", async () => {
      const result = await exportToFile(testData, {
        filename: "test.json",
        outputDir: "/invalid/nonexistent/path",
        format: "json",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.filePath).toBeUndefined();
    });
  });
});
