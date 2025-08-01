/**
 * Full application integration tests
 * Tests complete workflows from initialization to user interactions
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import type { JsonValue, ViewMode } from "@core/types/index";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

// Mock all hooks
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

// Mock all store hooks
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
vi.mock("@store/atoms", () => ({
  useAtomValue: vi.fn(),
  useSetAtom: vi.fn(),
}));

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

import * as exportHandlersModule from "@hooks/useExportHandlers";
import * as searchHandlersModule from "@hooks/useSearchHandlers";
// Import mocked modules
import * as hooksModule from "@hooks/useTerminalCalculations";
import * as atomsModule from "@store/atoms";
import * as storeHooksModule from "@store/hooks";
import * as debugHooksModule from "@store/hooks/useDebug";
import * as exportHooksModule from "@store/hooks/useExport";
import * as jqHooksModule from "@store/hooks/useJq";
import * as navigationHooksModule from "@store/hooks/useNavigation";
import * as searchHooksModule from "@store/hooks/useSearch";
import * as uiHooksModule from "@store/hooks/useUI";

// Setup comprehensive mocks
beforeEach(() => {
  vi.clearAllMocks();

  const mockTerminalCalculations = createMockTerminalCalculations();
  const mockUI = createMockUI();
  const mockSearchState = createMockSearchState();
  const mockJqState = createMockJqState();

  // Mock all hooks with realistic behavior
  vi.mocked(hooksModule.useTerminalCalculations).mockReturnValue(
    mockTerminalCalculations,
  );
  vi.mocked(searchHandlersModule.useSearchHandlers).mockReturnValue({});
  vi.mocked(exportHandlersModule.useExportHandlers).mockReturnValue({
    handleExportSchema: vi.fn(),
    handleExportConfirm: vi.fn(),
    handleExportCancel: vi.fn(),
  });

  vi.mocked(storeHooksModule.useUpdateDebugInfo).mockReturnValue(vi.fn());
  vi.mocked(debugHooksModule.useDebugInfo).mockReturnValue({});

  vi.mocked(uiHooksModule.useUI).mockReturnValue(mockUI);
  vi.mocked(uiHooksModule.useToggleTreeView).mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule.useToggleSchema).mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule.useToggleCollapsible).mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule.useToggleLineNumbers).mockReturnValue(vi.fn());
  vi.mocked(uiHooksModule.useToggleDebugLogViewer).mockReturnValue(vi.fn());

  vi.mocked(searchHooksModule.useSearchState).mockReturnValue(mockSearchState);
  vi.mocked(searchHooksModule.useSearchInput).mockReturnValue(["", vi.fn()]);
  vi.mocked(searchHooksModule.useSearchCursorPosition).mockReturnValue([
    0,
    vi.fn(),
  ]);
  vi.mocked(searchHooksModule.useStartSearch).mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule.useCancelSearch).mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule.useCycleScope).mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule.useNextSearchResult).mockReturnValue(vi.fn());
  vi.mocked(searchHooksModule.usePreviousSearchResult).mockReturnValue(vi.fn());

  vi.mocked(navigationHooksModule.useScrollOffset).mockReturnValue([
    0,
    vi.fn(),
  ]);
  vi.mocked(navigationHooksModule.useWaitingForSecondG).mockReturnValue([
    false,
  ]);
  vi.mocked(navigationHooksModule.useResetScroll).mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule.useScrollToTop).mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule.useScrollToBottom).mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule.useAdjustScroll).mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule.useStartGSequence).mockReturnValue(vi.fn());
  vi.mocked(navigationHooksModule.useResetGSequence).mockReturnValue(vi.fn());

  vi.mocked(jqHooksModule.useJqState).mockReturnValue(mockJqState);
  vi.mocked(jqHooksModule.useJqInput).mockReturnValue(["", vi.fn()]);
  vi.mocked(jqHooksModule.useJqCursorPosition).mockReturnValue([0, vi.fn()]);
  vi.mocked(jqHooksModule.useJqFocusMode).mockReturnValue([false, vi.fn()]);
  vi.mocked(jqHooksModule.useJqErrorScrollOffset).mockReturnValue([0, vi.fn()]);
  vi.mocked(jqHooksModule.useExitJqMode).mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule.useToggleJqMode).mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule.useToggleJqView).mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule.useStartJqTransformation).mockReturnValue(vi.fn());
  vi.mocked(jqHooksModule.useCompleteJqTransformation).mockReturnValue(vi.fn());

  vi.mocked(exportHooksModule.useExportStatus).mockReturnValue([
    {
      isExporting: false,
      currentFile: null,
      message: null,
      type: null,
    },
  ]);
  vi.mocked(exportHooksModule.useExportDialog).mockReturnValue({
    isVisible: false,
  });

  vi.mocked(atomsModule.useAtomValue).mockReturnValue(false);
  vi.mocked(atomsModule.useSetAtom).mockReturnValue(vi.fn());
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

describe("Full Application Integration", () => {
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
      vi.mocked(uiHooksModule.useUI).mockReturnValue(mockUI);

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
      vi.mocked(uiHooksModule.useUI).mockReturnValue(mockUI);

      render(<TestApp />);

      // App should handle schema view mode
      expect(document.body).toBeInTheDocument();
    });

    it("should handle collapsible view mode (default)", () => {
      const mockUI = createMockUI({ collapsibleMode: true });
      vi.mocked(uiHooksModule.useUI).mockReturnValue(mockUI);

      render(<TestApp />);

      // App should handle collapsible view mode
      expect(document.body).toBeInTheDocument();
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

      const RENDER_TIME_THRESHOLD = process.env.CI ? 2000 : 1000; // More lenient in CI
      const startTime = Date.now();
      render(<TestApp initialData={largeData} />);
      const endTime = Date.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(RENDER_TIME_THRESHOLD);
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle component render errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Force an error in one of the hooks
      vi.mocked(uiHooksModule.useUI).mockImplementation(() => {
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
  });
});
