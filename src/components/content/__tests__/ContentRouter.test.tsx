/**
 * Tests for ContentRouter component
 * Ensures proper content routing between different view modes
 */

import { AppStateProvider } from "@components/providers/AppStateProvider";
import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import type { AppMode } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { createRef } from "react";
import { ContentRouter } from "../ContentRouter";

// Mock ConfigContext
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: vi.fn(() => DEFAULT_CONFIG),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock store atoms
vi.mock("@store/atoms", () => ({
  useAtomValue: vi.fn(() => false),
  useSetAtom: vi.fn(() => vi.fn()),
}));

// Mock all hooks with proper implementations
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

// Mock store hooks with proper return values
vi.mock("@store/hooks", () => ({
  useUpdateDebugInfo: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useDebug", () => ({
  useDebugInfo: vi.fn(() => ({})),
  useUpdateDebugInfo: vi.fn(() => vi.fn()),
  useClearDebugInfo: vi.fn(() => vi.fn()),
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
  useSearchState: vi.fn(() => ({
    isSearching: false,
    searchTerm: "",
    searchScope: "all",
    results: [],
    searchResults: [],
    currentResultIndex: 0,
  })),
  useSearchInput: vi.fn(() => ["", vi.fn()]),
  useSearchCursorPosition: vi.fn(() => [0, vi.fn()]),
  useStartSearch: vi.fn(() => vi.fn()),
  useCancelSearch: vi.fn(() => vi.fn()),
  useCycleScope: vi.fn(() => vi.fn()),
  useNextSearchResult: vi.fn(() => vi.fn()),
  usePreviousSearchResult: vi.fn(() => vi.fn()),
}));

vi.mock("@store/hooks/useUI", () => ({
  useUI: vi.fn(() => ({
    treeViewMode: false,
    collapsibleMode: true, // Default to collapsible mode
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
}));

// Mock all viewer components
vi.mock("@features/tree/components/TreeView", () => ({
  TreeView: ({
    data,
    onKeyboardHandlerReady,
  }: {
    data: JsonValue | null;
    onKeyboardHandlerReady: (handler: () => void) => void;
  }) => (
    <div data-testid="tree-view">
      <div data-testid="tree-data">{JSON.stringify(data)}</div>
      <button
        type="button"
        onClick={() => onKeyboardHandlerReady(vi.fn())}
        data-testid="tree-handler-setup"
      >
        Setup Handler
      </button>
    </div>
  ),
}));

vi.mock("@features/collapsible/components/CollapsibleJsonViewer", () => ({
  CollapsibleJsonViewer: (
    {
      data,
      onScrollChange,
    }: { data: JsonValue | null; onScrollChange: (offset: number) => void },
    ref: React.Ref<HTMLDivElement>,
  ) => (
    <div data-testid="collapsible-view" ref={ref}>
      <div data-testid="collapsible-data">{JSON.stringify(data)}</div>
      <button
        type="button"
        onClick={() => onScrollChange(10)}
        data-testid="scroll-change"
      >
        Change Scroll
      </button>
    </div>
  ),
}));

vi.mock("@features/schema/components/SchemaViewer", () => ({
  SchemaViewer: ({ data }: { data: unknown }) => (
    <div data-testid="schema-view">
      <div data-testid="schema-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

vi.mock("@features/json-rendering/components/JsonViewer", () => ({
  JsonViewer: ({ data }: { data: unknown }) => (
    <div data-testid="json-view">
      <div data-testid="json-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

vi.mock("@features/debug/components/DebugBar", () => ({
  DebugBar: ({ keyboardEnabled }: { keyboardEnabled: boolean }) => (
    <div data-testid="debug-bar">
      Debug Bar (keyboard: {keyboardEnabled.toString()})
    </div>
  ),
}));

// Helper functions (commented out as unused)
// const createMockUI = (overrides = {}) => ({
//   debugVisible: false,
//   lineNumbersVisible: true,
//   schemaVisible: false,
//   helpVisible: false,
//   treeViewMode: false,
//   collapsibleMode: true,
//   debugLogViewerVisible: false,
//   setHelpVisible: vi.fn(),
//   setDebugLogViewerVisible: vi.fn(),
//   ...overrides,
// });

// const createMockSearchState = (overrides = {}) => ({
//   isSearching: false,
//   searchTerm: "",
//   searchScope: "all" as const,
//   currentIndex: 0,
//   totalResults: 0,
//   results: [],
//   searchResults: [],
//   currentResultIndex: 0,
//   ...overrides,
// });

function TestWrapper({
  displayData = { test: "data" },
  keyboardEnabled = false,
  currentMode = "raw" as AppMode,
}: {
  displayData?: JsonValue | null;
  keyboardEnabled?: boolean;
  currentMode?: AppMode;
}): ReactElement {
  const collapsibleViewerRef = createRef<{
    navigate: (action: unknown) => void;
  } | null>();

  const safeSetTreeViewKeyboardHandler = vi.fn();

  return (
    <ConfigProvider config={DEFAULT_CONFIG}>
      <AppStateProvider>
        <ContentRouter
          displayData={displayData}
          keyboardEnabled={keyboardEnabled}
          currentMode={currentMode}
          safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
          collapsibleViewerRef={collapsibleViewerRef}
        />
      </AppStateProvider>
    </ConfigProvider>
  );
}

describe("ContentRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with default collapsible mode", () => {
      render(<TestWrapper displayData={{ name: "test" }} />);

      // With default mocks, collapsible mode should be active
      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-data")).toHaveTextContent(
        '{"name":"test"}',
      );
    });

    it("should handle null display data", () => {
      render(<TestWrapper displayData={null} />);
      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-data")).toHaveTextContent("null");
    });

    it("should handle complex nested data", () => {
      const complexData = {
        users: [
          { id: 1, name: "John", nested: { level: 1 } },
          { id: 2, name: "Jane", nested: { level: 2 } },
        ],
        metadata: { count: 2, created: "2023-01-01" },
      };

      render(<TestWrapper displayData={complexData} />);
      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-data")).toHaveTextContent(
        JSON.stringify(complexData),
      );
    });

    it("should render component structure correctly", () => {
      render(<TestWrapper keyboardEnabled={true} />);

      // Should render the content router with mocked components
      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
    });

    it("should handle keyboard enabled state", () => {
      render(<TestWrapper keyboardEnabled={true} />);

      // Component should render without errors when keyboard is enabled
      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
    });
  });
});
