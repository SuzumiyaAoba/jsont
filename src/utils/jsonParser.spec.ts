import { describe, expect, it } from "vitest";
import { formatJsonValue, parseJsonSafely } from "./jsonParser.js";

describe("parseJsonSafely", () => {
  it("should parse valid JSON", () => {
    const input = '{"name": "test", "value": 42}';
    const result = parseJsonSafely(input);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ name: "test", value: 42 });
  });

  it("should handle invalid JSON", () => {
    const input = "{invalid json}";
    const result = parseJsonSafely(input);

    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });

  it("should handle empty string", () => {
    const input = "";
    const result = parseJsonSafely(input);

    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });
});

describe("formatJsonValue", () => {
  it("should format null", () => {
    expect(formatJsonValue(null)).toBe("null");
  });

  it("should format string", () => {
    expect(formatJsonValue("test")).toBe('"test"');
  });

  it("should format number", () => {
    expect(formatJsonValue(42)).toBe("42");
  });

  it("should format boolean", () => {
    expect(formatJsonValue(true)).toBe("true");
    expect(formatJsonValue(false)).toBe("false");
  });

  it("should format array", () => {
    expect(formatJsonValue([1, 2, 3])).toBe("[3 items]");
  });

  it("should format object", () => {
    expect(formatJsonValue({ a: 1, b: 2 })).toBe("{2 keys}");
  });
});
