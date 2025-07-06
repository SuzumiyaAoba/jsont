/**
 * useNavigation Hook
 * F2: Simple Navigation - Core Navigation Logic
 */

import { useInput } from "ink";
import { useCallback, useMemo, useState } from "react";
import type {
  JsonValue,
  NavigationHook,
  NavigationItem,
  NavigationOptions,
} from "../types/index.js";

/**
 * Flattens JSON structure into navigable items
 */
function flattenJsonStructure(
  data: JsonValue,
  path: string[] = [],
  depth = 0,
): NavigationItem[] {
  const items: NavigationItem[] = [];

  if (data === null) {
    items.push({
      key: path[path.length - 1] || "root",
      value: null,
      path,
      depth,
      type: "value",
      isExpandable: false,
    });
    return items;
  }

  if (
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  ) {
    items.push({
      key: path[path.length - 1] || "root",
      value: data,
      path,
      depth,
      type: "value",
      isExpandable: false,
    });
    return items;
  }

  if (Array.isArray(data)) {
    // Add array items
    data.forEach((item, index) => {
      const itemPath = [...path, index.toString()];

      // Add the array item itself
      items.push({
        key: index.toString(),
        value: item,
        path: itemPath,
        depth,
        type: "array-item",
        isExpandable: typeof item === "object" && item !== null,
        isExpanded: true, // Default expanded for F2
      });

      // Recursively add nested items
      if (typeof item === "object" && item !== null) {
        items.push(...flattenJsonStructure(item, itemPath, depth + 1));
      }
    });

    return items;
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);

    // Add object properties
    keys.forEach((key) => {
      const keyPath = [...path, key];
      const value = (data as Record<string, JsonValue>)[key]!;

      // Add the property itself
      items.push({
        key,
        value,
        path: keyPath,
        depth,
        type: "property",
        isExpandable: typeof value === "object" && value !== null,
        isExpanded: true, // Default expanded for F2
      });

      // Recursively add nested items
      if (typeof value === "object" && value !== null) {
        items.push(...flattenJsonStructure(value, keyPath, depth + 1));
      }
    });

    return items;
  }

  return items;
}

/**
 * Navigation hook for JSON data
 */
export function useNavigation(
  data: JsonValue,
  options: NavigationOptions = {},
): NavigationHook {
  const {
    pageSize = 10,
    viewportHeight = 20,
    enableKeyboardNavigation = true,
    initialSelectedIndex = 0,
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Flatten JSON structure for navigation
  const flatItems = useMemo(() => {
    if (!data) return [];
    return flattenJsonStructure(data);
  }, [data]);

  // Calculate current path
  const currentPath = useMemo(() => {
    if (
      selectedIndex >= 0 &&
      selectedIndex < flatItems.length &&
      flatItems[selectedIndex]
    ) {
      return flatItems[selectedIndex]?.path || [];
    }
    return [];
  }, [selectedIndex, flatItems]);

  // Navigation actions
  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const navigateDown = useCallback(() => {
    if (flatItems.length > 0) {
      setSelectedIndex((prev) => Math.min(flatItems.length - 1, prev + 1));
    }
  }, [flatItems.length]);

  const navigatePageUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - pageSize));
  }, [pageSize]);

  const navigatePageDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(flatItems.length - 1, prev + pageSize));
  }, [flatItems.length, pageSize]);

  const navigateHome = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const navigateEnd = useCallback(() => {
    setSelectedIndex(Math.max(0, flatItems.length - 1));
  }, [flatItems.length]);

  const setSelectedIndexSafe = useCallback(
    (index: number) => {
      const safeIndex = Math.max(0, Math.min(flatItems.length - 1, index));
      setSelectedIndex(safeIndex);
    },
    [flatItems.length],
  );

  // Get visible items based on viewport
  const getVisibleItems = useCallback(() => {
    const start = scrollOffset;
    const end = start + viewportHeight;
    return flatItems.slice(start, end);
  }, [flatItems, scrollOffset, viewportHeight]);

  // Get formatted path string
  const getPathString = useCallback(() => {
    if (currentPath.length === 0) return "root";
    return currentPath.join(".");
  }, [currentPath]);

  // Auto-scroll to keep selected item visible
  useMemo(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + viewportHeight) {
      setScrollOffset(selectedIndex - viewportHeight + 1);
    }
  }, [selectedIndex, scrollOffset, viewportHeight]);

  // Keyboard input handling
  useInput(
    (_input, key) => {
      if (!enableKeyboardNavigation) return;

      if (key.upArrow) {
        navigateUp();
      } else if (key.downArrow) {
        navigateDown();
      } else if (key.pageUp) {
        navigatePageUp();
      } else if (key.pageDown) {
        navigatePageDown();
      } else if ("home" in key && key.home) {
        navigateHome();
      } else if ("end" in key && key.end) {
        navigateEnd();
      }
    },
    {
      isActive: enableKeyboardNavigation,
    },
  );

  return {
    // State
    selectedIndex,
    currentPath,
    scrollOffset,
    isNavigable: flatItems.length > 0,
    flatItems,

    // Actions
    navigateUp,
    navigateDown,
    navigatePageUp,
    navigatePageDown,
    navigateHome,
    navigateEnd,
    setSelectedIndex: setSelectedIndexSafe,
    getVisibleItems,
    getPathString,
  };
}
