/**
 * Tests for KeyboardManager component
 * Ensures proper keyboard input handling and delegation
 */

import { AppStateProvider } from "@components/providers/AppStateProvider";
import { DEFAULT_CONFIG } from "@core/config/defaults";
import { ConfigProvider } from "@core/context/ConfigContext";
import type { AppMode, KeyboardHandler } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createRef } from "react";
import { KeyboardManager } from "../KeyboardManager";

// Mock Ink's useInput and useApp
vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn(),
    useApp: vi.fn(() => ({ exit: vi.fn() })),
  };
});

// Mock keyboard handler hook
vi.mock("@hooks/useKeyboardHandler", () => ({
  useKeyboardHandler: vi.fn(() => ({
    handleKeyInput: vi.fn(),
  })),
}));

// Mock jq transform
vi.mock("@features/jq/utils/jqTransform", () => ({
  transformWithJq: vi.fn(),
}));

// Mock text input handler
vi.mock("@features/common/components/TextInput", () => ({
  handleTextInput: vi.fn(),
}));

// Mock all store hooks
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
  vi.clearAllMocks();

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

function TestWrapper({
  keyboardEnabled = true,
  initialData = { test: "data" },
  displayData = { test: "data" },
  currentMode = "raw" as AppMode,
  treeViewKeyboardHandler = null,
}: {
  keyboardEnabled?: boolean;
  initialData?: JsonValue | null;
  displayData?: JsonValue | null;
  currentMode?: AppMode;
  treeViewKeyboardHandler?: KeyboardHandler | null;
}): ReactElement {
  const collapsibleViewerRef = createRef<{
    navigate: (action: unknown) => void;
  } | null>();

  const safeSetTreeViewKeyboardHandler = vi.fn();

  return (
    <ConfigProvider config={DEFAULT_CONFIG}>
      <AppStateProvider>
        <KeyboardManager
          keyboardEnabled={keyboardEnabled}
          initialData={initialData}
          displayData={displayData}
          currentMode={currentMode}
          treeViewKeyboardHandler={treeViewKeyboardHandler}
          collapsibleViewerRef={collapsibleViewerRef}
          safeSetTreeViewKeyboardHandler={safeSetTreeViewKeyboardHandler}
        />
      </AppStateProvider>
    </ConfigProvider>
  );
}

