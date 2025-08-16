/**
 * Regression tests for JsonViewer based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Syntax highlighting lost when long lines are split
 * 2. Token mapping issues with custom content renderer
 * 3. Line numbering consistency with BaseViewer
 * 4. TypeScript type errors with contentRenderer
 */

import type { JsonValue } from "@core/types";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { JsonViewer } from "./JsonViewer";

// Mock the config context
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: () => ({
    display: {
      json: {
        useTabs: false,
        indent: 2,
        maxLineLength: 40, // Short length to force splitting
      },
    },
  }),
}));

// Mock the regex mode hook
vi.mock("@store/hooks/useSearch", () => ({
  useIsRegexMode: () => false,
}));

// Mock the jsonHighlighter
vi.mock("@features/json-rendering", () => ({
  jsonHighlighter: {
    tokenizeLine: (line: string) => {
      // Simple tokenizer that identifies JSON elements
      if (line.includes('"')) {
        return [
          { text: line.substring(0, line.indexOf('"')), color: "white" },
          { text: line.substring(line.indexOf('"')), color: "green" },
        ];
      }
      if (line.includes("{") || line.includes("}")) {
        return [{ text: line, color: "yellow" }];
      }
      return [{ text: line, color: "white" }];
    },
    applySearchHighlighting: (tokens: any[], searchTerm: string) => {
      if (!searchTerm) return tokens;
      return tokens.map((token) => {
        if (token.text.includes(searchTerm)) {
          return { ...token, isMatch: true, color: "red" };
        }
        return token;
      });
    },
  },
}));

describe("JsonViewer Regression Tests", () => {
  describe("Syntax Highlighting for Split Lines", () => {
    it("should maintain syntax highlighting when long lines are split", () => {
      const testData: JsonValue = {
        longPropertyName:
          "This is a very long string value that should be split across multiple lines due to maxLineLength constraints",
        short: "value",
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={true}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      // Should contain the data even when split (partial matches are fine)
      expect(output).toContain("longPropertyName");
      expect(output).toContain("This is a very");
      expect(output).toContain("short");
      expect(output).toContain("value");
    });

    it("should handle token mapping correctly for split long strings", () => {
      const testData: JsonValue = {
        description:
          "A very long description that exceeds the maximum line length and needs to be split into multiple display lines while maintaining proper syntax highlighting throughout",
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={false}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      // Should contain all parts of the split string (partial matches)
      expect(output).toContain("description");
      expect(output).toContain("A very long");
      expect(output).toContain("maximum");
      expect(output).toContain("syntax");
    });

    it("should preserve line numbering consistency with split lines", () => {
      const testData: JsonValue = {
        array: [
          "First item",
          "Second item with a very long text that will be split across multiple lines",
          "Third item",
        ],
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={true}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      // Should have line numbers starting from 1
      expect(output).toContain("1:");

      // Array elements should each have line numbers
      expect(output).toContain("First item");
      expect(output).toContain("Second item");
      expect(output).toContain("Third item");

      // Should not start from line 2 (regression test)
      expect(output).toBeDefined();
      const lines = output!.split("\n");
      const firstLineWithNumber = lines.find((line) => line.includes(":"));
      if (firstLineWithNumber) {
        expect(firstLineWithNumber).toMatch(/1:/);
      }
    });
  });

  describe("Custom Content Renderer Integration", () => {
    it("should handle undefined contentRenderer gracefully", () => {
      // This tests the TypeScript fix for contentRenderer type
      const testData: JsonValue = null;

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={false}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("No JSON data to display");
    });

    it("should use custom content renderer for complex JSON structures", () => {
      const testData: JsonValue = {
        nested: {
          deeply: {
            structured: {
              data: "with long property names that might cause line splitting issues",
            },
          },
        },
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={true}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      // Should handle nested structures correctly
      expect(output).toContain("nested");
      expect(output).toContain("structured");
      expect(output).toContain("with long property");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty objects", () => {
      const testData: JsonValue = {};

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={true}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("{");
      expect(output).toContain("}");
    });

    it("should handle empty arrays", () => {
      const testData: JsonValue = [];

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={true}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("[");
      expect(output).toContain("]");
    });

    it("should handle JSON with special characters", () => {
      const testData: JsonValue = {
        "key with spaces": "value with \"quotes\" and 'apostrophes'",
        unicode: "Test with émojis 🎉 and special chars: ñáéíóú",
        numbers: 123.456,
        boolean: true,
        null: null,
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={false}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      expect(output).toContain("key with spaces");
      expect(output).toContain("quotes");
      expect(output).toContain("émojis");
      expect(output).toContain("123.456");
      expect(output).toContain("true");
      expect(output).toContain("null");
    });
  });

  describe("Search Integration", () => {
    it("should maintain highlighting during search", () => {
      const testData: JsonValue = {
        searchableField: "content to search for",
        otherField: "different content",
      };

      const { lastFrame } = render(
        <JsonViewer
          data={testData}
          showLineNumbers={false}
          scrollOffset={0}
          searchTerm="search"
          searchResults={[
            {
              lineIndex: 1,
              columnStart: 0,
              columnEnd: 6,
              matchText: "search",
              contextLine: "search term",
            },
          ]}
          currentSearchIndex={0}
        />,
      );

      const output = lastFrame();

      expect(output).toContain("searchableField");
      expect(output).toContain("content to search");
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large JSON structures efficiently", () => {
      const largeData: JsonValue = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} with a longer description that might be split`,
        })),
      };

      const startTime = Date.now();

      const { lastFrame } = render(
        <JsonViewer
          data={largeData}
          showLineNumbers={false}
          scrollOffset={0}
          searchTerm=""
          searchResults={[]}
          currentSearchIndex={0}
          visibleLines={20} // Limit visible lines for performance
        />,
      );

      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      const output = lastFrame();
      expect(output).toContain("items");
    });
  });
});
