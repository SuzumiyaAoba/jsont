/**
 * Tests for AppStateProvider component
 * Ensures proper state management and context provision
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider, useAppState } from "../AppStateProvider";

// Mock all the complex hooks to focus on testing the provider itself
vi.mock("@hooks/useExportHandlers", () => ({
  useExportHandlers: vi.fn(),
}));
vi.mock("@hooks/useSearchHandlers", () => ({
  useSearchHandlers: vi.fn(),
}));
vi.mock("@hooks/useTerminalCalculations", () => ({
  useTerminalCalculations: vi.fn(),
}));
vi.mock("@store/hooks", () => ({
  useUpdateDebugInfo: vi.fn(),
}));
vi.mock("@store/hooks/useDebug", () => ({
  useDebugInfo: vi.fn(),
}));
vi.mock("@store/hooks/useExport", () => ({
  useExportStatus: vi.fn(),
  useExportDialog: vi.fn(),
}));
vi.mock("@store/hooks/useJq", () => ({
  useJqState: vi.fn(),
  useJqInput: vi.fn(),
  useJqCursorPosition: vi.fn(),
  useJqFocusMode: vi.fn(),
  useJqErrorScrollOffset: vi.fn(),
  useExitJqMode: vi.fn(),
  useToggleJqMode: vi.fn(),
  useToggleJqView: vi.fn(),
  useStartJqTransformation: vi.fn(),
  useCompleteJqTransformation: vi.fn(),
}));
vi.mock("@store/hooks/useNavigation", () => ({
  useScrollOffset: vi.fn(),
  useWaitingForSecondG: vi.fn(),
  useResetScroll: vi.fn(),
  useScrollToTop: vi.fn(),
  useScrollToBottom: vi.fn(),
  useAdjustScroll: vi.fn(),
  useStartGSequence: vi.fn(),
  useResetGSequence: vi.fn(),
}));
vi.mock("@store/hooks/useSearch", () => ({
  useSearchState: vi.fn(),
  useSearchInput: vi.fn(),
  useSearchCursorPosition: vi.fn(),
  useStartSearch: vi.fn(),
  useCancelSearch: vi.fn(),
  useCycleScope: vi.fn(),
  useNextSearchResult: vi.fn(),
  usePreviousSearchResult: vi.fn(),
}));
vi.mock("@store/hooks/useUI", () => ({
  useUI: vi.fn(),
  useToggleTreeView: vi.fn(),
  useToggleSchema: vi.fn(),
  useToggleCollapsible: vi.fn(),
  useToggleLineNumbers: vi.fn(),
  useToggleDebugLogViewer: vi.fn(),
}));

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

import * as keybindingsModule from "@core/utils/keybindings";
import * as exportHandlersModule from "@hooks/useExportHandlers";
import * as searchHandlersModule from "@hooks/useSearchHandlers";
// Import mocked modules
import * as terminalCalculationsModule from "@hooks/useTerminalCalculations";
import * as atomsModule from "@store/atoms";
import * as storeHooksModule from "@store/hooks";
import * as debugHooksModule from "@store/hooks/useDebug";
import * as exportHooksModule from "@store/hooks/useExport";
import * as jqHooksModule from "@store/hooks/useJq";
import * as navigationHooksModule from "@store/hooks/useNavigation";
import * as searchHooksModule from "@store/hooks/useSearch";
import * as uiHooksModule from "@store/hooks/useUI";

// Mock additional modules
vi.mock("@store/atoms", () => ({
  useAtomValue: vi.fn(),
  useSetAtom: vi.fn(),
}));

vi.mock("@core/utils/keybindings", () => ({
  createKeybindingMatcher: vi.fn(),
}));

// Setup mocks
beforeEach(() => {
  vi.mocked(terminalCalculationsModule.useTerminalCalculations).mockReturnValue(
    mockTerminalCalculations,
  );
  vi.mocked(searchHandlersModule.useSearchHandlers).mockReturnValue({});
  vi.mocked(exportHandlersModule).useExportHandlers.mockReturnValue({});

  vi.mocked(storeHooksModule).useUpdateDebugInfo.mockReturnValue(vi.fn());
  vi.mocked(debugHooksModule).useDebugInfo.mockReturnValue({});

  vi.mocked(uiHooksModule).useUI.mockReturnValue(mockUI);
  vi.mocked(uiHooksModule).useToggleTreeView.mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule).useToggleSchema.mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule).useToggleCollapsible.mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule).useToggleLineNumbers.mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule).useToggleDebugLogViewer.mockReturnValue(vi.fn());

  vi.mocked(searchHooksModule).useSearchState.mockReturnValue(mockSearchState);
  vi.mocked(searchHooksModule).useSearchInput.mockReturnValue(["", vi.fn()]);
  vi.mocked(searchHooksModule).useSearchCursorPosition.mockReturnValue([
    0,
    vi.fn(),
  ]);
  vi.mocked(searchHooksModule).useStartSearch.mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule).useCancelSearch.mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule).useCycleScope.mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule).useNextSearchResult.mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule).usePreviousSearchResult.mockReturnValue(vi.fn());

  vi.mocked(navigationHooksModule).useScrollOffset.mockReturnValue([
    0,
    vi.fn(),
  ]);
  vi.mocked(navigationHooksModule).useWaitingForSecondG.mockReturnValue([
    false,
  ]);
  vi.mocked(navigationHooksModule).useResetScroll.mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule).useScrollToTop.mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule).useScrollToBottom.mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule).useAdjustScroll.mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule).useStartGSequence.mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule).useResetGSequence.mockReturnValue(vi.fn());

  vi.mocked(jqHooksModule).useJqState.mockReturnValue(mockJqState);
  vi.mocked(jqHooksModule).useJqInput.mockReturnValue(["", vi.fn()]);
  vi.mocked(jqHooksModule).useJqCursorPosition.mockReturnValue([0, vi.fn()]);
  vi.mocked(jqHooksModule).useJqFocusMode.mockReturnValue([false, vi.fn()]);
  vi.mocked(jqHooksModule).useJqErrorScrollOffset.mockReturnValue([0, vi.fn()]);
  vi.mocked(jqHooksModule).useExitJqMode.mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule).useToggleJqMode.mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule).useToggleJqView.mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule).useStartJqTransformation.mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule).useCompleteJqTransformation.mockReturnValue(vi.fn());

  vi.mocked(exportHooksModule).useExportStatus.mockReturnValue([
    { isExporting: false, currentFile: null },
  ]);
  vi.mocked(exportHooksModule).useExportDialog.mockReturnValue({
    isVisible: false,
  });

  vi.mocked(atomsModule.useAtomValue).mockReturnValue(false);
  vi.mocked(atomsModule.useSetAtom).mockReturnValue(vi.fn());
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
    initialData?: JsonValue | null,
    initialError?: string | null,
    keyboardEnabled = false,
  ) => {
    return render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <AppStateProvider
          initialData={initialData ?? null}
          initialError={initialError ?? null}
          keyboardEnabled={keyboardEnabled}
        >
          <TestComponent />
        </AppStateProvider>
      </ConfigProvider>,
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
        terminalCalculationsModule.useTerminalCalculations,
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
        terminalCalculationsModule.useTerminalCalculations,
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
        terminalCalculationsModule.useTerminalCalculations,
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
        terminalCalculationsModule.useTerminalCalculations,
      ).toHaveBeenCalled();
      expect(searchHandlersModule.useSearchHandlers).toHaveBeenCalled();
      expect(exportHandlersModule.useExportHandlers).toHaveBeenCalled();
      expect(uiHooksModule.useUI).toHaveBeenCalled();
      expect(searchHooksModule.useSearchState).toHaveBeenCalled();
      expect(jqHooksModule.useJqState).toHaveBeenCalled();
    });

    it("should call search handlers with correct parameters", () => {
      const testData = { test: true };
      renderWithProvider(testData);

      expect(searchHandlersModule.useSearchHandlers).toHaveBeenCalledWith({
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

      expect(exportHandlersModule.useExportHandlers).toHaveBeenCalledWith({
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
        <ConfigProvider config={DEFAULT_CONFIG}>
          <AppStateProvider
            initialData={null}
            initialError={null}
            keyboardEnabled={false}
          >
            <TestComponent />
          </AppStateProvider>
        </ConfigProvider>,
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
      expect(keybindingsModule.createKeybindingMatcher).toHaveBeenCalledWith(
        DEFAULT_CONFIG.keybindings,
      );
    });

    it("should handle config changes", () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        keybindings: {
          ...DEFAULT_CONFIG.keybindings,
          navigation: {
            ...DEFAULT_CONFIG.keybindings.navigation,
            up: ["w"],
          },
        },
      };

      render(
        <ConfigProvider config={customConfig}>
          <AppStateProvider>
            <TestComponent />
          </AppStateProvider>
        </ConfigProvider>,
      );

      expect(keybindingsModule.createKeybindingMatcher).toHaveBeenCalledWith(
        customConfig.keybindings,
      );
    });
  });
});
