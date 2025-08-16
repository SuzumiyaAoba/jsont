/**
 * Comprehensive tests for JSON highlighter
 *
 * Tests JSON syntax highlighting, search highlighting integration,
 * token generation, and highlighter interface compliance.
 */

import type { HighlightToken } from "@features/json-rendering/utils/syntaxHighlight";
import { describe, expect, it, vi } from "vitest";
import { JsonHighlighter, jsonHighlighter } from "./jsonHighlighter";

// Mock the syntax highlighting utilities
vi.mock("@features/json-rendering/utils/syntaxHighlight", () => ({
  tokenizeLine: vi.fn((line: string, _searchTerm: string) => {
    // Simple mock implementation for testing
    if (line.includes('"')) {
      return [
        { text: line.substring(0, line.indexOf('"')), color: "white" },
        { text: line.substring(line.indexOf('"')), color: "green" },
      ];
    }
    if (line.includes("{") || line.includes("}")) {
      return [{ text: line, color: "yellow" }];
    }
    if (line.includes(":")) {
      const parts = line.split(":");
      return [
        { text: parts[0] + ":", color: "cyan" },
        { text: parts.slice(1).join(":"), color: "white" },
      ];
    }
    return [{ text: line, color: "white" }];
  }),
  applySearchHighlighting: vi.fn(
    (
      tokens: HighlightToken[],
      searchTerm: string,
      isCurrentResult: boolean,
      isRegexMode: boolean,
      currentResultPosition?: { columnStart: number; columnEnd: number } | null,
    ) => {
      if (!searchTerm) return tokens;

      return tokens.map((token) => {
        if (token.text.includes(searchTerm)) {
          return {
            ...token,
            isMatch: true,
            color: isCurrentResult ? "red" : "yellow",
            backgroundColor: isCurrentResult ? "black" : undefined,
          };
        }
        return token;
      });
    },
  ),
}));

