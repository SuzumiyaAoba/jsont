/**
 * Utility functions for extracting property details from tree lines and data
 */

import type { JsonValue } from "@core/types/index";
import type { TreeLine } from "@features/tree/types/tree";
import type { PropertyDetails } from "../types/propertyDetails";

/**
 * Get the type of a JSON value
 */
function getValueType(value: JsonValue): PropertyDetails["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as "string" | "number" | "boolean";
}

/**
 * Format a JSON value as a display string without truncation
 */
/**
 * Format value for Property Details display without truncation
 * Shows full content instead of summary for arrays and objects
 */
function formatValueForPropertyDetails(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    // Don't show value for arrays, only show in Children count
    return "-";
  }
  if (typeof value === "object") {
    // Don't show value for objects, only show in Children count
    return "-";
  }
  return String(value);
}

function formatValue(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `{${keys.length} properties}`;
  }
  return String(value);
}

/**
 * Get children count for objects and arrays
 */
function getChildrenCount(value: JsonValue): number | undefined {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value).length;
  }
  return undefined;
}

/**
 * Extract property details from a tree line
 */
export function extractPropertyDetailsFromTreeLine(
  line: TreeLine,
  originalData: JsonValue,
): PropertyDetails | null {
  if (!line) return null;

  // Build the path from the tree line ID
  const path: (string | number)[] = [];

  // Parse the line ID to get the path
  if (line.id !== "__root__") {
    const idParts = line.id.split(".");
    if (idParts.length > 1) {
      // Remove "__root__" and parse the rest
      const pathParts = idParts.slice(1);
      for (const part of pathParts) {
        // Check if it's a number (array index)
        const numericPart = Number(part);
        if (!Number.isNaN(numericPart)) {
          path.push(numericPart);
        } else {
          path.push(part);
        }
      }
    }
  }

  // Get the actual value from the original data using the path
  let actualValue: JsonValue = originalData;
  try {
    for (const pathPart of path) {
      if (actualValue === null) break;

      if (Array.isArray(actualValue)) {
        const index =
          typeof pathPart === "number" ? pathPart : Number(pathPart);
        if (index >= 0 && index < actualValue.length) {
          actualValue = actualValue[index] ?? null;
        } else {
          actualValue = null;
          break;
        }
      } else if (typeof actualValue === "object") {
        const key = String(pathPart);
        if (key in actualValue) {
          actualValue = (actualValue as Record<string, JsonValue>)[key] ?? null;
        } else {
          actualValue = null;
          break;
        }
      } else {
        actualValue = null;
        break;
      }
    }
  } catch {
    actualValue = null;
  }

  // Use the original value if available, otherwise use the retrieved value
  const valueToUse =
    line.originalValue !== undefined ? line.originalValue : actualValue;

  const type = getValueType(valueToUse);
  const valueString = line.value || formatValueForPropertyDetails(valueToUse); // Use line.value (formatted) or format the actual value without truncation
  const pathString = path.length > 0 ? path.join(".") : "root";
  const hasChildren = line.hasChildren || false;
  const childrenCount = getChildrenCount(valueToUse);

  return {
    path,
    key: line.key,
    value: valueToUse,
    type,
    pathString,
    valueString,
    hasChildren,
    childrenCount,
  };
}

/**
 * Extract property details from a JSON path
 */
export function extractPropertyDetailsFromPath(
  path: (string | number)[],
  originalData: JsonValue,
): PropertyDetails | null {
  if (originalData === null || originalData === undefined) return null;

  try {
    // Navigate to the value at the given path
    let currentValue: JsonValue = originalData;
    let currentKey: string | number | null = null;

    for (const pathPart of path) {
      if (currentValue === null) return null;

      if (Array.isArray(currentValue)) {
        const index =
          typeof pathPart === "number" ? pathPart : Number(pathPart);
        if (index < 0 || index >= currentValue.length) return null;
        currentValue = currentValue[index] ?? null;
        currentKey = index;
      } else if (typeof currentValue === "object") {
        const key = String(pathPart);
        if (!(key in currentValue)) return null;
        currentValue = (currentValue as Record<string, JsonValue>)[key] ?? null;
        currentKey = key;
      } else {
        // Cannot navigate further into primitive values
        return null;
      }
    }

    const type = getValueType(currentValue);
    const valueString = formatValue(currentValue);
    const pathString = path.length > 0 ? path.join(".") : "root";
    const hasChildren = type === "object" || type === "array";
    const childrenCount = getChildrenCount(currentValue);

    return {
      path,
      key: currentKey,
      value: currentValue,
      type,
      pathString,
      valueString,
      hasChildren,
      childrenCount,
    };
  } catch {
    return null;
  }
}
