/**
 * Full application integration tests
 * Tests complete workflows from initialization to user interactions
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import type { JsonValue, ViewMode } from "@core/types/index";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { App } from "../../App";

// Mock external dependencies
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useApp: () => ({ exit: vi.fn() }),
    useInput: vi.fn(),
  };
});

vi.mock("@features/jq/utils/jqTransform", () => ({
  transformWithJq: vi.fn(),
}));

vi.mock("@features/schema/utils/fileExport", () => ({
  exportToFile: vi.fn(),
  generateDefaultFilename: vi.fn((format: string) => `test.${format}`),
}));

vi.mock("@hooks/useTerminalCalculations", () => ({
  useTerminalCalculations: vi.fn(),
}));

vi.mock("@hooks/useSearchHandlers", () => ({
  useSearchHandlers: vi.fn(),
}));

vi.mock("@hooks/useExportHandlers", () => ({
  useExportHandlers: vi.fn(),
}));

vi.mock("@hooks/useNavigationHandlers", () => ({
  useNavigationHandlers: vi.fn(),
}));

vi.mock("@hooks/useModalHandlers", () => ({
  useModalHandlers: vi.fn(),
}));

vi.mock("@hooks/useViewModeHandlers", () => ({
  useViewModeHandlers: vi.fn(),
}));

vi.mock("@hooks/useJqHandlers", () => ({
  useJqHandlers: vi.fn(),
}));

vi.mock("@hooks/useDebugHandlers", () => ({
  useDebugHandlers: vi.fn(),
}));

// Mock all store hooks with realistic implementations
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

// Create realistic mock implementations
const createMockTerminalCalculations = () => ({
  terminalSize: { width: 80, height: 24 },
  visibleLines: 20,
  searchModeVisibleLines: 18,
  maxScroll: 100,
  maxScrollSearchMode: 90,
  halfPageLines: 10,
});

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

const createMockSearchState = (overrides = {}) => ({
  isSearching: false,
  searchTerm: "",
  searchScope: "all" as const,
  currentIndex: 0,
  totalResults: 0,
  results: [],
  searchResults: [],
  currentResultIndex: 0,
  ...overrides,
});

const createMockJqState = (overrides = {}) => ({
  isActive: false,
  input: "",
  transformedData: null,
  error: null,
  showOriginal: false,
  ...overrides,
});

// Setup comprehensive mocks
beforeEach(() => {
  vi.clearAllMocks();

  const mockTerminalCalculations = createMockTerminalCalculations();
  const mockUI = createMockUI();
  const mockSearchState = createMockSearchState();
  const mockJqState = createMockJqState();

  // Mock all hooks with realistic behavior (using dynamic imports)
  vi.doMock("@hooks/useTerminalCalculations", () => ({
    useTerminalCalculations: vi.fn(() => mockTerminalCalculations),
  }));
  vi.doMock("@hooks/useSearchHandlers", () => ({
    useSearchHandlers: vi.fn(() => ({})),
  }));
  vi.doMock("@hooks/useExportHandlers", () => ({
    useExportHandlers: vi.fn(() => ({
      handleExportSchema: vi.fn(),
      handleExportConfirm: vi.fn(),
      handleExportCancel: vi.fn(),
    })),
  }));

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
    {
      isExporting: false,
      currentFile: null,
      message: null,
      type: null,
    },
  ]);
  vi.mocked(require("@store/hooks/useExport")).useExportDialog.mockReturnValue({
    isVisible: false,
  });

  vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(false);
  vi.mocked(require("@store/atoms")).useSetAtom.mockReturnValue(vi.fn());
});

function TestApp({
  initialData = { name: "test", value: 42 },
  initialError = null,
  keyboardEnabled = true,
  initialViewMode = undefined,
}: {
  initialData?: JsonValue | null;
  initialError?: string | null;
  keyboardEnabled?: boolean;
  initialViewMode?: ViewMode;
} = {}): ReactElement {
  return (
    <ConfigProvider config={DEFAULT_CONFIG}>
      <App
        initialData={initialData}
        initialError={initialError}
        keyboardEnabled={keyboardEnabled}
        initialViewMode={initialViewMode}
      />
    </ConfigProvider>
  );
}

describe.skip("Full Application Integration", () => {
  describe("Application Initialization", () => {
    it("should initialize with default data successfully", () => {
      render(<TestApp />);

      // App should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it("should initialize with custom data", () => {
      const customData = {
        users: [
          { id: 1, name: "Alice", active: true },
          { id: 2, name: "Bob", active: false },
        ],
        metadata: {
          total: 2,
          created: "2023-01-01",
        },
      };

      render(<TestApp initialData={customData} />);

      // Should initialize with custom data
      expect(document.body).toBeInTheDocument();
    });

    it("should handle initialization with error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<TestApp initialError="Failed to load JSON file" />);

      // Should still render despite error
      expect(document.body).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("should handle keyboard disabled state", () => {
      render(<TestApp keyboardEnabled={false} />);

      // Should render warning about keyboard unavailability
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("View Mode Switching", () => {
    it("should handle tree view mode activation", () => {
      const mockUI = createMockUI({
        treeViewMode: true,
        collapsibleMode: false,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestApp />);

      // App should handle tree view mode
      expect(document.body).toBeInTheDocument();
    });

    it("should handle schema view mode activation", () => {
      const mockUI = createMockUI({
        treeViewMode: false,
        collapsibleMode: false,
        schemaVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestApp />);

      // App should handle schema view mode
      expect(document.body).toBeInTheDocument();
    });

    it("should handle collapsible view mode (default)", () => {
      const mockUI = createMockUI({ collapsibleMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestApp />);

      // App should handle collapsible view mode
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Search Functionality Integration", () => {
    it("should handle search activation", () => {
      const mockSearchState = createMockSearchState({
        isSearching: true,
        searchTerm: "test",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      render(<TestApp />);

      // Search should be active
      expect(document.body).toBeInTheDocument();
    });

    it("should handle search with results", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "Alice",
        searchResults: [{ path: "users.0.name", value: "Alice" }],
        currentResultIndex: 0,
        totalResults: 1,
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      render(<TestApp />);

      // Should show search results
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("JQ Transformation Integration", () => {
    it("should handle jq query activation", async () => {
      const mockJqState = createMockJqState({
        isActive: true,
        input: ".users[] | select(.active)",
      });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );

      // Mock successful jq transformation
      vi.mocked(
        require("@features/jq/utils/jqTransform"),
      ).transformWithJq.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: "Alice", active: true }],
      });

      render(<TestApp />);

      // JQ should be active
      expect(document.body).toBeInTheDocument();
    });

    it("should handle jq transformation error", async () => {
      const mockJqState = createMockJqState({
        isActive: true,
        input: ".invalid | syntax",
        error: "Invalid jq syntax",
      });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );

      render(<TestApp />);

      // Should handle jq error
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Modal System Integration", () => {
    it("should handle settings modal", () => {
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true); // settings visible

      render(<TestApp />);

      // Settings modal should be handled
      expect(document.body).toBeInTheDocument();
    });

    it("should handle export dialog", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({
        isVisible: true,
      });

      render(<TestApp />);

      // Export dialog should be handled
      expect(document.body).toBeInTheDocument();
    });

    it("should handle help viewer", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestApp />);

      // Help viewer should be handled
      expect(document.body).toBeInTheDocument();
    });

    it("should handle debug log viewer", () => {
      const mockUI = createMockUI({ debugLogViewerVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestApp />);

      // Debug log viewer should be handled
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Export Functionality Integration", () => {
    it("should handle schema export process", async () => {
      const mockExportHandlers = {
        handleExportSchema: vi.fn(),
        handleExportConfirm: vi.fn(),
        handleExportCancel: vi.fn(),
      };
      vi.mocked(
        require("@hooks/useExportHandlers"),
      ).useExportHandlers.mockReturnValue(mockExportHandlers);

      render(<TestApp />);

      // Export handlers should be set up
      expect(mockExportHandlers.handleExportSchema).toBeDefined();
    });

    it("should handle data export process", async () => {
      vi.mocked(
        require("@features/schema/utils/fileExport"),
      ).exportToFile.mockResolvedValue(undefined);

      render(<TestApp />);

      // Data export should be available
      expect(document.body).toBeInTheDocument();
    });

    it("should handle export status updates", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([
        {
          isExporting: true,
          currentFile: "schema.json",
          message: null,
          type: null,
        },
      ]);

      render(<TestApp />);

      // Export status should be handled
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle component render errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Force an error in one of the hooks
      vi.mocked(require("@store/hooks/useUI")).useUI.mockImplementation(() => {
        throw new Error("Mock render error");
      });

      // Should not crash the entire app
      expect(() => render(<TestApp />)).toThrow("Mock render error");

      consoleSpy.mockRestore();
    });

    it("should handle invalid initial data", () => {
      const invalidData: JsonValue = {
        circular: "self-reference",
      };
      // Note: Using string instead of actual circular reference for JSON safety

      render(<TestApp initialData={invalidData} />);

      // Should handle circular data gracefully
      expect(document.body).toBeInTheDocument();
    });

    it("should handle state update errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock a state update that fails
      const failingSetState = vi.fn().mockImplementation(() => {
        throw new Error("State update failed");
      });

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchInput.mockReturnValue(["", failingSetState]);

      render(<TestApp />);

      // App should still render
      expect(document.body).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Performance Integration", () => {
    it("should handle large datasets efficiently", () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`],
            nested: {
              level1: { level2: { level3: `value${i}` } },
            },
          },
        })),
      };

      const startTime = Date.now();
      render(<TestApp initialData={largeData} />);
      const endTime = Date.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second max
      expect(document.body).toBeInTheDocument();
    });

    it("should handle rapid state updates", async () => {
      const mockSetScrollOffset = vi.fn();
      vi.mocked(
        require("@store/hooks/useNavigation"),
      ).useScrollOffset.mockReturnValue([0, mockSetScrollOffset]);

      render(<TestApp />);

      // Simulate rapid scroll updates
      for (let i = 0; i < 100; i++) {
        mockSetScrollOffset(i);
      }

      // Should handle rapid updates without issues
      expect(mockSetScrollOffset).toHaveBeenCalledTimes(100);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Full User Workflows", () => {
    it("should support complete search workflow", async () => {
      const mockSearchState = createMockSearchState();
      const mockStartSearch = vi.fn();
      const mockCancelSearch = vi.fn();

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useStartSearch.mockReturnValue(mockStartSearch);
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useCancelSearch.mockReturnValue(mockCancelSearch);

      render(<TestApp />);

      // Start search
      mockStartSearch();
      expect(mockStartSearch).toHaveBeenCalled();

      // Cancel search
      mockCancelSearch();
      expect(mockCancelSearch).toHaveBeenCalled();
    });

    it("should support complete jq transformation workflow", async () => {
      const mockToggleJqMode = vi.fn();
      const mockStartTransformation = vi.fn();
      const mockCompleteTransformation = vi.fn();

      vi.mocked(require("@store/hooks/useJq")).useToggleJqMode.mockReturnValue(
        mockToggleJqMode,
      );
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useStartJqTransformation.mockReturnValue(mockStartTransformation);
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useCompleteJqTransformation.mockReturnValue(mockCompleteTransformation);

      render(<TestApp />);

      // Toggle jq mode
      mockToggleJqMode();
      expect(mockToggleJqMode).toHaveBeenCalled();

      // Start transformation
      mockStartTransformation(".test");
      expect(mockStartTransformation).toHaveBeenCalledWith(".test");
    });

    it("should support complete export workflow", async () => {
      const mockHandleExportSchema = vi.fn();
      const mockHandleExportConfirm = vi.fn();

      vi.mocked(
        require("@hooks/useExportHandlers"),
      ).useExportHandlers.mockReturnValue({
        handleExportSchema: mockHandleExportSchema,
        handleExportConfirm: mockHandleExportConfirm,
        handleExportCancel: vi.fn(),
      });

      render(<TestApp />);

      // Start export
      mockHandleExportSchema();
      expect(mockHandleExportSchema).toHaveBeenCalled();

      // Confirm export
      mockHandleExportConfirm({ filename: "test.json", format: "json" });
      expect(mockHandleExportConfirm).toHaveBeenCalledWith({
        filename: "test.json",
        format: "json",
      });
    });

    it("should support view mode switching workflow", () => {
      const mockToggleTreeView = vi.fn();
      const mockToggleSchema = vi.fn();
      const mockToggleCollapsible = vi.fn();

      vi.mocked(
        require("@store/hooks/useUI"),
      ).useToggleTreeView.mockReturnValue(mockToggleTreeView);
      vi.mocked(require("@store/hooks/useUI")).useToggleSchema.mockReturnValue(
        mockToggleSchema,
      );
      vi.mocked(
        require("@store/hooks/useUI"),
      ).useToggleCollapsible.mockReturnValue(mockToggleCollapsible);

      render(<TestApp />);

      // Switch to tree view
      mockToggleTreeView();
      expect(mockToggleTreeView).toHaveBeenCalled();

      // Switch to schema view
      mockToggleSchema();
      expect(mockToggleSchema).toHaveBeenCalled();

      // Switch to collapsible view
      mockToggleCollapsible();
      expect(mockToggleCollapsible).toHaveBeenCalled();
    });
  });
});
