/**
 * Types for jq transformation functionality
 */

export interface JqState {
  isActive: boolean;
  query: string;
  transformedData: unknown | null;
  error: string | null;
  isProcessing: boolean;
  showOriginal: boolean; // Toggle between original and transformed data view
}

export interface JqTransformationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface JqQueryHistory {
  queries: string[];
  currentIndex: number;
}
