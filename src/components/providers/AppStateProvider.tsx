/**
 * Centralized state provider for the App component
 * Manages all state hooks and provides them through context
 */

import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { createKeybindingMatcher } from "@core/utils/keybindings";
import { useExportHandlers } from "@hooks/useExportHandlers";
import { useSearchHandlers } from "@hooks/useSearchHandlers";
import { useTerminalCalculations } from "@hooks/useTerminalCalculations";
import { useAtomValue, useSetAtom } from "@store/atoms";
import { isSearchingAtom } from "@store/atoms/search";
import { openSettingsAtom, settingsVisibleAtom } from "@store/atoms/settings";
import { useUpdateDebugInfo } from "@store/hooks";
import { useDebugInfo } from "@store/hooks/useDebug";
import { useExportDialog, useExportStatus } from "@store/hooks/useExport";
import {
  useCompleteJqTransformation,
  useExitJqMode,
  useJqCursorPosition,
  useJqErrorScrollOffset,
  useJqFocusMode,
  useJqInput,
  useJqState,
  useStartJqTransformation,
  useToggleJqMode,
  useToggleJqView,
} from "@store/hooks/useJq";
import {
  useAdjustScroll,
  useResetGSequence,
  useResetScroll,
  useScrollOffset,
  useScrollToBottom,
  useScrollToTop,
  useStartGSequence,
  useWaitingForSecondG,
} from "@store/hooks/useNavigation";
import {
  useCancelSearch,
  useCycleScope,
  useNextSearchResult,
  usePreviousSearchResult,
  useSearchCursorPosition,
  useSearchInput,
  useSearchState,
  useStartSearch,
} from "@store/hooks/useSearch";
import {
  useToggleCollapsible,
  useToggleDebugLogViewer,
  useToggleLineNumbers,
  useToggleSchema,
  useToggleTreeView,
  useUI,
} from "@store/hooks/useUI";
import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

interface AppStateContextValue {
  // Configuration
  config: ReturnType<typeof useConfig>;
  keybindings: ReturnType<typeof createKeybindingMatcher>;

  // Search state
  searchState: ReturnType<typeof useSearchState>;
  searchInput: ReturnType<typeof useSearchInput>[0];
  setSearchInput: ReturnType<typeof useSearchInput>[1];
  searchCursorPosition: ReturnType<typeof useSearchCursorPosition>[0];
  setSearchCursorPosition: ReturnType<typeof useSearchCursorPosition>[1];
  setIsSearching: (searching: boolean) => void;
  startSearch: ReturnType<typeof useStartSearch>;
  cancelSearch: ReturnType<typeof useCancelSearch>;
  cycleScope: ReturnType<typeof useCycleScope>;
  nextSearchResult: ReturnType<typeof useNextSearchResult>;
  previousSearchResult: ReturnType<typeof usePreviousSearchResult>;

  // Navigation and scroll state
  scrollOffset: ReturnType<typeof useScrollOffset>[0];
  setScrollOffset: ReturnType<typeof useScrollOffset>[1];
  waitingForSecondG: ReturnType<typeof useWaitingForSecondG>[0];
  resetScroll: ReturnType<typeof useResetScroll>;
  scrollToTop: ReturnType<typeof useScrollToTop>;
  scrollToBottom: ReturnType<typeof useScrollToBottom>;
  adjustScroll: ReturnType<typeof useAdjustScroll>;
  startGSequence: ReturnType<typeof useStartGSequence>;
  resetGSequence: ReturnType<typeof useResetGSequence>;

