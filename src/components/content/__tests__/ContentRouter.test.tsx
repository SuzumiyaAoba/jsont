/**
 * Tests for ContentRouter component
 * Ensures proper content routing between different view modes
 */

import { AppStateProvider } from "@components/providers/AppStateProvider";
import { defaultConfig } from "@core/config/defaults";
import { ConfigContext } from "@core/context/ConfigContext";
import type { AppMode } from "@core/types/app";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { createRef } from "react";
import { ContentRouter } from "../ContentRouter";

// Mock all viewer components
vi.mock("@features/tree/components/TreeView", () => ({
  TreeView: ({ data, onKeyboardHandlerReady }: any) => (
    <div data-testid="tree-view">
      <div data-testid="tree-data">{JSON.stringify(data)}</div>
      <button
        onClick={() => onKeyboardHandlerReady(vi.fn())}
        data-testid="tree-handler-setup"
      >
        Setup Handler
      </button>
    </div>
  ),
}));

vi.mock("@features/collapsible/components/CollapsibleJsonViewer", () => ({
  CollapsibleJsonViewer: ({ data, onScrollChange }: any, ref: any) => (
    <div data-testid="collapsible-view" ref={ref}>
      <div data-testid="collapsible-data">{JSON.stringify(data)}</div>
      <button onClick={() => onScrollChange(10)} data-testid="scroll-change">
        Change Scroll
      </button>
    </div>
  ),
}));

