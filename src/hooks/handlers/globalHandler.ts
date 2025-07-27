/**
 * Global keyboard input handler for always-available commands
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";
import type { IKeybindingMatcher } from "./types";

export interface GlobalHandlerDependencies {
  updateDebugInfo: (action: string, input: string) => void;
  keybindings: IKeybindingMatcher;
  searchState: {
    isSearching: boolean;
    searchTerm: string;
  };
  handleExportSchema: () => void;
  handleExportData: () => void;
  exit: () => void;
}

export function useGlobalHandler(deps: GlobalHandlerDependencies) {
  const {
    updateDebugInfo,
    keybindings,
    searchState,
    handleExportSchema,
    handleExportData,
    exit,
  } = deps;

  const handleGlobalInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Always allow exit commands
      if (key.ctrl && input === "c") {
        updateDebugInfo("Exit (Ctrl+C)", input);
        exit();
        return true;
      } else if (
        keybindings.isQuit(input, key) &&
        !searchState.isSearching &&
        !searchState.searchTerm
      ) {
        updateDebugInfo("Quit", input);
        exit();
        return true;
      } else if (keybindings.isExport(input, key)) {
        // Export JSON Schema to file - always available regardless of search mode
        updateDebugInfo("Export schema", input);
        handleExportSchema();
        return true;
      } else if (keybindings.isExportData(input, key)) {
        // Export current data to file - always available regardless of search mode
        updateDebugInfo("Export data", input);
        handleExportData();
        return true;
      }
      return false;
    },
    [
      exit,
      updateDebugInfo,
      keybindings,
      searchState,
      handleExportSchema,
      handleExportData,
    ],
  );

  return { handleGlobalInput };
}
