import { describe, expect, it } from "vitest";
import {
  applySearchHighlighting,
  DEFAULT_COLOR_SCHEME,
  getJsonValueColor,
  isKeyValueLine,
  isSchemaKeywordLine,
  isStructuralLine,
  parseKeyValueLine,
  tokenizeLine,
} from "./syntaxHighlight";

describe("syntaxHighlight", () => {
  describe("getJsonValueColor", () => {
    it("should return correct colors for different JSON values", () => {
      expect(getJsonValueColor("{", DEFAULT_COLOR_SCHEME)).toBe("magenta");
      expect(getJsonValueColor("[", DEFAULT_COLOR_SCHEME)).toBe("cyan");
      expect(getJsonValueColor('"hello"', DEFAULT_COLOR_SCHEME)).toBe("green");
      expect(getJsonValueColor("true", DEFAULT_COLOR_SCHEME)).toBe("yellow");
      expect(getJsonValueColor("false", DEFAULT_COLOR_SCHEME)).toBe("yellow");
      expect(getJsonValueColor("null", DEFAULT_COLOR_SCHEME)).toBe("gray");
      expect(getJsonValueColor("123", DEFAULT_COLOR_SCHEME)).toBe("cyan");
      expect(getJsonValueColor("45.67", DEFAULT_COLOR_SCHEME)).toBe("cyan");
      expect(getJsonValueColor("other", DEFAULT_COLOR_SCHEME)).toBe("white");
    });

    it("should handle values with trailing commas", () => {
      expect(getJsonValueColor('"hello",', DEFAULT_COLOR_SCHEME)).toBe("green");
      expect(getJsonValueColor("true,", DEFAULT_COLOR_SCHEME)).toBe("yellow");
      expect(getJsonValueColor("123,", DEFAULT_COLOR_SCHEME)).toBe("cyan");
    });
  });

  describe("isKeyValueLine", () => {
    it("should identify key-value lines correctly", () => {
      expect(isKeyValueLine('  "name": "John"')).toBe(true);
      expect(isKeyValueLine('  "age": 30')).toBe(true);
      expect(isKeyValueLine("  {")).toBe(false);
      expect(isKeyValueLine("  }")).toBe(false);
      expect(isKeyValueLine('  "items"')).toBe(false);
    });
  });

  describe("isStructuralLine", () => {
    it("should identify structural lines correctly", () => {
      expect(isStructuralLine("  {")).toBe(true);
      expect(isStructuralLine("  }")).toBe(true);
      expect(isStructuralLine("  [")).toBe(true);
      expect(isStructuralLine("  ]")).toBe(true);
      expect(isStructuralLine("  },")).toBe(true);
      expect(isStructuralLine("  ],")).toBe(true);
      expect(isStructuralLine('  "name": "John"')).toBe(false);
    });
  });

  describe("isSchemaKeywordLine", () => {
    it("should identify schema keyword lines correctly", () => {
      expect(isSchemaKeywordLine('  "$schema": "..."')).toBe(true);
      expect(isSchemaKeywordLine('  "title": "..."')).toBe(true);
      expect(isSchemaKeywordLine('  "description": "..."')).toBe(true);
      expect(isSchemaKeywordLine('  "type": "string"')).toBe(true);
      expect(isSchemaKeywordLine('  "name": "John"')).toBe(false);
    });
  });

  describe("parseKeyValueLine", () => {
    it("should parse key-value lines correctly", () => {
      const result = parseKeyValueLine('  "name": "John"');
      expect(result.beforeColon).toBe('  "name"');
      expect(result.value).toBe('"John"');
      expect(result.isStructuralValue).toBe(false);
    });

    it("should identify structural values", () => {
      const result1 = parseKeyValueLine('  "address": {');
      expect(result1.isStructuralValue).toBe(true);
      expect(result1.value).toBe("{");

      const result2 = parseKeyValueLine('  "items": [');
      expect(result2.isStructuralValue).toBe(true);
      expect(result2.value).toBe("[");
    });
  });

  describe("tokenizeLine", () => {
    it("should tokenize structural lines correctly", () => {
      const tokens = tokenizeLine("  {", "", DEFAULT_COLOR_SCHEME);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.color).toBe("magenta");
      expect(tokens[0]?.text).toBe("  {");
    });

    it("should tokenize key-value lines correctly", () => {
      const tokens = tokenizeLine('  "name": "John"', "", DEFAULT_COLOR_SCHEME);
      expect(tokens).toHaveLength(3); // key, colon+space, value (no comma in this example)
      expect(tokens[0]?.color).toBe("blue"); // key (regular JSON property uses blue)
      expect(tokens[1]?.color).toBe("white"); // colon and space
      expect(tokens[2]?.color).toBe("green"); // string value
    });

    it("should tokenize array values correctly", () => {
      const tokens = tokenizeLine('    "item1",', "", DEFAULT_COLOR_SCHEME);
      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.color).toBe("white"); // leading whitespace
      expect(tokens[1]?.color).toBe("green"); // string value
      expect(tokens[2]?.color).toBe("white"); // comma
    });

    it("should handle empty lines", () => {
      const tokens = tokenizeLine("", "", DEFAULT_COLOR_SCHEME);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.color).toBe("white");
      expect(tokens[0]?.text).toBe("");
    });
  });

  describe("applySearchHighlighting", () => {
    it("should apply search highlighting to matching tokens", () => {
      const inputTokens = [
        { text: "Hello ", color: "white" },
        { text: "world", color: "green" },
        { text: "!", color: "white" },
      ];

      const result = applySearchHighlighting(inputTokens, "world", false);

      expect(result).toHaveLength(3);
      expect(result[0]?.text).toBe("Hello ");
      expect(result[0]?.color).toBe("white");
      expect(result[0]?.isMatch).toBeUndefined();

      expect(result[1]?.text).toBe("world");
      expect(result[1]?.color).toBe("black");
      expect(result[1]?.isMatch).toBe(true);

      expect(result[2]?.text).toBe("!");
      expect(result[2]?.color).toBe("white");
      expect(result[2]?.isMatch).toBeUndefined();
    });

    it("should handle current search result highlighting", () => {
      const inputTokens = [{ text: "test", color: "green" }];
      const result = applySearchHighlighting(inputTokens, "test", true);

      expect(result[0]?.color).toBe("white");
      expect(result[0]?.isMatch).toBe(true);
    });

    it("should handle partial matches within tokens", () => {
      const inputTokens = [{ text: "testing", color: "green" }];
      const result = applySearchHighlighting(inputTokens, "test", false);

      expect(result).toHaveLength(2);
      expect(result[0]?.text).toBe("test");
      expect(result[0]?.isMatch).toBe(true);
      expect(result[1]?.text).toBe("ing");
      expect(result[1]?.color).toBe("green");
    });

    it("should be case insensitive", () => {
      const inputTokens = [{ text: "Hello World", color: "white" }];
      const result = applySearchHighlighting(inputTokens, "WORLD", false);

      expect(result).toHaveLength(2);
      expect(result[0]?.text).toBe("Hello ");
      expect(result[1]?.text).toBe("World");
      expect(result[1]?.isMatch).toBe(true);
    });

    it("should return original tokens when no search term", () => {
      const inputTokens = [{ text: "test", color: "green" }];
      const result = applySearchHighlighting(inputTokens, "", false);

      expect(result).toEqual(inputTokens);
    });
  });
});
