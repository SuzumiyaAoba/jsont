/**
 * Enhanced SearchView component that integrates SearchEngine
 * Provides search functionality using the UI-agnostic SearchEngine
 */

import { useSearchEngineIntegration } from "@components/providers/EngineProvider";
import type { KeyboardInput } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { Box, Text } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props for the Enhanced SearchView component
 */
export interface EnhancedSearchViewProps {
  /** JSON data to search */
  data: JsonValue | null;
  /** Display height in lines */
  height?: number;
  /** Display width in characters */
  width?: number;
  /** Callback when search results change */
  onSearchResults?: (results: {
    term: string;
    totalMatches: number;
    currentMatch: number;
    scope: string;
  }) => void;
  /** Callback when keyboard handler is ready */
  onKeyboardHandlerReady?: (
    handler: (input: string, key: KeyboardInput) => boolean,
  ) => void;
}

/**
 * Enhanced SearchView component using SearchEngine for UI-agnostic search
 *
 * Features:
 * - Search execution with regex and case sensitivity options
 * - Scope cycling (all, keys, values)
 * - Search navigation (next/previous)
 * - Search history
 * - Real-time search input
 */
export function EnhancedSearchView({
  data,
  height = 10,
  width = 80,
  onSearchResults,
  onKeyboardHandlerReady,
}: EnhancedSearchViewProps) {
  const {
    searchEngine,
    state: engineState,
    execute,
  } = useSearchEngineIntegration();

  // Local input state for search mode
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);

  // Update engine data when props change
  useEffect(() => {
    searchEngine.updateData(data);
  }, [data, searchEngine]);

  // Notify parent of search results
  useEffect(() => {
    if (onSearchResults && engineState.isActive) {
      onSearchResults({
        term: engineState.term,
        totalMatches: engineState.totalMatches,
        currentMatch: engineState.currentMatch,
        scope: engineState.scope,
      });
    }
  }, [engineState, onSearchResults]);

  // Start search mode
  const startSearchMode = useCallback(() => {
    execute("start-search");
    setIsInputMode(true);
    setInputValue("");
  }, [execute]);

  // End search with term
  const endSearchMode = useCallback(
    (term: string) => {
      execute("end-search", term);
      setIsInputMode(false);
    },
    [execute],
  );

  // Clear search
  const clearSearch = useCallback(() => {
    execute("clear-search");
    setIsInputMode(false);
    setInputValue("");
  }, [execute]);

  // Navigate matches
  const nextMatch = useCallback(() => {
    execute("next-match");
  }, [execute]);

  const previousMatch = useCallback(() => {
    execute("previous-match");
  }, [execute]);

  // Cycle search scope
  const cycleScope = useCallback(() => {
    execute("cycle-scope");
  }, [execute]);

  // Toggle options
  const toggleCaseSensitive = useCallback(() => {
    execute("toggle-case-sensitive");
  }, [execute]);

  const toggleRegex = useCallback(() => {
    execute("toggle-regex");
  }, [execute]);

  // Handle keyboard input
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // If in input mode, handle text input
      if (isInputMode) {
        if (key.return) {
          endSearchMode(inputValue);
          return true;
        } else if (key.escape) {
          clearSearch();
          return true;
        } else if (input && input.length === 1 && !key.ctrl) {
          setInputValue((prev) => prev + input);
          return true;
        } else if (key.ctrl && input === "h") {
          // Backspace
          setInputValue((prev) => prev.slice(0, -1));
          return true;
        }
        return false;
      }

      // Search mode commands
      if (input === "/") {
        startSearchMode();
        return true;
      } else if (input === "n") {
        nextMatch();
        return true;
      } else if (input === "N" || (key.shift && input === "n")) {
        previousMatch();
        return true;
      } else if (input === "s") {
        cycleScope();
        return true;
      } else if (input === "I") {
        toggleCaseSensitive();
        return true;
      } else if (input === "R") {
        toggleRegex();
        return true;
      } else if (key.escape) {
        clearSearch();
        return true;
      }

      return false;
    },
    [
      isInputMode,
      inputValue,
      startSearchMode,
      endSearchMode,
      clearSearch,
      nextMatch,
      previousMatch,
      cycleScope,
      toggleCaseSensitive,
      toggleRegex,
    ],
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      onKeyboardHandlerReady(handleKeyboardInput);
    }
  }, [onKeyboardHandlerReady, handleKeyboardInput]);

  // Render search status
  const renderSearchStatus = useMemo(() => {
    if (!engineState.isActive && !isInputMode) {
      return <Text color="gray">Press '/' to search</Text>;
    }

    if (isInputMode) {
      return (
        <Box>
          <Text color="yellow">Search: </Text>
          <Text color="white">{inputValue}</Text>
          <Text color="gray"> (Enter to search, Esc to cancel)</Text>
        </Box>
      );
    }

    const scopeDisplay = searchEngine.getScopeDisplayName();
    const navigationInfo = searchEngine.getNavigationInfo();

    return (
      <Box flexDirection="column">
        <Box>
          <Text color="green">Found: </Text>
          <Text color="white">{engineState.term}</Text>
          <Text color="gray"> in {scopeDisplay}</Text>
        </Box>
        <Box>
          <Text color="blue">{navigationInfo}</Text>
          {engineState.caseSensitive && <Text color="yellow"> [Case]</Text>}
          {engineState.useRegex && <Text color="magenta"> [Regex]</Text>}
        </Box>
      </Box>
    );
  }, [engineState, isInputMode, inputValue, searchEngine]);

  // Render search options help
  const renderSearchHelp = useMemo(() => {
    if (isInputMode) return null;

    return (
      <Box flexDirection="column">
        <Text color="gray">
          /: search, n/N: next/prev, s: scope, I: case, R: regex, Esc: clear
        </Text>
      </Box>
    );
  }, [isInputMode]);

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Search header */}
      <Box width={width}>
        <Text color="cyan" bold>
          🔍 SEARCH (Enhanced with SearchEngine)
        </Text>
      </Box>

      {/* Search status */}
      <Box width={width}>{renderSearchStatus}</Box>

      {/* Search help */}
      {renderSearchHelp}

      {/* Search history (if not in input mode and has history) */}
      {!isInputMode && engineState.history.length > 0 && (
        <Box flexDirection="column" width={width}>
          <Text color="gray">Recent searches:</Text>
          {engineState.history.slice(0, 3).map((term, index) => (
            <Text key={`search-history-${term}`} color="gray">
              {index + 1}. {term}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