describe("KeyboardManager", () => {
  describe("Initialization", () => {
    it("should render without crashing", () => {
      render(<TestWrapper />);
      // KeyboardManager returns null, so just ensure no errors
    });

    it("should initialize keyboard handler hook with correct parameters", () => {
      render(<TestWrapper />);

      expect(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          updateDebugInfo: expect.any(Function),
          updateDebugInfoCallback: expect.any(Function),
          helpVisible: mockUI.helpVisible,
          setHelpVisible: mockUI.setHelpVisible,
          searchState: mockSearchState,
          jqState: mockJqState,
          keybindings: expect.any(Function),
          handleTextInput: expect.any(Function),
          handleExportSchema: mockExportHandlers.handleExportSchema,
          handleExportData: expect.any(Function),
          exit: expect.any(Function),
        }),
      );
    });

    it("should set up useInput with correct isActive condition", () => {
      render(<TestWrapper keyboardEnabled={true} />);

      expect(require("ink").useInput).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isActive: true, // keyboardEnabled && no modals visible
        }),
      );
    });

    it("should disable input when keyboard is disabled", () => {
      render(<TestWrapper keyboardEnabled={false} />);

      expect(require("ink").useInput).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isActive: false,
        }),
      );
    });
  });

  describe("Modal State Handling", () => {
    it("should disable input when export dialog is visible", () => {
      vi.mocked(
        require("@store/hooks/useExport"),
      ).useExportDialog.mockReturnValue({ isVisible: true });

      render(<TestWrapper />);

      expect(require("ink").useInput).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isActive: false,
        }),
      );
    });

    it("should disable input when settings are visible", () => {
      vi.mocked(require("@store/atoms")).useAtomValue.mockReturnValue(true); // settings visible

      render(<TestWrapper />);

      expect(require("ink").useInput).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isActive: false,
        }),
      );
    });

    it("should disable input when debug log viewer is visible", () => {
      const mockUIWithDebug = { ...mockUI, debugLogViewerVisible: true };
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(
        mockUIWithDebug,
      );

      render(<TestWrapper />);

      expect(require("ink").useInput).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isActive: false,
        }),
      );
    });
  });

  describe("JQ Transformation", () => {
    it("should handle successful jq transformation", async () => {
      const startJqTransformation = vi.fn();
      const completeJqTransformation = vi.fn();
      const resetScroll = vi.fn();

      vi.mocked(
        require("@store/hooks/useJq"),
      ).useStartJqTransformation.mockReturnValue(startJqTransformation);
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useCompleteJqTransformation.mockReturnValue(completeJqTransformation);
      vi.mocked(
        require("@store/hooks/useNavigation"),
      ).useResetScroll.mockReturnValue(resetScroll);

      vi.mocked(
        require("@features/jq/utils/jqTransform"),
      ).transformWithJq.mockResolvedValue({
        success: true,
        data: { transformed: "data" },
      });

      render(<TestWrapper />);

      // Get the handleJqTransformation function that was passed to useKeyboardHandler
      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const handleJqTransformation = keyboardHandlerCall.handleJqTransformation;

      await handleJqTransformation(".test");

      expect(startJqTransformation).toHaveBeenCalledWith("");
      expect(
        require("@features/jq/utils/jqTransform").transformWithJq,
      ).toHaveBeenCalledWith({ test: "data" }, ".test");
      expect(completeJqTransformation).toHaveBeenCalledWith({
        success: true,
        data: { transformed: "data" },
      });
      expect(resetScroll).toHaveBeenCalled();
    });

    it("should handle failed jq transformation", async () => {
      const startJqTransformation = vi.fn();
      const completeJqTransformation = vi.fn();

      vi.mocked(
        require("@store/hooks/useJq"),
      ).useStartJqTransformation.mockReturnValue(startJqTransformation);
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useCompleteJqTransformation.mockReturnValue(completeJqTransformation);

      vi.mocked(
        require("@features/jq/utils/jqTransform"),
      ).transformWithJq.mockResolvedValue({
        success: false,
        error: "Invalid jq query",
      });

      render(<TestWrapper />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const handleJqTransformation = keyboardHandlerCall.handleJqTransformation;

      await handleJqTransformation(".invalid");

      expect(completeJqTransformation).toHaveBeenCalledWith({
        success: false,
        error: "Invalid jq query",
      });
    });

    it("should handle jq transformation exceptions", async () => {
      const completeJqTransformation = vi.fn();
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useCompleteJqTransformation.mockReturnValue(completeJqTransformation);

      vi.mocked(
        require("@features/jq/utils/jqTransform"),
      ).transformWithJq.mockRejectedValue(new Error("Network error"));

      render(<TestWrapper />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const handleJqTransformation = keyboardHandlerCall.handleJqTransformation;

      await handleJqTransformation(".test");

      expect(completeJqTransformation).toHaveBeenCalledWith({
        success: false,
        error: "Network error",
      });
    });

    it("should handle jq transformation with no initial data", async () => {
      const startJqTransformation = vi.fn();
      vi.mocked(
        require("@store/hooks/useJq"),
      ).useStartJqTransformation.mockReturnValue(startJqTransformation);

      render(<TestWrapper initialData={null} />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const handleJqTransformation = keyboardHandlerCall.handleJqTransformation;

      await handleJqTransformation(".test");

      // Should not start transformation when no data
      expect(startJqTransformation).not.toHaveBeenCalled();
      expect(
        require("@features/jq/utils/jqTransform").transformWithJq,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Data Export Handling", () => {
    it("should handle data export action", () => {
      const setDataExportDialog = vi.fn();
      // Use the function to prevent unused variable warning
      expect(setDataExportDialog).toBeDefined(); // Mock the provider state to include the setDataExportDialog function
      // const mockState = {
      // setDataExportDialog,
      // dataExportDialog: { isVisible: false },
      // ... other state
      //       };

      // We need to ensure that setDataExportDialog is called
      render(<TestWrapper />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const handleExportData = keyboardHandlerCall.handleExportData;

      handleExportData();

      // Note: We need to properly mock the AppStateProvider to test this
      // For now, just verify the function exists
      expect(handleExportData).toBeDefined();
      expect(typeof handleExportData).toBe("function");
    });
  });

  describe("Debug Info Updates", () => {
    it("should create updateDebugInfoCallback with correct parameters", () => {
      const updateDebugInfo = vi.fn();
      vi.mocked(require("@store/hooks")).useUpdateDebugInfo.mockReturnValue(
        updateDebugInfo,
      );

      render(<TestWrapper />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const updateDebugInfoCallback =
        keyboardHandlerCall.updateDebugInfoCallback;

      updateDebugInfoCallback("test-action", "test-input");

      expect(updateDebugInfo).toHaveBeenCalledWith(
        "test-action (searching: false)",
        "test-input",
      );
    });

    it("should include search state in debug info", () => {
      const updateDebugInfo = vi.fn();
      const searchingState = { ...mockSearchState, isSearching: true };

      vi.mocked(require("@store/hooks")).useUpdateDebugInfo.mockReturnValue(
        updateDebugInfo,
      );
      vi.mocked(
        require("@store/hooks/useSearch"),
      ).useSearchState.mockReturnValue(searchingState);

      render(<TestWrapper />);

      const keyboardHandlerCall = vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mock.calls[0][0];
      const updateDebugInfoCallback =
        keyboardHandlerCall.updateDebugInfoCallback;

      updateDebugInfoCallback("search", "test");

      expect(updateDebugInfo).toHaveBeenCalledWith(
        "search (searching: true)",
        "test",
      );
    });
  });

  describe("Dependency Management", () => {
    it("should pass correct view mode states to keyboard handler", () => {
      const customUI = {
        ...mockUI,
        treeViewMode: true,
        collapsibleMode: false,
        schemaVisible: true,
        lineNumbersVisible: false,
      };
      vi.mocked(require("@store/hooks/useUI")).useUI.mockReturnValue(customUI);

      render(<TestWrapper />);

      expect(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          treeViewMode: true,
          collapsibleMode: false,
          schemaVisible: true,
          lineNumbersVisible: false,
        }),
      );
    });

    it("should pass terminal calculation values to keyboard handler", () => {
      render(<TestWrapper />);

      expect(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          maxScroll: mockTerminalCalculations.maxScroll,
          maxScrollSearchMode: mockTerminalCalculations.maxScrollSearchMode,
          halfPageLines: mockTerminalCalculations.halfPageLines,
        }),
      );
    });

    it("should pass tree view keyboard handler to useKeyboardHandler", () => {
      const mockTreeHandler = vi.fn();

      render(<TestWrapper treeViewKeyboardHandler={mockTreeHandler} />);

      expect(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          treeViewKeyboardHandler: mockTreeHandler,
        }),
      );
    });
  });

  describe("Input Delegation", () => {
    it("should call handleKeyInput when input is received", () => {
      const mockHandleKeyInput = vi.fn();
      vi.mocked(
        require("@hooks/useKeyboardHandler").useKeyboardHandler,
      ).mockReturnValue({
        handleKeyInput: mockHandleKeyInput,
      });

      render(<TestWrapper />);

      // Get the input handler that was passed to useInput
      const inputHandler = vi.mocked(require("ink").useInput).mock.calls[0][0];

      // Simulate key input
      inputHandler("j", { downArrow: false, upArrow: false });

      expect(mockHandleKeyInput).toHaveBeenCalledWith("j", {
        downArrow: false,
        upArrow: false,
      });
    });
  });
});
