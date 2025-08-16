/**
 * Comprehensive tests for SearchBar component
 *
 * Tests rendering in both active search and passive modes, cursor positioning,
 * scope display, regex mode handling, navigation info, and user feedback patterns.
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import type { SearchResult, SearchState } from "@features/search/types/search";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

// Mock the config context
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: () => DEFAULT_CONFIG,
}));

// Mock the renderTextWithCursor utility
vi.mock("../../common/components/TextInput", () => ({
  renderTextWithCursor: vi.fn((text: string, position: number) => ({
    beforeCursor: text.substring(0, position),
    atCursor: text.charAt(position) || " ",
    afterCursor: text.substring(position + 1),
  })),
}));

// Mock search utilities
vi.mock("@features/search/utils/searchUtils", () => ({
  getSearchNavigationInfo: vi.fn(
    (results: SearchResult[], currentIndex: number) => {
      if (results.length === 0) return "0/0";
      return `${currentIndex + 1}/${results.length}`;
    },
  ),
  getSearchScopeDisplayName: vi.fn((scope: string) => {
    switch (scope) {
      case "all":
        return "All";
      case "keys":
        return "Keys";
      case "values":
        return "Values";
      default:
        return "All";
    }
  }),
  getRegexModeDisplayName: vi.fn((isRegex: boolean) =>
    isRegex ? "RegEx" : "Text",
  ),
}));

describe("SearchBar Component", () => {
  const mockSearchResults: SearchResult[] = [
    {
      lineIndex: 1,
      columnStart: 0,
      columnEnd: 4,
      matchText: "test",
      contextLine: "test line",
    },
    {
      lineIndex: 3,
      columnStart: 5,
      columnEnd: 9,
      matchText: "test",
      contextLine: "another test",
    },
  ];

  const defaultSearchState: SearchState = {
    isSearching: false,
    searchTerm: "",
    searchResults: [],
    currentResultIndex: 0,
    searchScope: "all",
    isRegexMode: false,
  };

  const defaultProps = {
    searchState: defaultSearchState,
    searchInput: "",
    searchCursorPosition: 0,
  };

  describe("Component Rendering", () => {
    it("should render search bar container with proper styling", () => {
      const { lastFrame } = render(<SearchBar {...defaultProps} />);
      const output = lastFrame();

      // Should contain basic structure
      expect(output).toContain("Search:");
      expect(output).toContain("[All]");
      expect(output).toContain("[Text]");
    });

    it("should display search label and empty term when not searching", () => {
      const { lastFrame } = render(<SearchBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("n: next, N: prev, /: new search, Tab: scope");
    });

    it("should display existing search term when not actively searching", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchTerm: "existing search",
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("existing search");
    });
  });

  describe("Active Search Mode", () => {
    it("should display search input with cursor in active mode", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "test query",
        searchCursorPosition: 4,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("test");
      expect(output).toContain("query");
      expect(output).toContain(
        "Enter: confirm, Esc: cancel, Tab: scope, Ctrl+R: regex",
      );
    });

    it("should handle cursor at beginning of input", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "search",
        searchCursorPosition: 0,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("search");
    });

    it("should handle cursor at end of input", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "search",
        searchCursorPosition: 6,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("search");
    });

    it("should handle empty search input", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "",
        searchCursorPosition: 0,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("Enter: confirm, Esc: cancel");
    });
  });

  describe("Search Scope Display", () => {
    it("should display 'All' scope correctly", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchScope: "all" as const,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[All]");
    });

    it("should display 'Keys' scope correctly", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchScope: "keys" as const,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[Keys]");
    });

    it("should display 'Values' scope correctly", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchScope: "values" as const,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[Values]");
    });
  });

  describe("Regex Mode Display", () => {
    it("should display 'Text' mode when regex is disabled", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isRegexMode: false,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[Text]");
    });

    it("should display 'RegEx' mode when regex is enabled", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isRegexMode: true,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[RegEx]");
    });
  });

  describe("Navigation Information", () => {
    it("should display '0/0' when no search results", () => {
      const { lastFrame } = render(<SearchBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("0/0");
    });

    it("should display correct navigation info with results", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: mockSearchResults,
          currentResultIndex: 0,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("1/2");
    });

    it("should display correct navigation info when on second result", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: mockSearchResults,
          currentResultIndex: 1,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("2/2");
    });

    it("should handle large result sets", () => {
      const largeResultSet: SearchResult[] = Array.from(
        { length: 100 },
        (_, i) => ({
          lineIndex: i,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: `line ${i}`,
        }),
      );

      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: largeResultSet,
          currentResultIndex: 49,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("50/100");
    });
  });

  describe("User Guidance", () => {
    it("should show search mode instructions when actively searching", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Enter: confirm");
      expect(output).toContain("Esc: cancel");
      expect(output).toContain("Tab: scope");
      expect(output).toContain("Ctrl+R: regex");
    });

    it("should show navigation instructions when not actively searching", () => {
      const { lastFrame } = render(<SearchBar {...defaultProps} />);
      const output = lastFrame();

      expect(output).toContain("n: next");
      expect(output).toContain("N: prev");
      expect(output).toContain("/: new search");
      expect(output).toContain("Tab: scope");
    });
  });

  describe("Text Cursor Rendering", () => {
    it("should handle cursor position beyond text length", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "short",
        searchCursorPosition: 100,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("short");
    });
  });

  describe("Component Memoization", () => {
    it("should be wrapped in memo for performance", () => {
      // Check that the component is memoized (React.memo adds the $$typeof property)
      expect(SearchBar).toBeDefined();
      expect(typeof SearchBar).toBe("object");
    });

    it("should handle prop changes correctly", () => {
      const { rerender, lastFrame } = render(<SearchBar {...defaultProps} />);

      // Initial render
      expect(lastFrame()).toContain("[All]");

      // Change scope
      const newProps = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchScope: "keys" as const,
        },
      };

      rerender(<SearchBar {...newProps} />);
      expect(lastFrame()).toContain("[Keys]");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle undefined search cursor position", () => {
      const props = {
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "test",
        // searchCursorPosition is undefined (should default to 0)
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("Search:");
      expect(output).toContain("test");
    });

    it("should handle malformed search results", () => {
      const malformedResults = [
        {
          lineIndex: -1,
          columnStart: 0,
          columnEnd: 4,
          matchText: "",
          contextLine: "",
        },
      ] as SearchResult[];

      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: malformedResults,
          currentResultIndex: 0,
        },
      };

      expect(() => {
        render(<SearchBar {...props} />);
      }).not.toThrow();
    });

    it("should handle invalid current result index", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: mockSearchResults,
          currentResultIndex: 999, // Out of bounds
        },
      };

      expect(() => {
        render(<SearchBar {...props} />);
      }).not.toThrow();
    });

    it("should handle special characters in search input", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          isSearching: true,
        },
        searchInput: "test@#$%^&*()[]{}|\\:;\"'<>?,./~`!",
        searchCursorPosition: 10,
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      // Should render without errors and contain search input
      expect(output).toContain("test@#$%^&*()[]{}");
    });
  });

  describe("Integration with Search Utils", () => {
    it("should render with different search utility results", () => {
      const props = {
        ...defaultProps,
        searchState: {
          ...defaultSearchState,
          searchResults: mockSearchResults,
          currentResultIndex: 1,
          searchScope: "keys" as const,
          isRegexMode: true,
        },
      };

      const { lastFrame } = render(<SearchBar {...props} />);
      const output = lastFrame();

      expect(output).toContain("[Keys]");
      expect(output).toContain("[RegEx]");
    });
  });

  describe("Accessibility and Styling", () => {
    it("should use proper color scheme from config", () => {
      const { lastFrame } = render(<SearchBar {...defaultProps} />);
      const output = lastFrame();

      // Component should render without errors and include styled elements
      expect(output).toContain("Search:");
      expect(output).toContain("[");
      expect(output).toContain("]");
    });

    it("should handle different appearance configurations", () => {
      // This test verifies the component doesn't crash with different configs
      expect(() => {
        render(<SearchBar {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
