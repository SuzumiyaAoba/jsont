/**
 * es-toolkit utility functions for jsont
 * High-performance utilities for JSON processing
 */

import {
  chunk,
  debounce,
  flatten,
  groupBy,
  memoize,
  omit,
  pick,
} from "es-toolkit";
import type { JsonValue } from "../types/index.js";

/**
 * Memoized JSON path getter using es-toolkit
 */
export const getJsonPath = memoize(
  (data: JsonValue, path: string[]): JsonValue => {
    if (!data || path.length === 0) {
      return data;
    }

    let current = data;
    for (const key of path) {
      if (current === null || typeof current !== "object") {
        return null;
      }

      if (Array.isArray(current)) {
        const index = parseInt(key, 10);
        if (isNaN(index) || index < 0 || index >= current.length) {
          return null;
        }
        current = current[index];
      } else {
        current = (current as Record<string, JsonValue>)[key];
      }
    }

    return current;
  },
);

/**
 * Debounced filter function for real-time filtering
 */
export const debouncedFilter = debounce(
  (
    data: JsonValue,
    filterString: string,
    callback: (result: JsonValue) => void,
  ) => {
    // Basic filtering implementation
    // Will be enhanced with jq/JSONata integration
    try {
      const result = applyBasicFilter(data, filterString);
      callback(result);
    } catch (error) {
      callback(data); // Return original data on error
    }
  },
  300,
);

/**
 * Extract specific fields from JSON objects using es-toolkit pick
 */
export function extractFields(data: JsonValue, fields: string[]): JsonValue {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const result = pick(data as Record<string, JsonValue>, fields);
  return result as JsonValue;
}

/**
 * Remove specific fields from JSON objects using es-toolkit omit
 */
export function removeFields(data: JsonValue, fields: string[]): JsonValue {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const result = omit(data as Record<string, JsonValue>, fields);
  return result as JsonValue;
}

/**
 * Chunk large arrays for virtual scrolling
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  return chunk(array, size);
}

/**
 * Flatten nested JSON structures
 */
export function flattenJson(data: JsonValue): JsonValue[] {
  if (!Array.isArray(data)) {
    return [data];
  }

  return flatten(
    data.map((item) => (Array.isArray(item) ? flattenJson(item) : [item])),
  );
}

/**
 * Group JSON objects by a specific key
 */
export function groupJsonBy(
  data: JsonValue[],
  keyGetter: (item: JsonValue) => string,
): Record<string, JsonValue[]> {
  return groupBy(data, keyGetter);
}

/**
 * Memoized JSON stringification for performance
 */
export const stringifyJson = memoize(
  (data: JsonValue, pretty = false): string => {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  },
);

/**
 * Memoized deep clone using JSON methods
 */
export const cloneJson = memoize((data: JsonValue): JsonValue => {
  return JSON.parse(JSON.stringify(data));
});

/**
 * Basic filter implementation (placeholder for jq/JSONata)
 */
function applyBasicFilter(data: JsonValue, filterString: string): JsonValue {
  if (!filterString.trim()) {
    return data;
  }

  // Very basic filtering - will be replaced with hybrid query engine
  if (Array.isArray(data)) {
    return data.filter((item) => {
      const itemString = JSON.stringify(item).toLowerCase();
      return itemString.includes(filterString.toLowerCase());
    });
  }

  return data;
}

/**
 * Performance utilities
 */
export const perfUtils = {
  /**
   * Measure execution time of a function
   */
  measureTime: <T>(fn: () => T, label?: string): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    if (label) {
      console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  },

  /**
   * Create a memoized version of any function
   */
  memoize,

  /**
   * Create a debounced version of any function
   */
  debounce,
};

/**
 * Object manipulation utilities
 */
export const objectUtils = {
  pick,
  omit,

  /**
   * Get nested value safely
   */
  get: getJsonPath,

  /**
   * Check if object has nested property
   */
  has: (obj: JsonValue, path: string[]): boolean => {
    return getJsonPath(obj, path) !== null;
  },
};
