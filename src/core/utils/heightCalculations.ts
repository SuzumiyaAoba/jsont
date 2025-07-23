/**
 * Height calculation utilities for consistent layout calculations across components
 */

export interface HeightCalculations {
  /** Total height available */
  totalHeight: number;
  /** Base content height (accounting for basic UI elements) */
  baseContentHeight: number;
  /** Safe content height (with additional safety margin) */
  safeContentHeight: number;
  /** Conservative content height (for scroll calculations) */
  conservativeContentHeight: number;
  /** Half page height (for page up/down navigation) */
  halfPageHeight: number;
}

/**
 * Standard height calculation for components with header
 */
export function calculateComponentHeights(
  totalHeight: number,
): HeightCalculations {
  const baseContentHeight = Math.max(1, totalHeight - 1); // Account for header line
  const safeContentHeight = Math.max(1, baseContentHeight); // Keep same as base for better visibility
  const conservativeContentHeight = Math.max(1, totalHeight - 2); // Conservative approach
  const halfPageHeight = Math.max(1, Math.floor(conservativeContentHeight / 2));

  return {
    totalHeight,
    baseContentHeight,
    safeContentHeight,
    conservativeContentHeight,
    halfPageHeight,
  };
}

/**
 * Tree view specific height calculations
 */
export function calculateTreeViewHeights(
  totalHeight: number,
): HeightCalculations {
  // Tree view has specific requirements for line display
  const baseContentHeight = Math.max(1, totalHeight - 1); // Account for header line
  const safeContentHeight = Math.max(1, baseContentHeight); // Keep same as base for better visibility
  const conservativeContentHeight = Math.max(1, totalHeight - 2); // Conservative for scroll calculations
  const halfPageHeight = Math.max(1, Math.floor(conservativeContentHeight / 2));

  return {
    totalHeight,
    baseContentHeight,
    safeContentHeight,
    conservativeContentHeight,
    halfPageHeight,
  };
}

/**
 * Calculate scroll bounds for a component
 */
export interface ScrollBounds {
  maxScroll: number;
  boundedScrollOffset: number;
  isNearEnd: boolean;
}

export function calculateScrollBounds(
  scrollOffset: number,
  totalItems: number,
  contentHeight: number,
): ScrollBounds {
  const maxScroll = Math.max(0, totalItems - contentHeight);
  const boundedScrollOffset = Math.min(scrollOffset, maxScroll);
  const isNearEnd = boundedScrollOffset >= maxScroll - 1;

  return {
    maxScroll,
    boundedScrollOffset,
    isNearEnd,
  };
}

/**
 * Calculate visible item range for pagination
 */
export interface VisibleRange {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
}

export function calculateVisibleRange(
  scrollOffset: number,
  contentHeight: number,
  totalItems: number,
  isNearEnd: boolean = false,
): VisibleRange {
  if (totalItems === 0) {
    return { startIndex: 0, endIndex: 0, visibleCount: 0 };
  }

  let startIndex: number;
  let endIndex: number;

  if (isNearEnd && totalItems > contentHeight) {
    // Near end: show the last contentHeight items to guarantee visibility
    startIndex = Math.max(0, totalItems - contentHeight);
    endIndex = totalItems;
  } else {
    // Normal case: use scroll offset
    startIndex = scrollOffset;
    endIndex = Math.min(scrollOffset + contentHeight, totalItems);
  }

  const visibleCount = endIndex - startIndex;

  return {
    startIndex,
    endIndex,
    visibleCount,
  };
}

/**
 * Calculate effective height for navigation (used in keyboard handlers)
 */
export function calculateNavigationHeight(totalHeight: number): number {
  return Math.max(1, totalHeight - 2); // Conservative content height for navigation
}

/**
 * Calculate visible end position for scroll validation
 */
export function calculateVisibleEnd(
  scrollOffset: number,
  contentHeight: number,
): number {
  return scrollOffset + contentHeight - 1;
}

/**
 * Calculate new scroll position to center an item
 */
export function calculateCenteredScroll(
  targetIndex: number,
  contentHeight: number,
  maxScroll: number,
): number {
  const centered = Math.max(0, targetIndex - Math.floor(contentHeight / 2));
  return Math.min(centered, maxScroll);
}

/**
 * Calculate new scroll position to ensure an item is visible
 */
export function calculateScrollToVisible(
  targetIndex: number,
  currentScrollOffset: number,
  contentHeight: number,
  maxScroll: number,
): number {
  const visibleStart = currentScrollOffset;
  const visibleEnd = currentScrollOffset + contentHeight - 1;

  if (targetIndex < visibleStart) {
    // Item is above visible area, scroll up to show it
    return Math.max(0, targetIndex);
  } else if (targetIndex > visibleEnd) {
    // Item is below visible area, scroll down to show it
    return Math.min(maxScroll, targetIndex - contentHeight + 1);
  } else {
    // Item is already visible, no scroll needed
    return currentScrollOffset;
  }
}