  // JQ transformation state
  jqState: ReturnType<typeof useJqState>;
  jqInput: ReturnType<typeof useJqInput>[0];
  setJqInput: ReturnType<typeof useJqInput>[1];
  jqCursorPosition: ReturnType<typeof useJqCursorPosition>[0];
  setJqCursorPosition: ReturnType<typeof useJqCursorPosition>[1];
  jqFocusMode: ReturnType<typeof useJqFocusMode>[0];
  setJqFocusMode: ReturnType<typeof useJqFocusMode>[1];
  jqErrorScrollOffset: ReturnType<typeof useJqErrorScrollOffset>[0];
  setJqErrorScrollOffset: ReturnType<typeof useJqErrorScrollOffset>[1];
  exitJqMode: ReturnType<typeof useExitJqMode>;
  toggleJqMode: ReturnType<typeof useToggleJqMode>;
  toggleJqView: ReturnType<typeof useToggleJqView>;
  startJqTransformation: ReturnType<typeof useStartJqTransformation>;
  completeJqTransformation: ReturnType<typeof useCompleteJqTransformation>;

  // Export and debug state
  exportStatus: ReturnType<typeof useExportStatus>[0];
  exportDialog: ReturnType<typeof useExportDialog>;
  dataExportDialog: { isVisible: boolean };
  setDataExportDialog: (dialog: { isVisible: boolean }) => void;
  updateDebugInfo: ReturnType<typeof useUpdateDebugInfo>;

  // UI state
  ui: ReturnType<typeof useUI>;

  // Settings state
  settingsVisible: boolean;
  openSettings: () => void;

  // UI toggle functions
  toggleTreeView: ReturnType<typeof useToggleTreeView>;
  toggleSchema: ReturnType<typeof useToggleSchema>;
  toggleCollapsible: ReturnType<typeof useToggleCollapsible>;
  toggleLineNumbers: ReturnType<typeof useToggleLineNumbers>;
  toggleDebugLogViewer: ReturnType<typeof useToggleDebugLogViewer>;

  // Utility handlers
  terminalCalculations: ReturnType<typeof useTerminalCalculations>;
  searchHandlers: ReturnType<typeof useSearchHandlers>;
  exportHandlers: ReturnType<typeof useExportHandlers>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
  initialData?: JsonValue | null;
  initialError?: string | null;
  keyboardEnabled?: boolean;
}

