/**
 * Performance-optimized equality comparison utilities
 */

/**
 * Fast shallow comparison for objects with known keys
 */
export function shallowEqual(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

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
 * Optimized deep equality comparison with early exit
 * More efficient than JSON.stringify for most settings objects
 */
export function deepEqual(
  value1: unknown,
  value2: unknown,
  maxDepth = 10,
): boolean {
  // Quick identity check
  if (value1 === value2) {
    return true;
  }

  // Null/undefined checks
  if (value1 == null || value2 == null) {
    return value1 === value2;
  }

  // Type check
  if (typeof value1 !== typeof value2) {
    return false;
  }

  // Handle primitives
  if (typeof value1 !== "object") {
    return value1 === value2;
  }

  // Handle arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    for (let i = 0; i < value1.length; i++) {
      if (maxDepth > 0 && !deepEqual(value1[i], value2[i], maxDepth - 1)) {
        return false;
      }
    }
    return true;
  }

  // Handle objects
  if (Array.isArray(value1) || Array.isArray(value2)) {
    return false;
  }

  const obj1 = value1 as Record<string, unknown>;
  const obj2 = value2 as Record<string, unknown>;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!(key in obj2)) {
      return false;
    }
    if (maxDepth > 0 && !deepEqual(obj1[key], obj2[key], maxDepth - 1)) {
      return false;
    }
  }

  return true;
}

/**
 * Specialized comparison for settings values
 * Optimized for the specific structure of settings objects
 */
export function settingsEqual(
  settings1: Record<string, unknown>,
  settings2: Record<string, unknown>,
): boolean {
  // Fast path for empty objects
  if (
    Object.keys(settings1).length === 0 &&
    Object.keys(settings2).length === 0
  ) {
    return true;
  }

  // Use deep equality with limited depth for settings
  return deepEqual(settings1, settings2, 5);
}
