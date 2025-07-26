/**
 * Tests for JSON Schema file export functionality
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportJsonSchemaToFile,
  exportToFile,
  generateDefaultFilename,
  validateExportOptions,
} from "./fileExport";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
}));

// Mock path
vi.mock("node:path", () => ({
  join: vi.fn(),
}));

describe("File Export Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(join).mockImplementation((...paths) => paths.join("/"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToFile", () => {
    it("should export JSON data when format is 'json'", async () => {
      const testData = { name: "test", value: 42 };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportToFile(testData, {
        filename: "test-data.json",
        outputDir: "/tmp",
        format: "json",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/tmp/test-data.json");
      expect(writeFile).toHaveBeenCalledWith(
        "/tmp/test-data.json",
        JSON.stringify(testData, null, 2),
        "utf8",
      );
    });

    it("should export JSON Schema when format is 'schema'", async () => {
      const testData = { name: "test", value: 42 };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportToFile(testData, {
        filename: "test-schema.json",
        outputDir: "/tmp",
        format: "schema",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/tmp/test-schema.json");
      expect(writeFile).toHaveBeenCalledWith(
        "/tmp/test-schema.json",
        expect.stringContaining('"type": "object"'),
        "utf8",
      );
    });

    it("should default to JSON export when format is not specified", async () => {
      const testData = { name: "test", value: 42 };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportToFile(testData, {
        filename: "test.json",
        outputDir: "/tmp",
      });

      expect(result.success).toBe(true);
      expect(writeFile).toHaveBeenCalledWith(
        "/tmp/test.json",
        JSON.stringify(testData, null, 2),
        "utf8",
      );
    });
  });

  describe("exportJsonSchemaToFile (backward compatibility)", () => {
    it("should export simple JSON data to schema file", async () => {
      const testData = { name: "test", value: 42 };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportJsonSchemaToFile(testData, {
        filename: "test-schema.json",
        outputDir: "/tmp",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/tmp/test-schema.json");
      expect(writeFile).toHaveBeenCalledWith(
        "/tmp/test-schema.json",
        expect.stringContaining('"type": "object"'),
        "utf8",
      );
    });

    it("should use default filename when not provided", async () => {
      const testData = { test: true };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportJsonSchemaToFile(testData);

      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/schema\.json$/); // Schema format defaults to schema.json
    });

    it("should add .json extension if missing", async () => {
      const testData = { test: true };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportJsonSchemaToFile(testData, {
        filename: "my-schema",
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toMatch(/my-schema\.json$/);
    });

    it("should handle file write errors", async () => {
      const testData = { test: true };
      const writeError = new Error("Permission denied");
      vi.mocked(writeFile).mockRejectedValue(writeError);

      const result = await exportJsonSchemaToFile(testData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Permission denied");
    });

    it("should export complex nested data", async () => {
      const testData = {
        user: {
          name: "John",
          age: 30,
          hobbies: ["reading", "coding"],
        },
        metadata: {
          created: "2023-01-01",
          version: 1.0,
        },
      };
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportJsonSchemaToFile(testData);

      expect(result.success).toBe(true);
      expect(writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"properties"'),
        "utf8",
      );

      const firstCall = vi.mocked(writeFile).mock.calls[0];
      expect(firstCall).toBeDefined();
      const schemaContent = firstCall?.[1] as string;
      expect(schemaContent).toBeDefined();
      const schema = JSON.parse(schemaContent);

      expect(schema.$schema).toBe(
        "https://json-schema.org/draft/2020-12/schema",
      );
      expect(schema.title).toBe("Exported Schema");
      expect(schema.type).toBe("object");
      expect(schema.properties).toBeDefined();
      expect(schema.properties.user).toBeDefined();
      expect(schema.properties.metadata).toBeDefined();
    });

    it("should handle arrays in JSON data", async () => {
      const testData = [1, 2, 3, "test"];
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await exportJsonSchemaToFile(testData);

      expect(result.success).toBe(true);

      const firstCall = vi.mocked(writeFile).mock.calls[0];
      expect(firstCall).toBeDefined();
      const schemaContent = firstCall?.[1] as string;
      expect(schemaContent).toBeDefined();
      const schema = JSON.parse(schemaContent);

      expect(schema.type).toBe("array");
      expect(schema.items).toBeDefined();
    });
  });

  describe("generateDefaultFilename", () => {
    it("should generate filename with timestamp", () => {
      const filename = generateDefaultFilename();

      expect(filename).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      );
    });

    it("should generate unique filenames with proper structure", () => {
      const filename1 = generateDefaultFilename();

      // Short delay to ensure different timestamps if precision allows
      const start = Date.now();
      while (Date.now() - start < 2) {
        // Small busy wait to ensure timestamp difference
      }

      const filename2 = generateDefaultFilename();

      // Both should match the expected pattern (defaults to export format)
      expect(filename1).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      );
      expect(filename2).toMatch(
        /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      );

      // Structure should be consistent (same length and format)
      expect(filename1.length).toBe(filename2.length);
      expect(filename1.startsWith("export_")).toBe(true);
      expect(filename2.startsWith("export_")).toBe(true);
    });
  });

  describe("validateExportOptions", () => {
    it("should validate correct options", () => {
      const result = validateExportOptions({
        filename: "test-schema.json",
        outputDir: "/tmp/export",
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid filename characters", () => {
      const result = validateExportOptions({
        filename: "test<>schema.json",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("forbidden characters");
    });

    it("should reject directory traversal attempts", () => {
      const result = validateExportOptions({
        outputDir: "/tmp/../etc",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("cannot contain '..'");
    });

    it("should allow valid filenames including spaces", () => {
      const validFilenames = [
        "schema.json",
        "my-schema.json",
        "schema_v1.0.json",
        "user.schema.json",
        "My Schema File.json", // Now allowed with relaxed validation
        "schema (2024).json",
      ];

      for (const filename of validFilenames) {
        const result = validateExportOptions({ filename });
        expect(result.isValid).toBe(true);
      }
    });

    it("should allow empty options", () => {
      const result = validateExportOptions({});

      expect(result.isValid).toBe(true);
    });
  });
});
