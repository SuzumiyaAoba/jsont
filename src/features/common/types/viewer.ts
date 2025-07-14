import type { JsonValue, SearchResult } from "@core/types/index";
import type React from "react";

/**
 * Base props interface for all viewer components
 */
export interface BaseViewerProps {
  data: JsonValue | null;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  visibleLines?: number;
  showLineNumbers?: boolean;
}

/**
 * Props for components that need search functionality
 */
export interface SearchableProps {
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
}

/**
 * Props for components that need navigation/scrolling
 */
export interface NavigatableProps {
  scrollOffset?: number;
  visibleLines?: number;
}

/**
 * Props for components that show line numbers
 */
export interface LineNumberProps {
  showLineNumbers?: boolean;
}

/**
 * Data processing function type for different viewer types
 * Takes raw data and returns formatted lines for display
 */
export type DataProcessor = (data: JsonValue | null) => string[] | null;

/**
 * Content renderer function type for BaseViewer
 * Allows different viewers to customize how content is rendered
 */
export type ContentRenderer = (
  lines: string[],
  visibleLineData: string[],
  startLine: number,
  endLine: number,
  formatLineNumber: (index: number) => string,
  renderLineWithHighlighting: (
    line: string,
    originalIndex: number,
    searchTerm: string,
    isCurrentResult: boolean,
  ) => React.ReactNode,
) => React.ReactNode;

/**
 * Fallback message configuration for empty states
 */
export interface EmptyStateConfig {
  message: string;
  color?: string;
}
