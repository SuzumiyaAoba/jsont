/**
 * Regression tests for useSearchResults based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Search results not being properly indexed by line
 * 2. Performance issues with large search result sets
 * 3. Memory leaks from not cleaning up search result mappings
 */

import type { SearchResult } from "@features/search/types/search";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSearchResults } from "./useSearchResults";

describe("useSearchResults Regression Tests", () => {
  describe("Search Result Indexing Bug Fixes", () => {
    it("should correctly index search results by line", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: 1,
          columnStart: 5,
          columnEnd: 10,
          matchText: "test",
          contextLine: "line 1 test content",
        },
        {
          lineIndex: 3,
          columnStart: 2,
          columnEnd: 8,
          matchText: "test",
          contextLine: "  test line 3",
        },
        {
          lineIndex: 1,
          columnStart: 15,
          columnEnd: 20,
          matchText: "test",
          contextLine: "line 1 test content",
        }, // Multiple results on same line
        {
          lineIndex: 7,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "test line 7",
        },
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      const { searchResultsByLine } = result.current;

      // Should have results for lines 1, 3, and 7
      expect(searchResultsByLine.has(1)).toBe(true);
      expect(searchResultsByLine.has(3)).toBe(true);
      expect(searchResultsByLine.has(7)).toBe(true);

      // Should not have results for other lines
      expect(searchResultsByLine.has(0)).toBe(false);
      expect(searchResultsByLine.has(2)).toBe(false);
      expect(searchResultsByLine.has(4)).toBe(false);
    });

    it("should handle multiple search results on the same line", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: 5,
          columnStart: 2,
          columnEnd: 6,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 5,
          columnStart: 10,
          columnEnd: 15,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 5,
          columnStart: 20,
          columnEnd: 25,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      const { searchResultsByLine } = result.current;

      // Line 5 should be marked as having search results
      expect(searchResultsByLine.has(5)).toBe(true);

      // Only line 5 should be in the set
      expect(searchResultsByLine.size).toBe(1);
    });

    it("should handle empty search results gracefully", () => {
      const searchResults: SearchResult[] = [];

      const { result } = renderHook(() => useSearchResults(searchResults));

      const { searchResultsByLine } = result.current;

      // Should be an empty set
      expect(searchResultsByLine.size).toBe(0);

      // Checking any line should return false
      expect(searchResultsByLine.has(0)).toBe(false);
      expect(searchResultsByLine.has(10)).toBe(false);
    });
  });

  describe("Performance Bug Fixes", () => {
    it("should handle large numbers of search results efficiently", () => {
      // Create a large number of search results
      const searchResults: SearchResult[] = Array.from(
        { length: 10000 },
        (_, i) => ({
          lineIndex: Math.floor(i / 10), // ~10 results per line for 1000 lines
          columnStart: (i % 10) * 5,
          columnEnd: (i % 10) * 5 + 4,
          matchText: "test",
          contextLine: "line content",
        }),
      );

      const startTime = Date.now();

      const { result } = renderHook(() => useSearchResults(searchResults));

      const endTime = Date.now();

      // Should complete quickly (less than 100ms for 10k results)
      expect(endTime - startTime).toBeLessThan(100);

      // Should correctly index all unique lines
      const expectedUniqueLines = Math.floor(10000 / 10); // 1000 unique lines
      expect(result.current.searchResultsByLine.size).toBe(expectedUniqueLines);
    });

    it("should be efficient for checking line membership", () => {
      const searchResults: SearchResult[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          lineIndex: i * 2, // Every even line has a result
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }),
      );

      const { result } = renderHook(() => useSearchResults(searchResults));

      const startTime = Date.now();

      // Check membership for many lines
      for (let i = 0; i < 2000; i++) {
        result.current.searchResultsByLine.has(i);
      }

      const endTime = Date.now();

      // Membership checks should be very fast (less than 10ms for 2k checks)
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe("Memory Management", () => {
    it("should update efficiently when search results change", () => {
      const initialSearchResults: SearchResult[] = [
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 3,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result, rerender } = renderHook(
        (props) => useSearchResults(props.searchResults),
        { initialProps: { searchResults: initialSearchResults } },
      );

      // Initial state
      expect(result.current.searchResultsByLine.has(1)).toBe(true);
      expect(result.current.searchResultsByLine.has(3)).toBe(true);
      expect(result.current.searchResultsByLine.size).toBe(2);

      // Update with new search results
      const newSearchResults: SearchResult[] = [
        {
          lineIndex: 2,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 4,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 6,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      rerender({ searchResults: newSearchResults });

      // Should reflect new results and clear old ones
      expect(result.current.searchResultsByLine.has(1)).toBe(false);
      expect(result.current.searchResultsByLine.has(3)).toBe(false);
      expect(result.current.searchResultsByLine.has(2)).toBe(true);
      expect(result.current.searchResultsByLine.has(4)).toBe(true);
      expect(result.current.searchResultsByLine.has(6)).toBe(true);
      expect(result.current.searchResultsByLine.size).toBe(3);
    });

    it("should clear all results when search results become empty", () => {
      const initialSearchResults: SearchResult[] = [
        {
          lineIndex: 10,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 20,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 30,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result, rerender } = renderHook(
        (props) => useSearchResults(props.searchResults),
        { initialProps: { searchResults: initialSearchResults } },
      );

      // Should have initial results
      expect(result.current.searchResultsByLine.size).toBe(3);

      // Clear search results
      rerender({ searchResults: [] });

      // Should be completely empty
      expect(result.current.searchResultsByLine.size).toBe(0);
      expect(result.current.searchResultsByLine.has(10)).toBe(false);
      expect(result.current.searchResultsByLine.has(20)).toBe(false);
      expect(result.current.searchResultsByLine.has(30)).toBe(false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle invalid line indices gracefully", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: -1,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }, // Negative line index
        {
          lineIndex: 0,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }, // Valid
        {
          lineIndex: 1000000,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }, // Very large line index
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      // Should not crash and should handle all indices
      expect(() => result.current.searchResultsByLine.has(-1)).not.toThrow();
      expect(() => result.current.searchResultsByLine.has(0)).not.toThrow();
      expect(() =>
        result.current.searchResultsByLine.has(1000000),
      ).not.toThrow();

      // All provided indices should be indexed (even invalid ones)
      expect(result.current.searchResultsByLine.has(-1)).toBe(true);
      expect(result.current.searchResultsByLine.has(0)).toBe(true);
      expect(result.current.searchResultsByLine.has(1000000)).toBe(true);
    });

    it("should handle duplicate search results correctly", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: 5,
          columnStart: 10,
          columnEnd: 15,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 5,
          columnStart: 10,
          columnEnd: 15,
          matchText: "test",
          contextLine: "line content",
        }, // Exact duplicate
        {
          lineIndex: 7,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 7,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }, // Exact duplicate
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      // Should only index unique lines
      expect(result.current.searchResultsByLine.size).toBe(2);
      expect(result.current.searchResultsByLine.has(5)).toBe(true);
      expect(result.current.searchResultsByLine.has(7)).toBe(true);
    });

    it("should handle search results with invalid column positions", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: 1,
          columnStart: -5,
          columnEnd: 10,
          matchText: "test",
          contextLine: "line content",
        }, // Negative start
        {
          lineIndex: 2,
          columnStart: 10,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        }, // End before start
        {
          lineIndex: 3,
          columnStart: 0,
          columnEnd: 1000000,
          matchText: "test",
          contextLine: "line content",
        }, // Very large end
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      // Should not crash and should index all lines
      expect(result.current.searchResultsByLine.size).toBe(3);
      expect(result.current.searchResultsByLine.has(1)).toBe(true);
      expect(result.current.searchResultsByLine.has(2)).toBe(true);
      expect(result.current.searchResultsByLine.has(3)).toBe(true);
    });
  });

  describe("Consistency and Stability", () => {
    it("should be stable across multiple re-renders with same input", () => {
      const searchResults: SearchResult[] = [
        {
          lineIndex: 15,
          columnStart: 5,
          columnEnd: 10,
          matchText: "test",
          contextLine: "line content",
        },
        {
          lineIndex: 25,
          columnStart: 8,
          columnEnd: 12,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result, rerender } = renderHook(
        (props) => useSearchResults(props.searchResults),
        { initialProps: { searchResults } },
      );

      const firstResult = result.current.searchResultsByLine;

      // Re-render with same data multiple times
      rerender({ searchResults });
      rerender({ searchResults });
      rerender({ searchResults });

      // Should maintain consistent results
      expect(result.current.searchResultsByLine.has(15)).toBe(
        firstResult.has(15),
      );
      expect(result.current.searchResultsByLine.has(25)).toBe(
        firstResult.has(25),
      );
      expect(result.current.searchResultsByLine.size).toBe(firstResult.size);
    });

    it("should handle rapid alternating between different search result sets", () => {
      const searchResults1: SearchResult[] = [
        {
          lineIndex: 1,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const searchResults2: SearchResult[] = [
        {
          lineIndex: 2,
          columnStart: 0,
          columnEnd: 5,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result, rerender } = renderHook(
        (props) => useSearchResults(props.searchResults),
        { initialProps: { searchResults: searchResults1 } },
      );

      // Rapidly alternate between different result sets
      for (let i = 0; i < 100; i++) {
        const currentResults = i % 2 === 0 ? searchResults1 : searchResults2;
        rerender({ searchResults: currentResults });

        if (i % 2 === 0) {
          expect(result.current.searchResultsByLine.has(1)).toBe(true);
          expect(result.current.searchResultsByLine.has(2)).toBe(false);
        } else {
          expect(result.current.searchResultsByLine.has(1)).toBe(false);
          expect(result.current.searchResultsByLine.has(2)).toBe(true);
        }
      }
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should handle typical search patterns efficiently", () => {
      // Simulate search results from searching "test" in a large JSON file
      const searchResults: SearchResult[] = [
        // Line 5: "test" in property name
        {
          lineIndex: 5,
          columnStart: 4,
          columnEnd: 8,
          matchText: "test",
          contextLine: "line content",
        },
        // Line 12: "test" in string value
        {
          lineIndex: 12,
          columnStart: 15,
          columnEnd: 19,
          matchText: "test",
          contextLine: "line content",
        },
        // Line 12: "testing" (overlapping with "test")
        {
          lineIndex: 12,
          columnStart: 15,
          columnEnd: 22,
          matchText: "test",
          contextLine: "line content",
        },
        // Line 45: "test" in another property
        {
          lineIndex: 45,
          columnStart: 8,
          columnEnd: 12,
          matchText: "test",
          contextLine: "line content",
        },
        // Line 67: "testData" (contains "test")
        {
          lineIndex: 67,
          columnStart: 2,
          columnEnd: 6,
          matchText: "test",
          contextLine: "line content",
        },
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      // Should identify all lines with matches
      expect(result.current.searchResultsByLine.has(5)).toBe(true);
      expect(result.current.searchResultsByLine.has(12)).toBe(true);
      expect(result.current.searchResultsByLine.has(45)).toBe(true);
      expect(result.current.searchResultsByLine.has(67)).toBe(true);

      // Lines without matches should not be included
      expect(result.current.searchResultsByLine.has(6)).toBe(false);
      expect(result.current.searchResultsByLine.has(13)).toBe(false);
      expect(result.current.searchResultsByLine.has(44)).toBe(false);

      // Total unique lines should be correct
      expect(result.current.searchResultsByLine.size).toBe(4);
    });

    it("should handle search results from regex patterns", () => {
      // Simulate regex search results for pattern: /\d+/g (find all numbers)
      const searchResults: SearchResult[] = [
        // Line 2: "id": 123
        {
          lineIndex: 2,
          columnStart: 7,
          columnEnd: 10,
          matchText: "test",
          contextLine: "line content",
        },
        // Line 8: "port": 8080, "timeout": 30
        {
          lineIndex: 8,
          columnStart: 9,
          columnEnd: 13,
          matchText: "test",
          contextLine: "line content",
        }, // 8080
        {
          lineIndex: 8,
          columnStart: 27,
          columnEnd: 29,
          matchText: "test",
          contextLine: "line content",
        }, // 30
        // Line 15: version "1.2.3"
        {
          lineIndex: 15,
          columnStart: 11,
          columnEnd: 12,
          matchText: "test",
          contextLine: "line content",
        }, // 1
        {
          lineIndex: 15,
          columnStart: 13,
          columnEnd: 14,
          matchText: "test",
          contextLine: "line content",
        }, // 2
        {
          lineIndex: 15,
          columnStart: 15,
          columnEnd: 16,
          matchText: "test",
          contextLine: "line content",
        }, // 3
      ];

      const { result } = renderHook(() => useSearchResults(searchResults));

      // Should correctly identify lines with numeric matches
      expect(result.current.searchResultsByLine.has(2)).toBe(true);
      expect(result.current.searchResultsByLine.has(8)).toBe(true);
      expect(result.current.searchResultsByLine.has(15)).toBe(true);

      // Should have exactly 3 unique lines
      expect(result.current.searchResultsByLine.size).toBe(3);
    });
  });
});
