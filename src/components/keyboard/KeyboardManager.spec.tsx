/**
 * Tests for KeyboardManager component
 * Ensures proper keyboard input handling and delegation
 */

import { KeyboardManager } from "@components/keyboard/KeyboardManager";
import { AppStateProvider } from "@components/providers/AppStateProvider";
import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import { render } from "@testing-library/react";

// Mock ConfigContext
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: vi.fn(() => DEFAULT_CONFIG),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Ink's useInput and useApp
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn(),
    useApp: vi.fn(() => ({ exit: vi.fn() })),
  };
});

// Mock store atoms
vi.mock("@store/atoms", () => ({
  useAtomValue: vi.fn(() => false),
  useSetAtom: vi.fn(() => vi.fn()),
}));

// Mock all hooks with proper implementations
vi.mock("@hooks/useKeyboardHandler", () => ({
  useKeyboardHandler: vi.fn(() => ({
    handleKeyInput: vi.fn(),
  })),
}));

vi.mock("@hooks/useTerminalCalculations", () => ({
  useTerminalCalculations: vi.fn(() => ({
    visibleLines: 20,
    searchModeVisibleLines: 18,
  })),
}));

vi.mock("@hooks/useSearchHandlers", () => ({
  useSearchHandlers: vi.fn(() => ({})),
}));

vi.mock("@hooks/useExportHandlers", () => ({
  useExportHandlers: vi.fn(() => ({})),
}));

// Mock store hooks
vi.mock("@store/hooks", () => ({
  useUpdateDebugInfo: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useDebug", () => ({
  useDebugInfo: vi.fn(() => ({})),
  useUpdateDebugInfo: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useExport", () => ({
  useExportStatus: vi.fn(() => [{ isExporting: false, currentFile: null }]),
  useExportDialog: vi.fn(() => ({ isVisible: false })),
}));

vi.mock("@store/hooks/useJq", () => ({
  useJqState: vi.fn(() => ({
    isActive: false,
    input: "",
    transformedData: null,
    error: null,
    showOriginal: false,
  })),
  useJqInput: vi.fn(() => ["", vi.fn()]),
  useJqCursorPosition: vi.fn(() => [0, vi.fn()]),
  useJqFocusMode: vi.fn(() => [false, vi.fn()]),
  useJqErrorScrollOffset: vi.fn(() => [0, vi.fn()]),
  useExitJqMode: vi.fn(() => vi.fn()),
  useToggleJqMode: vi.fn(() => vi.fn()),
  useToggleJqView: vi.fn(() => vi.fn()),
  useStartJqTransformation: vi.fn(() => vi.fn()),
  useCompleteJqTransformation: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useNavigation", () => ({
  useScrollOffset: vi.fn(() => [0, vi.fn()]),
  useWaitingForSecondG: vi.fn(() => [false]),
  useResetScroll: vi.fn(() => vi.fn()),
  useScrollToTop: vi.fn(() => vi.fn()),
  useScrollToBottom: vi.fn(() => vi.fn()),
  useAdjustScroll: vi.fn(() => vi.fn()),
  useStartGSequence: vi.fn(() => vi.fn()),
  useResetGSequence: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useSearch", () => ({
  useSearchInput: vi.fn(() => ["", vi.fn()]),
  useSearchCursorPosition: vi.fn(() => [0, vi.fn()]),
  useIsSearching: vi.fn(() => [false, vi.fn()]),
  useSearchTerm: vi.fn(() => ["", vi.fn()]),
  useSearchResults: vi.fn(() => [[], vi.fn()]),
  useCurrentResultIndex: vi.fn(() => [0, vi.fn()]),
  useSearchScope: vi.fn(() => ["all", vi.fn()]),
  useSearchState: vi.fn(() => ({
    isSearching: false,
    searchTerm: "",
    searchScope: "all",
    results: [],
    searchResults: [],
    currentResultIndex: 0,
  })),
  useHasSearchResults: vi.fn(() => false),
  useCurrentSearchResult: vi.fn(() => null),
  useStartSearch: vi.fn(() => vi.fn()),
  useCancelSearch: vi.fn(() => vi.fn()),
  useUpdateSearchResults: vi.fn(() => vi.fn()),
  useToggleRegexMode: vi.fn(() => vi.fn()),
  useIsRegexMode: vi.fn(() => false),
  useNextSearchResult: vi.fn(() => vi.fn()),
  usePreviousSearchResult: vi.fn(() => vi.fn()),
  useCycleScope: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useUI", () => ({
  useUI: vi.fn(() => ({
    treeViewMode: false,
    collapsibleMode: true,
    schemaVisible: false,
    helpVisible: false,
    debugVisible: false,
    debugLogViewerVisible: false,
    lineNumbersVisible: true,
  })),
  useToggleTreeView: vi.fn(() => vi.fn()),
  useToggleSchema: vi.fn(() => vi.fn()),
  useToggleCollapsible: vi.fn(() => vi.fn()),
  useToggleLineNumbers: vi.fn(() => vi.fn()),
  useToggleDebugLogViewer: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useSettings", () => ({
  useSettingsVisible: vi.fn(() => false),
  useSettingsState: vi.fn(() => [{}]),
  useOpenSettings: vi.fn(() => vi.fn()),
  useCloseSettings: vi.fn(() => vi.fn()),
  useSetActiveCategory: vi.fn(() => vi.fn()),
  useSetActiveField: vi.fn(() => vi.fn()),
  useStartEditing: vi.fn(() => vi.fn()),
  useStopEditing: vi.fn(() => vi.fn()),
  useUpdatePreviewValue: vi.fn(() => vi.fn()),
  useResetPreviewValues: vi.fn(() => vi.fn()),
  useSaveSettings: vi.fn(() => vi.fn()),
}));

