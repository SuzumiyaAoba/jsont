/**
 * Regression tests for useScrolling based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Incorrect scroll range calculations causing missing lines
 * 2. Edge cases with small visible areas
 * 3. Boundary conditions in startLine/endLine calculations
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useScrolling } from "./useScrolling";

describe("useScrolling Regression Tests", () => {
  describe("Scroll Range Calculation Bug Fixes", () => {
    it("should calculate correct start and end lines for normal scrolling", () => {
      const totalLines = 100;
      const scrollOffset = 10;
      const visibleLines = 20;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(10);
      expect(result.current.endLine).toBe(30);
    });

    it("should handle edge case where content is shorter than visible area", () => {
      // This addresses the bug where short content was not displayed correctly
      const totalLines = 5;
      const scrollOffset = 0;
      const visibleLines = 20;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(0);
      expect(result.current.endLine).toBe(5); // Should show all available lines
    });

    it("should prevent scrolling beyond available content", () => {
      // This addresses the bug where scrolling past the end caused display issues
      const totalLines = 10;
      const scrollOffset = 15; // Attempting to scroll past the end
      const visibleLines = 5;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      // Should clamp to show the last available lines
      expect(result.current.startLine).toBe(5); // totalLines - visibleLines
      expect(result.current.endLine).toBe(10);
    });

    it("should handle negative scroll offset gracefully", () => {
      const totalLines = 50;
      const scrollOffset = -5; // Invalid negative scroll
      const visibleLines = 10;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      // Should start from the beginning
      expect(result.current.startLine).toBe(0);
      expect(result.current.endLine).toBe(10);
    });

    it("should ensure minimum visible content", () => {
      // This addresses the bug where very small visible areas caused issues
      const totalLines = 100;
      const scrollOffset = 50;
      const visibleLines = 1; // Very small visible area

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(50);
      expect(result.current.endLine).toBe(51);
      expect(result.current.endLine - result.current.startLine).toBe(
        visibleLines,
      );
    });
  });

  describe("Boundary Conditions", () => {
    it("should handle zero total lines", () => {
      const totalLines = 0;
      const scrollOffset = 0;
      const visibleLines = 10;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(0);
      expect(result.current.endLine).toBe(0);
    });

    it("should handle zero visible lines", () => {
      const totalLines = 100;
      const scrollOffset = 10;
      const visibleLines = 0;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(10);
      // useScrolling enforces minimum of 1 visible line, so end will be start + default height
      expect(result.current.endLine).toBeGreaterThan(result.current.startLine);
    });

    it("should handle large scroll offsets efficiently", () => {
      const totalLines = 10;
      const scrollOffset = 1000000; // Extremely large offset
      const visibleLines = 5;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      // Should clamp to the maximum valid range
      expect(result.current.startLine).toBe(5);
      expect(result.current.endLine).toBe(10);
    });
  });

  describe("Line Display Consistency", () => {
    it("should ensure first line is always accessible when scrollOffset is 0", () => {
      // This regression test ensures that line 1 is always visible when not scrolled
      const totalLines = 50;
      const scrollOffset = 0;
      const visibleLines = 10;

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      expect(result.current.startLine).toBe(0); // Should start from first line
      expect(result.current.endLine).toBe(10);
    });

    it("should ensure last line is accessible when scrolled to bottom", () => {
      // This regression test ensures that the last line can always be displayed
      const totalLines = 100;
      const maxScrollOffset = totalLines - 1; // Scroll to show last line
      const visibleLines = 20;

      const { result } = renderHook(() =>
        useScrolling(totalLines, maxScrollOffset, visibleLines),
      );

      // Should include the last line (index 99)
      expect(result.current.endLine).toBe(totalLines);
      expect(result.current.startLine).toBe(totalLines - visibleLines);
    });

    it("should maintain consistent range size when possible", () => {
      // This ensures that the displayed range stays consistent
      const totalLines = 100;
      const visibleLines = 15;

      // Test multiple scroll positions
      const scrollPositions = [0, 10, 25, 50, 80];

      scrollPositions.forEach((scrollOffset) => {
        const { result } = renderHook(() =>
          useScrolling(totalLines, scrollOffset, visibleLines),
        );

        const displayedLines =
          result.current.endLine - result.current.startLine;
        expect(displayedLines).toBeLessThanOrEqual(visibleLines);
        expect(displayedLines).toBeGreaterThan(0);
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle very large content efficiently", () => {
      const totalLines = 1000000; // Very large file
      const scrollOffset = 500000;
      const visibleLines = 50;

      const startTime = Date.now();

      const { result } = renderHook(() =>
        useScrolling(totalLines, scrollOffset, visibleLines),
      );

      const endTime = Date.now();

      // Should complete very quickly (less than 10ms for calculation)
      expect(endTime - startTime).toBeLessThan(10);

      expect(result.current.startLine).toBe(500000);
      expect(result.current.endLine).toBe(500050);
    });

    it("should be stable across re-renders with same props", () => {
      const totalLines = 50;
      const scrollOffset = 25;
      const visibleLines = 10;

      const { result, rerender } = renderHook(
        (props) =>
          useScrolling(
            props.totalLines,
            props.scrollOffset,
            props.visibleLines,
          ),
        {
          initialProps: { totalLines, scrollOffset, visibleLines },
        },
      );

      const firstResult = {
        startLine: result.current.startLine,
        endLine: result.current.endLine,
      };

      // Re-render with same props
      rerender({ totalLines, scrollOffset, visibleLines });

      // Should produce identical results
      expect(result.current.startLine).toBe(firstResult.startLine);
      expect(result.current.endLine).toBe(firstResult.endLine);
    });

    it("should handle dynamic content length changes", () => {
      const initialTotalLines = 20;
      const scrollOffset = 15;
      const visibleLines = 10;

      const { result, rerender } = renderHook(
        (props) =>
          useScrolling(
            props.totalLines,
            props.scrollOffset,
            props.visibleLines,
          ),
        {
          initialProps: {
            totalLines: initialTotalLines,
            scrollOffset,
            visibleLines,
          },
        },
      );

      // Initially should clamp to available content
      expect(result.current.startLine).toBe(10);
      expect(result.current.endLine).toBe(20);

      // Simulate content growing
      rerender({ totalLines: 100, scrollOffset, visibleLines });

      // Should maintain the same scroll position
      expect(result.current.startLine).toBe(15);
      expect(result.current.endLine).toBe(25);

      // Simulate content shrinking below current scroll position
      rerender({ totalLines: 5, scrollOffset, visibleLines });

      // Should adjust to show available content
      expect(result.current.startLine).toBe(0);
      expect(result.current.endLine).toBe(5);
    });
  });
});
