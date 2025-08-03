/**
 * Engine-enhanced state provider that integrates UI-agnostic engines
 * with the existing TUI components and state management
 */

import { useConfig } from "@core/context/ConfigContext";
import type { JsonEngineState, JsonViewMode } from "@core/engine/JsonEngine";
import { JsonEngine } from "@core/engine/JsonEngine";
import type { SearchEngineState } from "@core/engine/SearchEngine";
import { SearchEngine } from "@core/engine/SearchEngine";
import type { TreeEngineState } from "@core/engine/TreeEngine";
import { TreeEngine } from "@core/engine/TreeEngine";
import type { JsonValue } from "@core/types/index";
import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface EngineContextValue {
  // Core engines
  jsonEngine: JsonEngine;
  treeEngine: TreeEngine;
  searchEngine: SearchEngine;

  // Engine states
  jsonEngineState: JsonEngineState;
  treeEngineState: TreeEngineState;
  searchEngineState: SearchEngineState;

  // Engine command methods
  executeJsonCommand: (command: string, payload?: unknown) => void;
  executeTreeCommand: (command: string, payload?: unknown) => void;
  executeSearchCommand: (command: string, payload?: unknown) => void;

  // Convenience methods for common operations
  setViewMode: (mode: JsonViewMode) => void;
  updateData: (data: JsonValue | null) => void;
  applyJqTransform: (query: string) => Promise<void>;
  startSearch: (term?: string) => void;
  navigateTree: (direction: "up" | "down" | "page-up" | "page-down") => void;
  toggleTreeNode: () => void;
}

const EngineContext = createContext<EngineContextValue | null>(null);

interface EngineProviderProps {
  children: ReactNode;
  initialData?: JsonValue | null;
  initialViewMode?: JsonViewMode;
}

export function EngineProvider({
  children,
  initialData = null,
  initialViewMode = "raw",
}: EngineProviderProps): ReactElement {
  const config = useConfig();

  // Initialize engines
  const { jsonEngine, treeEngine, searchEngine } = useMemo(() => {
    const dataString = initialData ? JSON.stringify(initialData) : "null";

    const jsonEngine = new JsonEngine(dataString, config, {
      viewMode: initialViewMode,
      treeOptions: {
        expandLevel: 2,
        showSchemaTypes: false,
      },
      searchOptions: {
        caseSensitive: false,
        useRegex: false,
        scope: "all",
      },
    });

    const treeEngine = new TreeEngine(initialData, {
      ...config.display.tree,
      showSchemaTypes: false,
    });

    const searchEngine = new SearchEngine(initialData, {
      caseSensitive: false,
      useRegex: false,
      scope: "all",
    });

    return { jsonEngine, treeEngine, searchEngine };
  }, [config, initialData, initialViewMode]);

  // Engine states
  const [jsonEngineState, setJsonEngineState] = useState<JsonEngineState>(() =>
    jsonEngine.getState(),
  );
  const [treeEngineState, setTreeEngineState] = useState<TreeEngineState>(() =>
    treeEngine.getState(),
  );
  const [searchEngineState, setSearchEngineState] = useState<SearchEngineState>(
    () => searchEngine.getState(),
  );

  // Command execution methods
  const executeJsonCommand = async (command: string, payload?: unknown) => {
    // biome-ignore lint/suspicious/noExplicitAny: Engine command types are generic
    const result = await jsonEngine.executeCommand(command as any, payload);
    if (result.handled) {
      setJsonEngineState(result.state);
    }
  };

  const executeTreeCommand = (command: string, payload?: unknown) => {
    const result = treeEngine.executeCommand(
      // biome-ignore lint/suspicious/noExplicitAny: Runtime type safety for generic command
      command as any,
      // biome-ignore lint/suspicious/noExplicitAny: Runtime type safety for generic payload
      payload as any,
    );
    if (result.handled) {
      setTreeEngineState(result.state);
    }
  };

  const executeSearchCommand = (command: string, payload?: unknown) => {
    const result = searchEngine.executeCommand(
      // biome-ignore lint/suspicious/noExplicitAny: Engine command types are generic
      command as any,
      payload as string,
    );
    if (result.handled) {
      setSearchEngineState(result.state);
    }
  };

  // Convenience methods
  const setViewMode = (mode: JsonViewMode) => {
    executeJsonCommand("set-view-mode", mode);
  };

  const updateData = (data: JsonValue | null) => {
    const dataString = data !== null ? JSON.stringify(data) : "null";
    executeJsonCommand("parse-json", dataString);
    treeEngine.updateData(data);
    searchEngine.updateData(data);
    setTreeEngineState(treeEngine.getState());
    setSearchEngineState(searchEngine.getState());
  };

  const applyJqTransform = async (query: string) => {
    await executeJsonCommand("apply-jq", query);
  };

  const startSearch = (term?: string) => {
    if (term) {
      executeSearchCommand("end-search", term);
    } else {
      executeSearchCommand("start-search");
    }
  };

  const navigateTree = (direction: "up" | "down" | "page-up" | "page-down") => {
    const commandMap = {
      up: "navigate-up",
      down: "navigate-down",
      "page-up": "navigate-page-up",
      "page-down": "navigate-page-down",
    };
    executeTreeCommand(commandMap[direction]);
  };

  const toggleTreeNode = () => {
    executeTreeCommand("toggle-node");
  };

  // Sync data changes between engines when JSON engine data changes
  useEffect(() => {
    treeEngine.updateData(jsonEngineState.data);
    searchEngine.updateData(jsonEngineState.data);
    setTreeEngineState(treeEngine.getState());
    setSearchEngineState(searchEngine.getState());
  }, [jsonEngineState.data, treeEngine, searchEngine]);

  const contextValue: EngineContextValue = {
    jsonEngine,
    treeEngine,
    searchEngine,
    jsonEngineState,
    treeEngineState,
    searchEngineState,
    executeJsonCommand,
    executeTreeCommand,
    executeSearchCommand,
    setViewMode,
    updateData,
    applyJqTransform,
    startSearch,
    navigateTree,
    toggleTreeNode,
  };

  return (
    <EngineContext.Provider value={contextValue}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngines(): EngineContextValue {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngines must be used within an EngineProvider");
  }
  return context;
}

// Convenience hooks for individual engines
export function useJsonEngine() {
  const { jsonEngine, jsonEngineState, executeJsonCommand } = useEngines();
  return { jsonEngine, state: jsonEngineState, execute: executeJsonCommand };
}

export function useTreeEngineIntegration() {
  const {
    treeEngine,
    treeEngineState,
    executeTreeCommand,
    navigateTree,
    toggleTreeNode,
  } = useEngines();
  return {
    treeEngine,
    state: treeEngineState,
    execute: executeTreeCommand,
    navigate: navigateTree,
    toggle: toggleTreeNode,
  };
}

export function useSearchEngineIntegration() {
  const { searchEngine, searchEngineState, executeSearchCommand, startSearch } =
    useEngines();
  return {
    searchEngine,
    state: searchEngineState,
    execute: executeSearchCommand,
    search: startSearch,
  };
}
