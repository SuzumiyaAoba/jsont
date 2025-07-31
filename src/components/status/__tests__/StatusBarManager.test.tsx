/**
 * Tests for StatusBarManager component
 * Ensures proper status bar management and conditional rendering
 */

import { AppStateProvider } from "@components/providers/AppStateProvider";
import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { StatusBarManager } from "../StatusBarManager";

// Mock status bar components
vi.mock("@features/search/components/SearchBar", () => ({
  SearchBar: ({
    searchState,
    searchInput,
  }: {
    searchState: unknown;
    searchInput: React.ReactNode;
  }) => (
    <div data-testid="search-bar">
      <div data-testid="search-state">{JSON.stringify(searchState)}</div>
      <div data-testid="search-input">{searchInput}</div>
    </div>
  ),
}));

vi.mock("@features/jq/components/JqQueryInput", () => ({
  JqQueryInput: ({
    jqState,
    queryInput,
  }: {
    jqState: unknown;
    queryInput: React.ReactNode;
  }) => (
    <div data-testid="jq-input">
      <div data-testid="jq-state">{JSON.stringify(jqState)}</div>
      <div data-testid="jq-query">{queryInput}</div>
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

const createMockJqState = (overrides = {}) => ({
  isActive: false,
  input: "",
  transformedData: null,
  error: null,
  showOriginal: false,
  ...overrides,
});

const createMockExportStatus = (overrides = {}) => ({
  isExporting: false,
  currentFile: null,
  message: null,
  type: null,
  ...overrides,
});

// Setup default mocks
beforeEach(() => {
  vi.clearAllMocks();

  const mockUI = createMockUI();
  const mockSearchState = createMockSearchState();
  const mockJqState = createMockJqState();
  const mockExportStatus = createMockExportStatus();

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
    mockExportStatus,
  ]);
  vi.mocked(require("@store/hooks/useExport")).useExportDialog.mockReturnValue({
    isVisible: false,
  });

  vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(false);
  vi.mocked(require("@store/atoms")).useSetAtom.mockReturnValue(vi.fn());
});

function TestWrapper({
  keyboardEnabled = true,
}: {
  keyboardEnabled?: boolean;
}): ReactElement {
  return (
    <ConfigProvider config={DEFAULT_CONFIG}>
      <AppStateProvider>
        <StatusBarManager keyboardEnabled={keyboardEnabled} />
      </AppStateProvider>
    </ConfigProvider>
  );
}

describe("StatusBarManager", () => {
  describe("Search Bar", () => {
    it("should show search bar when searching", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchInput.mockReturnValue(["test query", vi.fn()]);

      render(<TestWrapper />);

      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
      expect(screen.getByTestId("search-state")).toHaveTextContent(
        JSON.stringify(mockSearchState),
      );
      expect(screen.getByTestId("search-input")).toHaveTextContent(
        "test query",
      );
    });

    it("should show search bar when search term exists", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "existing search",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      render(<TestWrapper />);

      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    });

    it("should hide search bar when not searching and no search term", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      render(<TestWrapper />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });

    it("should hide search bar when export dialog is visible", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });

    it("should hide search bar when help is visible", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });
  });

  describe("JQ Query Input", () => {
    it("should show jq input when jq is active", () => {
      const mockJqState = createMockJqState({ isActive: true });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(require("@store/hooks/useJq")).useJqInput.mockReturnValue([
        ".filter",
        vi.fn(),
      ]);

      render(<TestWrapper />);

      expect(screen.getByTestId("jq-input")).toBeInTheDocument();
      expect(screen.getByTestId("jq-state")).toHaveTextContent(
        JSON.stringify(mockJqState),
      );
      expect(screen.getByTestId("jq-query")).toHaveTextContent(".filter");
    });

    it("should hide jq input when jq is not active", () => {
      const mockJqState = createMockJqState({ isActive: false });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );

      render(<TestWrapper />);

      expect(screen.queryByTestId("jq-input")).not.toBeInTheDocument();
    });

    it("should hide jq input when export dialog is visible", () => {
      const mockJqState = createMockJqState({ isActive: true });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByTestId("jq-input")).not.toBeInTheDocument();
    });

    it("should hide jq input when help is visible", () => {
      const mockJqState = createMockJqState({ isActive: true });
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.queryByTestId("jq-input")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Warning", () => {
    it("should show keyboard warning when keyboard is disabled", () => {
      render(<TestWrapper keyboardEnabled={false} />);

      expect(
        screen.getByText(/Keyboard input unavailable/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Use file input: jsont file.json/),
      ).toBeInTheDocument();
    });

    it("should hide keyboard warning when keyboard is enabled", () => {
      render(<TestWrapper keyboardEnabled={true} />);

      expect(
        screen.queryByText(/Keyboard input unavailable/),
      ).not.toBeInTheDocument();
    });

    it("should hide keyboard warning when export dialog is visible", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper keyboardEnabled={false} />);

      expect(
        screen.queryByText(/Keyboard input unavailable/),
      ).not.toBeInTheDocument();
    });

    it("should hide keyboard warning when help is visible", () => {
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper keyboardEnabled={false} />);

      expect(
        screen.queryByText(/Keyboard input unavailable/),
      ).not.toBeInTheDocument();
    });
  });

  describe("Export Status", () => {
    it("should show export status when exporting", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: true,
        currentFile: "test.json",
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper />);

      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });

    it("should show success message after export", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: false,
        message: "Export completed successfully",
        type: "success",
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper />);

      expect(
        screen.getByText("Export completed successfully"),
      ).toBeInTheDocument();
    });

    it("should show error message when export fails", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: false,
        message: "Export failed: Permission denied",
        type: "error",
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper />);

      expect(
        screen.getByText("Export failed: Permission denied"),
      ).toBeInTheDocument();
    });

    it("should hide export status when not exporting and no message", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: false,
        message: null,
        type: null,
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper />);

      expect(screen.queryByText(/Export/)).not.toBeInTheDocument();
    });

    it("should hide export status when export dialog is visible", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: true,
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(screen.queryByText("Exporting...")).not.toBeInTheDocument();
    });

    it("should hide export status when help is visible", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: true,
      });
      const mockUI = createMockUI({ helpVisible: true });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper />);

      expect(screen.queryByText("Exporting...")).not.toBeInTheDocument();
    });
  });

  describe("Multiple Status Bars", () => {
    it("should show multiple status bars simultaneously", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      const mockJqState = createMockJqState({ isActive: true });
      const mockExportStatus = createMockExportStatus({ isExporting: true });

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper keyboardEnabled={false} />);

      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
      expect(screen.getByTestId("jq-input")).toBeInTheDocument();
      expect(
        screen.getByText(/Keyboard input unavailable/),
      ).toBeInTheDocument();
      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });

    it("should hide all status bars when help is visible", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      const mockJqState = createMockJqState({ isActive: true });
      const mockExportStatus = createMockExportStatus({ isExporting: true });
      const mockUI = createMockUI({ helpVisible: true });

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(mockUI);

      render(<TestWrapper keyboardEnabled={false} />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("jq-input")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Keyboard input unavailable/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Exporting...")).not.toBeInTheDocument();
    });

    it("should hide all status bars when export dialog is visible", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      const mockJqState = createMockJqState({ isActive: true });
      const mockExportStatus = createMockExportStatus({ isExporting: true });

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper keyboardEnabled={false} />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("jq-input")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Keyboard input unavailable/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Exporting...")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined export status message", () => {
      const mockExportStatus = createMockExportStatus({
        isExporting: false,
        message: undefined,
        type: "success",
      });
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      render(<TestWrapper />);

      expect(screen.queryByText(/Export/)).not.toBeInTheDocument();
    });

    it("should handle empty search term", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "",
      });
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);

      render(<TestWrapper />);

      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });

    it("should render nothing when all conditions are false", () => {
      const mockSearchState = createMockSearchState({
        isSearching: false,
        searchTerm: "",
      });
      const mockJqState = createMockJqState({ isActive: false });
      const mockExportStatus = createMockExportStatus({
        isExporting: false,
        message: null,
      });

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportStatus.mockReturnValue([mockExportStatus]);

      const { container } = render(<TestWrapper keyboardEnabled={true} />);

      // Should only have empty fragment
      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe("Props Integration", () => {
    it("should pass correct props to SearchBar", () => {
      const mockSearchState = createMockSearchState({ isSearching: true });
      const searchInput = "test search";
      const searchCursorPosition = 5;

      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(mockSearchState);
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchInput.mockReturnValue([searchInput, vi.fn()]);
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchCursorPosition.mockReturnValue([
        searchCursorPosition,
        vi.fn(),
      ]);

      render(<TestWrapper />);

      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
      expect(screen.getByTestId("search-input")).toHaveTextContent(searchInput);
    });

    it("should pass correct props to JqQueryInput", () => {
      const mockJqState = createMockJqState({ isActive: true });
      const jqInput = ".test | select(.active)";
      const jqCursorPosition = 10;
      const jqErrorScrollOffset = 2;
      const jqFocusMode = true;

      vi.mocked(require("@store/hooks/useJq")).useJqState.mockReturnValue(
        mockJqState,
      );
      vi.mocked(require("@store/hooks/useJq")).useJqInput.mockReturnValue([
        jqInput,
        vi.fn(),
      ]);
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useJqCursorPosition.mockReturnValue([jqCursorPosition, vi.fn()]);
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useJqErrorScrollOffset.mockReturnValue([jqErrorScrollOffset, vi.fn()]);
      vi.mocked(require("@store/hooks/useJq")).useJqFocusMode.mockReturnValue([
        jqFocusMode,
        vi.fn(),
      ]);

      render(<TestWrapper />);

      expect(screen.getByTestId("jq-input")).toBeInTheDocument();
      expect(screen.getByTestId("jq-query")).toHaveTextContent(jqInput);
    });
  });
});
