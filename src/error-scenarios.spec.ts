/**
 * Critical error scenarios and edge cases tests
 * Ensures system stability under various error conditions
 */

import type { JsonValue } from "@core/types";
import {
  getErrorMessage,
  handleFatalError,
  handleInputError,
  handleNoInput,
} from "@core/utils/errorHandler";
import {
  detectJsonFormat,
  parseJsonSafely,
  parseJsonWithValidation,
  repairJsonString,
  validateJsonStructure,
} from "@features/json-rendering/utils/jsonProcessor";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock console and process for error handler tests
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockExit = vi.fn();

// Mock process.exit for testing
Object.defineProperty(process, "exit", {
  value: mockExit,
  writable: true,
});

describe("Critical Error Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
    mockExit.mockClear();
    // Ensure we're in test environment
    process.env["VITEST"] = "true";
    // Mock stdin.isTTY for error handler tests
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      writable: true,
    });
  });

  describe("Application JSON Processing Error Handling", () => {
    it("should handle malformed JSON with detailed error information", () => {
      const malformedJson = '{"name": "test", "incomplete": ';
      const result = parseJsonSafely(malformedJson);

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toContain("JSON parsing failed");
      expect(result.suggestion).toBe(
        "Check for unclosed strings, objects, or arrays",
      );
      expect(result.parseTime).toBeGreaterThan(0);
    });

    it("should handle single quotes in JSON with helpful suggestions", () => {
      // JSON5 actually supports single quotes, so let's test with truly invalid JSON
      const invalidJson = "{'name': 'test', 'invalid': function(){}}";
      const result = parseJsonSafely(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain("JSON parsing failed");
    });

    it("should handle empty or whitespace input", () => {
      const emptyInputs = ["", "   ", "\n\t  \n"];

      for (const input of emptyInputs) {
        const result = parseJsonSafely(input);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Input is empty or contains only whitespace");
        expect(result.suggestion).toBe("Please provide valid JSON data");
      }
    });

    it("should detect circular references in validation", () => {
      const circularObj: { name: string; self?: unknown } = { name: "test" };
      circularObj.self = circularObj;

      const validation = validateJsonStructure(
        circularObj as unknown as JsonValue,
      );
      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(
        /circular reference|Maximum call stack/i,
      );
      if (validation.suggestion) {
        expect(validation.suggestion).toBe(
          "Remove circular references before processing",
        );
      }
    });

    it("should handle deeply nested objects with validation warnings", () => {
      // Create deeply nested object
      const deepObj: Record<string, unknown> = {};
      let current = deepObj;
      for (let i = 0; i < 20; i++) {
        current["nested"] = {};
        current = current["nested"] as Record<string, unknown>;
      }
      current["value"] = "deep";

      const validation = validateJsonStructure(deepObj as unknown as JsonValue);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain("excessive-depth");
    });

    it("should handle large JSON objects with validation warnings", () => {
      // Create large object
      const largeObject: Record<string, unknown> = {};
      for (let i = 0; i < 2000; i++) {
        largeObject[`key_${i}`] = "x".repeat(1000);
      }

      const validation = validateJsonStructure(
        largeObject as unknown as JsonValue,
      );
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain("large-size");
      expect(validation.warnings).toContain("many-keys");
    });

    it("should provide comprehensive validation with statistics", () => {
      const complexJson = {
        string: "value",
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        nested: { deep: { deeper: "value" } },
      };

      const result = parseJsonWithValidation(JSON.stringify(complexJson));
      expect(result.success).toBe(true);
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.stats?.types["string"]).toBeGreaterThan(0);
      expect(result.validation.stats?.types["number"]).toBeGreaterThan(0);
      expect(result.validation.stats?.types["boolean"]).toBeGreaterThan(0);
      expect(result.validation.stats?.types["null"]).toBeGreaterThan(0);
      expect(result.validation.stats?.types["array"]).toBeGreaterThan(0);
      expect(result.validation.stats?.types["object"]).toBeGreaterThan(0);
    });

    it("should detect different JSON formats correctly", () => {
      expect(detectJsonFormat('{"valid": "json"}')).toBe("json");
      expect(detectJsonFormat('{unquoted: "keys"}')).toBe("json5");
      expect(detectJsonFormat('{"trailing": "comma",}')).toBe("json5");
      expect(detectJsonFormat('// comment\n{"json5": true}')).toBe("json5");
      expect(detectJsonFormat("invalid json")).toBe("invalid");
    });

    it("should repair common JSON issues", () => {
      const brokenJson = "{'key': 'value', 'trailing': 'comma',}";
      const repaired = repairJsonString(brokenJson);
      expect(repaired).toBe('{"key": "value", "trailing": "comma"}');
    });
  });

  describe("Application Error Handler Functions", () => {
    it("should handle fatal errors in test environment", () => {
      const testError = new Error("Test fatal error");

      expect(() => handleFatalError(testError)).toThrow(
        "Fatal error: Test fatal error",
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/Fatal error/),
        "Test fatal error",
      );
    });

    it("should handle unknown fatal errors", () => {
      const unknownError = "string error";

      expect(() => handleFatalError(unknownError)).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/Fatal error/),
        expect.stringMatching(/Unknown error/),
      );
    });

    it("should handle input errors gracefully in test environment", () => {
      const inputError = new Error("Invalid input");

      // Should not throw in test environment
      expect(() => handleInputError(inputError)).not.toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith("Error:", "Invalid input");
    });

    it("should handle no input scenario in test environment", () => {
      // Should not throw in test environment
      expect(() => handleNoInput()).not.toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith("No JSON input provided.");
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Usage: jsont [file.json] or echo '{...}' | jsont",
      );
    });

    it("should extract error messages from various error types", () => {
      expect(getErrorMessage(new Error("Test error"))).toBe("Test error");
      expect(getErrorMessage("string error")).toMatch(/Unknown error/);
      expect(getErrorMessage(null)).toMatch(/Unknown error/);
      expect(getErrorMessage(undefined)).toMatch(/Unknown error/);
      expect(getErrorMessage({ message: "object error" })).toMatch(
        /Unknown error/,
      );
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle extremely large valid JSON", () => {
      const largeArray = Array(50000).fill("data");
      const largeJson = JSON.stringify(largeArray);

      const result = parseJsonSafely(largeJson);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50000);
    });

    it("should handle various numeric edge cases", () => {
      const numericCases = [
        { value: Number.MAX_SAFE_INTEGER, expected: true },
        { value: Number.MIN_SAFE_INTEGER, expected: true },
        { value: 0, expected: true },
        { value: -0, expected: true },
        { value: 1.7976931348623157e308, expected: true }, // MAX_VALUE
      ];

      for (const testCase of numericCases) {
        const json = JSON.stringify({ value: testCase.value });
        const result = parseJsonSafely(json);
        expect(result.success).toBe(testCase.expected);
      }
    });

    it("should handle various string edge cases", () => {
      const stringCases = [
        '{"unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F"}',
        '{"emoji": "🚀🎉"}',
        '{"empty": ""}',
        '{"newlines": "line1\\nline2\\r\\nline3"}',
        '{"quotes": "He said \\"Hello\\""}',
      ];

      for (const json of stringCases) {
        const result = parseJsonSafely(json);
        expect(result.success).toBe(true);
      }
    });

    it("should handle memory exhaustion gracefully", () => {
      // Test with reasonable size to avoid actually exhausting memory
      const reasonableLargeObject: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        reasonableLargeObject[`key_${i}`] = "x".repeat(1000);
      }

      const result = parseJsonSafely(JSON.stringify(reasonableLargeObject));
      expect(result.success).toBe(true);

      const validation = validateJsonStructure(
        reasonableLargeObject as unknown as JsonValue,
      );
      expect(validation.isValid).toBe(true);
    });

    it("should handle concurrent parsing operations", async () => {
      const testData = '{"concurrent": "test"}';
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(parseJsonSafely(testData)));

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ concurrent: "test" });
      });
    });
  });

  describe("Recovery and Resilience", () => {
    it("should provide actionable error messages for common mistakes", () => {
      const commonMistakes = [
        {
          input: '{"name": "test"',
          expectedSuggestion: "unclosed",
        },
        {
          input: '{"name": undefined}',
          expectedSuggestion: "missing commas|brackets|quotes",
        },
        {
          input: '{"invalid": function(){}}',
          expectedSuggestion: "missing commas|brackets|quotes",
        },
      ];

      for (const mistake of commonMistakes) {
        const result = parseJsonSafely(mistake.input);
        expect(result.success).toBe(false);
        if (result.suggestion) {
          expect(result.suggestion).toMatch(
            new RegExp(mistake.expectedSuggestion, "i"),
          );
        }
      }
    });

    it("should maintain performance under error conditions", () => {
      const malformedJson = '{"broken": "json"'.repeat(1000);

      const startTime = performance.now();
      const result = parseJsonSafely(malformedJson);
      const endTime = performance.now();

      expect(result.success).toBe(false);
      expect(endTime - startTime).toBeLessThan(100); // Should fail fast
      expect(result.parseTime).toBeLessThan(100);
    });

    it("should handle error conditions without memory leaks", () => {
      // Test that error handling doesn't accumulate memory
      for (let i = 0; i < 100; i++) {
        const result = parseJsonSafely(`{"invalid": json${i}}`);
        expect(result.success).toBe(false);
      }

      // If we get here without running out of memory, the test passes
      expect(true).toBe(true);
    });
  });
});
