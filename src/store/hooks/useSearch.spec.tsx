/**
 * Comprehensive tests for useSearch hooks
 *
 * Tests all 18 search-related hooks for state management, actions, and integrations.
 * Based on critical bug patterns and state management requirements.
 */

import type { SearchResult } from "@features/search/types/search";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import type React from "react";
import { describe, expect, it } from "vitest";
import {
  useCancelSearch,
  useCurrentResultIndex,
  useCurrentSearchResult,
  useCycleScope,
  useHasSearchResults,
  useIsRegexMode,
  useIsSearching,
  useNextSearchResult,
  usePreviousSearchResult,
  useSearchCursorPosition,
  useSearchInput,
  useSearchResults,
  useSearchScope,
  useSearchState,
  useSearchTerm,
  useStartSearch,
  useToggleRegexMode,
  useUpdateSearchResults,
} from "./useSearch";

// Test wrapper with Jotai Provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider>{children}</Provider>
);

describe("useSearch Hooks - Comprehensive Test Suite", () => {
  describe("Individual State Hooks", () => {
    describe("useSearchInput", () => {
      it("should manage search input state", () => {
        const { result } = renderHook(() => useSearchInput(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe("");

        // Update input
        act(() => {
          result.current[1]("test query");
        });

        expect(result.current[0]).toBe("test query");
      });

      it("should handle empty and whitespace input", () => {
        const { result } = renderHook(() => useSearchInput(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current[1]("   ");
        });
        expect(result.current[0]).toBe("   ");

        act(() => {
          result.current[1]("");
        });
        expect(result.current[0]).toBe("");
      });

      it("should handle special characters and unicode", () => {
        const { result } = renderHook(() => useSearchInput(), {
          wrapper: TestWrapper,
        });

        const specialInput = "test@#$%^&*()[]{}|\\:;\"'<>?,./~`!émojis🎉ñáéíóú";
        act(() => {
          result.current[1](specialInput);
        });
        expect(result.current[0]).toBe(specialInput);
      });
    });

    describe("useSearchCursorPosition", () => {
      it("should manage cursor position state", () => {
        const { result } = renderHook(() => useSearchCursorPosition(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe(0);

        // Update position
        act(() => {
          result.current[1](5);
        });

        expect(result.current[0]).toBe(5);
      });

      it("should handle negative and large cursor positions", () => {
        const { result } = renderHook(() => useSearchCursorPosition(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current[1](-1);
        });
        expect(result.current[0]).toBe(-1);

        act(() => {
          result.current[1](10000);
        });
        expect(result.current[0]).toBe(10000);
      });
    });

    describe("useIsSearching", () => {
      it("should manage searching state", () => {
        const { result } = renderHook(() => useIsSearching(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe(false);

        // Start searching
        act(() => {
          result.current[1](true);
        });

        expect(result.current[0]).toBe(true);

        // Stop searching
        act(() => {
          result.current[1](false);
        });

        expect(result.current[0]).toBe(false);
      });
    });

    describe("useSearchTerm", () => {
      it("should manage confirmed search term", () => {
        const { result } = renderHook(() => useSearchTerm(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe("");

        // Set search term
        act(() => {
          result.current[1]("confirmed term");
        });

        expect(result.current[0]).toBe("confirmed term");
      });
    });

    describe("useSearchResults", () => {
      it("should manage search results array", () => {
        const { result } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toEqual([]);

        const testResults: SearchResult[] = [
          {
            lineIndex: 1,
            columnStart: 5,
            columnEnd: 10,
            matchText: "test",
            contextLine: "This is a test line",
          },
          {
            lineIndex: 3,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "test at start",
          },
        ];

        // Set search results
        act(() => {
          result.current[1](testResults);
        });

        expect(result.current[0]).toEqual(testResults);
        expect(result.current[0]).toHaveLength(2);
      });

      it("should handle empty results and large result sets", () => {
        const { result } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });

        // Large result set
        const largeResults: SearchResult[] = Array.from(
          { length: 1000 },
          (_, i) => ({
            lineIndex: i,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: `Line ${i} with test`,
          }),
        );

        act(() => {
          result.current[1](largeResults);
        });

        expect(result.current[0]).toHaveLength(1000);
        expect(result.current[0][0]?.lineIndex).toBe(0);
        expect(result.current[0][999]?.lineIndex).toBe(999);

        // Clear results
        act(() => {
          result.current[1]([]);
        });

        expect(result.current[0]).toEqual([]);
      });
    });

    describe("useCurrentResultIndex", () => {
      it("should manage current result index", () => {
        const { result } = renderHook(() => useCurrentResultIndex(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe(0);

        // Update index
        act(() => {
          result.current[1](3);
        });

        expect(result.current[0]).toBe(3);
      });
    });

    describe("useSearchScope", () => {
      it("should manage search scope", () => {
        const { result } = renderHook(() => useSearchScope(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(result.current[0]).toBe("all");

        // Change scope
        act(() => {
          result.current[1]("keys");
        });

        expect(result.current[0]).toBe("keys");

        act(() => {
          result.current[1]("values");
        });

        expect(result.current[0]).toBe("values");
      });
    });
  });

  describe("Read-only Hooks", () => {
    describe("useSearchState", () => {
      it("should provide complete search state", () => {
        const { result: searchState } = renderHook(() => useSearchState(), {
          wrapper: TestWrapper,
        });
        const { result: setSearching } = renderHook(() => useIsSearching(), {
          wrapper: TestWrapper,
        });
        const { result: setTerm } = renderHook(() => useSearchTerm(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(searchState.current).toEqual({
          isSearching: false,
          searchTerm: "",
          searchResults: [],
          currentResultIndex: 0,
          searchScope: "all",
          isRegexMode: false,
        });

        // Update some state
        act(() => {
          setSearching.current[1](true);
          setTerm.current[1]("test");
        });

        expect(searchState.current.isSearching).toBe(true);
        expect(searchState.current.searchTerm).toBe("test");
      });
    });

    describe("useHasSearchResults", () => {
      it("should indicate if search results exist", () => {
        const { result: hasResults } = renderHook(() => useHasSearchResults(), {
          wrapper: TestWrapper,
        });
        const { result: setResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });

        // Initially no results
        expect(hasResults.current).toBe(false);

        // Add results
        act(() => {
          setResults.current[1]([
            {
              lineIndex: 1,
              columnStart: 0,
              columnEnd: 4,
              matchText: "test",
              contextLine: "test line",
            },
          ]);
        });

        expect(hasResults.current).toBe(true);

        // Clear results
        act(() => {
          setResults.current[1]([]);
        });

        expect(hasResults.current).toBe(false);
      });
    });

    describe("useCurrentSearchResult", () => {
      it("should provide current search result", () => {
        const { result: currentResult } = renderHook(
          () => useCurrentSearchResult(),
          {
            wrapper: TestWrapper,
          },
        );
        const { result: setResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });
        const { result: setIndex } = renderHook(() => useCurrentResultIndex(), {
          wrapper: TestWrapper,
        });

        // Initially null
        expect(currentResult.current).toBeNull();

        const testResults: SearchResult[] = [
          {
            lineIndex: 1,
            columnStart: 0,
            columnEnd: 4,
            matchText: "first",
            contextLine: "first result",
          },
          {
            lineIndex: 2,
            columnStart: 0,
            columnEnd: 6,
            matchText: "second",
            contextLine: "second result",
          },
        ];

        // Add results
        act(() => {
          setResults.current[1](testResults);
        });

        expect(currentResult.current).toEqual(testResults[0]);

        // Change index
        act(() => {
          setIndex.current[1](1);
        });

        expect(currentResult.current).toEqual(testResults[1]);

        // Out of bounds index
        act(() => {
          setIndex.current[1](5);
        });

        expect(currentResult.current).toBeNull();
      });
    });
  });

  describe("Action Hooks", () => {
    describe("useStartSearch", () => {
      it("should initiate search with term", () => {
        const { result: startSearch } = renderHook(() => useStartSearch(), {
          wrapper: TestWrapper,
        });
        const { result: searchTerm } = renderHook(() => useSearchTerm(), {
          wrapper: TestWrapper,
        });
        const { result: isSearching } = renderHook(() => useIsSearching(), {
          wrapper: TestWrapper,
        });
        const { result: currentIndex } = renderHook(
          () => useCurrentResultIndex(),
          {
            wrapper: TestWrapper,
          },
        );

        // Start search
        act(() => {
          startSearch.current("search query");
        });

        expect(searchTerm.current[0]).toBe("search query");
        expect(isSearching.current[0]).toBe(false); // Should exit search input mode
        expect(currentIndex.current[0]).toBe(0); // Reset to first result
      });

      it("should handle empty and special search terms", () => {
        const { result: startSearch } = renderHook(() => useStartSearch(), {
          wrapper: TestWrapper,
        });
        const { result: searchTerm } = renderHook(() => useSearchTerm(), {
          wrapper: TestWrapper,
        });

        // Empty search
        act(() => {
          startSearch.current("");
        });
        expect(searchTerm.current[0]).toBe("");

        // Special characters
        act(() => {
          startSearch.current(".*[regex]?");
        });
        expect(searchTerm.current[0]).toBe(".*[regex]?");
      });
    });

    describe("useCancelSearch", () => {
      it("should reset all search state", () => {
        const { result: cancelSearch } = renderHook(() => useCancelSearch(), {
          wrapper: TestWrapper,
        });
        const { result: searchState } = renderHook(() => useSearchState(), {
          wrapper: TestWrapper,
        });
        const { result: searchInput } = renderHook(() => useSearchInput(), {
          wrapper: TestWrapper,
        });
        const { result: cursorPosition } = renderHook(
          () => useSearchCursorPosition(),
          {
            wrapper: TestWrapper,
          },
        );

        // Set up some search state
        const { result: setSearching } = renderHook(() => useIsSearching(), {
          wrapper: TestWrapper,
        });
        const { result: setTerm } = renderHook(() => useSearchTerm(), {
          wrapper: TestWrapper,
        });
        const { result: setResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });

        act(() => {
          setSearching.current[1](true);
          setTerm.current[1]("test");
          setResults.current[1]([
            {
              lineIndex: 1,
              columnStart: 0,
              columnEnd: 4,
              matchText: "test",
              contextLine: "test",
            },
          ]);
          searchInput.current[1]("typing...");
          cursorPosition.current[1](5);
        });

        // Cancel search
        act(() => {
          cancelSearch.current();
        });

        expect(searchState.current.isSearching).toBe(false);
        expect(searchState.current.searchTerm).toBe("");
        expect(searchState.current.searchResults).toEqual([]);
        expect(searchState.current.currentResultIndex).toBe(0);
        expect(searchInput.current[0]).toBe("");
        expect(cursorPosition.current[0]).toBe(0);
      });
    });

    describe("useUpdateSearchResults", () => {
      it("should update search results and reset index", () => {
        const { result: updateResults } = renderHook(
          () => useUpdateSearchResults(),
          {
            wrapper: TestWrapper,
          },
        );
        const { result: searchResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });
        const { result: currentIndex } = renderHook(
          () => useCurrentResultIndex(),
          {
            wrapper: TestWrapper,
          },
        );

        // Set initial index to non-zero
        act(() => {
          currentIndex.current[1](5);
        });

        const testResults: SearchResult[] = [
          {
            lineIndex: 1,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "test",
          },
        ];

        // Update results
        act(() => {
          updateResults.current({ results: testResults });
        });

        expect(searchResults.current[0]).toEqual(testResults);
        expect(currentIndex.current[0]).toBe(0); // Should reset to 0
      });

      it("should update regex mode when provided", () => {
        const { result: updateResults } = renderHook(
          () => useUpdateSearchResults(),
          {
            wrapper: TestWrapper,
          },
        );
        const { result: isRegexMode } = renderHook(() => useIsRegexMode(), {
          wrapper: TestWrapper,
        });

        // Update with regex mode
        act(() => {
          updateResults.current({ results: [], isRegexMode: true });
        });

        expect(isRegexMode.current).toBe(true);

        // Update without regex mode (should not change)
        act(() => {
          updateResults.current({ results: [] });
        });

        expect(isRegexMode.current).toBe(true); // Should remain unchanged
      });
    });

    describe("useToggleRegexMode", () => {
      it("should toggle regex mode state", () => {
        const { result: toggleRegex } = renderHook(() => useToggleRegexMode(), {
          wrapper: TestWrapper,
        });
        const { result: isRegexMode } = renderHook(() => useIsRegexMode(), {
          wrapper: TestWrapper,
        });

        // Initial state
        expect(isRegexMode.current).toBe(false);

        // Toggle on
        act(() => {
          toggleRegex.current();
        });

        expect(isRegexMode.current).toBe(true);

        // Toggle off
        act(() => {
          toggleRegex.current();
        });

        expect(isRegexMode.current).toBe(false);
      });
    });

    describe("useNextSearchResult", () => {
      it("should cycle to next search result", () => {
        const { result: nextResult } = renderHook(() => useNextSearchResult(), {
          wrapper: TestWrapper,
        });
        const { result: setResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });
        const { result: currentIndex } = renderHook(
          () => useCurrentResultIndex(),
          {
            wrapper: TestWrapper,
          },
        );

        const testResults: SearchResult[] = [
          {
            lineIndex: 1,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "1",
          },
          {
            lineIndex: 2,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "2",
          },
          {
            lineIndex: 3,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "3",
          },
        ];

        act(() => {
          setResults.current[1](testResults);
        });

        // Initially at index 0
        expect(currentIndex.current[0]).toBe(0);

        // Next result
        act(() => {
          nextResult.current();
        });
        expect(currentIndex.current[0]).toBe(1);

        // Next result
        act(() => {
          nextResult.current();
        });
        expect(currentIndex.current[0]).toBe(2);

        // Wrap around to beginning
        act(() => {
          nextResult.current();
        });
        expect(currentIndex.current[0]).toBe(0);
      });

      it("should handle empty results gracefully", () => {
        const { result: nextResult } = renderHook(() => useNextSearchResult(), {
          wrapper: TestWrapper,
        });
        const { result: currentIndex } = renderHook(
          () => useCurrentResultIndex(),
          {
            wrapper: TestWrapper,
          },
        );

        // No results
        act(() => {
          nextResult.current();
        });

        expect(currentIndex.current[0]).toBe(0);
      });
    });

    describe("usePreviousSearchResult", () => {
      it("should cycle to previous search result", () => {
        const { result: previousResult } = renderHook(
          () => usePreviousSearchResult(),
          {
            wrapper: TestWrapper,
          },
        );
        const { result: setResults } = renderHook(() => useSearchResults(), {
          wrapper: TestWrapper,
        });
        const { result: currentIndex } = renderHook(
          () => useCurrentResultIndex(),
          {
            wrapper: TestWrapper,
          },
        );

        const testResults: SearchResult[] = [
          {
            lineIndex: 1,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "1",
          },
          {
            lineIndex: 2,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "2",
          },
          {
            lineIndex: 3,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "3",
          },
        ];

        act(() => {
          setResults.current[1](testResults);
          currentIndex.current[1](1); // Start at middle
        });

        // Previous result
        act(() => {
          previousResult.current();
        });
        expect(currentIndex.current[0]).toBe(0);

        // Wrap around to end
        act(() => {
          previousResult.current();
        });
        expect(currentIndex.current[0]).toBe(2);

        // Previous result
        act(() => {
          previousResult.current();
        });
        expect(currentIndex.current[0]).toBe(1);
      });
    });

    describe("useCycleScope", () => {
      it("should cycle through search scopes", () => {
        const { result: cycleScope } = renderHook(() => useCycleScope(), {
          wrapper: TestWrapper,
        });
        const { result: searchScope } = renderHook(() => useSearchScope(), {
          wrapper: TestWrapper,
        });

        // Initial scope
        expect(searchScope.current[0]).toBe("all");

        // Cycle to keys
        act(() => {
          cycleScope.current();
        });
        expect(searchScope.current[0]).toBe("keys");

        // Cycle to values
        act(() => {
          cycleScope.current();
        });
        expect(searchScope.current[0]).toBe("values");

        // Cycle back to all
        act(() => {
          cycleScope.current();
        });
        expect(searchScope.current[0]).toBe("all");
      });
    });
  });

  describe("Integration and Complex Scenarios", () => {
    it("should handle complete search workflow", () => {
      const { result: startSearch } = renderHook(() => useStartSearch(), {
        wrapper: TestWrapper,
      });
      const { result: updateResults } = renderHook(
        () => useUpdateSearchResults(),
        {
          wrapper: TestWrapper,
        },
      );
      const { result: nextResult } = renderHook(() => useNextSearchResult(), {
        wrapper: TestWrapper,
      });
      const { result: cancelSearch } = renderHook(() => useCancelSearch(), {
        wrapper: TestWrapper,
      });
      const { result: searchState } = renderHook(() => useSearchState(), {
        wrapper: TestWrapper,
      });
      const { result: currentResult } = renderHook(
        () => useCurrentSearchResult(),
        {
          wrapper: TestWrapper,
        },
      );

      // Complete workflow
      const testResults: SearchResult[] = [
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "line 1",
        },
        {
          lineIndex: 3,
          columnStart: 5,
          columnEnd: 9,
          matchText: "test",
          contextLine: "line 3",
        },
      ];

      // 1. Start search
      act(() => {
        startSearch.current("test");
      });
      expect(searchState.current.searchTerm).toBe("test");

      // 2. Update with results
      act(() => {
        updateResults.current({ results: testResults });
      });
      expect(searchState.current.searchResults).toEqual(testResults);
      expect(currentResult.current).toEqual(testResults[0]);

      // 3. Navigate results
      act(() => {
        nextResult.current();
      });
      expect(currentResult.current).toEqual(testResults[1]);

      // 4. Cancel search
      act(() => {
        cancelSearch.current();
      });
      expect(searchState.current.searchTerm).toBe("");
      expect(searchState.current.searchResults).toEqual([]);
      expect(currentResult.current).toBeNull();
    });

    it("should handle concurrent state updates correctly", () => {
      const { result: searchInput } = renderHook(() => useSearchInput(), {
        wrapper: TestWrapper,
      });
      const { result: isSearching } = renderHook(() => useIsSearching(), {
        wrapper: TestWrapper,
      });
      const { result: searchScope } = renderHook(() => useSearchScope(), {
        wrapper: TestWrapper,
      });
      const { result: toggleRegex } = renderHook(() => useToggleRegexMode(), {
        wrapper: TestWrapper,
      });

      // Multiple simultaneous updates
      act(() => {
        searchInput.current[1]("concurrent test");
        isSearching.current[1](true);
        searchScope.current[1]("keys");
        toggleRegex.current();
      });

      expect(searchInput.current[0]).toBe("concurrent test");
      expect(isSearching.current[0]).toBe(true);
      expect(searchScope.current[0]).toBe("keys");
    });

    it("should maintain state consistency with rapid operations", () => {
      const { result: startSearch } = renderHook(() => useStartSearch(), {
        wrapper: TestWrapper,
      });
      const { result: nextResult } = renderHook(() => useNextSearchResult(), {
        wrapper: TestWrapper,
      });
      const { result: previousResult } = renderHook(
        () => usePreviousSearchResult(),
        {
          wrapper: TestWrapper,
        },
      );
      const { result: updateResults } = renderHook(
        () => useUpdateSearchResults(),
        {
          wrapper: TestWrapper,
        },
      );
      const { result: currentIndex } = renderHook(
        () => useCurrentResultIndex(),
        {
          wrapper: TestWrapper,
        },
      );

      const testResults: SearchResult[] = Array.from(
        { length: 10 },
        (_, i) => ({
          lineIndex: i,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: `line ${i}`,
        }),
      );

      act(() => {
        startSearch.current("test");
        updateResults.current({ results: testResults });
      });

      // Rapid navigation
      act(() => {
        for (let i = 0; i < 15; i++) {
          nextResult.current();
        }
      });

      // Should cycle correctly (15 % 10 = 5)
      expect(currentIndex.current[0]).toBe(5);

      act(() => {
        for (let i = 0; i < 8; i++) {
          previousResult.current();
        }
      });

      // Should wrap correctly (5 - 8 = -3, which wraps to 7)
      expect(currentIndex.current[0]).toBe(7);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large result sets efficiently", () => {
      const { result: updateResults } = renderHook(
        () => useUpdateSearchResults(),
        {
          wrapper: TestWrapper,
        },
      );
      const { result: searchResults } = renderHook(() => useSearchResults(), {
        wrapper: TestWrapper,
      });

      const startTime = Date.now();

      // Create large result set
      const largeResults: SearchResult[] = Array.from(
        { length: 10000 },
        (_, i) => ({
          lineIndex: i,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: `This is line ${i} with test content`,
        }),
      );

      act(() => {
        updateResults.current({ results: largeResults });
      });

      const endTime = Date.now();

      // Should complete quickly (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(searchResults.current[0]).toHaveLength(10000);
    });

    it("should handle malformed search result data gracefully", () => {
      const { result: updateResults } = renderHook(
        () => useUpdateSearchResults(),
        {
          wrapper: TestWrapper,
        },
      );
      const { result: currentResult } = renderHook(
        () => useCurrentSearchResult(),
        {
          wrapper: TestWrapper,
        },
      );

      // Results with missing properties
      const malformedResults = [
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 4,
          matchText: "test",
          contextLine: "normal result",
        },
        {
          lineIndex: -1, // Invalid line index
          columnStart: 10,
          columnEnd: 5, // End before start
          matchText: "",
          contextLine: "",
        },
      ] as SearchResult[];

      act(() => {
        updateResults.current({ results: malformedResults });
      });

      expect(currentResult.current).toEqual(malformedResults[0]);
    });

    it("should maintain hook stability across re-renders", () => {
      const { result, rerender } = renderHook(
        () => ({
          startSearch: useStartSearch(),
          cancelSearch: useCancelSearch(),
          searchState: useSearchState(),
        }),
        {
          wrapper: TestWrapper,
        },
      );

      const firstRenderRefs = {
        startSearch: result.current.startSearch,
        cancelSearch: result.current.cancelSearch,
      };

      // Re-render multiple times
      rerender();
      rerender();
      rerender();

      // Function references should be stable
      expect(result.current.startSearch).toBe(firstRenderRefs.startSearch);
      expect(result.current.cancelSearch).toBe(firstRenderRefs.cancelSearch);
    });
  });

  describe("Error Scenarios and Recovery", () => {
    it("should handle undefined and null values gracefully", () => {
      const { result: updateResults } = renderHook(
        () => useUpdateSearchResults(),
        {
          wrapper: TestWrapper,
        },
      );

      // Should not crash with undefined results
      act(() => {
        updateResults.current({ results: undefined as any });
      });

      // Should handle null input
      expect(() => {
        act(() => {
          updateResults.current(null as any);
        });
      }).not.toThrow();
    });

    it("should recover from invalid state transitions", () => {
      const { result: setIndex } = renderHook(() => useCurrentResultIndex(), {
        wrapper: TestWrapper,
      });
      const { result: currentResult } = renderHook(
        () => useCurrentSearchResult(),
        {
          wrapper: TestWrapper,
        },
      );

      // Set invalid index without results
      act(() => {
        setIndex.current[1](100);
      });

      expect(currentResult.current).toBeNull();

      // Should recover when valid results are added
      const { result: setResults } = renderHook(() => useSearchResults(), {
        wrapper: TestWrapper,
      });

      act(() => {
        setResults.current[1]([
          {
            lineIndex: 1,
            columnStart: 0,
            columnEnd: 4,
            matchText: "test",
            contextLine: "test",
          },
        ]);
        setIndex.current[1](0);
      });

      expect(currentResult.current).not.toBeNull();
    });
  });
});
