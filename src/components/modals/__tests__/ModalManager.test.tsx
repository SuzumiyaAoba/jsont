/**
 * Tests for ModalManager component
 * Ensures proper modal management and priority system
 */

import { AppStateProvider } from "@components/providers/AppStateProvider";
import { defaultConfig } from "@core/config/defaults";
import { ConfigContext } from "@core/context/ConfigContext";
import type { AppMode } from "@core/types/app";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { ModalManager } from "../ModalManager";

// Mock all modal components
vi.mock("@features/debug/components/DebugLogViewer", () => ({
  DebugLogViewer: ({ onExit }: { onExit: () => void }) => (
    <div data-testid="debug-log-viewer">
      <button type="button" onClick={onExit} data-testid="debug-close">
        Close Debug
      </button>
    </div>
  ),
}));

vi.mock("@features/settings/components/SettingsViewer", () => ({
  SettingsViewer: () => <div data-testid="settings-viewer">Settings</div>,
}));

vi.mock("@features/schema/components/ExportDialog", () => ({
  ExportDialog: ({
    onConfirm,
    onCancel,
    defaultFilename,
  }: {
    onConfirm: (options: { filename: string; format: string }) => void;
    onCancel: () => void;
    defaultFilename: string;
  }) => (
    <div data-testid="export-dialog">
      <div data-testid="default-filename">{defaultFilename}</div>
      <button
        type="button"
        onClick={() => onConfirm({ filename: "test.json", format: "json" })}
        data-testid="export-confirm"
      >
        Confirm
      </button>
      <button type="button" onClick={onCancel} data-testid="export-cancel">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("@features/help/components/HelpViewer", () => ({
  HelpViewer: ({ mode }: { mode: AppMode }) => (
    <div data-testid="help-viewer">Help for {mode}</div>
  ),
}));

vi.mock("@features/schema/utils/fileExport", () => ({
  exportToFile: vi.fn(),
  generateDefaultFilename: vi.fn((format: string) => `default.${format}`),
}));

// Mock hooks
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

const mockExportHandlers = {
  handleExportSchema: vi.fn(),
  handleExportConfirm: vi.fn(),
  handleExportCancel: vi.fn(),
};

const createMockUI = (overrides = {}) => ({
  debugVisible: false,
  lineNumbersVisible: true,
  schemaVisible: false,
  helpVisible: false,
  treeViewMode: false,
  collapsibleMode: true,
  debugLogViewerVisible: false,
  setHelpVisible: vi.fn(),
  setDebugLogViewerVisible: vi.fn(),
  ...overrides,
});

// Setup default mocks
beforeEach(() => {
  const mockUI = createMockUI();

  vi.mocked(
    require("@hooks/useTerminalCalculations"),
  ).useTerminalCalculations.mockReturnValue(mockTerminalCalculations);
  vi.mocked(
    require("@hooks/useSearchHandlers"),
  ).useSearchHandlers.mockReturnValue({});
  vi.mocked(
    require("@hooks/useExportHandlers"),
  ).useExportHandlers.mockReturnValue(mockExportHandlers);

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

  vi.mocked(require("@store/hooks/useSearch")).useSearchState.mockReturnValue({
    isSearching: false,
    searchTerm: "",
    searchScope: "all" as const,
    currentIndex: 0,
    totalResults: 0,
    results: [],
  });
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

  vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue({
    isActive: false,
    input: "",
    transformedData: null,
    error: null,
    showOriginal: false,
  });
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

function TestWrapper({
  children,
  currentMode = "raw" as AppMode,
  displayData = { test: "data" },
  initialError = null,
}: {
  children: React.ReactNode;
  currentMode?: AppMode;
  displayData?: unknown;
  initialError?: string | null;
}): ReactElement {
  return (
    <ConfigContext.Provider value={defaultConfig}>
      <AppStateProvider>
        <ModalManager
          currentMode={currentMode}
          displayData={displayData}
          initialError={initialError}
        >
          {children}
        </ModalManager>
      </AppStateProvider>
    </ConfigContext.Provider>
  );
}

describe("ModalManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render children when no modals are visible", () => {
      render(
        <TestWrapper>
          <div data-testid="main-content">Main Content</div>
        </TestWrapper>,
      );

      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("should hide children when debug log viewer is visible", () => {
      const mockUI = createMockUI({ debugLogViewerVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(
        <TestWrapper>
          <div data-testid="main-content">Main Content</div>
        </TestWrapper>,
      );

      expect(screen.queryByTestId("main-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("debug-log-viewer")).toBeInTheDocument();
    });

    it("should hide children when settings are visible", () => {
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true);

      render(
        <TestWrapper>
          <div data-testid="main-content">Main Content</div>
        </TestWrapper>,
      );

      expect(screen.queryByTestId("main-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("settings-viewer")).toBeInTheDocument();
    });
  });

  describe("Modal Priority System", () => {
    it("should show debug log viewer with highest priority", () => {
      const mockUI = createMockUI({
        debugLogViewerVisible: true,
        helpVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true); // settings visible
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.getByTestId("debug-log-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("settings-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("help-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument();
    });

    it("should show settings when debug log viewer is not visible", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true); // settings visible
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByTestId("debug-log-viewer")).not.toBeInTheDocument();
      expect(screen.getByTestId("settings-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("help-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument();
    });

    it("should show export dialog when higher priority modals are not visible", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByTestId("debug-log-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("settings-viewer")).not.toBeInTheDocument();
      expect(screen.getByTestId("export-dialog")).toBeInTheDocument();
    });

    it("should show help viewer only when no higher priority modals are visible", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper currentMode="tree" />);

      expect(screen.queryByTestId("debug-log-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("settings-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("help-viewer")).toBeInTheDocument();
      expect(screen.getByTestId("help-viewer")).toHaveTextContent(
        "Help for tree",
      );
    });
  });

  describe("Export Dialog Functionality", () => {
    it("should handle schema export dialog", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      const exportDialog = screen.getByTestId("export-dialog");
      expect(exportDialog).toBeInTheDocument();
      expect(screen.getByTestId("default-filename")).toHaveTextContent(
        "default.schema",
      );

      fireEvent.click(screen.getByTestId("export-confirm"));
      expect(mockExportHandlers.handleExportConfirm).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("export-cancel"));
      expect(mockExportHandlers.handleExportCancel).toHaveBeenCalled();
    });

    it("should handle data export dialog", async () => {
      const setDataExportDialog = vi.fn();
      const mockStateWithDataExport = {
        ...require("@components/providers/AppStateProvider").__mockState,
        dataExportDialog: { isVisible: true },
        setDataExportDialog,
      };

      // Mock the provider to return our custom state
      vi.mocked(
        require("@components/providers/AppStateProvider"),
      ).useAppState.mockReturnValue(mockStateWithDataExport);

      const exportToFile = vi.mocked(
        require("@features/schema/utils/fileExport"),
      ).exportToFile;
      exportToFile.mockResolvedValue(undefined);

      render(<TestWrapper />);

      expect(screen.getByTestId("export-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("default-filename")).toHaveTextContent(
        "default.json",
      );

      fireEvent.click(screen.getByTestId("export-confirm"));

      // Should call exportToFile with display data
      expect(exportToFile).toHaveBeenCalledWith(
        { test: "data" },
        { filename: "test.json", format: "json" },
      );

      // Should close dialog after successful export
      await vi.waitFor(() => {
        expect(setDataExportDialog).toHaveBeenCalledWith({ isVisible: false });
      });
    });

    it("should handle export errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const setDataExportDialog = vi.fn();
      const mockStateWithDataExport = {
        ...require("@components/providers/AppStateProvider").__mockState,
        dataExportDialog: { isVisible: true },
        setDataExportDialog,
      };

      vi.mocked(
        require("@components/providers/AppStateProvider"),
      ).useAppState.mockReturnValue(mockStateWithDataExport);

      const exportToFile = vi.mocked(
        require("@features/schema/utils/fileExport"),
      ).exportToFile;
      exportToFile.mockRejectedValue(new Error("Export failed"));

      render(<TestWrapper />);

      fireEvent.click(screen.getByTestId("export-confirm"));

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Export failed:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Debug Log Viewer", () => {
    it("should handle debug log viewer close", () => {
      const setDebugLogViewerVisible = vi.fn();
      const mockUI = createMockUI({
        debugLogViewerVisible: true,
        setDebugLogViewerVisible,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      fireEvent.click(screen.getByTestId("debug-close"));
      expect(setDebugLogViewerVisible).toHaveBeenCalledWith(false);
    });

    it("should pass correct dimensions to debug log viewer", () => {
      const mockUI = createMockUI({ debugLogViewerVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      const debugViewer = screen.getByTestId("debug-log-viewer");
      expect(debugViewer).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing display data", () => {
      render(
        <TestWrapper displayData={null}>
          <div data-testid="main-content">Content</div>
        </TestWrapper>,
      );

      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("should handle all modals being visible simultaneously", () => {
      const mockUI = createMockUI({
        debugLogViewerVisible: true,
        helpVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true); // settings
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      // Only debug log viewer should be visible (highest priority)
      expect(screen.getByTestId("debug-log-viewer")).toBeInTheDocument();
      expect(screen.queryByTestId("settings-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("help-viewer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument();
    });

    it("should maintain modal state across re-renders", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      const { rerender } = render(<TestWrapper currentMode="tree" />);

      expect(screen.getByTestId("help-viewer")).toBeInTheDocument();
      expect(screen.getByTestId("help-viewer")).toHaveTextContent(
        "Help for tree",
      );

      rerender(
        <TestWrapper currentMode="search">
          <div data-testid="main-content">Content</div>
        </TestWrapper>,
      );

      expect(screen.getByTestId("help-viewer")).toHaveTextContent(
        "Help for search",
      );
    });
  });
});
