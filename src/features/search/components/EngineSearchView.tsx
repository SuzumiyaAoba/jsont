/**
 * Engine-based SearchView component
 * Uses the new SearchEngine for UI-agnostic search processing
 */

import type {
  SearchCommand,
  SearchEngineState,
  SearchOptions,
} from "@core/engine/SearchEngine";
import { SearchEngine } from "@core/engine/SearchEngine";
import type { JsonValue } from "@core/types/index";
import { Box, Text } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props for the engine-based SearchView
 */
export interface EngineSearchViewProps {
  /** JSON data to search */
  data: JsonValue | null;
  /** Display height in lines */
  height?: number;
  /** Display width in characters */
  width?: number;
  /** Search options */
  options?: SearchOptions;
  /** Callback when search results change */
  onSearchResults?: (results: any) => void;
  /** Callback when keyboard handler is ready */
  onKeyboardHandlerReady?: (
    handler: (input: string, key: any) => boolean,
  ) => void;
}

/**
 * Keyboard input interface
 */
interface KeyboardInput {
  return?: boolean;
  escape?: boolean;
  ctrl?: boolean;
  shift?: boolean;
}

/**
 * Engine-based SearchView component
 */
export function EngineSearchView({
  data,
  height = 10,
  width = 80,
  options = {},
  onSearchResults,
  onKeyboardHandlerReady,
}: EngineSearchViewProps) {
  // Initialize search engine
  const [searchEngine] = useState(() => new SearchEngine(data, options));

  // Engine state
  const [engineState, setEngineState] = useState<SearchEngineState>(() =>
    searchEngine.getState(),
  );

  // Local input state
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);

  // Update engine data when props change
  useEffect(() => {
    searchEngine.updateData(data);
    setEngineState(searchEngine.getState());
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

  // Execute search command
  const executeCommand = useCallback(
    (command: SearchCommand, payload?: string): boolean => {
      const result = searchEngine.executeCommand(command, payload);
      if (result.handled) {
        setEngineState(result.state);
        return true;
      }
      return false;
    },
    [searchEngine],
  );

  // Start search mode
  const startSearch = useCallback(() => {
    executeCommand("start-search");
    setIsInputMode(true);
    setInputValue("");
  }, [executeCommand]);

  // End search with term
  const endSearch = useCallback(
    (term: string) => {
      executeCommand("end-search", term);
      setIsInputMode(false);
    },
    [executeCommand],
  );

  // Clear search
  const clearSearch = useCallback(() => {
    executeCommand("clear-search");
    setIsInputMode(false);
    setInputValue("");
  }, [executeCommand]);

  // Navigate matches
  const nextMatch = useCallback(() => {
    executeCommand("next-match");
  }, [executeCommand]);

  const previousMatch = useCallback(() => {
    executeCommand("previous-match");
  }, [executeCommand]);

  // Cycle search scope
  const cycleScope = useCallback(() => {
    executeCommand("cycle-scope");
  }, [executeCommand]);

  // Toggle options
  const toggleCaseSensitive = useCallback(() => {
    executeCommand("toggle-case-sensitive");
  }, [executeCommand]);

  const toggleRegex = useCallback(() => {
    executeCommand("toggle-regex");
  }, [executeCommand]);

  // Handle keyboard input
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // If in input mode, handle text input
      if (isInputMode) {
        if (key.return) {
          endSearch(inputValue);
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
        startSearch();
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
      startSearch,
      endSearch,
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
          ENGINE SEARCH VIEW
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
            <Text key={index} color="gray">
              {index + 1}. {term}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
