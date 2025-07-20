/**
 * Application state management hook
 * Extracted from App.tsx to improve maintainability
 */

import type { JqState } from "@features/jq/types/jq";
import type { ExportDialogState } from "@features/schema/types/export";
import type { SearchResult, SearchState } from "@features/search/types/search";
import { useState } from "react";

export interface AppState {
  // Scroll and navigation
  scrollOffset: number;

  // Search state
  searchState: SearchState;
  searchInput: string;
  searchCursorPosition: number;
  searchResults: SearchResult[];
  searchResultIndex: number;

  // JQ transformation state
  jqState: JqState;
  jqInput: string;
  jqCursorPosition: number;
  jqFocusMode: "input" | "json";

  // UI visibility toggles
  debugVisible: boolean;
  lineNumbersVisible: boolean;
  schemaVisible: boolean;
  helpVisible: boolean;
  treeViewMode: boolean;
  collapsibleMode: boolean;
  debugLogViewerVisible: boolean;

  // Export state
  exportStatus: {
    isExporting: boolean;
    message?: string;
    type?: "success" | "error";
  };
  exportDialog: ExportDialogState;

  // Debug info
  debugInfo: {
    lastKey: string;
    lastKeyAction: string;
    timestamp: string;
  } | null;

  // Navigation state
  waitingForSecondG: boolean;
}

const initialSearchState: SearchState = {
  isSearching: false,
  searchTerm: "",
  searchResults: [],
  currentResultIndex: 0,
  searchScope: "all",
};

const initialJqState: JqState = {
  isActive: false,
  query: "",
  transformedData: null,
  error: null,
  isProcessing: false,
  showOriginal: false,
};

export function useAppState(_initialError: string | null = null) {
  // Search state
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [searchState, setSearchState] =
    useState<SearchState>(initialSearchState);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchCursorPosition, setSearchCursorPosition] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchResultIndex, setSearchResultIndex] = useState<number>(0);

  // JQ state
  const [jqState, setJqState] = useState<JqState>(initialJqState);
  const [jqInput, setJqInput] = useState<string>("");
  const [jqCursorPosition, setJqCursorPosition] = useState<number>(0);
  const [jqFocusMode, setJqFocusMode] = useState<"input" | "json">("input");

  // UI visibility state
  const [debugVisible, setDebugVisible] = useState<boolean>(false);
  const [lineNumbersVisible, setLineNumbersVisible] = useState<boolean>(false);
  const [schemaVisible, setSchemaVisible] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);
  const [treeViewMode, setTreeViewMode] = useState<boolean>(false);
  const [collapsibleMode, setCollapsibleMode] = useState<boolean>(false);
  const [debugLogViewerVisible, setDebugLogViewerVisible] =
    useState<boolean>(false);

  // Export state
  const [exportStatus, setExportStatus] = useState<{
    isExporting: boolean;
    message?: string;
    type?: "success" | "error";
  }>({ isExporting: false });

  const [exportDialog, setExportDialog] = useState<ExportDialogState>({
    isVisible: false,
    mode: "simple",
  });

  // Debug info
  const [debugInfo, setDebugInfo] = useState<{
    lastKey: string;
    lastKeyAction: string;
    timestamp: string;
  } | null>(null);

  // Navigation state
  const [waitingForSecondG, setWaitingForSecondG] = useState<boolean>(false);

  return {
    // State values
    scrollOffset,
    searchState,
    searchInput,
    searchCursorPosition,
    searchResults,
    searchResultIndex,
    jqState,
    jqInput,
    jqCursorPosition,
    jqFocusMode,
    debugVisible,
    lineNumbersVisible,
    schemaVisible,
    helpVisible,
    treeViewMode,
    collapsibleMode,
    debugLogViewerVisible,
    exportStatus,
    exportDialog,
    debugInfo,
    waitingForSecondG,

    // State setters
    setScrollOffset,
    setSearchState,
    setSearchInput,
    setSearchCursorPosition,
    setSearchResults,
    setSearchResultIndex,
    setJqState,
    setJqInput,
    setJqCursorPosition,
    setJqFocusMode,
    setDebugVisible,
    setLineNumbersVisible,
    setSchemaVisible,
    setHelpVisible,
    setTreeViewMode,
    setCollapsibleMode,
    setDebugLogViewerVisible,
    setExportStatus,
    setExportDialog,
    setDebugInfo,
    setWaitingForSecondG,
  };
}
