/**
 * Custom hooks for JSON store management
 * Provides convenient access to Jotai atoms
 */

import { useAtomValue, useSetAtom } from "jotai";
import {
  clearErrorAtom,
  displayDataAtom,
  errorAtom,
  filterAtom,
  filteredDataAtom,
  filterHistoryAtom,
  isFilterModeAtom,
  jsonDataAtom,
  jsonStatsAtom,
  selectedPathAtom,
  setFilterAtom,
  themeAtom,
  viewModeAtom,
} from "../store/atoms.js";

/**
 * Main hook for JSON store access
 * Provides all commonly used store operations
 */
export function useJsonStore() {
  return {
    // Data atoms
    jsonData: useAtomValue(jsonDataAtom),
    setJsonData: useSetAtom(jsonDataAtom),

    // Filter atoms
    filter: useAtomValue(filterAtom),
    setFilter: useSetAtom(setFilterAtom),
    filteredData: useAtomValue(filteredDataAtom),

    // UI state atoms
    selectedPath: useAtomValue(selectedPathAtom),
    setSelectedPath: useSetAtom(selectedPathAtom),
    isFilterMode: useAtomValue(isFilterModeAtom),
    setIsFilterMode: useSetAtom(isFilterModeAtom),
    viewMode: useAtomValue(viewModeAtom),
    setViewMode: useSetAtom(viewModeAtom),

    // Error handling
    error: useAtomValue(errorAtom),
    setError: useSetAtom(errorAtom),
    clearError: useSetAtom(clearErrorAtom),

    // Computed data
    stats: useAtomValue(jsonStatsAtom),
    displayData: useAtomValue(displayDataAtom),
  };
}

/**
 * Hook for theme management
 */
export function useTheme() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(themeAtom);

  return {
    theme,
    setTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}

/**
 * Hook for filter history management
 */
export function useFilterHistory() {
  const history = useAtomValue(filterHistoryAtom);
  const setHistory = useSetAtom(filterHistoryAtom);

  const addToHistory = (filter: string) => {
    if (filter && !history.includes(filter)) {
      setHistory([...history.slice(-9), filter]); // Keep last 10
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    clearHistory,
  };
}

/**
 * Hook for navigation and selection
 */
export function useNavigation() {
  const selectedPath = useAtomValue(selectedPathAtom);
  const setSelectedPath = useSetAtom(selectedPathAtom);

  const navigateToPath = (path: string[]) => {
    setSelectedPath(path);
  };

  const navigateUp = () => {
    if (selectedPath.length > 0) {
      setSelectedPath(selectedPath.slice(0, -1));
    }
  };

  const navigateDown = (key: string) => {
    setSelectedPath([...selectedPath, key]);
  };

  const clearSelection = () => {
    setSelectedPath([]);
  };

  return {
    selectedPath,
    navigateToPath,
    navigateUp,
    navigateDown,
    clearSelection,
  };
}
