/**
 * Regression tests for useLineFormatting based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Line numbers starting from 2 instead of 1
 * 2. Inconsistent line number formatting with padding
 * 3. Line number width calculations for different content sizes
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLineFormatting } from "./useLineFormatting";

describe("useLineFormatting Regression Tests", () => {
  describe("Line Number Starting Bug Fixes", () => {
    it("should format line numbers starting from 1, not 2", () => {
      // This is the critical regression test for the line numbering bug
      const totalLines = 10;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Test formatting the first line (index 0 should produce " 1" with padding)
      const firstLineFormatted = result.current.formatLineNumber(0);
      expect(firstLineFormatted).toBe(" 1");

      // Test formatting the second line (index 1 should produce " 2")
      const secondLineFormatted = result.current.formatLineNumber(1);
      expect(secondLineFormatted).toBe(" 2");

      // Test formatting the last line
      const lastLineFormatted = result.current.formatLineNumber(totalLines - 1);
      expect(lastLineFormatted).toBe("10");
    });

    it("should handle zero-based indexing correctly for various line counts", () => {
      const testCases = [
        { totalLines: 1, testIndex: 0, expected: "1" },
        { totalLines: 5, testIndex: 0, expected: "1" },
        { totalLines: 5, testIndex: 4, expected: "5" },
        { totalLines: 100, testIndex: 0, expected: "  1" }, // Should be padded
        { totalLines: 100, testIndex: 99, expected: "100" },
        { totalLines: 1000, testIndex: 0, expected: "   1" }, // More padding
        { totalLines: 1000, testIndex: 999, expected: "1000" },
      ];

      testCases.forEach(({ totalLines, testIndex, expected }) => {
        const { result } = renderHook(() => useLineFormatting(totalLines));
        const formatted = result.current.formatLineNumber(testIndex);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe("Padding and Width Calculations", () => {
    it("should calculate correct padding for single digit line numbers", () => {
      const totalLines = 9;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // All line numbers should have consistent width (no padding needed)
      expect(result.current.formatLineNumber(0)).toBe("1");
      expect(result.current.formatLineNumber(8)).toBe("9");

      // Check that all formatted numbers have the same length
      const allFormatted = Array.from({ length: totalLines }, (_, i) =>
        result.current.formatLineNumber(i),
      );
      const lengths = allFormatted.map((f) => f.length);
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1); // All should have same length
    });

    it("should calculate correct padding for double digit line numbers", () => {
      const totalLines = 99;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Single digits should be padded
      expect(result.current.formatLineNumber(0)).toBe(" 1");
      expect(result.current.formatLineNumber(8)).toBe(" 9");

      // Double digits should not be padded
      expect(result.current.formatLineNumber(9)).toBe("10");
      expect(result.current.formatLineNumber(98)).toBe("99");

      // Check consistent width
      const testIndices = [0, 8, 9, 50, 98];
      const formatted = testIndices.map((i) =>
        result.current.formatLineNumber(i),
      );
      const lengths = formatted.map((f) => f.length);
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
    });

    it("should calculate correct padding for triple digit line numbers", () => {
      const totalLines = 999;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Single digits should be padded with 2 spaces
      expect(result.current.formatLineNumber(0)).toBe("  1");
      expect(result.current.formatLineNumber(8)).toBe("  9");

      // Double digits should be padded with 1 space
      expect(result.current.formatLineNumber(9)).toBe(" 10");
      expect(result.current.formatLineNumber(99)).toBe("100");

      // Triple digits should not be padded
      expect(result.current.formatLineNumber(998)).toBe("999");

      // Check consistent width
      const testIndices = [0, 9, 99, 500, 998];
      const formatted = testIndices.map((i) =>
        result.current.formatLineNumber(i),
      );
      const lengths = formatted.map((f) => f.length);
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
    });

    it("should handle very large line counts correctly", () => {
      const totalLines = 10000;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Test various ranges
      expect(result.current.formatLineNumber(0)).toBe("    1");
      expect(result.current.formatLineNumber(9)).toBe("   10");
      expect(result.current.formatLineNumber(99)).toBe("  100");
      expect(result.current.formatLineNumber(999)).toBe(" 1000");
      expect(result.current.formatLineNumber(9999)).toBe("10000");

      // Verify consistent width
      const testIndices = [0, 9, 99, 999, 5000, 9999];
      const formatted = testIndices.map((i) =>
        result.current.formatLineNumber(i),
      );
      const lengths = formatted.map((f) => f.length);
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero total lines gracefully", () => {
      const totalLines = 0;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Should not crash and should handle the edge case
      expect(() => result.current.formatLineNumber(0)).not.toThrow();

      // With 0 total lines, formatting line 0 should still produce "1"
      expect(result.current.formatLineNumber(0)).toBe("1");
    });

    it("should handle negative line indices gracefully", () => {
      const totalLines = 10;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Should handle negative indices without crashing
      expect(() => result.current.formatLineNumber(-1)).not.toThrow();

      // Should probably return a reasonable default or clamp to valid range
      const result1 = result.current.formatLineNumber(-1);
      expect(typeof result1).toBe("string");
      expect(result1.length).toBeGreaterThan(0);
    });

    it("should handle out-of-bounds positive indices gracefully", () => {
      const totalLines = 10;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Should handle indices beyond total lines
      expect(() => result.current.formatLineNumber(20)).not.toThrow();

      const result1 = result.current.formatLineNumber(20);
      expect(typeof result1).toBe("string");
      expect(result1.length).toBeGreaterThan(0);
    });

    it("should be consistent across re-renders", () => {
      const totalLines = 100;

      const { result, rerender } = renderHook(
        (props) => useLineFormatting(props.totalLines),
        { initialProps: { totalLines } },
      );

      const firstRenderResult = result.current.formatLineNumber(50);

      // Re-render with same props
      rerender({ totalLines });

      const secondRenderResult = result.current.formatLineNumber(50);

      expect(firstRenderResult).toBe(secondRenderResult);
    });
  });

  describe("Performance and Memory", () => {
    it("should handle very large line counts efficiently", () => {
      const totalLines = 1000000;

      const startTime = Date.now();

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Format several line numbers
      const testIndices = [0, 100, 10000, 500000, 999999];
      testIndices.forEach((index) => {
        result.current.formatLineNumber(index);
      });

      const endTime = Date.now();

      // Should complete very quickly (less than 50ms for large numbers)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should produce consistent results for repeated calls", () => {
      const totalLines = 50;

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Call the same formatting multiple times
      const results = Array.from({ length: 100 }, () =>
        result.current.formatLineNumber(25),
      );

      // All results should be identical
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1);
      expect(results[0]).toBe("26"); // Index 25 should format to line 26
    });

    it("should handle rapid changes in total lines", () => {
      const { result, rerender } = renderHook(
        (props) => useLineFormatting(props.totalLines),
        { initialProps: { totalLines: 10 } },
      );

      // Test with small line count (should be padded)
      expect(result.current.formatLineNumber(5)).toBe(" 6");

      // Rapidly change to large line count
      rerender({ totalLines: 1000 });
      expect(result.current.formatLineNumber(5)).toBe("   6");

      // Change back to small line count
      rerender({ totalLines: 5 });
      expect(result.current.formatLineNumber(4)).toBe("5");

      // Change to very large line count
      rerender({ totalLines: 100000 });
      expect(result.current.formatLineNumber(5)).toBe("     6");
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should handle typical JSON file line counts correctly", () => {
      // Common JSON file sizes and their expected formatting
      const commonSizes = [
        { totalLines: 15, testIndex: 0, expected: " 1" },
        { totalLines: 50, testIndex: 0, expected: " 1" },
        { totalLines: 200, testIndex: 0, expected: "  1" },
        { totalLines: 500, testIndex: 0, expected: "  1" },
        { totalLines: 1000, testIndex: 0, expected: "   1" },
      ];

      commonSizes.forEach(({ totalLines, testIndex, expected }) => {
        const { result } = renderHook(() => useLineFormatting(totalLines));
        expect(result.current.formatLineNumber(testIndex)).toBe(expected);
      });
    });

    it("should format array element line numbers correctly", () => {
      // Simulating a JSON array with multiple elements
      const totalLines = 25; // Typical array with ~20 elements

      const { result } = renderHook(() => useLineFormatting(totalLines));

      // Array start
      expect(result.current.formatLineNumber(0)).toBe(" 1"); // "["
      expect(result.current.formatLineNumber(1)).toBe(" 2"); // First element
      expect(result.current.formatLineNumber(10)).toBe("11"); // Middle element
      expect(result.current.formatLineNumber(24)).toBe("25"); // "]"
    });
  });
});
