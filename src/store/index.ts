/**
 * Central export for all store functionality
 *
 * This barrel export provides a single entry point for all store-related imports,
 * including atoms and hooks, to ensure consistent import patterns across the codebase.
 */

// Re-export all atoms
export * from "./atoms";

// Re-export all hooks
export * from "./hooks";
export type { JotaiProviderProps } from "./Provider";
// Re-export the store provider
export { JotaiProvider, JotaiProvider as StoreProvider } from "./Provider";