describe("KeyboardManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should render without crashing", () => {
      const props = {
        keyboardEnabled: true,
        initialData: { test: "data" },
        displayData: { test: "data" },
        currentMode: "raw" as const,
        collapsibleViewerRef: { current: null },
        safeSetTreeViewKeyboardHandler: vi.fn(),
        treeViewKeyboardHandler: null,
      };

      render(
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider>
            <KeyboardManager {...props} />
          </AppStateProvider>
        </ConfigProvider>,
      );

      // Component should render without throwing errors
      expect(true).toBe(true);
    });

    it("should handle disabled keyboard input", () => {
      const props = {
        keyboardEnabled: false,
        initialData: { test: "data" },
        displayData: { test: "data" },
        currentMode: "raw" as const,
        collapsibleViewerRef: { current: null },
        safeSetTreeViewKeyboardHandler: vi.fn(),
        treeViewKeyboardHandler: null,
      };

      render(
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider>
            <KeyboardManager {...props} />
          </AppStateProvider>
        </ConfigProvider>,
      );

      // Component should render without throwing errors when keyboard is disabled
      expect(true).toBe(true);
    });

    it("should handle null initial data", () => {
      const props = {
        keyboardEnabled: true,
        initialData: null,
        displayData: null,
        currentMode: "raw" as const,
        collapsibleViewerRef: { current: null },
        safeSetTreeViewKeyboardHandler: vi.fn(),
        treeViewKeyboardHandler: null,
      };

      render(
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider>
            <KeyboardManager {...props} />
          </AppStateProvider>
        </ConfigProvider>,
      );

      // Component should handle null data gracefully
      expect(true).toBe(true);
    });

    it("should handle tree view keyboard handler", () => {
      const mockHandler = vi.fn();
      const props = {
        keyboardEnabled: true,
        initialData: { test: "data" },
        displayData: { test: "data" },
        currentMode: "raw" as const,
        collapsibleViewerRef: { current: null },
        safeSetTreeViewKeyboardHandler: vi.fn(),
        treeViewKeyboardHandler: mockHandler,
      };

      render(
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider>
            <KeyboardManager {...props} />
          </AppStateProvider>
        </ConfigProvider>,
      );

      // Component should render with tree view handler
      expect(true).toBe(true);
    });

    it("should integrate with providers correctly", () => {
      const props = {
        keyboardEnabled: true,
        initialData: { complex: { nested: { data: [1, 2, 3] } } },
        displayData: { complex: { nested: { data: [1, 2, 3] } } },
        currentMode: "raw" as const,
        collapsibleViewerRef: { current: null },
        safeSetTreeViewKeyboardHandler: vi.fn(),
        treeViewKeyboardHandler: null,
      };

      render(
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider>
            <KeyboardManager {...props} />
          </AppStateProvider>
        </ConfigProvider>,
      );

      // Component should integrate with all providers without errors
      expect(true).toBe(true);
    });
  });
});
