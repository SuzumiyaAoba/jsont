import { useMemo } from "react";

/**
 * Hook for scroll calculation logic
 * Handles visible lines calculation and scroll boundaries
 */
export function useScrolling(
  totalLines: number,
  scrollOffset: number = 0,
  visibleLines?: number,
) {
  // Calculate effective visible lines with fallback
  const effectiveVisibleLines = useMemo(() => {
    return visibleLines || Math.max(1, (process.stdout.rows || 24) - 3);
  }, [visibleLines]);

  // Calculate visible line range
  const { startLine, endLine, visibleLineIndices } = useMemo(() => {
    const start = scrollOffset;
    const end = Math.min(totalLines, start + effectiveVisibleLines);
    const indices = Array.from({ length: end - start }, (_, i) => start + i);

    return {
      startLine: start,
      endLine: end,
      visibleLineIndices: indices,
    };
  }, [scrollOffset, totalLines, effectiveVisibleLines]);

  return {
    effectiveVisibleLines,
    startLine,
    endLine,
    visibleLineIndices,
  };
}