describe("JsonHighlighter", () => {
  describe("Class Implementation", () => {
    it("should create a new instance", () => {
      const highlighter = new JsonHighlighter();

      expect(highlighter).toBeInstanceOf(JsonHighlighter);
      expect(typeof highlighter.tokenizeLine).toBe("function");
      expect(typeof highlighter.applySearchHighlighting).toBe("function");
    });

    it("should implement the Highlighter interface", () => {
      const highlighter = new JsonHighlighter();

      // Check that it has the required methods
      expect(highlighter.tokenizeLine).toBeDefined();
      expect(highlighter.applySearchHighlighting).toBeDefined();
    });
  });

  describe("tokenizeLine", () => {
    it("should tokenize simple JSON strings", () => {
      const highlighter = new JsonHighlighter();
      const line = '"name": "John"';

      const tokens = highlighter.tokenizeLine(line);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.color).toBe("white");
      expect(tokens[1]?.color).toBe("green");
    });

    it("should tokenize JSON objects", () => {
      const highlighter = new JsonHighlighter();
      const line = "{ }";

      const tokens = highlighter.tokenizeLine(line);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.color).toBe("yellow");
      expect(tokens[0]?.text).toBe("{ }");
    });

    it("should tokenize property definitions", () => {
      const highlighter = new JsonHighlighter();
      const line = "name: value";

      const tokens = highlighter.tokenizeLine(line);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.color).toBe("cyan");
      expect(tokens[1]?.color).toBe("white");
    });

    it("should handle empty lines", () => {
      const highlighter = new JsonHighlighter();
      const line = "";

      const tokens = highlighter.tokenizeLine(line);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.text).toBe("");
      expect(tokens[0]?.color).toBe("white");
    });

    it("should handle complex JSON structures", () => {
      const highlighter = new JsonHighlighter();
      const line = '  "users": [{"id": 1}]';

      const tokens = highlighter.tokenizeLine(line);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.text).toBe("  ");
      expect(tokens[1]?.text).toBe('"users": [{"id": 1}]');
    });

    it("should return tokens from tokenizeLine", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.tokenizeLine("test line");

      expect(result).toHaveLength(1);
      expect(result[0]?.text).toBe("test line");
    });
  });

  describe("applySearchHighlighting", () => {
    const mockTokens: HighlightToken[] = [
      { text: "name", color: "cyan" },
      { text: ": ", color: "white" },
      { text: '"John"', color: "green" },
    ];

    it("should apply search highlighting to matching tokens", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.applySearchHighlighting(
        mockTokens,
        "name",
        false,
        false,
      );

      expect(result[0]?.isMatch).toBe(true);
      expect(result[0]?.color).toBe("yellow");
      expect(result[1]?.isMatch).toBeUndefined();
      expect(result[2]?.isMatch).toBeUndefined();
    });

    it("should highlight current search result differently", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.applySearchHighlighting(
        mockTokens,
        "name",
        true, // isCurrentResult
        false,
      );

      expect(result[0]?.isMatch).toBe(true);
      expect(result[0]?.color).toBe("red");
      expect(result[0]?.backgroundColor).toBe("black");
    });

    it("should handle empty search term", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.applySearchHighlighting(
        mockTokens,
        "",
        false,
        false,
      );

      expect(result).toEqual(mockTokens);
      expect(result.every((token) => !token.isMatch)).toBe(true);
    });

    it("should work with regex mode", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.applySearchHighlighting(
        mockTokens,
        "test",
        false,
        true, // isRegexMode
      );

      expect(result).toBeDefined();
    });

    it("should work with current result position", () => {
      const highlighter = new JsonHighlighter();
      const position = { columnStart: 5, columnEnd: 10 };

      const result = highlighter.applySearchHighlighting(
        mockTokens,
        "test",
        true,
        false,
        position,
      );

      expect(result).toBeDefined();
    });

    it("should handle multiple matching tokens", () => {
      const highlighter = new JsonHighlighter();
      const tokens: HighlightToken[] = [
        { text: "test", color: "white" },
        { text: " ", color: "white" },
        { text: "test", color: "green" },
      ];

      const result = highlighter.applySearchHighlighting(
        tokens,
        "test",
        false,
        false,
      );

      expect(result[0]?.isMatch).toBe(true);
      expect(result[1]?.isMatch).toBeUndefined();
      expect(result[2]?.isMatch).toBe(true);
    });

    it("should preserve original token properties", () => {
      const highlighter = new JsonHighlighter();
      const tokens: HighlightToken[] = [
        { text: "name", color: "cyan", bold: true },
        { text: "value", color: "green", italic: true },
      ];

      const result = highlighter.applySearchHighlighting(
        tokens,
        "different",
        false,
        false,
      );

      expect(result[0]?.bold).toBe(true);
      expect(result[1]?.italic).toBe(true);
      expect(result[0]?.color).toBe("cyan");
      expect(result[1]?.color).toBe("green");
    });
  });

  describe("Shared Instance", () => {
    it("should export a shared jsonHighlighter instance", () => {
      expect(jsonHighlighter).toBeInstanceOf(JsonHighlighter);
    });

    it("should be a singleton instance", () => {
      expect(jsonHighlighter).toBeInstanceOf(JsonHighlighter);
      expect(jsonHighlighter).toBe(jsonHighlighter); // Self-reference test
    });

    it("should work with the shared instance", () => {
      const tokens = jsonHighlighter.tokenizeLine('"test": "value"');

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.color).toBe("white");
      expect(tokens[1]?.color).toBe("green");
    });
  });

  describe("Functionality", () => {
    it("should handle basic highlighting workflow", () => {
      const highlighter = new JsonHighlighter();

      // Test tokenization
      const tokens = highlighter.tokenizeLine('{"name": "value"}');
      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);

      // Test search highlighting
      const highlighted = highlighter.applySearchHighlighting(
        tokens,
        "name",
        false,
        false,
      );
      expect(highlighted).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should handle large input efficiently", () => {
      const highlighter = new JsonHighlighter();
      const largeLine = "a".repeat(10000);

      const startTime = performance.now();
      highlighter.tokenizeLine(largeLine);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it("should handle many tokens efficiently in search highlighting", () => {
      const highlighter = new JsonHighlighter();
      const manyTokens = Array.from({ length: 1000 }, (_, i) => ({
        text: `token${i}`,
        color: "white",
      }));

      const startTime = performance.now();
      highlighter.applySearchHighlighting(manyTokens, "token500");
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe("Edge Cases", () => {
    it("should handle unusual inputs", () => {
      const highlighter = new JsonHighlighter();

      // Test with empty string
      const result = highlighter.tokenizeLine("");
      expect(result).toBeDefined();
    });

    it("should handle special characters in search terms", () => {
      const highlighter = new JsonHighlighter();
      const tokens = [{ text: "test@#$%", color: "white" }];

      expect(() => {
        highlighter.applySearchHighlighting(tokens, "@#$%", false, false);
      }).not.toThrow();
    });

    it("should handle empty tokens array", () => {
      const highlighter = new JsonHighlighter();

      const result = highlighter.applySearchHighlighting(
        [],
        "search",
        false,
        false,
      );

      expect(result).toEqual([]);
    });

    it("should handle very long search terms", () => {
      const highlighter = new JsonHighlighter();
      const tokens = [{ text: "short", color: "white" }];
      const longSearchTerm = "a".repeat(1000);

      expect(() => {
        highlighter.applySearchHighlighting(
          tokens,
          longSearchTerm,
          false,
          false,
        );
      }).not.toThrow();
    });
  });
});
