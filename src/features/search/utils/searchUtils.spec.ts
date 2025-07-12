import type { JsonValue } from "@core/types/index";
import {
  getSearchNavigationInfo,
  highlightSearchInLine,
  lineContainsSearch,
  searchInJson,
  searchInJsonSchema,
  searchInText,
} from "@features/search/utils/searchUtils";
import { describe, expect, it } from "vitest";

describe("searchUtils", () => {
  describe("searchInJson", () => {
    const testData: JsonValue = {
      name: "John Doe",
      age: 30,
      address: {
        street: "123 Main St",
        city: "New York",
      },
      hobbies: ["reading", "gaming", "coding"],
    };

    it("should find matches in JSON content", () => {
      const results = searchInJson(testData, "John");
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        lineIndex: 1,
        matchText: "John",
        contextLine: '  "name": "John Doe",',
      });
    });

    it("should find multiple matches", () => {
      const results = searchInJson(testData, "e");
      expect(results.length).toBeGreaterThan(1);
      expect(
        results.some((result) => result.contextLine.includes("name")),
      ).toBe(true);
      expect(
        results.some((result) => result.contextLine.includes("street")),
      ).toBe(true);
    });

    it("should be case insensitive", () => {
      const results = searchInJson(testData, "john");
      expect(results).toHaveLength(1);
      expect(results[0]?.matchText).toBe("John");
    });

    it("should return empty array for empty search term", () => {
      const results = searchInJson(testData, "");
      expect(results).toHaveLength(0);
    });

    it("should return empty array for no matches", () => {
      const results = searchInJson(testData, "xyz123");
      expect(results).toHaveLength(0);
    });

    it("should handle null data", () => {
      const results = searchInJson(null, "test");
      expect(results).toHaveLength(0);
    });

    it("should find matches in array values", () => {
      const results = searchInJson(testData, "reading");
      expect(results).toHaveLength(1);
      expect(results[0]?.contextLine).toContain("reading");
    });
  });

  describe("lineContainsSearch", () => {
    it("should return true when line contains search term", () => {
      expect(lineContainsSearch("Hello World", "world")).toBe(true);
      expect(lineContainsSearch("Hello World", "Hello")).toBe(true);
    });

    it("should be case insensitive", () => {
      expect(lineContainsSearch("Hello World", "WORLD")).toBe(true);
      expect(lineContainsSearch("HELLO WORLD", "hello")).toBe(true);
    });

    it("should return false when line does not contain search term", () => {
      expect(lineContainsSearch("Hello World", "xyz")).toBe(false);
    });

    it("should return false for empty search term", () => {
      expect(lineContainsSearch("Hello World", "")).toBe(false);
      expect(lineContainsSearch("Hello World", "   ")).toBe(false);
    });
  });

  describe("highlightSearchInLine", () => {
    it("should highlight single match", () => {
      const result = highlightSearchInLine("Hello World", "World");
      expect(result).toEqual([
        { text: "Hello ", isMatch: false },
        { text: "World", isMatch: true },
      ]);
    });

    it("should highlight multiple matches", () => {
      const result = highlightSearchInLine("test test test", "test");
      expect(result).toEqual([
        { text: "test", isMatch: true },
        { text: " ", isMatch: false },
        { text: "test", isMatch: true },
        { text: " ", isMatch: false },
        { text: "test", isMatch: true },
      ]);
    });

    it("should be case insensitive", () => {
      const result = highlightSearchInLine("Hello World", "world");
      expect(result).toEqual([
        { text: "Hello ", isMatch: false },
        { text: "World", isMatch: true },
      ]);
    });

    it("should return original line when no matches", () => {
      const result = highlightSearchInLine("Hello World", "xyz");
      expect(result).toEqual([{ text: "Hello World", isMatch: false }]);
    });

    it("should return original line for empty search term", () => {
      const result = highlightSearchInLine("Hello World", "");
      expect(result).toEqual([{ text: "Hello World", isMatch: false }]);
    });

    it("should handle overlapping matches correctly", () => {
      const result = highlightSearchInLine("aaa", "aa");
      expect(result).toEqual([
        { text: "aa", isMatch: true },
        { text: "a", isMatch: false },
      ]);
    });
  });

  describe("getSearchNavigationInfo", () => {
    it("should return correct navigation info", () => {
      const searchResults = [
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "test line",
        },
        {
          lineIndex: 3,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "another test",
        },
      ];

      expect(getSearchNavigationInfo(searchResults, 0)).toBe("1/2");
      expect(getSearchNavigationInfo(searchResults, 1)).toBe("2/2");
    });

    it("should return 'No matches' for empty results", () => {
      expect(getSearchNavigationInfo([], 0)).toBe("No matches");
    });
  });

  describe("searchInJsonSchema", () => {
    const testData: JsonValue = {
      name: "John Doe",
      age: 30,
      active: true,
    };

    it("should find matches in generated JSON schema", () => {
      const results = searchInJsonSchema(testData, "string");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((result) => result.contextLine.includes("string")),
      ).toBe(true);
    });

    it("should find type matches in schema", () => {
      const results = searchInJsonSchema(testData, "type");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((result) => result.contextLine.includes("type")),
      ).toBe(true);
    });

    it("should be case insensitive for schema search", () => {
      const results = searchInJsonSchema(testData, "STRING");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((result) =>
          result.matchText.toLowerCase().includes("string"),
        ),
      ).toBe(true);
    });

    it("should return empty array for invalid data", () => {
      const results = searchInJsonSchema(null, "test");
      expect(results).toEqual([]);
    });

    it("should return empty array for empty search term", () => {
      const results = searchInJsonSchema(testData, "");
      expect(results).toEqual([]);
    });
  });

  describe("searchInText", () => {
    const testText = `This is line 1
This is line 2 with test
Line 3 has another TEST
Final line`;

    it("should find matches in text", () => {
      const results = searchInText(testText, "test");
      expect(results).toHaveLength(2);
      expect(results[0]?.lineIndex).toBe(1);
      expect(results[1]?.lineIndex).toBe(2);
    });

    it("should be case insensitive", () => {
      const results = searchInText(testText, "TEST");
      expect(results).toHaveLength(2);
    });

    it("should return empty array for empty text", () => {
      const results = searchInText("", "test");
      expect(results).toEqual([]);
    });

    it("should return empty array for empty search term", () => {
      const results = searchInText(testText, "");
      expect(results).toEqual([]);
    });

    it("should find multiple matches in same line", () => {
      const text = "test and test again";
      const results = searchInText(text, "test");
      expect(results).toHaveLength(2);
      expect(results[0]?.columnStart).toBe(0);
      expect(results[1]?.columnStart).toBe(9);
    });
  });
});
