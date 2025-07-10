/**
 * Tests for safe application service layer
 */

import { describe, expect, it } from "vitest";
import type { JsonValue } from "../types";
import {
  createAppState,
  generateSchemaViewData,
  getErrorRecoverySuggestions,
  handleSchemaError,
  processInitialData,
  validateAppPrerequisites,
} from "./safeAppService";

describe("Safe App Service", () => {
  describe("processInitialData", () => {
    it("should process valid JSON data", () => {
      const input = '{"name": "test", "value": 123}';
      const result = processInitialData(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: "test", value: 123 });
      }
    });

    it("should handle empty input", () => {
      const result = processInitialData("");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("No input data provided");
      }
    });

    it("should handle null input", () => {
      const result = processInitialData(null);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("No input data provided");
      }
    });

    it("should handle whitespace-only input", () => {
      const result = processInitialData("   \n\t  ");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("No input data provided");
      }
    });

    it("should handle invalid JSON", () => {
      const input = '{"invalid": json}';
      const result = processInitialData(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("JSON parsing failed");
      }
    });
  });

  describe("generateSchemaViewData", () => {
    it("should generate schema for valid data", () => {
      const data: JsonValue = { name: "test", value: 123 };
      const result = generateSchemaViewData(data, "Test Schema");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.schema).toContain('"$schema"');
        expect(result.value.schema).toContain('"title": "Test Schema"');
        expect(result.value.lineCount).toBeGreaterThan(1);
      }
    });

    it("should handle null data", () => {
      const result = generateSchemaViewData(null);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("SCHEMA_ERROR");
        expect(result.error.message).toContain("No data available");
      }
    });

    it("should generate schema for array data", () => {
      const data: JsonValue = [1, 2, 3, "test"];
      const result = generateSchemaViewData(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.schema).toContain('"type": "array"');
        expect(result.value.lineCount).toBeGreaterThan(1);
      }
    });

    it("should generate schema for nested objects", () => {
      const data: JsonValue = {
        user: {
          profile: { name: "Alice", age: 30 },
          settings: { theme: "dark", notifications: true },
        },
      };
      const result = generateSchemaViewData(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.schema).toContain('"type": "object"');
        expect(result.value.schema).toContain('"properties"');
        expect(result.value.lineCount).toBeGreaterThan(5);
      }
    });
  });

  describe("createAppState", () => {
    it("should create success state for valid data", () => {
      const parseResult = processInitialData('{"test": true}');
      const state = createAppState(parseResult);

      expect(state.data).toEqual({ test: true });
      expect(state.error).toBe(null);
      expect(state.schemaGenerated).toBe(false);
    });

    it("should create error state for invalid data", () => {
      const parseResult = processInitialData("invalid json");
      const state = createAppState(parseResult);

      expect(state.data).toBe(null);
      expect(state.error).toContain("JSON Parse Error");
      expect(state.schemaGenerated).toBe(false);
    });
  });

  describe("handleSchemaError", () => {
    it("should format schema error with context", () => {
      const error = {
        type: "SCHEMA_ERROR" as const,
        message: "Schema generation failed",
        context: "test context",
      };

      const result = handleSchemaError(error);

      expect(result.error).toContain("Schema Error");
      expect(result.error).toContain("Schema generation failed");
      expect(result.error).toContain("test context");
      expect(result.fallback).toContain("Schema generation failed");
      expect(result.fallback).toContain("test context");
    });

    it("should handle error without context", () => {
      const error = {
        type: "SCHEMA_ERROR" as const,
        message: "Unknown error",
      };

      const result = handleSchemaError(error);

      expect(result.error).toContain("Schema Error");
      expect(result.error).toContain("Unknown error");
      expect(result.fallback).toContain("unknown");
    });
  });

  describe("validateAppPrerequisites", () => {
    it("should validate with valid data and keyboard enabled", () => {
      const data: JsonValue = { test: true };
      const result = validateAppPrerequisites(data, true);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.valid).toBe(true);
      }
    });

    it("should validate with valid data and keyboard disabled", () => {
      const data: JsonValue = { test: true };
      const result = validateAppPrerequisites(data, false);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.valid).toBe(true);
      }
    });

    it("should return error for null data", () => {
      const result = validateAppPrerequisites(null, true);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("No data provided");
      }
    });
  });

  describe("getErrorRecoverySuggestions", () => {
    it("should provide suggestions for parse errors", () => {
      const error = {
        type: "PARSE_ERROR" as const,
        message: "Invalid JSON",
        suggestion: "Check syntax",
      };

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions).toContain(
        "Check JSON syntax for missing quotes, commas, or brackets",
      );
      expect(suggestions).toContain(
        "Verify that the input is valid JSON or JSON5 format",
      );
      expect(suggestions).toContain("Check syntax");
    });

    it("should provide suggestions for validation errors", () => {
      const error = {
        type: "VALIDATION_ERROR" as const,
        message: "Validation failed",
        warnings: ["circular-reference"],
      };

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions).toContain(
        "Check for circular references in the data",
      );
      expect(suggestions).toContain(
        "Reduce data complexity if it's too large or deeply nested",
      );
    });

    it("should provide suggestions for schema errors", () => {
      const error = {
        type: "SCHEMA_ERROR" as const,
        message: "Schema error",
      };

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions).toContain(
        "Try with simpler data to isolate the issue",
      );
      expect(suggestions).toContain(
        "Check if the data contains unsupported types",
      );
    });

    it("should provide suggestions for file errors", () => {
      const error = {
        type: "FILE_ERROR" as const,
        message: "File not found",
        path: "/path/to/file",
      };

      const suggestions = getErrorRecoverySuggestions(error);

      expect(suggestions).toContain(
        "Verify file permissions and path accessibility",
      );
      expect(suggestions).toContain("Check if the file exists and is readable");
    });
  });
});
