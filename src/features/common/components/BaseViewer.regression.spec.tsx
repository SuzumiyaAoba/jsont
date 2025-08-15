/**
 * Regression tests for BaseViewer based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Line numbers starting from 2 instead of 1
 * 2. Array elements getting duplicate line numbers
 * 3. Height calculation issues with border height
 * 4. Scroll range calculations
 */

import type { DataProcessor, Highlighter } from "@features/common/types/viewer";
import { render } from "ink-testing-library";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BaseViewer } from "./BaseViewer";

// Mock highlighter that preserves original text
const mockHighlighter: Highlighter = {
  tokenizeLine: (line: string) => [{ text: line, color: "white" }],
  applySearchHighlighting: (
    tokens,
    _searchTerm,
    _isCurrentResult,
    _isRegexMode,
    _position,
  ) => tokens,
};

// Mock data processor that splits JSON into lines
const mockJsonDataProcessor: DataProcessor = (data) => {
  if (!data) return null;
  const jsonString = JSON.stringify(data, null, 2);
  return jsonString.split("\n");
};

// Mock data processor that simulates long line splitting
const mockLongLineDataProcessor: DataProcessor = (data) => {
  if (!data) return null;
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");
  const processedLines: string[] = [];

  lines.forEach((line) => {
    if (line.length <= 40) {
      // Simulate maxLineLength = 40
      processedLines.push(line);
    } else {
      // Split long lines
      const chunks: string[] = [];
      let remaining = line;

      while (remaining.length > 40) {
        let splitIndex = 40;
        const breakPoint = remaining.lastIndexOf(" ", 40);
        if (breakPoint > 40 * 0.7) {
          splitIndex = breakPoint + 1;
        }
        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex);
      }

      if (remaining.length > 0) {
        chunks.push(remaining);
      }

      processedLines.push(...chunks);
    }
  });

  return processedLines;
};

describe("BaseViewer Regression Tests", () => {
  describe("Line Number Bug Fixes", () => {
    it("should start line numbers from 1, not 2", () => {
      const testData = {
        name: "test",
        value: 123,
      };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          showLineNumbers={true}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Should start with "1:" not "2:"
      expect(output).toContain("1:");
      expect(output).not.toMatch(/^[^1]*2:/); // Should not start with line 2
    });

    it("should assign unique line numbers to array elements", () => {
      const testData = {
        items: ["first", "second", "third"],
      };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          showLineNumbers={true}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Each array element should have its own line number
      const lineNumbers = output.match(/(\d+):/g) || [];
      const uniqueNumbers = new Set(lineNumbers);

      // Should have unique line numbers for each array element
      expect(uniqueNumbers.size).toBe(lineNumbers.length);

      // Should contain array elements with different line numbers
      expect(output).toContain('"first"');
      expect(output).toContain('"second"');
      expect(output).toContain('"third"');
    });

    it("should handle long line splitting with correct line numbers", () => {
      const testData = {
        longText:
          "This is a very long text that will be split across multiple lines when the maxLineLength is exceeded",
      };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          showLineNumbers={true}
          dataProcessor={mockLongLineDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Should have line numbers starting from 1
      expect(output).toContain("1:");

      // Split lines should have appropriate line numbering
      // (continuation lines may share line numbers, but first line should be 1)
      const firstLineMatch = output.match(/1:\s*\{/);
      expect(firstLineMatch).toBeTruthy();
    });
  });

  describe("Height and Scroll Calculation Bug Fixes", () => {
    it("should calculate height correctly without double border subtraction", () => {
      const testData = { simple: "test" };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          visibleLines={10}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Should render content (not be too short due to double border subtraction)
      expect(output).toContain("simple");
      expect(output).toContain("test");
    });

    it("should display all content including the last line", () => {
      const testData = {
        line1: "first",
        line2: "second",
        line3: "third",
        line4: "fourth",
        line5: "last",
      };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          visibleLines={20} // Ensure enough space
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Should display the closing brace (last line)
      expect(output).toContain("}");
      expect(output).toContain("last");
    });
  });

  describe("Search and Highlighting Integration", () => {
    it("should handle search results correctly", () => {
      const testData = { searchable: "content", other: "data" };

      const mockHighlighterWithSearch: Highlighter = {
        tokenizeLine: (line: string) => [{ text: line, color: "white" }],
        applySearchHighlighting: (tokens, searchTerm) => {
          if (searchTerm && tokens[0]?.text.includes(searchTerm)) {
            return [{ ...tokens[0], isMatch: true, color: "yellow" }];
          }
          return tokens;
        },
      };

      const { lastFrame } = render(
        <BaseViewer
          data={testData}
          searchTerm="content"
          searchResults={[{ lineIndex: 1, columnStart: 0, columnEnd: 7 }]}
          currentSearchIndex={0}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighterWithSearch}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();

      // Should contain the searchable content
      expect(output).toContain("content");
    });
  });

  describe("Empty State and Error Handling", () => {
    it("should display empty state message for null data", () => {
      const { lastFrame } = render(
        <BaseViewer
          data={null}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "No data available", color: "gray" }}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("No data available");
    });

    it("should display error state when data processor returns null", () => {
      const errorDataProcessor: DataProcessor = () => null;

      const { lastFrame } = render(
        <BaseViewer
          data={{ some: "data" }}
          dataProcessor={errorDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("Error processing data");
    });
  });

  describe("Custom Content Renderer", () => {
    it("should use custom content renderer when provided", () => {
      const customRenderer = vi.fn(() =>
        React.createElement("div", {}, "Custom content"),
      );

      render(
        <BaseViewer
          data={{ test: "data" }}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          contentRenderer={customRenderer}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      expect(customRenderer).toHaveBeenCalled();
    });

    it("should fall back to default renderer when custom renderer is not provided", () => {
      const { lastFrame } = render(
        <BaseViewer
          data={{ test: "data" }}
          dataProcessor={mockJsonDataProcessor}
          highlighter={mockHighlighter}
          emptyStateConfig={{ message: "Empty", color: "gray" }}
        />,
      );

      const output = lastFrame();
      expect(output).toContain("test");
      expect(output).toContain("data");
    });
  });
});