export function AppStateProvider({
  children,
  initialData = null,
  initialError = null,
  keyboardEnabled = false,
}: AppStateProviderProps): ReactElement {
  // Load configuration and create keybinding matcher
  const config = useConfig();
  const keybindings = useMemo(
    () => createKeybindingMatcher(config.keybindings),
    [config.keybindings],
  );

  // Jotai-based state management
  const updateDebugInfo = useUpdateDebugInfo();

  // Search state management using jotai
  const searchState = useSearchState();
  const [searchInput, setSearchInput] = useSearchInput();
  const [searchCursorPosition, setSearchCursorPosition] =
    useSearchCursorPosition();
  const setIsSearching = useSetAtom(isSearchingAtom);
  const startSearch = useStartSearch();
  const cancelSearch = useCancelSearch();
  const cycleScope = useCycleScope();
  const nextSearchResult = useNextSearchResult();
  const previousSearchResult = usePreviousSearchResult();

  // Navigation and scroll state
  const [scrollOffset, setScrollOffset] = useScrollOffset();
  const [waitingForSecondG] = useWaitingForSecondG();
  const resetScroll = useResetScroll();
  const scrollToTop = useScrollToTop();
  const scrollToBottom = useScrollToBottom();
  const adjustScroll = useAdjustScroll();
  const startGSequence = useStartGSequence();
  const resetGSequence = useResetGSequence();

  // JQ transformation state
  const jqState = useJqState();
  const [jqInput, setJqInput] = useJqInput();
  const [jqCursorPosition, setJqCursorPosition] = useJqCursorPosition();
  const [jqFocusMode, setJqFocusMode] = useJqFocusMode();
  const [jqErrorScrollOffset, setJqErrorScrollOffset] =
    useJqErrorScrollOffset();
  const exitJqMode = useExitJqMode();
  const toggleJqMode = useToggleJqMode();
  const toggleJqView = useToggleJqView();
  const startJqTransformation = useStartJqTransformation();
  const completeJqTransformation = useCompleteJqTransformation();

  // Export and debug state
  const [exportStatus] = useExportStatus();
  const exportDialog = useExportDialog();
  const [dataExportDialog, setDataExportDialog] = useState({
    isVisible: false,
  });
  void useDebugInfo();

  // UI state
  const ui = useUI();

  // Settings state
  const settingsVisible = useAtomValue(settingsVisibleAtom);
  const openSettings = useSetAtom(openSettingsAtom);

  // UI toggle functions
  const toggleTreeView = useToggleTreeView();
  const toggleSchema = useToggleSchema();
  const toggleCollapsible = useToggleCollapsible();
  const toggleLineNumbers = useToggleLineNumbers();
  const toggleDebugLogViewer = useToggleDebugLogViewer();

  // Utility handlers
  const terminalCalculations = useTerminalCalculations({
    keyboardEnabled,
    error: initialError,
    searchInput: searchInput,
    initialData,
    collapsibleMode: ui.collapsibleMode,
  });
  const searchHandlers = useSearchHandlers({
    initialData,
    schemaVisible: ui.schemaVisible,
    visibleLines: terminalCalculations.visibleLines,
    maxScroll: terminalCalculations.maxScroll,
    maxScrollSearchMode: terminalCalculations.maxScrollSearchMode,
  });
  const exportHandlers = useExportHandlers({ initialData });

  const contextValue = useMemo(
    (): AppStateContextValue => ({
      // Configuration
      config,
      keybindings,

      // Search state
      searchState,
      searchInput,
      setSearchInput,
      searchCursorPosition,
      setSearchCursorPosition,
      setIsSearching,
      startSearch,
      cancelSearch,
      cycleScope,
      nextSearchResult,
      previousSearchResult,

      // Navigation and scroll state
      scrollOffset,
      setScrollOffset,
      waitingForSecondG,
      resetScroll,
      scrollToTop,
      scrollToBottom,
      adjustScroll,
      startGSequence,
      resetGSequence,

      // JQ transformation state
      jqState,
      jqInput,
      setJqInput,
      jqCursorPosition,
      setJqCursorPosition,
      jqFocusMode,
      setJqFocusMode,
      jqErrorScrollOffset,
      setJqErrorScrollOffset,
      exitJqMode,
      toggleJqMode,
      toggleJqView,
      startJqTransformation,
      completeJqTransformation,

      // Export and debug state
      exportStatus,
      exportDialog,
      dataExportDialog,
      setDataExportDialog,
      updateDebugInfo,

      // UI state
      ui,

      // Settings state
      settingsVisible,
      openSettings,

      // UI toggle functions
      toggleTreeView,
      toggleSchema,
      toggleCollapsible,
      toggleLineNumbers,
      toggleDebugLogViewer,

      // Utility handlers
      terminalCalculations,
      searchHandlers,
      exportHandlers,
    }),
    [
      config,
      keybindings,
      searchState,
      searchInput,
      setSearchInput,
      searchCursorPosition,
      setSearchCursorPosition,
      setIsSearching,
      startSearch,
      cancelSearch,
      cycleScope,
      nextSearchResult,
      previousSearchResult,
      scrollOffset,
      setScrollOffset,
      waitingForSecondG,
      resetScroll,
      scrollToTop,
      scrollToBottom,
      adjustScroll,
      startGSequence,
      resetGSequence,
      jqState,
      jqInput,
      setJqInput,
      jqCursorPosition,
      setJqCursorPosition,
      jqFocusMode,
      setJqFocusMode,
      jqErrorScrollOffset,
      setJqErrorScrollOffset,
      exitJqMode,
      toggleJqMode,
      toggleJqView,
      startJqTransformation,
      completeJqTransformation,
      exportStatus,
      exportDialog,
      dataExportDialog,
      updateDebugInfo,
      ui,
      settingsVisible,
      openSettings,
      toggleTreeView,
      toggleSchema,
      toggleCollapsible,
      toggleLineNumbers,
      toggleDebugLogViewer,
      terminalCalculations,
      searchHandlers,
      exportHandlers,
    ],
  );

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
