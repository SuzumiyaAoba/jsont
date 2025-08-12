import {
  getNextSearchScope,
  getRegexModeDisplayName,
  getSearchNavigationInfo,
  getSearchScopeDisplayName,
  highlightSearchInLine,
  lineContainsSearch,
  searchInJson,
  searchInJsonWithScope,
  searchInText,
  toggleRegexMode,
} from "@features/search/utils/searchUtils.js";
import { describe, expect, it } from "vitest";

describe("searchUtils", () => {
  describe("searchInJson", () => {
    const testData = {
      name: "John Doe",
      age: 30,
      city: "New York",
      hobbies: ["reading", "coding"],
      address: {
        street: "123 Main St",
        country: "USA",
      },
    };

    it("should find matches in all content when scope is 'all'", () => {
      const results = searchInJson(testData, "John", "all");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("John");
    });

    it("should find matches only in keys when scope is 'keys'", () => {
      const results = searchInJson(testData, "name", "keys");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("name");
    });

    it("should find matches only in values when scope is 'values'", () => {
      const results = searchInJson(testData, "John", "values");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("John");
    });

    it("should not find key matches in values scope", () => {
      const results = searchInJson(testData, "name", "values");
      expect(results.length).toBe(0);
    });

    it("should not find value matches in keys scope", () => {
      const results = searchInJson(testData, "John", "keys");
      expect(results.length).toBe(0);
    });

    it("should return empty array for empty search term", () => {
      const results = searchInJson(testData, "", "all");
      expect(results).toEqual([]);
    });

    it("should return empty array for null data", () => {
      const results = searchInJson(null, "test", "all");
      expect(results).toEqual([]);
    });

    it("should be case insensitive", () => {
      const results = searchInJson(testData, "john", "all");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("John");
    });
  });

  describe("searchInJsonWithScope", () => {
    const testData = {
      userName: "alice",
      userAge: 25,
      settings: {
        theme: "dark",
        language: "en",
      },
    };

    it("should find key matches only in keys scope", () => {
      const results = searchInJsonWithScope(testData, "user", "keys");
      expect(results.length).toBe(2); // userName and userAge
      expect(results.every((r) => r.matchText === "user")).toBe(true);
    });

    it("should find value matches only in values scope", () => {
      const results = searchInJsonWithScope(testData, "alice", "values");
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("alice");
    });

    it("should handle nested objects in keys scope", () => {
      const results = searchInJsonWithScope(testData, "theme", "keys");
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("theme");
    });

    it("should handle nested objects in values scope", () => {
      const results = searchInJsonWithScope(testData, "dark", "values");
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("dark");
    });

    it("should return empty array for non-matching search", () => {
      const results = searchInJsonWithScope(testData, "nonexistent", "keys");
      expect(results).toEqual([]);
    });

    it("should handle JSON values containing colons correctly", () => {
      const testDataWithColons = {
        url: "https://example.com:8080/path",
        message: "Error: connection failed",
        timestamp: "2024-01-01T10:00:00Z",
      };

      // Should find 'url' key but not match colons in the URL value
      const keyResults = searchInJsonWithScope(
        testDataWithColons,
        "url",
        "keys",
      );
      expect(keyResults.length).toBe(1);
      expect(keyResults[0]?.matchText).toBe("url");

      // Should find the URL in values
      const valueResults = searchInJsonWithScope(
        testDataWithColons,
        "https",
        "values",
      );
      expect(valueResults.length).toBe(1);
      expect(valueResults[0]?.matchText).toBe("https");

      // Should find 'Error' in the message value, not be confused by the colon
      const errorResults = searchInJsonWithScope(
        testDataWithColons,
        "Error",
        "values",
      );
      expect(errorResults.length).toBe(1);
      expect(errorResults[0]?.matchText).toBe("Error");
    });
  });

  describe("searchInText", () => {
    const testText = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`;

    it("should find all occurrences of search term", () => {
      const results = searchInText(testText, "name");
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("name");
      expect(results[0]?.lineIndex).toBe(1);
    });

    it("should find multiple occurrences in same line", () => {
      const text = "test test test";
      const results = searchInText(text, "test");
      expect(results.length).toBe(3);
    });

    it("should be case insensitive", () => {
      const results = searchInText(testText, "JOHN");
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("John");
    });

    it("should return empty array for empty text", () => {
      const results = searchInText("", "test");
      expect(results).toEqual([]);
    });

    it("should return empty array for empty search term", () => {
      const results = searchInText(testText, "");
      expect(results).toEqual([]);
    });
  });

  describe("getSearchNavigationInfo", () => {
    it("should return correct navigation info for results", () => {
      const mockResults = [
        {
          lineIndex: 0,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "test line",
        },
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "test line",
        },
      ];

      const info = getSearchNavigationInfo(mockResults, 0);
      expect(info).toBe("1/2");

      const info2 = getSearchNavigationInfo(mockResults, 1);
      expect(info2).toBe("2/2");
    });

    it("should return 'No matches' for empty results", () => {
      const info = getSearchNavigationInfo([], 0);
      expect(info).toBe("No matches");
    });
  });

  describe("getSearchScopeDisplayName", () => {
    it("should return correct display names", () => {
      expect(getSearchScopeDisplayName("all")).toBe("All");
      expect(getSearchScopeDisplayName("keys")).toBe("Keys");
      expect(getSearchScopeDisplayName("values")).toBe("Values");
    });

    it("should return 'All' for unknown scope", () => {
      // @ts-ignore - testing runtime behavior
      expect(getSearchScopeDisplayName("unknown")).toBe("All");
    });
  });

  describe("getNextSearchScope", () => {
    it("should cycle through scopes correctly", () => {
      expect(getNextSearchScope("all")).toBe("keys");
      expect(getNextSearchScope("keys")).toBe("values");
      expect(getNextSearchScope("values")).toBe("all");
    });

    it("should default to 'all' for unknown scope", () => {
      // @ts-ignore - testing runtime behavior
      expect(getNextSearchScope("unknown")).toBe("all");
    });
  });

  describe("lineContainsSearch", () => {
    it("should return true when line contains search term", () => {
      expect(lineContainsSearch("Hello world", "world")).toBe(true);
      expect(lineContainsSearch("Hello World", "world")).toBe(true); // case insensitive
    });

    it("should return false when line does not contain search term", () => {
      expect(lineContainsSearch("Hello world", "test")).toBe(false);
    });

    it("should return false for empty search term", () => {
      expect(lineContainsSearch("Hello world", "")).toBe(false);
      expect(lineContainsSearch("Hello world", "   ")).toBe(false);
    });
  });

  describe("highlightSearchInLine", () => {
    it("should split line into highlighted and non-highlighted parts", () => {
      const result = highlightSearchInLine("Hello world test", "world");

      expect(result).toEqual([
        { text: "Hello ", isMatch: false },
        { text: "world", isMatch: true },
        { text: " test", isMatch: false },
      ]);
    });

    it("should handle multiple matches in one line", () => {
      const result = highlightSearchInLine("test and test", "test");

      expect(result).toEqual([
        { text: "test", isMatch: true },
        { text: " and ", isMatch: false },
        { text: "test", isMatch: true },
      ]);
    });

    it("should handle case insensitive matches", () => {
      const result = highlightSearchInLine("Hello WORLD", "world");

      expect(result).toEqual([
        { text: "Hello ", isMatch: false },
        { text: "WORLD", isMatch: true },
      ]);
    });

    it("should return whole line as non-match for empty search", () => {
      const result = highlightSearchInLine("Hello world", "");

      expect(result).toEqual([{ text: "Hello world", isMatch: false }]);
    });

    it("should handle line with no matches", () => {
      const result = highlightSearchInLine("Hello world", "test");

      expect(result).toEqual([{ text: "Hello world", isMatch: false }]);
    });

    it("should handle match at start of line", () => {
      const result = highlightSearchInLine("test hello", "test");

      expect(result).toEqual([
        { text: "test", isMatch: true },
        { text: " hello", isMatch: false },
      ]);
    });

    it("should handle match at end of line", () => {
      const result = highlightSearchInLine("hello test", "test");

      expect(result).toEqual([
        { text: "hello ", isMatch: false },
        { text: "test", isMatch: true },
      ]);
    });

    it("should highlight regex patterns when regex mode is enabled", () => {
      const result = highlightSearchInLine(
        "Email: user@example.com",
        "\w+@\w+\.\w+",
        true,
      );

      expect(result).toEqual([
        { text: "Email: ", isMatch: false },
        { text: "user@example.com", isMatch: true },
      ]);
    });

    it("should handle multiple regex matches in one line", () => {
      const result = highlightSearchInLine(
        "Emails: user@test.com admin@test.com",
        "\w+@\w+\.\w+",
        true,
      );

      expect(result).toEqual([
        { text: "Emails: ", isMatch: false },
        { text: "user@test.com", isMatch: true },
        { text: " ", isMatch: false },
        { text: "admin@test.com", isMatch: true },
      ]);
    });

    it("should fallback to literal search for invalid regex", () => {
      const result = highlightSearchInLine(
        "hello [unclosed",
        "[unclosed",
        true,
      );

      expect(result).toEqual([
        { text: "hello ", isMatch: false },
        { text: "[unclosed", isMatch: true },
      ]);
    });

    it("should work normally when regex mode is disabled", () => {
      const result = highlightSearchInLine("user@example.com", "\w+", false);

      expect(result).toEqual([{ text: "user@example.com", isMatch: false }]);
    });
  });

  describe("regex mode functions", () => {
    describe("toggleRegexMode", () => {
      it("should toggle regex mode from false to true", () => {
        expect(toggleRegexMode(false)).toBe(true);
      });

      it("should toggle regex mode from true to false", () => {
        expect(toggleRegexMode(true)).toBe(false);
      });
    });

    describe("getRegexModeDisplayName", () => {
      it("should return '.*' for regex mode enabled", () => {
        expect(getRegexModeDisplayName(true)).toBe(".*");
      });

      it("should return 'Aa' for regex mode disabled", () => {
        expect(getRegexModeDisplayName(false)).toBe("Aa");
      });
    });
  });

  describe("searchInJson with regex mode", () => {
    const testData = {
      name: "John Doe",
      email: "john.doe@example.com",
      age: 30,
      city: "New York",
      description: "Software engineer with 5+ years experience",
    };

    it("should find regex matches in all content", () => {
      // Test email pattern
      const results = searchInJson(
        testData,
        "[\\w.]+@\\w+\\.\\w+",
        "all",
        true,
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("john.doe@example.com");
    });

    it("should find regex matches only in keys", () => {
      // Test keys containing 'e'
      const results = searchInJson(testData, "\\w*e\\w*", "keys", true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.matchText === "name")).toBe(true);
    });

    it("should find regex matches only in values", () => {
      // Test number pattern
      const results = searchInJson(testData, "\\d+", "values", true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("30");
    });

    it("should handle invalid regex gracefully", () => {
      // Invalid regex should fall back to literal string search
      const results = searchInJson(testData, "[invalid", "all", true);
      expect(results).toEqual([]); // Should not find literal "[invalid"
    });

    it("should work with case insensitive regex", () => {
      // Regex with 'i' flag is handled internally
      const results = searchInJson(testData, "JOHN", "all", true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe("John");
    });

    it("should handle zero-length matches correctly", () => {
      // Test word boundaries
      const results = searchInJson(testData, "\\b", "all", true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("searchInText with regex mode", () => {
    const testText = `{
  "name": "John",
  "age": 30,
  "email": "john@test.com",
  "city": "New York"
}`;

    it("should find regex patterns in text", () => {
      // Test email pattern
      const results = searchInText(testText, "\\w+@\\w+\\.\\w+", true);
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("john@test.com");
    });

    it("should handle multiple regex matches", () => {
      // Test quoted strings pattern
      const results = searchInText(testText, '"[^"]*"', true);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should fall back to literal search for invalid regex", () => {
      // Invalid regex should not throw error
      const results = searchInText(testText, "[unclosed", true);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it("should work without regex mode (backward compatibility)", () => {
      const results = searchInText(testText, "John", false);
      expect(results.length).toBe(2); // Finds both "John" and "john" (case-insensitive)
      expect(results[0]?.matchText).toBe("John");
    });
  });

  describe("searchInJsonWithScope with regex mode", () => {
    const testData = {
      firstName: "Alice",
      lastName: "Smith",
      email: "alice.smith@company.com",
      phoneNumber: "555-123-4567",
      address: {
        streetAddress: "123 Main St",
        cityName: "Boston",
      },
    };

    it("should find regex matches in keys scope", () => {
      // Test keys containing 'Name'
      const results = searchInJsonWithScope(testData, "\\w*Name", "keys", true);
      expect(results.length).toBe(3); // firstName, lastName, cityName
      expect(results.some((r) => r.matchText === "firstName")).toBe(true);
      expect(results.some((r) => r.matchText === "lastName")).toBe(true);
      expect(results.some((r) => r.matchText === "cityName")).toBe(true);
    });

    it("should find regex matches in values scope", () => {
      // Test phone number pattern
      const results = searchInJsonWithScope(
        testData,
        "\\d{3}-\\d{3}-\\d{4}",
        "values",
        true,
      );
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("555-123-4567");
    });

    it("should handle email regex in values", () => {
      const results = searchInJsonWithScope(
        testData,
        "\\w+\\.\\w+@\\w+\\.\\w+",
        "values",
        true,
      );
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("alice.smith@company.com");
    });

    it("should handle invalid regex gracefully in scoped search", () => {
      const results = searchInJsonWithScope(testData, "[invalid", "keys", true);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it("should work with complex nested regex patterns", () => {
      // Test street addresses (numbers followed by words)
      const results = searchInJsonWithScope(
        testData,
        "\\d+\\s+\\w+\\s+\\w+",
        "values",
        true,
      );
      expect(results.length).toBe(1);
      expect(results[0]?.matchText).toBe("123 Main St");
    });
  });
});
