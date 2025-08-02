/**
 * Tests for jq transformation utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJqExamples,
  transformWithJq,
  validateJqQuery,
} from "../jqTransform";

// Mock node-jq
vi.mock("node-jq", () => ({
  default: {
    run: vi.fn(),
  },
}));

import jq from "node-jq";

describe("JQ Transform Utilities", () => {
  let mockJqRun: ReturnType<typeof vi.mocked<typeof jq.run>>;

  beforeEach(() => {
    mockJqRun = vi.mocked(jq.run);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("transformWithJq", () => {
    const testData = {
      users: [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "San Francisco" },
      ],
      total: 2,
    };

    it("should return original data for empty query", async () => {
      const result = await transformWithJq(testData, "");

      expect(result.success).toBe(true);
      expect(result.data).toBe(testData);
      expect(mockJqRun).not.toHaveBeenCalled();
    });

    it("should return original data for whitespace-only query", async () => {
      const result = await transformWithJq(testData, "   \n\t  ");

      expect(result.success).toBe(true);
      expect(result.data).toBe(testData);
      expect(mockJqRun).not.toHaveBeenCalled();
    });

    it("should successfully transform data with simple jq query", async () => {
      const expectedResult = [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "San Francisco" },
      ];

      mockJqRun.mockResolvedValue(JSON.stringify(expectedResult));

      const result = await transformWithJq(testData, ".users");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedResult);
      expect(mockJqRun).toHaveBeenCalledWith(
        ".users",
        JSON.stringify(testData),
        { input: "string", raw: false },
      );
    });

    it("should handle jq queries that return primitives", async () => {
      mockJqRun.mockResolvedValue("2");

      const result = await transformWithJq(testData, ".total");

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
      expect(mockJqRun).toHaveBeenCalledWith(
        ".total",
        JSON.stringify(testData),
        { input: "string", raw: false },
      );
    });

    it("should handle jq queries that return strings", async () => {
      mockJqRun.mockResolvedValue('"Alice"');

      const result = await transformWithJq(testData, ".users[0].name");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Alice");
    });

    it("should handle jq queries that return arrays", async () => {
      const expectedNames = ["Alice", "Bob"];
      mockJqRun.mockResolvedValue(JSON.stringify(expectedNames));

      const result = await transformWithJq(testData, ".users[].name");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedNames);
    });

    it("should handle complex jq transformations", async () => {
      const expectedResult = [
        { name: "Alice", info: "Alice is 30 years old" },
        { name: "Bob", info: "Bob is 25 years old" },
      ];

      mockJqRun.mockResolvedValue(JSON.stringify(expectedResult));

      const result = await transformWithJq(
        testData,
        '.users | map({name, info: "\\(.name) is \\(.age) years old"})',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedResult);
    });

    it("should handle jq syntax errors", async () => {
      const jqError = new Error("jq: error: syntax error, unexpected INVALID");
      mockJqRun.mockRejectedValue(jqError);

      const result = await transformWithJq(testData, ".invalid[syntax");

      expect(result.success).toBe(false);
      expect(result.error).toContain("jq:");
      expect(result.data).toBeUndefined();
    });

    it("should clean up jq error messages", async () => {
      const jqError = new Error(
        "jq: error: compile error: syntax error, unexpected INVALID (while parsing '.invalid[syntax')",
      );
      mockJqRun.mockRejectedValue(jqError);

      const result = await transformWithJq(testData, ".invalid[syntax");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Syntax error:");
      expect(result.error).not.toContain("jq: error");
      expect(result.error).not.toContain("compile error");
    });

    it("should handle jq runtime errors", async () => {
      const jqError = new Error(
        'jq: error: Cannot index number with string "name"',
      );
      mockJqRun.mockRejectedValue(jqError);

      const result = await transformWithJq(42, ".name");

      expect(result.success).toBe(false);
      expect(result.error).toContain("jq:");
      expect(result.error).toContain("Cannot index number");
    });

    it("should handle data serialization errors", async () => {
      // Create circular reference
      const circularData: { prop: string; circular?: unknown } = {
        prop: "value",
      };
      circularData.circular = circularData;

      const result = await transformWithJq(circularData, ".");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to serialize data");
      expect(mockJqRun).not.toHaveBeenCalled();
    });

    it("should handle raw string output from jq", async () => {
      mockJqRun.mockResolvedValue("Plain text result");

      const result = await transformWithJq(testData, ". | tostring");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Plain text result");
    });

    it("should handle jq returning object directly", async () => {
      const expectedResult = { transformed: true };
      mockJqRun.mockResolvedValue(expectedResult);

      const result = await transformWithJq(testData, ".");

      expect(result.success).toBe(true);
      expect(result.data).toBe(expectedResult);
    });

    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Network error");
      mockJqRun.mockRejectedValue(unexpectedError);

      const result = await transformWithJq(testData, ".");

      expect(result.success).toBe(false);
      expect(result.error).toContain("jq: Network error");
    });

    it("should handle non-Error exceptions", async () => {
      mockJqRun.mockRejectedValue("String error");

      const result = await transformWithJq(testData, ".");

      expect(result.success).toBe(false);
      expect(result.error).toContain("jq: Unknown jq error");
    });
  });

  describe("validateJqQuery", () => {
    it("should reject empty queries", () => {
      expect(validateJqQuery("")).toEqual({
        valid: false,
        error: "Empty query",
      });

      expect(validateJqQuery("   ")).toEqual({
        valid: false,
        error: "Empty query",
      });
    });

    it("should accept simple dot queries", () => {
      expect(validateJqQuery(".")).toEqual({ valid: true });
      expect(validateJqQuery(".field")).toEqual({ valid: true });
      expect(validateJqQuery(".nested.field")).toEqual({ valid: true });
    });

    it("should accept array queries", () => {
      expect(validateJqQuery(".[0]")).toEqual({ valid: true });
      expect(validateJqQuery(".users[]")).toEqual({ valid: true });
      expect(validateJqQuery(".users[0].name")).toEqual({ valid: true });
    });

    it("should accept pipe operations", () => {
      expect(validateJqQuery(". | keys")).toEqual({ valid: true });
      expect(validateJqQuery(".users | length")).toEqual({ valid: true });
      expect(validateJqQuery(".users[] | .name")).toEqual({ valid: true });
    });

    it("should accept recursive descent", () => {
      expect(validateJqQuery("..")).toEqual({ valid: true });
      expect(validateJqQuery(".. | .name?")).toEqual({ valid: true });
    });

    it("should accept comparison operators", () => {
      expect(validateJqQuery(".age > 18")).toEqual({ valid: true });
      expect(validateJqQuery(".score >= 90")).toEqual({ valid: true });
      expect(validateJqQuery('.name == "Alice"')).toEqual({ valid: true });
      expect(validateJqQuery('.status != "inactive"')).toEqual({ valid: true });
    });

    it("should accept function names", () => {
      expect(validateJqQuery("keys")).toEqual({ valid: true });
      expect(validateJqQuery("length")).toEqual({ valid: true });
      expect(validateJqQuery("type")).toEqual({ valid: true });
    });

    it("should accept valid identifiers", () => {
      expect(validateJqQuery("users")).toEqual({ valid: true });
      expect(validateJqQuery("user_data")).toEqual({ valid: true });
      expect(validateJqQuery("userData2")).toEqual({ valid: true });
    });

    it("should reject invalid syntax patterns", () => {
      expect(validateJqQuery("123invalid")).toEqual({
        valid: false,
        error: "Invalid jq syntax",
      });

      expect(validateJqQuery("@invalid")).toEqual({
        valid: false,
        error: "Invalid jq syntax",
      });
    });
  });

  describe("getJqExamples", () => {
    it("should return array of example queries", () => {
      const examples = getJqExamples();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples).toContain(".");
      expect(examples).toContain(".[]");
      expect(examples).toContain("keys");
      expect(examples).toContain("length");
    });

    it("should include basic navigation examples", () => {
      const examples = getJqExamples();

      expect(examples).toContain(".");
      expect(examples).toContain(".[]");
      expect(examples).toContain(".name");
      expect(examples).toContain(".users[]");
      expect(examples).toContain(".users[0]");
    });

    it("should include transformation examples", () => {
      const examples = getJqExamples();

      expect(examples).toContain(".users[] | .name");
      expect(examples).toContain(".users | length");
      expect(examples).toContain("map(.name)");
      expect(examples).toContain("sort_by(.name)");
      expect(examples).toContain("group_by(.category)");
    });

    it("should include filtering examples", () => {
      const examples = getJqExamples();

      expect(examples).toContain(".users[] | select(.age > 18)");
      expect(examples).toContain('has("key")');
    });

    it("should include utility function examples", () => {
      const examples = getJqExamples();

      expect(examples).toContain("keys");
      expect(examples).toContain("values");
      expect(examples).toContain("type");
      expect(examples).toContain("length");
      expect(examples).toContain("empty");
      expect(examples).toContain("error");
    });

    it("should return consistent results", () => {
      const examples1 = getJqExamples();
      const examples2 = getJqExamples();

      expect(examples1).toEqual(examples2);
    });
  });
});
