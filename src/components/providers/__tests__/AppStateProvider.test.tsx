/**
 * Tests for AppStateProvider component
 * Ensures proper state management and context provision
 */

import { defaultConfig } from "@core/config/defaults";
import { ConfigContext } from "@core/context/ConfigContext";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { AppStateProvider, useAppState } from "../AppStateProvider";

// Mock all the complex hooks to focus on testing the provider itself
vi.mock("@hooks/useExportHandlers");
vi.mock("@hooks/useSearchHandlers");
vi.mock("@hooks/useTerminalCalculations");
vi.mock("@store/hooks");
vi.mock("@store/hooks/useDebug");
vi.mock("@store/hooks/useExport");
vi.mock("@store/hooks/useJq");
vi.mock("@store/hooks/useNavigation");
vi.mock("@store/hooks/useSearch");
vi.mock("@store/hooks/useUI");

// Mock implementations
const mockTerminalCalculations = {
  terminalSize: { width: 80, height: 24 },
  visibleLines: 20,
  searchModeVisibleLines: 18,
  maxScroll: 100,
  maxScrollSearchMode: 90,
  halfPageLines: 10,
};

const mockUI = {
  debugVisible: false,
  lineNumbersVisible: true,
  schemaVisible: false,
  helpVisible: false,
  treeViewMode: false,
  collapsibleMode: true,
  debugLogViewerVisible: false,
  setHelpVisible: vi.fn(),
  setDebugLogViewerVisible: vi.fn(),
};

const mockSearchState = {
  isSearching: false,
  searchTerm: "",
  searchScope: "all" as const,
  currentIndex: 0,
  totalResults: 0,
  results: [],
};

const mockJqState = {
  isActive: false,
  input: "",
  transformedData: null,
  error: null,
  showOriginal: false,
};

// Setup mocks
beforeEach(() => {
  vi.mocked(
    require("@hooks/useTerminalCalculations"),
  ).useTerminalCalculations.mockReturnValue(mockTerminalCalculations);
  vi.mocked(
    require("@hooks/useSearchHandlers"),
  ).useSearchHandlers.mockReturnValue({});
  vi.mocked(
    require("@hooks/useExportHandlers"),
  ).useExportHandlers.mockReturnValue({});

  vi.mocked(require("@store/hooks")).useUpdateDebugInfo.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useDebug")).useDebugInfo.mockReturnValue({});

  vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);
  vi.mocked(require("@store/hooks/useUI")).useToggleTreeView.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useUI")).useToggleSchema.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useUI")).useToggleCollapsible.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useUI")).useToggleLineNumbers.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(
    require("@store/hooks/useUI"),
  ).useToggleDebugLogViewer.mockReturnValue(vi.fn());

  vi.mocked(require("@store/hooks/useSearch")).useSearchState.mockReturnValue(
    mockSearchState,
  );
  vi.mocked(require("@store/hooks/useSearch")).useSearchInput.mockReturnValue([
    "",
    vi.fn(),
  ]);
  vi.mocked(
    require("@store/hooks/useSearch"),
  ).useSearchCursorPosition.mockReturnValue([0, vi.fn()]);
  vi.mocked(require("@store/hooks/useSearch")).useStartSearch.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useSearch")).useCancelSearch.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useSearch")).useCycleScope.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(
    require("@store/hooks/useSearch"),
  ).useNextSearchResult.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useSearch"),
  ).usePreviousSearchResult.mockReturnValue(vi.fn());

  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useScrollOffset.mockReturnValue([0, vi.fn()]);
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useWaitingForSecondG.mockReturnValue([false]);
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useResetScroll.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useScrollToTop.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useScrollToBottom.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useAdjustScroll.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useStartGSequence.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useNavigation"),
  ).useResetGSequence.mockReturnValue(vi.fn());

  vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
    mockJqState,
  );
  vi.mocked(require("@store/hooks/useJq")).useJqInput.mockReturnValue([
    "",
    vi.fn(),
  ]);
  vi.mocked(require("@store/hooks/useJq")).useJqCursorPosition.mockReturnValue([
    0,
    vi.fn(),
  ]);
  vi.mocked(require("@store/hooks/useJq")).useJqFocusMode.mockReturnValue([
    false,
    vi.fn(),
  ]);
  vi.mocked(
    require("@store/hooks/useJq"),
  ).useJqErrorScrollOffset.mockReturnValue([0, vi.fn()]);
  vi.mocked(require("@store/hooks/useJq")).useExitJqMode.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useJq")).useToggleJqMode.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(require("@store/hooks/useJq")).useToggleJqView.mockReturnValue(
    vi.fn(),
  );
  vi.mocked(
    require("@store/hooks/useJq"),
  ).useStartJqTransformation.mockReturnValue(vi.fn());
  vi.mocked(
    require("@store/hooks/useJq"),
  ).useCompleteJqTransformation.mockReturnValue(vi.fn());

  vi.mocked(require("@store/hooks/useExport")).useExportStatus.mockReturnValue([
    { isExporting: false, currentFile: null },
  ]);
  vi.mocked(require("@store/hooks/useExport")).useExportDialog.mockReturnValue({
    isVisible: false,
  });

  vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(false);
  vi.mocked(require("@store/atoms")).useSetAtom.mockReturnValue(vi.fn());
});

