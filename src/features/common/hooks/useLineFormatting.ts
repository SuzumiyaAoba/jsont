import { useMemo } from "react";

/**
 * Hook for line number formatting logic
 * Provides consistent line number formatting across all viewers
 */
export function useLineFormatting(totalLines: number) {
  const lineNumberWidth = useMemo(() => {
    return totalLines.toString().length;
  }, [totalLines]);

  const formatLineNumber = useMemo(
    () =>
      (lineIndex: number): string => {
        const lineNumber = lineIndex + 1; // Line numbers start from 1
        return lineNumber.toString().padStart(lineNumberWidth, " ");
      },
    [lineNumberWidth],
  );

  return {
    lineNumberWidth,
    formatLineNumber,
  };
}
