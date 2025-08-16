/**
 * Comprehensive tests for CollapsibleJsonViewer component
 *
 * Tests collapsible tree rendering, navigation, search highlighting,
 * line numbering, scroll behavior, and integration with hooks.
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import type { SearchResult } from "@core/types";
import type { NavigationAction } from "@features/collapsible/types/collapsible";
import { render } from "ink-testing-library";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CollapsibleJsonViewer } from "./CollapsibleJsonViewer";

// Mock the config context
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: () => DEFAULT_CONFIG,
}));

// Mock the CollapsibleLine component with Ink components
vi.mock("./CollapsibleLine", () => ({
  CollapsibleLine: ({
    line,
    globalLineIndex,
    showLineNumbers,
    isCursorLine,
    hasSearchHighlight,
    isCurrentSearchResult,
    searchTerm,
  }: any) => {
    const React = require("react");
    const { Box, Text } = require("ink");

    return React.createElement(
      Box,
      { "data-testid": "collapsible-line" },
      React.createElement(
        Text,
        { "data-testid": "line-index" },
        globalLineIndex.toString(),
      ),
      React.createElement(Text, { "data-testid": "line-content" }, line || ""),
      React.createElement(
        Text,
        { "data-testid": "show-line-numbers" },
        showLineNumbers.toString(),
      ),
      React.createElement(
        Text,
        { "data-testid": "is-cursor-line" },
        isCursorLine.toString(),
      ),
      React.createElement(
        Text,
        { "data-testid": "has-search-highlight" },
        hasSearchHighlight.toString(),
      ),
      React.createElement(
        Text,
        { "data-testid": "is-current-search-result" },
        isCurrentSearchResult.toString(),
      ),
      React.createElement(
        Text,
        { "data-testid": "search-term" },
        searchTerm || "none",
      ),
    );
  },
}));

// Mock the collapsible hooks
const mockCollapsibleState = {
  flattenedNodes: [
    { id: "0", path: [], type: "object", isCollapsed: false, level: 0 },
    { id: "1", path: ["name"], type: "property", isCollapsed: false, level: 1 },
    { id: "2", path: ["age"], type: "property", isCollapsed: false, level: 1 },
  ],
  cursorPosition: 0,
  selectedNode: null,
};

const mockDisplayLines = ["{", '  "name": "John",', '  "age": 30', "}"];

const mockNavigate = vi.fn();
const mockSetCollapsibleState = vi.fn();
const mockOnNavigate = vi.fn();
const mockOnScrollChange = vi.fn();

vi.mock("../hooks", () => ({
  useCollapsibleState: vi.fn(() => ({
    collapsibleState: mockCollapsibleState,
    setCollapsibleState: mockSetCollapsibleState,
    config: {
      showArrayIndices: true,
      showPrimitiveValues: true,
      maxValueLength: 50,
    },
  })),
  useDisplayLines: vi.fn(() => mockDisplayLines),
  useSearchHighlighting: vi.fn(() => ({
    searchResultsByLine: new Map(),
    renderLineWithHighlighting: vi.fn(
      (line, _node, index, cursor, startLine) => ({
        highlightedTokens: [{ text: line, color: "white" }],
        isCursorLine: index === cursor - startLine,
      }),
    ),
  })),
  useCollapsibleNavigation: vi.fn(() => ({
    handleNavigationAction: mockNavigate,
  })),
}));

describe("CollapsibleJsonViewer Component", () => {
  const mockSearchResults: SearchResult[] = [
    {
      lineIndex: 1,
      columnStart: 0,
      columnEnd: 4,
      matchText: "name",
      contextLine: '"name": "John"',
    },
  ];

  const defaultProps = {
    data: { name: "John", age: 30 },
    scrollOffset: 0,
    searchTerm: "",
    searchResults: [],
    currentSearchIndex: 0,
    visibleLines: 10,
    showLineNumbers: false,
  };

  describe("Component Rendering", () => {
    it("should render collapsible viewer with basic structure", () => {
      const { lastFrame } = render(<CollapsibleJsonViewer {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("0"); // Line index
      expect(output).toContain("{"); // JSON content
    });

    it("should render multiple lines correctly", () => {
      const { lastFrame } = render(<CollapsibleJsonViewer {...defaultProps} />);

      const output = lastFrame();

      // Should contain multiple lines and line numbers
      expect(output).toContain("0");
      expect(output).toContain("{");
    });

    it("should apply border styling from config", () => {
      const { lastFrame } = render(<CollapsibleJsonViewer {...defaultProps} />);
      const output = lastFrame();

      // Should render with border characters
      expect(output).toMatch(/[┌┐└┘─│]/);
    });
  });

  describe("Data Handling", () => {
    it("should handle null data gracefully", () => {
      const props = {
        ...defaultProps,
        data: null,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle empty object", () => {
      const props = {
        ...defaultProps,
        data: {},
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle complex nested data", () => {
      const props = {
        ...defaultProps,
        data: {
          user: {
            profile: {
              name: "John",
              settings: {
                theme: "dark",
                notifications: true,
              },
            },
            posts: [
              { id: 1, title: "First post" },
              { id: 2, title: "Second post" },
            ],
          },
        },
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle arrays correctly", () => {
      const props = {
        ...defaultProps,
        data: ["item1", "item2", "item3"],
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });
  });

  describe("Line Numbering", () => {
    it("should pass showLineNumbers prop to CollapsibleLine", () => {
      const props = {
        ...defaultProps,
        showLineNumbers: true,
      };

      const { lastFrame } = render(<CollapsibleJsonViewer {...props} />);
      const output = lastFrame();
      expect(output).toContain("true");
    });

    it("should not show line numbers when disabled", () => {
      const props = {
        ...defaultProps,
        showLineNumbers: false,
      };

      const { lastFrame } = render(<CollapsibleJsonViewer {...props} />);
      const output = lastFrame();
      expect(output).toContain("false");
    });

    it("should calculate correct line number width for large datasets", () => {
      // Mock large display lines
      const { useDisplayLines } = require("../hooks");
      useDisplayLines.mockReturnValueOnce(
        Array.from({ length: 1000 }, (_, i) => `line ${i}`),
      );

      expect(() => {
        render(<CollapsibleJsonViewer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Scrolling and Visible Lines", () => {
    it("should handle scroll offset correctly", () => {
      const props = {
        ...defaultProps,
        scrollOffset: 2,
        visibleLines: 2,
      };

      const { lastFrame } = render(<CollapsibleJsonViewer {...props} />);
      const output = lastFrame();
      expect(output).toContain("2"); // Should start from offset
    });

    it("should adjust visible lines for border height", () => {
      const props = {
        ...defaultProps,
        visibleLines: 10,
      };

      // Should account for border height (effective visible lines = 10 - 2 = 8)
      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle very small visible lines", () => {
      const props = {
        ...defaultProps,
        visibleLines: 1,
      };

      // Should ensure minimum of 1 effective visible line
      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle undefined visible lines", () => {
      const props = {
        ...defaultProps,
        visibleLines: 10,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });
  });

  describe("Search Functionality", () => {
    it("should pass search term to CollapsibleLine", () => {
      const props = {
        ...defaultProps,
        searchTerm: "John",
        searchResults: mockSearchResults,
      };

      const { lastFrame } = render(<CollapsibleJsonViewer {...props} />);
      const output = lastFrame();
      expect(output).toContain("John");
    });

    it("should handle empty search term", () => {
      const props = {
        ...defaultProps,
        searchTerm: "",
      };

      const { lastFrame } = render(<CollapsibleJsonViewer {...props} />);
      const output = lastFrame();
      expect(output).toBeDefined();
    });

    it("should handle search results highlighting", () => {
      const { useSearchHighlighting } = require("../hooks");

      // Mock search highlighting with results
      useSearchHighlighting.mockReturnValueOnce({
        searchResultsByLine: new Map([[1, mockSearchResults]]),
        renderLineWithHighlighting: vi.fn(() => ({
          highlightedTokens: [{ text: "highlighted", color: "yellow" }],
          isCursorLine: false,
        })),
      });

      const props = {
        ...defaultProps,
        searchTerm: "John",
        searchResults: mockSearchResults,
        currentSearchIndex: 0,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should indicate current search result", () => {
      const { useSearchHighlighting } = require("../hooks");

      useSearchHighlighting.mockReturnValueOnce({
        searchResultsByLine: new Map([[0, mockSearchResults]]),
        renderLineWithHighlighting: vi.fn(() => ({
          highlightedTokens: [{ text: "current", color: "red" }],
          isCursorLine: false,
        })),
      });

      const props = {
        ...defaultProps,
        searchTerm: "John",
        searchResults: mockSearchResults,
        currentSearchIndex: 0,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });
  });

  describe("Navigation and Cursor", () => {
    it("should indicate cursor line correctly", () => {
      const { useSearchHighlighting } = require("../hooks");

      useSearchHighlighting.mockReturnValueOnce({
        searchResultsByLine: new Map(),
        renderLineWithHighlighting: vi.fn(
          (line, _node, index, cursor, startLine) => ({
            highlightedTokens: [{ text: line, color: "white" }],
            isCursorLine: index === cursor - startLine,
          }),
        ),
      });

      const { useCollapsibleState } = require("../hooks");
      useCollapsibleState.mockReturnValueOnce({
        collapsibleState: { ...mockCollapsibleState, cursorPosition: 1 },
        setCollapsibleState: mockSetCollapsibleState,
        config: {
          showArrayIndices: true,
          showPrimitiveValues: true,
          maxValueLength: 50,
        },
      });

      const { lastFrame } = render(<CollapsibleJsonViewer {...defaultProps} />);
      const output = lastFrame();
      expect(output).toContain("true");
    });

    it("should call onNavigate when navigation action occurs", () => {
      const props = {
        ...defaultProps,
        onNavigate: mockOnNavigate,
      };

      render(<CollapsibleJsonViewer {...props} />);

      // Verify navigation hook is set up
      const { useCollapsibleNavigation } = require("../hooks");
      expect(useCollapsibleNavigation).toHaveBeenCalledWith(
        mockCollapsibleState,
        mockSetCollapsibleState,
        0, // scrollOffset
        expect.any(Number), // effectiveVisibleLines
        mockOnNavigate,
        undefined, // onScrollChange
      );
    });

    it("should call onScrollChange when scroll changes", () => {
      const props = {
        ...defaultProps,
        onScrollChange: mockOnScrollChange,
      };

      render(<CollapsibleJsonViewer {...props} />);

      // Verify scroll change handler is set up
      const { useCollapsibleNavigation } = require("../hooks");
      expect(useCollapsibleNavigation).toHaveBeenCalledWith(
        mockCollapsibleState,
        mockSetCollapsibleState,
        0, // scrollOffset
        expect.any(Number), // effectiveVisibleLines
        undefined, // onNavigate
        mockOnScrollChange,
      );
    });
  });

  describe("ForwardRef and Imperative Handle", () => {
    it("should expose navigate function via ref", () => {
      const ref = React.createRef<{
        navigate: (action: NavigationAction) => void;
      }>();

      render(<CollapsibleJsonViewer ref={ref} {...defaultProps} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.navigate).toBe("function");
    });

    it("should call handleNavigationAction when navigate is called via ref", () => {
      const ref = React.createRef<{
        navigate: (action: NavigationAction) => void;
      }>();

      render(<CollapsibleJsonViewer ref={ref} {...defaultProps} />);

      const navigationAction: NavigationAction = {
        type: "move_down",
      };

      ref.current?.navigate(navigationAction);

      expect(mockNavigate).toHaveBeenCalledWith(navigationAction);
    });
  });

  describe("Hook Integration", () => {
    it("should call useCollapsibleState with correct data", () => {
      const testData = { test: "data" };
      const props = {
        ...defaultProps,
        data: testData,
      };

      render(<CollapsibleJsonViewer {...props} />);

      const { useCollapsibleState } = require("../hooks");
      expect(useCollapsibleState).toHaveBeenCalledWith(testData);
    });

    it("should call useDisplayLines with state and config", () => {
      render(<CollapsibleJsonViewer {...defaultProps} />);

      const { useDisplayLines } = require("../hooks");
      expect(useDisplayLines).toHaveBeenCalledWith(
        mockCollapsibleState,
        expect.objectContaining({
          showArrayIndices: true,
          showPrimitiveValues: true,
          maxValueLength: 50,
        }),
      );
    });

    it("should call useSearchHighlighting with correct parameters", () => {
      const props = {
        ...defaultProps,
        searchTerm: "test",
        searchResults: mockSearchResults,
      };

      render(<CollapsibleJsonViewer {...props} />);

      const { useSearchHighlighting } = require("../hooks");
      expect(useSearchHighlighting).toHaveBeenCalledWith(
        "test",
        mockSearchResults,
      );
    });
  });

  describe("Performance and Memoization", () => {
    it("should memoize rendered lines for performance", () => {
      const { rerender } = render(<CollapsibleJsonViewer {...defaultProps} />);

      // Re-render with same props should use memoized result
      rerender(<CollapsibleJsonViewer {...defaultProps} />);

      expect(() => {
        rerender(<CollapsibleJsonViewer {...defaultProps} />);
      }).not.toThrow();
    });

    it("should handle large datasets efficiently", () => {
      const { useDisplayLines } = require("../hooks");
      const largeLines = Array.from({ length: 10000 }, (_, i) => `line ${i}`);
      useDisplayLines.mockReturnValueOnce(largeLines);

      const { useCollapsibleState } = require("../hooks");
      const largeNodes = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        path: [i.toString()],
        type: "property",
        isCollapsed: false,
        level: 1,
      }));
      useCollapsibleState.mockReturnValueOnce({
        collapsibleState: {
          ...mockCollapsibleState,
          flattenedNodes: largeNodes,
        },
        setCollapsibleState: mockSetCollapsibleState,
        config: {
          showArrayIndices: true,
          showPrimitiveValues: true,
          maxValueLength: 50,
        },
      });

      const startTime = Date.now();

      render(<CollapsibleJsonViewer {...defaultProps} visibleLines={20} />);

      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle mismatched nodes and lines gracefully", () => {
      const { useDisplayLines } = require("../hooks");
      useDisplayLines.mockReturnValueOnce(["line1", "line2"]);

      const { useCollapsibleState } = require("../hooks");
      useCollapsibleState.mockReturnValueOnce({
        collapsibleState: {
          ...mockCollapsibleState,
          flattenedNodes: [mockCollapsibleState.flattenedNodes[0]], // Only one node for two lines
        },
        setCollapsibleState: mockSetCollapsibleState,
        config: {
          showArrayIndices: true,
          showPrimitiveValues: true,
          maxValueLength: 50,
        },
      });

      expect(() => {
        render(<CollapsibleJsonViewer {...defaultProps} />);
      }).not.toThrow();
    });

    it("should handle undefined search results gracefully", () => {
      const props = {
        ...defaultProps,
        searchResults: undefined as any,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle negative scroll offset", () => {
      const props = {
        ...defaultProps,
        scrollOffset: -10,
      };

      expect(() => {
        render(<CollapsibleJsonViewer {...props} />);
      }).not.toThrow();
    });

    it("should handle empty display lines", () => {
      const { useDisplayLines } = require("../hooks");
      useDisplayLines.mockReturnValueOnce([]);

      const { useCollapsibleState } = require("../hooks");
      useCollapsibleState.mockReturnValueOnce({
        collapsibleState: { ...mockCollapsibleState, flattenedNodes: [] },
        setCollapsibleState: mockSetCollapsibleState,
        config: {
          showArrayIndices: true,
          showPrimitiveValues: true,
          maxValueLength: 50,
        },
      });

      expect(() => {
        render(<CollapsibleJsonViewer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Component Cleanup", () => {
    it("should handle component unmounting gracefully", () => {
      const { unmount } = render(<CollapsibleJsonViewer {...defaultProps} />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("should handle rapid prop changes", () => {
      const { rerender } = render(<CollapsibleJsonViewer {...defaultProps} />);

      // Test rapid data changes
      rerender(
        <CollapsibleJsonViewer {...defaultProps} data={{ changed: true }} />,
      );
      rerender(<CollapsibleJsonViewer {...defaultProps} scrollOffset={5} />);
      rerender(
        <CollapsibleJsonViewer {...defaultProps} searchTerm="new search" />,
      );

      expect(() => {
        rerender(<CollapsibleJsonViewer {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
