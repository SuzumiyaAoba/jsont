/**
 * Engine-based App component
 * Demonstrates the new UI-agnostic architecture in action
 */

import { TUIAdapter } from "@core/adapters/TUIAdapter";
import { UIController } from "@core/adapters/UIAdapter";
import type { JsontConfig } from "@core/config/types";
import type {
  JsonCommand,
  JsonEngineState,
  JsonViewMode,
} from "@core/engine/JsonEngine";
import { JsonEngine } from "@core/engine/JsonEngine";
import type { JsonValue, KeyboardInput } from "@core/types/index";
import { EngineSearchView } from "@features/search/components/EngineSearchView";
import { EngineTreeView } from "@features/tree/components/EngineTreeView";
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props for the engine-based app
 */
export interface EngineBasedAppProps {
  /** Initial JSON data */
  initialData: JsonValue | null;
  /** Application configuration */
  config: JsontConfig;
  /** Display dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Engine-based App component
 */
export function EngineBasedApp({
  initialData,
  config,
  dimensions = { width: 120, height: 30 },
}: EngineBasedAppProps) {
  // Initialize engines and adapters
  const [jsonEngine] = useState(
    () =>
      new JsonEngine(JSON.stringify(initialData), config, {
        viewMode: "tree",
        treeOptions: {
          expandLevel: 2,
          showSchemaTypes: false,
        },
        searchOptions: {
          caseSensitive: false,
          useRegex: false,
          scope: "all",
        },
      }),
  );

  const [tuiAdapter] = useState(() => new TUIAdapter(config));
  const [uiController] = useState(() => new UIController(tuiAdapter));

  // Engine state
  const [engineState, setEngineState] = useState<JsonEngineState>(() =>
    jsonEngine.getState(),
  );

  // UI state
  const [currentViewMode, setCurrentViewMode] = useState<JsonViewMode>("tree");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Active component handlers
  const [treeKeyboardHandler, setTreeKeyboardHandler] = useState<
    ((input: string, key: KeyboardInput) => boolean) | null
  >(null);
  const [searchKeyboardHandler, setSearchKeyboardHandler] = useState<
    ((input: string, key: KeyboardInput) => boolean) | null
  >(null);

  // Initialize UI controller
  useEffect(() => {
    uiController.initialize(engineState);
  }, [uiController, engineState]);

  // Execute JSON engine command
  const executeJsonCommand = useCallback(
    async (command: JsonCommand, payload?: unknown) => {
      const result = await jsonEngine.executeCommand(command, payload);
      if (result.handled) {
        setEngineState(result.state);

        // Update UI controller with new state
        uiController.updateState(result.state);
      }
      return result;
    },
    [jsonEngine, uiController],
  );

  // Handle view mode changes
  const switchViewMode = useCallback(
    (mode: JsonViewMode) => {
      executeJsonCommand("set-view-mode", mode);
      setCurrentViewMode(mode);
    },
    [executeJsonCommand],
  );

  // Handle search operations
  const handleSearchResults = useCallback((results: unknown) => {
    if (results && typeof results === "object" && "term" in results) {
      setSearchTerm(String((results as { term?: string }).term || ""));
    }
  }, []);

  // Global keyboard handler
  const handleGlobalKeyboard = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Global shortcuts
      if (input === "q" && key.ctrl) {
        // Quit application
        process.exit(0);
      }

      // View mode switching
      if (input === "1") {
        switchViewMode("tree");
        setIsSearchMode(false);
        return true;
      } else if (input === "2") {
        switchViewMode("raw");
        setIsSearchMode(false);
        return true;
      } else if (input === "3") {
        switchViewMode("schema");
        setIsSearchMode(false);
        return true;
      } else if (input === "4") {
        switchViewMode("debug");
        setIsSearchMode(false);
        return true;
      }

      // Search mode toggle
      if (input === "/") {
        setIsSearchMode(true);
        return true;
      } else if (key.escape) {
        setIsSearchMode(false);
        return true;
      }

      // Delegate to active component
      if (isSearchMode && searchKeyboardHandler) {
        return searchKeyboardHandler(input, key);
      } else if (!isSearchMode && treeKeyboardHandler) {
        return treeKeyboardHandler(input, key);
      }

      return false;
    },
    [switchViewMode, isSearchMode, treeKeyboardHandler, searchKeyboardHandler],
  );

  // Register global keyboard handler
  useInput(handleGlobalKeyboard);

  // Get current data for display
  const currentData = useMemo(() => {
    if (engineState.jqResult !== undefined) {
      return engineState.jqResult;
    }
    return engineState.data;
  }, [engineState]);

  // Render view mode indicator
  const renderViewModeIndicator = useMemo(
    () => (
      <Box width={dimensions.width} justifyContent="space-between">
        <Box>
          <Text color="cyan" bold>
            jsont - Engine Architecture Demo
          </Text>
        </Box>
        <Box>
          <Text color={currentViewMode === "tree" ? "yellow" : "gray"}>
            [1] Tree
          </Text>
          <Text> | </Text>
          <Text color={currentViewMode === "raw" ? "yellow" : "gray"}>
            [2] Raw
          </Text>
          <Text> | </Text>
          <Text color={currentViewMode === "schema" ? "yellow" : "gray"}>
            [3] Schema
          </Text>
          <Text> | </Text>
          <Text color={currentViewMode === "debug" ? "yellow" : "gray"}>
            [4] Debug
          </Text>
          <Text> | </Text>
          <Text color={isSearchMode ? "yellow" : "gray"}>[/] Search</Text>
        </Box>
      </Box>
    ),
    [currentViewMode, isSearchMode, dimensions.width],
  );

  // Render status bar
  const renderStatusBar = useMemo(
    () => (
      <Box width={dimensions.width} justifyContent="space-between">
        <Box>
          <Text color="green">Mode: {currentViewMode.toUpperCase()}</Text>
          {searchTerm && (
            <>
              <Text> | Search: </Text>
              <Text color="yellow">{searchTerm}</Text>
            </>
          )}
        </Box>
        <Box>
          <Text color="gray">
            Ctrl+Q: Quit | 1-4: Views | /: Search | Esc: Back
          </Text>
        </Box>
      </Box>
    ),
    [currentViewMode, searchTerm, dimensions.width],
  );

  // Calculate content height
  const contentHeight = dimensions.height - 3; // Reserve space for header and footer

  return (
    <Box
      flexDirection="column"
      width={dimensions.width}
      height={dimensions.height}
    >
      {/* Header */}
      {renderViewModeIndicator}

      {/* Main content area */}
      <Box flexDirection="row" width={dimensions.width} height={contentHeight}>
        {/* Primary view */}
        <Box width={Math.floor(dimensions.width * 0.7)} height={contentHeight}>
          {currentViewMode === "tree" && (
            <EngineTreeView
              data={currentData}
              height={contentHeight}
              width={Math.floor(dimensions.width * 0.7)}
              searchTerm={searchTerm}
              onKeyboardHandlerReady={setTreeKeyboardHandler}
            />
          )}

          {currentViewMode === "raw" && (
            <Box flexDirection="column" width="100%" height={contentHeight}>
              <Text color="blue" bold>
                RAW JSON VIEW
              </Text>
              <Text>{JSON.stringify(currentData, null, 2)}</Text>
            </Box>
          )}

          {currentViewMode === "schema" && (
            <Box flexDirection="column" width="100%" height={contentHeight}>
              <Text color="blue" bold>
                SCHEMA VIEW
              </Text>
              <Text color="gray">Schema generation using JsonEngine...</Text>
            </Box>
          )}

          {currentViewMode === "debug" && (
            <Box flexDirection="column" width="100%" height={contentHeight}>
              <Text color="blue" bold>
                DEBUG VIEW
              </Text>
              <Text>Engine State:</Text>
              <Text color="gray">{JSON.stringify(engineState, null, 2)}</Text>
            </Box>
          )}
        </Box>

        {/* Side panel for search */}
        <Box width={Math.floor(dimensions.width * 0.3)} height={contentHeight}>
          <EngineSearchView
            data={currentData}
            height={contentHeight}
            width={Math.floor(dimensions.width * 0.3)}
            onSearchResults={handleSearchResults}
            onKeyboardHandlerReady={setSearchKeyboardHandler}
          />
        </Box>
      </Box>

      {/* Footer */}
      {renderStatusBar}
    </Box>
  );
}