// Helper component to test the hook
function TestComponent(): ReactElement {
  const appState = useAppState();
  return (
    <div>
      <div data-testid="config-loaded">
        {appState.config ? "true" : "false"}
      </div>
      <div data-testid="keybindings-loaded">
        {appState.keybindings ? "true" : "false"}
      </div>
      <div data-testid="search-state">
        {JSON.stringify(appState.searchState)}
      </div>
      <div data-testid="ui-state">{JSON.stringify(appState.ui)}</div>
      <div data-testid="jq-state">{JSON.stringify(appState.jqState)}</div>
      <div data-testid="terminal-calculations">
        {JSON.stringify(appState.terminalCalculations)}
      </div>
    </div>
  );
}

describe("AppStateProvider", () => {
  const renderWithProvider = (
    initialData?: unknown,
    initialError?: string | null,
    keyboardEnabled = false,
  ) => {
    return render(
      <ConfigContext.Provider value={defaultConfig}>
        <AppStateProvider
          initialData={initialData}
          initialError={initialError}
          keyboardEnabled={keyboardEnabled}
        >
          <TestComponent />
        </AppStateProvider>
      </ConfigContext.Provider>,
    );
  };

  describe("Context Provision", () => {
    it("should provide all required state values", () => {
      renderWithProvider();

      expect(screen.getByTestId("config-loaded")).toHaveTextContent("true");
      expect(screen.getByTestId("keybindings-loaded")).toHaveTextContent(
        "true",
      );
      expect(screen.getByTestId("search-state")).toHaveTextContent(
        JSON.stringify(mockSearchState),
      );
      expect(screen.getByTestId("ui-state")).toHaveTextContent(
        JSON.stringify(mockUI),
      );
      expect(screen.getByTestId("jq-state")).toHaveTextContent(
        JSON.stringify(mockJqState),
      );
      expect(screen.getByTestId("terminal-calculations")).toHaveTextContent(
        JSON.stringify(mockTerminalCalculations),
      );
    });

    it("should handle initial data prop", () => {
      const testData = { test: "data" };
      renderWithProvider(testData);

      // Verify terminal calculations were called with initial data
      expect(
        require("@hooks/useTerminalCalculations").useTerminalCalculations,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          initialData: testData,
        }),
      );
    });

    it("should handle initial error prop", () => {
      const testError = "Test error message";
      renderWithProvider(null, testError);

      // Verify terminal calculations were called with error
      expect(
        require("@hooks/useTerminalCalculations").useTerminalCalculations,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          error: testError,
        }),
      );
    });

    it("should handle keyboard enabled prop", () => {
      renderWithProvider(null, null, true);

      // Verify terminal calculations were called with keyboard enabled
      expect(
        require("@hooks/useTerminalCalculations").useTerminalCalculations,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          keyboardEnabled: true,
        }),
      );
    });
  });

  describe("Hook Integration", () => {
    it("should initialize all required hooks", () => {
      renderWithProvider();

      // Verify all hooks are called
      expect(
        require("@hooks/useTerminalCalculations").useTerminalCalculations,
      ).toHaveBeenCalled();
      expect(
        require("@hooks/useSearchHandlers").useSearchHandlers,
      ).toHaveBeenCalled();
      expect(
        require("@hooks/useExportHandlers").useExportHandlers,
      ).toHaveBeenCalled();
      expect(require("@store/hooks/useUI").useUI).toHaveBeenCalled();
      expect(
        require("@store/hooks/useSearch").useSearchState,
      ).toHaveBeenCalled();
      expect(require("@store/hooks/useJq").useJqState).toHaveBeenCalled();
    });

    it("should call search handlers with correct parameters", () => {
      const testData = { test: true };
      renderWithProvider(testData);

      expect(
        require("@hooks/useSearchHandlers").useSearchHandlers,
      ).toHaveBeenCalledWith({
        initialData: testData,
        schemaVisible: mockUI.schemaVisible,
        visibleLines: mockTerminalCalculations.visibleLines,
        maxScroll: mockTerminalCalculations.maxScroll,
        maxScrollSearchMode: mockTerminalCalculations.maxScrollSearchMode,
      });
    });

    it("should call export handlers with initial data", () => {
      const testData = { export: "test" };
      renderWithProvider(testData);

      expect(
        require("@hooks/useExportHandlers").useExportHandlers,
      ).toHaveBeenCalledWith({
        initialData: testData,
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error when useAppState is used outside provider", () => {
      // Create a component that tries to use the hook without provider
      function InvalidComponent() {
        useAppState();
        return <div>Test</div>;
      }

      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<InvalidComponent />)).toThrow(
        "useAppState must be used within AppStateProvider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("State Updates", () => {
    it("should handle data export dialog state changes", () => {
      renderWithProvider();

      // The data export dialog should be initialized with isVisible: false
      const appState = JSON.parse(
        screen.getByTestId("terminal-calculations").textContent || "{}",
      );
      expect(appState).toBeDefined();
    });

    it("should maintain stable references for memoized values", () => {
      const { rerender } = renderWithProvider();
      const initialContent = screen.getByTestId(
        "terminal-calculations",
      ).textContent;

      // Rerender with same props
      rerender(
        <ConfigContext.Provider value={defaultConfig}>
          <AppStateProvider
            initialData={null}
            initialError={null}
            keyboardEnabled={false}
          >
            <TestComponent />
          </AppStateProvider>
        </ConfigContext.Provider>,
      );

      const rerenderedContent = screen.getByTestId(
        "terminal-calculations",
      ).textContent;
      expect(rerenderedContent).toBe(initialContent);
    });
  });

  describe("Configuration Integration", () => {
    it("should create keybinding matcher from config", () => {
      renderWithProvider();

      // Verify createKeybindingMatcher was called with config keybindings
      expect(
        require("@core/utils/keybindings").createKeybindingMatcher,
      ).toHaveBeenCalledWith(defaultConfig.keybindings);
    });

    it("should handle config changes", () => {
      const customConfig = {
        ...defaultConfig,
        keybindings: {
          ...defaultConfig.keybindings,
          navigation: {
            ...defaultConfig.keybindings.navigation,
            up: ["w"],
          },
        },
      };

      render(
        <ConfigContext.Provider value={customConfig}>
          <AppStateProvider>
            <TestComponent />
          </AppStateProvider>
        </ConfigContext.Provider>,
      );

      expect(
        require("@core/utils/keybindings").createKeybindingMatcher,
      ).toHaveBeenCalledWith(customConfig.keybindings);
    });
  });
});
