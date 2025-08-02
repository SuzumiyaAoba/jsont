/**
 * Tests for Result-based error handling utilities
 */

import type { JsonValue } from "@core/types/index";
import {
  combineResults,
  createError,
  handleResult,
  parseJsonSafely,
  parseJsonWithValidation,
  safe,
  safeDetectJsonFormat,
  validateJsonStructure,
} from "@core/utils/result";
import { describe, expect, it } from "vitest";

describe("Result utilities", () => {
  describe("parseJsonSafely", () => {
    it("should successfully parse valid JSON", () => {
      const input = '{"name": "test", "value": 123}';
      const result = parseJsonSafely(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: "test", value: 123 });
      }
    });

    it("should return error for invalid JSON", () => {
      const input = '{"invalid": json}';
      const result = parseJsonSafely(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("JSON parsing failed");
      }
    });

    it("should return error for empty input", () => {
      const result = parseJsonSafely("");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("empty");
      }
    });

    it("should handle null input gracefully", () => {
      const result = parseJsonSafely("null");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(null);
      }
    });

    it("should parse JSON5 format", () => {
      const input = `{
        // comment
        name: 'test',
        value: 123,
      }`;
      const result = parseJsonSafely(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: "test", value: 123 });
      }
    });
  });

  describe("parseJsonWithValidation", () => {
    it("should parse and validate simple data", () => {
      const input = '{"name": "test"}';
      const result = parseJsonWithValidation(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value["data"]).toEqual({ name: "test" });
        expect(result.value["validation"]["isValid"]).toBe(true);
      }
    });

    it("should return error for invalid JSON", () => {
      const input = "invalid json";
      const result = parseJsonWithValidation(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
      }
    });

    it("should detect validation warnings for large data", () => {
      // Create large object to trigger size warning
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 2000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      const input = JSON.stringify(largeObject);
      const result = parseJsonWithValidation(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value["validation"]["warnings"]).toContain("many-keys");
      }
    });
  });

  describe("validateJsonStructure", () => {
    it("should validate simple structure", () => {
      const data: JsonValue = { name: "test", value: 123 };
      const result = validateJsonStructure(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value["isValid"]).toBe(true);
        expect(result.value["stats"]).toBeDefined();
      }
    });

    it("should handle null data", () => {
      const result = validateJsonStructure(null);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value["isValid"]).toBe(true);
      }
    });

    it("should detect deeply nested structures", () => {
      const deepObject = { level1: { level2: { level3: { level4: "deep" } } } };
      const result = validateJsonStructure(deepObject);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value["isValid"]).toBe(true);
        expect(result.value["stats"]?.["depth"]).toBeGreaterThan(1);
      }
    });
  });

  describe("safeDetectJsonFormat", () => {
    it("should detect standard JSON", () => {
      const input = '{"name": "test"}';
      const result = safeDetectJsonFormat(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("json");
      }
    });

    it("should detect JSON5 format", () => {
      const input = `{name: 'test', /* comment */ }`;
      const result = safeDetectJsonFormat(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("json5");
      }
    });

    it("should return error for invalid format", () => {
      const input = "completely invalid";
      const result = safeDetectJsonFormat(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("Invalid JSON format");
      }
    });
  });

  describe("createError", () => {
    it("should create parse error", () => {
      const result = createError("PARSE_ERROR", "Test error", {
        suggestion: "Try again",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toBe("Test error");
      }
    });

    it("should create validation error", () => {
      const result = createError("VALIDATION_ERROR", "Validation failed", {
        warnings: ["warning1", "warning2"],
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("VALIDATION_ERROR");
        expect(result.error.message).toBe("Validation failed");
      }
    });
  });

  describe("handleResult", () => {
    it("should call success handler for Ok result", () => {
      let successCalled = false;
      let errorCalled = false;

      const result = parseJsonSafely('{"test": true}');
      handleResult(
        result,
        () => {
          successCalled = true;
        },
        () => {
          errorCalled = true;
        },
      );

      expect(successCalled).toBe(true);
      expect(errorCalled).toBe(false);
    });

    it("should call error handler for Err result", () => {
      let successCalled = false;
      let errorCalled = false;

      const result = parseJsonSafely("invalid json");
      handleResult(
        result,
        () => {
          successCalled = true;
        },
        () => {
          errorCalled = true;
        },
      );

      expect(successCalled).toBe(false);
      expect(errorCalled).toBe(true);
    });
  });

  describe("combineResults", () => {
    it("should combine two successful results", () => {
      const result1 = parseJsonSafely('{"a": 1}');
      const result2 = parseJsonSafely('{"b": 2}');
      const combined = combineResults(result1, result2);

      expect(combined.isOk()).toBe(true);
      if (combined.isOk()) {
        expect(combined.value).toHaveLength(2);
        expect(combined.value[0]).toEqual({ a: 1 });
        expect(combined.value[1]).toEqual({ b: 2 });
      }
    });

    it("should return error if either result fails", () => {
      const result1 = parseJsonSafely('{"a": 1}');
      const result2 = parseJsonSafely("invalid");
      const combined = combineResults(result1, result2);

      expect(combined.isErr()).toBe(true);
      if (combined.isErr()) {
        expect(combined.error.type).toBe("PARSE_ERROR");
      }
    });
  });

  describe("safe", () => {
    it("should wrap successful operation", () => {
      const operation = () => JSON.parse('{"success": true}');
      const errorMapper = (error: unknown) => ({
        type: "PARSE_ERROR" as const,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      const result = safe(operation, errorMapper);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ success: true });
      }
    });

    it("should wrap failed operation", () => {
      const operation = () => JSON.parse("invalid json");
      const errorMapper = (error: unknown) => ({
        type: "PARSE_ERROR" as const,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      const result = safe(operation, errorMapper);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("JSON");
      }
    });
  });
});