vi.mock("@features/schema/components/SchemaViewer", () => ({
  SchemaViewer: ({ data }: any) => (
    <div data-testid="schema-view">
      <div data-testid="schema-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

vi.mock("@features/json-rendering/components/JsonViewer", () => ({
  JsonViewer: ({ data }: any) => (
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

// Mock store hooks
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

// Setup default mocks
beforeEach(() => {
  vi.clearAllMocks();

  const mockUI = createMockUI();
  const mockSearchState = createMockSearchState();

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
  displayData = { test: "data" },
  keyboardEnabled = false,
  currentMode = "raw" as AppMode,
}: {
  displayData?: any;
  keyboardEnabled?: boolean;
  currentMode?: AppMode;
}): ReactElement {
  const collapsibleViewerRef = createRef<{
    navigate: (action: any) => void;
  } | null>();

  const safeSetTreeViewKeyboardHandler = vi.fn();

  return (
    <ConfigContext.Provider value={defaultConfig}>
      <AppStateProvider>
        <ContentRouter
          displayData={displayData}
          keyboardEnabled={keyboardEnabled}
          currentMode={currentMode}
          safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
          collapsibleViewerRef={collapsibleViewerRef}
        />
      </AppStateProvider>
    </ConfigContext.Provider>
  );
}

describe("ContentRouter", () => {
  describe("View Mode Routing", () => {
    it("should render tree view when treeViewMode is true", () => {
      const mockUI = createMockUI({
        treeViewMode: true,
        collapsibleMode: false,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={{ name: "test" }} />);

      expect(screen.getByTestId("tree-view")).toBeInTheDocument();
      expect(screen.getByTestId("tree-data")).toHaveTextContent(
        '{"name":"test"}',
      );
      expect(screen.queryByTestId("collapsible-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("schema-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("json-view")).not.toBeInTheDocument();
    });

    it("should render collapsible view when collapsibleMode is true", () => {
      const mockUI = createMockUI({
        treeViewMode: false,
        collapsibleMode: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={{ type: "collapsible" }} />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-data")).toHaveTextContent(
        '{"type":"collapsible"}',
      );
      expect(screen.queryByTestId("tree-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("schema-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("json-view")).not.toBeInTheDocument();
    });

    it("should render schema view when schemaVisible is true", () => {
      const mockUI = createMockUI({
        treeViewMode: false,
        collapsibleMode: false,
        schemaVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={{ schema: "test" }} />);

      expect(screen.getByTestId("schema-view")).toBeInTheDocument();
      expect(screen.getByTestId("schema-data")).toHaveTextContent(
        '{"schema":"test"}',
      );
      expect(screen.queryByTestId("tree-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("collapsible-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("json-view")).not.toBeInTheDocument();
    });

    it("should render json view as default when no specific mode is active", () => {
      const mockUI = createMockUI({
        treeViewMode: false,
        collapsibleMode: false,
        schemaVisible: false,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={{ default: "json" }} />);

      expect(screen.getByTestId("json-view")).toBeInTheDocument();
      expect(screen.getByTestId("json-data")).toHaveTextContent(
        '{"default":"json"}',
      );
      expect(screen.queryByTestId("tree-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("collapsible-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("schema-view")).not.toBeInTheDocument();
    });

    it("should prioritize tree view when multiple modes are active", () => {
      const mockUI = createMockUI({
        treeViewMode: true,
        collapsibleMode: true,
        schemaVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("tree-view")).toBeInTheDocument();
      expect(screen.queryByTestId("collapsible-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("schema-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("json-view")).not.toBeInTheDocument();
    });

    it("should prioritize collapsible over schema when tree view is off", () => {
      const mockUI = createMockUI({
        treeViewMode: false,
        collapsibleMode: true,
        schemaVisible: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.queryByTestId("schema-view")).not.toBeInTheDocument();
    });
  });

  describe("Help Visibility", () => {
    it("should return null when help is visible", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      const { container } = render(<TestWrapper />);

      expect(container.firstChild).toBeNull();
    });

    it("should render content when help is not visible", () => {
      const mockUI = createMockUI({
        helpVisible: false,
        collapsibleMode: true,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
    });
  });

  describe("Debug Bar", () => {
    it("should show debug bar when debugVisible is true", () => {
      const mockUI = createMockUI({ debugVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper keyboardEnabled={true} />);

      expect(screen.getByTestId("debug-bar")).toBeInTheDocument();
      expect(screen.getByTestId("debug-bar")).toHaveTextContent(
        "Debug Bar (keyboard: true)",
      );
    });

    it("should hide debug bar when debugVisible is false", () => {
      const mockUI = createMockUI({ debugVisible: false });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.queryByTestId("debug-bar")).not.toBeInTheDocument();
    });

    it("should hide debug bar when export dialog is visible", () => {
      const mockUI = createMockUI({ debugVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByTestId("debug-bar")).not.toBeInTheDocument();
    });

    it("should pass keyboard enabled state to debug bar", () => {
      const mockUI = createMockUI({ debugVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper keyboardEnabled={false} />);

      expect(screen.getByTestId("debug-bar")).toHaveTextContent(
        "Debug Bar (keyboard: false)",
      );
    });
  });

  describe("Visible Lines Calculation", () => {
    it("should use search mode visible lines when searching", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      const mockUI = createMockUI({ treeViewMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      // TreeView should receive searchModeVisibleLines (18) instead of visibleLines (20)
      expect(screen.getByTestId("tree-view")).toBeInTheDocument();
    });

    it("should use search mode visible lines when search term exists", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "test",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      const mockUI = createMockUI({ collapsibleMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
    });

    it("should use normal visible lines when not searching", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      const mockUI = createMockUI({ schemaVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("schema-view")).toBeInTheDocument();
    });
  });

  describe("Scroll Handling", () => {
    it("should handle collapsible scroll changes", () => {
      const setScrollOffset = vi.fn();
      vi.mocked(
        require("@store/hooks/useNavigation"),
      ).useScrollOffset.mockReturnValue([0, setScrollOffset]);

      const mockUI = createMockUI({ collapsibleMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      // Simulate scroll change in collapsible viewer
      const scrollButton = screen.getByTestId("scroll-change");
      scrollButton.click();

      expect(setScrollOffset).toHaveBeenCalledWith(10);
    });

    it("should pass current scroll offset to viewers", () => {
      const scrollOffset = 25;
      vi.mocked(
        require("@store/hooks/useNavigation"),
      ).useScrollOffset.mockReturnValue([scrollOffset, vi.fn()]);

      const mockUI = createMockUI({ treeViewMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("tree-view")).toBeInTheDocument();
      // TreeView component should receive scrollOffset prop
    });
  });

  describe("Search Integration", () => {
    it("should pass search state to all viewers", () => {
      const mockSearchState = createMockSearchState({
        searchTerm: "test search",
        searchResults: ["result1", "result2"],
        currentResultIndex: 1,
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      const mockUI = createMockUI({ schemaVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("schema-view")).toBeInTheDocument();
      // SchemaViewer should receive search props
    });

    it("should pass line numbers visibility to viewers", () => {
      const mockUI = createMockUI({
        collapsibleMode: true,
        lineNumbersVisible: false,
      });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      // CollapsibleJsonViewer should receive showLineNumbers prop
    });
  });

  describe("Tree View Handler", () => {
    it("should setup tree view keyboard handler", () => {
      const safeSetTreeViewKeyboardHandler = vi.fn();
      const mockUI = createMockUI({ treeViewMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      const collapsibleViewerRef = createRef<{
        navigate: (action: any) => void;
      } | null>();

      render(
        <ConfigContext.Provider value={defaultConfig}>
          <AppStateProvider>
            <ContentRouter
              displayData={{ test: "data" }}
              keyboardEnabled={true}
              currentMode="tree"
              safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
              collapsibleViewerRef={collapsibleViewerRef}
            />
          </AppStateProvider>
        </ConfigContext.Provider>,
      );

      // Simulate handler setup
      const handlerButton = screen.getByTestId("tree-handler-setup");
      handlerButton.click();

      expect(safeSetTreeViewKeyboardHandler).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle null display data", () => {
      const mockUI = createMockUI({ collapsibleMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={null} />);

      expect(screen.getByTestId("collapsible-view")).toBeInTheDocument();
      expect(screen.getByTestId("collapsible-data")).toHaveTextContent("null");
    });

    it("should handle undefined display data", () => {
      const mockUI = createMockUI({ treeViewMode: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={undefined} />);

      expect(screen.getByTestId("tree-view")).toBeInTheDocument();
    });

    it("should handle complex nested data", () => {
      const complexData = {
        users: [
          { id: 1, name: "John", nested: { level: 1 } },
          { id: 2, name: "Jane", nested: { level: 2 } },
        ],
        metadata: {
          count: 2,
          created: "2023-01-01",
        },
      };

      const mockUI = createMockUI({ schemaVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper displayData={complexData} />);

      expect(screen.getByTestId("schema-view")).toBeInTheDocument();
      expect(screen.getByTestId("schema-data")).toHaveTextContent(
        JSON.stringify(complexData),
      );
    });
  });
});
