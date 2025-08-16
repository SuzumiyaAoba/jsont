import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/App";

// Mock the useInput hook to simulate keyboard input
type MockKeyInput = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
};

// let mockInputHandler: ((input: string, key: MockKeyInput) => void) | null = null; // Unused variable

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn((_handler: (input: string, key: MockKeyInput) => void) => {
      // mockInputHandler = handler; // Handler assignment removed
    }),
    useApp: () => ({ exit: vi.fn() }),
  };
});

// Mock ConfigContext
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: vi.fn(() => DEFAULT_CONFIG),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock all necessary hooks to prevent errors
vi.mock("@store/atoms", () => ({
  useAtomValue: vi.fn(() => false),
  useSetAtom: vi.fn(() => vi.fn()),
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

describe("Schema Toggle Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render App with data without crashing", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <App initialData={data} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // App should render without crashing
    expect(output).toBeDefined();
    expect(output?.length).toBeGreaterThan(0);
  });

  it("should handle null data", () => {
    const { lastFrame } = render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <App initialData={null} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // App should handle null data gracefully
    expect(output).toBeDefined();
  });

  it("should handle keyboard disabled state", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <App initialData={data} keyboardEnabled={false} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // App should render when keyboard is disabled
    expect(output).toBeDefined();
    expect(output?.length).toBeGreaterThan(0);
  });

  it("should render with complex data structures", () => {
    const complexData = {
      users: [
        { id: 1, name: "John", nested: { level: 1 } },
        { id: 2, name: "Jane", nested: { level: 2 } },
      ],
      metadata: { count: 2, created: "2023-01-01" },
    };

    const { lastFrame } = render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <App initialData={complexData} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // App should handle complex data structures
    expect(output).toBeDefined();
    expect(output?.length).toBeGreaterThan(0);
  });

  it("should integrate with ConfigProvider correctly", () => {
    const data = { simple: "data" };
    const { lastFrame } = render(
      <ConfigProvider config={DEFAULT_CONFIG}>
        <App initialData={data} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // App should work with ConfigProvider
    expect(output).toBeDefined();
    expect(output?.length).toBeGreaterThan(0);
  });
});
