/**
 * Comprehensive tests for App component
 *
 * Tests the main application component including state management, view mode switching,
 * component integration, keyboard handling, and data display logic.
 */

import { ConfigProvider } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import { render } from "@testing-library/react";
import { Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

// Mock Ink components and hooks with comprehensive setup
const mockInk = vi.hoisted(() => ({
  useInput: vi.fn(),
  useApp: vi.fn(() => ({ exit: vi.fn() })),
}));

vi.mock("ink", () => ({
  Box: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Text: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
  useInput: mockInk.useInput,
  useApp: mockInk.useApp,
}));

// Mock all major component dependencies
vi.mock("@components/content/ContentRouter", () => ({
  ContentRouter: ({
    displayData,
    keyboardEnabled,
    currentMode,
    safeSetTreeViewKeyboardHandler,
    collapsibleViewerRef,
  }: any) => (
    <div data-testid="content-router">
      <span data-testid="content-display-data">
        {JSON.stringify(displayData)}
      </span>
      <span data-testid="content-keyboard-enabled">
        {keyboardEnabled.toString()}
      </span>
      <span data-testid="content-current-mode">{currentMode}</span>
      <span data-testid="content-handler-ref">
        {typeof safeSetTreeViewKeyboardHandler}
      </span>
      <span data-testid="content-collapsible-ref">
        {typeof collapsibleViewerRef}
      </span>
    </div>
  ),
}));

vi.mock("@components/keyboard/KeyboardManager", () => ({
  KeyboardManager: ({
    keyboardEnabled,
    initialData,
    displayData,
    currentMode,
    treeViewKeyboardHandler,
    collapsibleViewerRef,
    safeSetTreeViewKeyboardHandler,
  }: any) => (
    <div data-testid="keyboard-manager">
      <span data-testid="keyboard-keyboard-enabled">
        {keyboardEnabled.toString()}
      </span>
      <span data-testid="keyboard-initial-data">
        {JSON.stringify(initialData)}
      </span>
      <span data-testid="keyboard-display-data">
        {JSON.stringify(displayData)}
      </span>
      <span data-testid="keyboard-current-mode">{currentMode}</span>
      <span data-testid="keyboard-tree-handler">
        {treeViewKeyboardHandler ? "present" : "null"}
      </span>
      <span data-testid="keyboard-collapsible-ref">
        {typeof collapsibleViewerRef}
      </span>
      <span data-testid="keyboard-handler-setter">
        {typeof safeSetTreeViewKeyboardHandler}
      </span>
    </div>
  ),
}));

vi.mock("@components/modals/ModalManager", () => ({
  ModalManager: ({ children, currentMode, displayData, initialError }: any) => (
    <div data-testid="modal-manager">
      <span data-testid="modal-current-mode">{currentMode}</span>
      <span data-testid="modal-display-data">
        {JSON.stringify(displayData)}
      </span>
      <span data-testid="modal-initial-error">{initialError || "none"}</span>
      <div data-testid="modal-children">{children}</div>
    </div>
  ),
}));

vi.mock("@components/status/StatusBarManager", () => ({
  StatusBarManager: ({ keyboardEnabled }: any) => (
    <div data-testid="status-bar-manager">
      <span data-testid="status-keyboard-enabled">
        {keyboardEnabled.toString()}
      </span>
    </div>
  ),
}));

vi.mock("@features/property-details", () => ({
  PropertyDetailsDisplay: ({ details, config, width }: any) => (
    <div data-testid="property-details">
      <span data-testid="details">{JSON.stringify(details)}</span>
      <span data-testid="config">{JSON.stringify(config)}</span>
      <span data-testid="width">{width}</span>
    </div>
  ),
}));

vi.mock("@features/common", () => ({
  ConfirmationDialog: ({ terminalWidth }: any) => (
    <div data-testid="confirmation-dialog">
      <span data-testid="terminal-width">{terminalWidth}</span>
    </div>
  ),
  NotificationToast: () => <div data-testid="notification-toast">Toast</div>,
}));

// Mock store hooks
const mockAppState: any = {
  ui: {
    treeViewMode: false,
    collapsibleMode: false,
    schemaVisible: false,
  },
  jqState: {
    isActive: false,
    transformedData: null as any,
    showOriginal: false,
  },
  searchState: {
    isSearching: false,
    searchTerm: "",
  },
  toggleTreeView: vi.fn(),
  toggleCollapsible: vi.fn(),
  toggleSchema: vi.fn(),
  openSettings: vi.fn(),
  terminalCalculations: {
    terminalSize: { width: 80, height: 24 },
  },
};

const mockPropertyDetails: any = {
  details: { key: "test", value: "value" },
  config: { enabled: true },
};

vi.mock("@components/providers/AppStateProvider", () => ({
  AppStateProvider: ({ children }: any) => children,
  useAppState: vi.fn(() => mockAppState),
}));

vi.mock("@/store/hooks", () => ({
  usePropertyDetails: vi.fn(() => mockPropertyDetails),
}));

describe("App", () => {
  const defaultProps = {
    initialData: { key: "value" } as JsonValue,
    initialError: null,
    keyboardEnabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock state
    Object.assign(mockAppState, {
      ui: {
        treeViewMode: false,
        collapsibleMode: false,
        schemaVisible: false,
      },
      jqState: {
        isActive: false,
        transformedData: null,
        showOriginal: false,
      },
      searchState: {
        isSearching: false,
        searchTerm: "",
      },
      terminalCalculations: {
        terminalSize: { width: 80, height: 24 },
      },
    });

    Object.assign(mockPropertyDetails, {
      details: { key: "test", value: "value" },
      config: { enabled: true },
    });
  });

  describe("Component Structure", () => {
    it("should render App wrapper with AppStateProvider", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("modal-manager")).toBeInTheDocument();
      expect(getByTestId("status-bar-manager")).toBeInTheDocument();
      expect(getByTestId("content-router")).toBeInTheDocument();
      expect(getByTestId("keyboard-manager")).toBeInTheDocument();
    });

    it("should pass correct props to child components", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("status-keyboard-enabled")).toHaveTextContent("true");
      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(defaultProps.initialData),
      );
      expect(getByTestId("content-current-mode")).toHaveTextContent("raw");
    });

    it("should render with null initial data", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App initialData={null} keyboardEnabled={true} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent("null");
    });

    it("should render with initial error", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialError="Test error message" />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("modal-initial-error")).toHaveTextContent(
        "Test error message",
      );
    });
  });

  describe("Initial View Mode Handling", () => {
    it("should set tree view mode when initialViewMode is 'tree'", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialViewMode="tree" />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.toggleTreeView).toHaveBeenCalledTimes(1);
    });

    it("should set collapsible view mode when initialViewMode is 'collapsible'", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialViewMode="collapsible" />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.toggleCollapsible).toHaveBeenCalledTimes(1);
    });

    it("should set schema view mode when initialViewMode is 'schema'", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialViewMode="schema" />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.toggleSchema).toHaveBeenCalledTimes(1);
    });

    it("should open settings when initialViewMode is 'settings'", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialViewMode="settings" />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.openSettings).toHaveBeenCalledTimes(1);
    });

    it("should not call any mode functions when initialViewMode is 'raw'", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialViewMode="raw" />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.toggleTreeView).not.toHaveBeenCalled();
      expect(mockAppState.toggleCollapsible).not.toHaveBeenCalled();
      expect(mockAppState.toggleSchema).not.toHaveBeenCalled();
      expect(mockAppState.openSettings).not.toHaveBeenCalled();
    });

    it("should not call mode functions when no initialViewMode is provided", () => {
      render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(mockAppState.toggleTreeView).not.toHaveBeenCalled();
      expect(mockAppState.toggleCollapsible).not.toHaveBeenCalled();
      expect(mockAppState.toggleSchema).not.toHaveBeenCalled();
      expect(mockAppState.openSettings).not.toHaveBeenCalled();
    });
  });

  describe("Display Data Logic", () => {
    it("should use transformed data when jq is active and not showing original", () => {
      const transformedData = { transformed: true };
      (mockAppState.jqState as any) = {
        isActive: true,
        transformedData,
        showOriginal: false,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(transformedData),
      );
    });

    it("should use initial data when jq is active but showing original", () => {
      (mockAppState.jqState as any) = {
        isActive: true,
        transformedData: { transformed: true },
        showOriginal: true,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(defaultProps.initialData),
      );
    });

    it("should use initial data when jq is not active", () => {
      (mockAppState.jqState as any) = {
        isActive: false,
        transformedData: { transformed: true },
        showOriginal: false,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(defaultProps.initialData),
      );
    });

    it("should handle null transformed data", () => {
      (mockAppState.jqState as any) = {
        isActive: true,
        transformedData: null,
        showOriginal: false,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(defaultProps.initialData),
      );
    });
  });

  describe("Current Mode Determination", () => {
    it("should return 'search' mode when searching", () => {
      mockAppState.searchState = {
        isSearching: true,
        searchTerm: "test",
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("search");
    });

    it("should return 'search' mode when search term exists", () => {
      mockAppState.searchState = {
        isSearching: false,
        searchTerm: "test",
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("search");
    });

    it("should return 'tree' mode when tree view is active", () => {
      mockAppState.ui.treeViewMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("tree");
    });

    it("should return 'filter' mode when jq is active", () => {
      mockAppState.jqState.isActive = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("filter");
    });

    it("should return 'collapsible' mode when collapsible is active", () => {
      mockAppState.ui.collapsibleMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent(
        "collapsible",
      );
    });

    it("should return 'schema' mode when schema is visible", () => {
      mockAppState.ui.schemaVisible = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("schema");
    });

    it("should return 'raw' mode when no other modes are active", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("raw");
    });

    it("should prioritize search mode over other modes", () => {
      mockAppState.searchState.isSearching = true;
      mockAppState.ui.treeViewMode = true;
      mockAppState.jqState.isActive = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-current-mode")).toHaveTextContent("search");
    });
  });

  describe("Property Details Display", () => {
    it("should show property details in tree mode", () => {
      mockAppState.ui.treeViewMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("property-details")).toBeInTheDocument();
      expect(getByTestId("details")).toHaveTextContent(
        JSON.stringify(mockPropertyDetails.details),
      );
      expect(getByTestId("config")).toHaveTextContent(
        JSON.stringify(mockPropertyDetails.config),
      );
    });

    it("should show property details in collapsible mode", () => {
      mockAppState.ui.collapsibleMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("property-details")).toBeInTheDocument();
    });

    it("should not show property details in raw mode", () => {
      const { queryByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(queryByTestId("property-details")).not.toBeInTheDocument();
    });

    it("should not show property details in schema mode", () => {
      mockAppState.ui.schemaVisible = true;

      const { queryByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(queryByTestId("property-details")).not.toBeInTheDocument();
    });

    it("should pass terminal width to property details", () => {
      mockAppState.ui.treeViewMode = true;
      mockAppState.terminalCalculations.terminalSize.width = 120;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("width")).toHaveTextContent("120");
    });
  });

  describe("Keyboard Handler Management", () => {
    it("should provide safe tree view keyboard handler setter", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-handler-ref")).toHaveTextContent("function");
      expect(getByTestId("keyboard-handler-setter")).toHaveTextContent(
        "function",
      );
    });

    it("should pass tree view handler to keyboard manager", () => {
      mockAppState.ui.treeViewMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      // Initially should be null since no handler is set
      expect(getByTestId("keyboard-tree-handler")).toHaveTextContent("null");
    });

    it("should provide collapsible viewer ref", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-collapsible-ref")).toHaveTextContent(
        "object",
      );
    });
  });

  describe("Global Components", () => {
    it("should always render notification toast", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("notification-toast")).toBeInTheDocument();
    });

    it("should always render confirmation dialog with terminal width", () => {
      mockAppState.terminalCalculations.terminalSize.width = 100;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("confirmation-dialog")).toBeInTheDocument();
      expect(getByTestId("terminal-width")).toHaveTextContent("100");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle undefined initial data", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App keyboardEnabled={true} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent("null");
    });

    it("should handle empty initial data", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App initialData={{}} keyboardEnabled={true} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent("{}");
    });

    it("should handle complex nested data", () => {
      const complexData = {
        users: [
          {
            id: 1,
            name: "John",
            profile: { age: 30, skills: ["JS", "React"] },
          },
          {
            id: 2,
            name: "Jane",
            profile: { age: 25, skills: ["Python", "Django"] },
          },
        ],
        meta: { total: 2, page: 1 },
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App initialData={complexData} keyboardEnabled={true} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(complexData),
      );
    });

    it("should handle keyboard disabled state", () => {
      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} keyboardEnabled={false} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("status-keyboard-enabled")).toHaveTextContent("false");
    });

    it("should handle missing property details gracefully", () => {
      mockAppState.ui.treeViewMode = true;
      (mockPropertyDetails as any).details = null;
      (mockPropertyDetails as any).config = null;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("details")).toHaveTextContent("null");
      expect(getByTestId("config")).toHaveTextContent("null");
    });
  });

  describe("State Integration", () => {
    it("should handle all UI state combinations", () => {
      mockAppState.ui = {
        treeViewMode: true,
        collapsibleMode: true,
        schemaVisible: true,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      // Should prioritize tree mode
      expect(getByTestId("content-current-mode")).toHaveTextContent("tree");
    });

    it("should handle search state with tree view", () => {
      mockAppState.searchState = {
        isSearching: true,
        searchTerm: "test",
      };
      mockAppState.ui.treeViewMode = true;

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      // Search should take priority
      expect(getByTestId("content-current-mode")).toHaveTextContent("search");
    });

    it("should handle jq transformation state", () => {
      const originalData = { original: true };
      const transformedData = { transformed: true };

      (mockAppState.jqState as any) = {
        isActive: true,
        transformedData,
        showOriginal: false,
      };

      const { getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App initialData={originalData} keyboardEnabled={true} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(transformedData),
      );
      expect(getByTestId("content-current-mode")).toHaveTextContent("filter");
    });
  });

  describe("Component Lifecycle", () => {
    it("should handle re-renders without side effects", () => {
      const { rerender } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      vi.clearAllMocks();

      rerender(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} keyboardEnabled={false} />
          </Provider>
        </ConfigProvider>,
      );

      // Should not trigger initial mode setting again
      expect(mockAppState.toggleTreeView).not.toHaveBeenCalled();
    });

    it("should handle prop changes", () => {
      const { rerender, getByTestId } = render(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} />
          </Provider>
        </ConfigProvider>,
      );

      const newData = { changed: "data" };
      rerender(
        <ConfigProvider>
          <Provider>
            <App {...defaultProps} initialData={newData} />
          </Provider>
        </ConfigProvider>,
      );

      expect(getByTestId("content-display-data")).toHaveTextContent(
        JSON.stringify(newData),
      );
    });
  });
});
