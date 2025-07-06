/**
 * Jotai Atoms for jsont Application
 * Atomic state management with primitive and derived atoms
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { JsonValue } from "../types/index.js";

// Primitive atoms
export const jsonDataAtom = atom<JsonValue>(null);
export const filterAtom = atom<string>("");
export const selectedPathAtom = atom<string[]>([]);
export const errorAtom = atom<string | null>(null);
export const isFilterModeAtom = atom<boolean>(false);

// View mode atom
export const viewModeAtom = atom<"compact" | "detail" | "presentation">(
  "detail",
);

// Persistent atoms (stored in localStorage)
export const themeAtom = atomWithStorage<"dark" | "light">(
  "jsont-theme",
  "dark",
);
export const filterHistoryAtom = atomWithStorage<string[]>(
  "jsont-filter-history",
  [],
);

// Derived atoms (computed state)
export const filteredDataAtom = atom((get) => {
  const data = get(jsonDataAtom);
  const filter = get(filterAtom);

  if (!data || !filter) {
    return data;
  }

  // Basic filtering implementation (will be enhanced with jq/JSONata later)
  try {
    // For now, just return the data as-is
    // This will be replaced with hybrid query engine
    return data;
  } catch (error) {
    return data;
  }
});

// JSON statistics atom
export const jsonStatsAtom = atom((get) => {
  const data = get(jsonDataAtom);
  if (!data) {
    return null;
  }

  const jsonString = JSON.stringify(data);
  return {
    size: jsonString.length,
    depth: calculateDepth(data),
    keys: getAllKeys(data),
    types: getTypeDistribution(data),
  };
});

// Display data atom (for virtualization)
export const displayDataAtom = atom((get) => {
  const data = get(filteredDataAtom);
  const viewMode = get(viewModeAtom);

  return flattenForVirtualization(data, viewMode);
});

// Action atoms
export const setFilterAtom = atom(null, (get, set, filter: string) => {
  set(filterAtom, filter);

  // Add to history if not already present
  const history = get(filterHistoryAtom);
  if (filter && !history.includes(filter)) {
    set(filterHistoryAtom, [...history.slice(-9), filter]); // Keep last 10
  }
});

export const clearErrorAtom = atom(null, (get, set) => {
  set(errorAtom, null);
});

// Utility functions for JSON processing
function calculateDepth(obj: unknown, currentDepth = 0): number {
  if (obj === null || typeof obj !== "object") {
    return currentDepth;
  }

  if (Array.isArray(obj)) {
    return Math.max(
      currentDepth,
      ...obj.map((item) => calculateDepth(item, currentDepth + 1)),
    );
  }

  const depths = Object.values(obj).map((value) =>
    calculateDepth(value, currentDepth + 1),
  );

  return depths.length > 0 ? Math.max(currentDepth, ...depths) : currentDepth;
}

function getAllKeys(obj: unknown): string[] {
  const keys = new Set<string>();

  function traverse(value: unknown) {
    if (value === null || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => traverse(item));
    } else {
      Object.keys(value).forEach((key) => {
        keys.add(key);
        traverse((value as Record<string, unknown>)[key]);
      });
    }
  }

  traverse(obj);
  return Array.from(keys).sort();
}

function getTypeDistribution(obj: unknown): Record<string, number> {
  const types: Record<string, number> = {};

  function traverse(value: unknown) {
    const type =
      value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    types[type] = (types[type] || 0) + 1;

    if (Array.isArray(value)) {
      value.forEach((item) => traverse(item));
    } else if (value !== null && typeof value === "object") {
      Object.values(value).forEach((val) => traverse(val));
    }
  }

  traverse(obj);
  return types;
}

function flattenForVirtualization(data: unknown, viewMode: string): unknown[] {
  // Simple flattening for now - will be enhanced for virtualization
  if (Array.isArray(data)) {
    return data;
  }

  return [data];
}
