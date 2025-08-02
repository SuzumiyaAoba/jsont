/**
 * Tests for height calculation utilities
 */

import {
  calculateCenteredScroll,
  calculateComponentHeights,
  calculateNavigationHeight,
  calculateScrollBounds,
  calculateScrollToVisible,
  calculateTreeViewHeights,
  calculateVisibleEnd,
  calculateVisibleRange,
} from "@core/utils/heightCalculations";
import { describe, expect, it } from "vitest";

describe("Height Calculations", () => {
  describe("calculateComponentHeights", () => {
    it("should calculate heights for normal sized components", () => {
      const result = calculateComponentHeights(20);

      expect(result).toEqual({
        totalHeight: 20,
        baseContentHeight: 19, // 20 - 1 (header)
        safeContentHeight: 19, // same as base
        conservativeContentHeight: 18, // 20 - 2
        halfPageHeight: 9, // floor(18 / 2)
      });
    });

    it("should handle small heights gracefully", () => {
      const result = calculateComponentHeights(2);

      expect(result).toEqual({
        totalHeight: 2,
        baseContentHeight: 1,
        safeContentHeight: 1,
        conservativeContentHeight: 1, // max(1, 2-2)
        halfPageHeight: 1, // max(1, floor(1/2))
      });
    });

    it("should handle zero and negative heights", () => {
      const zeroResult = calculateComponentHeights(0);
      expect(zeroResult).toEqual({
        totalHeight: 0,
        baseContentHeight: 0, // max(0, 0-1)
        safeContentHeight: 1, // max(1, 0)
        conservativeContentHeight: 1, // max(1, 0-2)
        halfPageHeight: 1, // max(1, floor(1/2))
      });

      const negativeResult = calculateComponentHeights(-5);
      expect(negativeResult).toEqual({
        totalHeight: -5,
        baseContentHeight: 0, // max(0, -5-1)
        safeContentHeight: 1, // max(1, 0)
        conservativeContentHeight: 1, // max(1, -5-2)
        halfPageHeight: 1, // max(1, floor(1/2))
      });
    });

    it("should handle large heights", () => {
      const result = calculateComponentHeights(100);

      expect(result).toEqual({
        totalHeight: 100,
        baseContentHeight: 99,
        safeContentHeight: 99,
        conservativeContentHeight: 98,
        halfPageHeight: 49,
      });
    });
  });

  describe("calculateTreeViewHeights", () => {
    it("should calculate heights for tree view (same as component heights)", () => {
      const result = calculateTreeViewHeights(15);

      expect(result).toEqual({
        totalHeight: 15,
        baseContentHeight: 14,
        safeContentHeight: 14,
        conservativeContentHeight: 13,
        halfPageHeight: 6,
      });
    });

    it("should handle edge cases like component heights", () => {
      const result = calculateTreeViewHeights(1);

      expect(result).toEqual({
        totalHeight: 1,
        baseContentHeight: 0,
        safeContentHeight: 1,
        conservativeContentHeight: 1,
        halfPageHeight: 1,
      });
    });
  });

  describe("calculateScrollBounds", () => {
    it("should calculate scroll bounds for normal case", () => {
      const result = calculateScrollBounds(5, 50, 10);

      expect(result).toEqual({
        maxScroll: 40, // 50 - 10
        boundedScrollOffset: 5, // min(5, 40)
        isNearEnd: false, // 5 < 40 - 1
      });
    });

    it("should bound scroll offset to maximum", () => {
      const result = calculateScrollBounds(100, 50, 10);

      expect(result).toEqual({
        maxScroll: 40,
        boundedScrollOffset: 40, // min(100, 40)
        isNearEnd: true, // 40 >= 40 - 1
      });
    });

    it("should handle case where content fits in view", () => {
      const result = calculateScrollBounds(5, 5, 10);

      expect(result).toEqual({
        maxScroll: 0, // max(0, 5 - 10)
        boundedScrollOffset: 0, // min(5, 0)
        isNearEnd: true, // 0 >= 0 - 1
      });
    });

    it("should detect near end correctly", () => {
      const nearEnd = calculateScrollBounds(39, 50, 10);
      expect(nearEnd.isNearEnd).toBe(true); // 39 >= 40 - 1

      const notNearEnd = calculateScrollBounds(38, 50, 10);
      expect(notNearEnd.isNearEnd).toBe(false); // 38 < 40 - 1
    });

    it("should handle zero items", () => {
      const result = calculateScrollBounds(5, 0, 10);

      expect(result).toEqual({
        maxScroll: 0,
        boundedScrollOffset: 0,
        isNearEnd: true,
      });
    });
  });

  describe("calculateVisibleRange", () => {
    it("should calculate visible range for normal scrolling", () => {
      const result = calculateVisibleRange(10, 5, 30, false);

      expect(result).toEqual({
        startIndex: 10,
        endIndex: 15, // min(10 + 5, 30)
        visibleCount: 5,
      });
    });

    it("should handle near end scrolling", () => {
      const result = calculateVisibleRange(25, 10, 30, true);

      expect(result).toEqual({
        startIndex: 20, // max(0, 30 - 10)
        endIndex: 30,
        visibleCount: 10,
      });
    });

    it("should handle case where items fit in content height", () => {
      const result = calculateVisibleRange(0, 20, 10, false);

      expect(result).toEqual({
        startIndex: 0,
        endIndex: 10, // min(0 + 20, 10)
        visibleCount: 10,
      });
    });

    it("should handle zero items", () => {
      const result = calculateVisibleRange(5, 10, 0, false);

      expect(result).toEqual({
        startIndex: 0,
        endIndex: 0,
        visibleCount: 0,
      });
    });

    it("should handle near end with small item count", () => {
      const result = calculateVisibleRange(0, 10, 5, true);

      expect(result).toEqual({
        startIndex: 0, // max(0, 5 - 10)
        endIndex: 5,
        visibleCount: 5,
      });
    });

    it("should not use near end logic when not near end", () => {
      const result = calculateVisibleRange(5, 10, 30, false);

      expect(result).toEqual({
        startIndex: 5,
        endIndex: 15,
        visibleCount: 10,
      });
    });
  });

  describe("calculateNavigationHeight", () => {
    it("should calculate navigation height with safety margin", () => {
      expect(calculateNavigationHeight(20)).toBe(18); // 20 - 2
      expect(calculateNavigationHeight(10)).toBe(8); // 10 - 2
      expect(calculateNavigationHeight(5)).toBe(3); // 5 - 2
    });

    it("should ensure minimum height of 1", () => {
      expect(calculateNavigationHeight(2)).toBe(1); // max(1, 2 - 2)
      expect(calculateNavigationHeight(1)).toBe(1); // max(1, 1 - 2)
      expect(calculateNavigationHeight(0)).toBe(1); // max(1, 0 - 2)
      expect(calculateNavigationHeight(-5)).toBe(1); // max(1, -5 - 2)
    });
  });

  describe("calculateVisibleEnd", () => {
    it("should calculate visible end position", () => {
      expect(calculateVisibleEnd(10, 5)).toBe(14); // 10 + 5 - 1
      expect(calculateVisibleEnd(0, 20)).toBe(19); // 0 + 20 - 1
      expect(calculateVisibleEnd(5, 1)).toBe(5); // 5 + 1 - 1
    });

    it("should handle zero content height", () => {
      expect(calculateVisibleEnd(10, 0)).toBe(9); // 10 + 0 - 1
    });
  });

  describe("calculateCenteredScroll", () => {
    it("should center item in view", () => {
      const result = calculateCenteredScroll(20, 10, 50);
      expect(result).toBe(15); // max(0, 20 - floor(10/2))
    });

    it("should not scroll past beginning", () => {
      const result = calculateCenteredScroll(2, 10, 50);
      expect(result).toBe(0); // max(0, 2 - 5)
    });

    it("should not scroll past maximum", () => {
      const result = calculateCenteredScroll(100, 10, 20);
      expect(result).toBe(20); // min(95, 20)
    });

    it("should handle even and odd content heights", () => {
      expect(calculateCenteredScroll(10, 6, 50)).toBe(7); // 10 - floor(6/2)
      expect(calculateCenteredScroll(10, 7, 50)).toBe(7); // 10 - floor(7/2)
    });
  });

  describe("calculateScrollToVisible", () => {
    it("should not scroll when item is already visible", () => {
      const result = calculateScrollToVisible(15, 10, 10, 50);
      expect(result).toBe(10); // item at 15 is visible in range [10, 19]
    });

    it("should scroll up when item is above visible area", () => {
      const result = calculateScrollToVisible(5, 10, 10, 50);
      expect(result).toBe(5); // max(0, 5)
    });

    it("should scroll down when item is below visible area", () => {
      const result = calculateScrollToVisible(25, 10, 10, 50);
      expect(result).toBe(16); // min(50, 25 - 10 + 1)
    });

    it("should not scroll past beginning when scrolling up", () => {
      const result = calculateScrollToVisible(0, 10, 10, 50);
      expect(result).toBe(0); // max(0, 0)
    });

    it("should not scroll past maximum when scrolling down", () => {
      const result = calculateScrollToVisible(100, 10, 10, 20);
      expect(result).toBe(20); // min(20, 100 - 10 + 1)
    });

    it("should handle edge of visible area", () => {
      // Item at start of visible area
      const startResult = calculateScrollToVisible(10, 10, 10, 50);
      expect(startResult).toBe(10); // already visible

      // Item at end of visible area
      const endResult = calculateScrollToVisible(19, 10, 10, 50);
      expect(endResult).toBe(10); // already visible
    });

    it("should handle single item view", () => {
      const result = calculateScrollToVisible(25, 10, 1, 50);
      expect(result).toBe(25); // min(50, 25 - 1 + 1)
    });
  });

  describe("integration scenarios", () => {
    it("should work together for typical tree view scenario", () => {
      const totalHeight = 20;
      const totalItems = 100;
      const scrollOffset = 30;

      // Calculate heights
      const heights = calculateTreeViewHeights(totalHeight);
      expect(heights.safeContentHeight).toBe(19);

      // Calculate scroll bounds
      const scrollBounds = calculateScrollBounds(
        scrollOffset,
        totalItems,
        heights.safeContentHeight,
      );
      expect(scrollBounds.maxScroll).toBe(81); // 100 - 19
      expect(scrollBounds.boundedScrollOffset).toBe(30);

      // Calculate visible range
      const visibleRange = calculateVisibleRange(
        scrollBounds.boundedScrollOffset,
        heights.safeContentHeight,
        totalItems,
        scrollBounds.isNearEnd,
      );
      expect(visibleRange.startIndex).toBe(30);
      expect(visibleRange.endIndex).toBe(49);
      expect(visibleRange.visibleCount).toBe(19);
    });

    it("should handle navigation scenario", () => {
      const totalHeight = 15;
      const navigationHeight = calculateNavigationHeight(totalHeight);
      expect(navigationHeight).toBe(13);

      // Navigate to specific item
      const targetIndex = 50;
      const currentScroll = 20;
      const maxScroll = 100;

      const newScroll = calculateScrollToVisible(
        targetIndex,
        currentScroll,
        navigationHeight,
        maxScroll,
      );
      expect(newScroll).toBe(38); // min(100, 50 - 13 + 1)
    });

    it("should handle small viewport scenarios", () => {
      const totalHeight = 3;
      const heights = calculateComponentHeights(totalHeight);

      expect(heights.safeContentHeight).toBe(2); // max(1, 3-1)
      expect(heights.halfPageHeight).toBe(1);

      const scrollBounds = calculateScrollBounds(
        0,
        10,
        heights.safeContentHeight,
      );
      expect(scrollBounds.maxScroll).toBe(8); // 10 - 2

      const visibleRange = calculateVisibleRange(
        0,
        heights.safeContentHeight,
        10,
        false,
      );
      expect(visibleRange.visibleCount).toBe(2);
    });
  });
});
