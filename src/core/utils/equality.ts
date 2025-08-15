/**
 * Performance-optimized equality comparison utilities using es-toolkit
 */

import { isEqual } from "es-toolkit";
import { isEmpty, keys } from "es-toolkit/compat";

/**
 * Fast shallow comparison for objects with known keys
 */
export function shallowEqual(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
): boolean {
  const keys1 = keys(obj1);
  const keys2 = keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Optimized deep equality comparison using es-toolkit
 * More efficient than JSON.stringify for most settings objects
 */
export function deepEqual(
  value1: unknown,
  value2: unknown,
  _maxDepth = 10, // Keep for API compatibility but use es-toolkit's optimized implementation
): boolean {
  return isEqual(value1, value2);
}

/**
 * Specialized comparison for settings values using es-toolkit
 * Optimized for the specific structure of settings objects
 */
export function settingsEqual(
  settings1: Record<string, unknown>,
  settings2: Record<string, unknown>,
): boolean {
  // Fast path for empty objects using es-toolkit's isEmpty
  if (isEmpty(settings1) && isEmpty(settings2)) {
    return true;
  }

  // Use es-toolkit's optimized deep equality
  return isEqual(settings1, settings2);
}
