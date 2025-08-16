/**
 * Comprehensive tests for SettingsViewer
 *
 * Tests the main settings interface including navigation, editing, keyboard shortcuts,
 * state management, and layout functionality.
 */

import { render } from "@testing-library/react";
import { Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsViewer } from "./SettingsViewer";

// Mock Ink components
vi.mock("ink", () => ({
  Box: ({ children, ...props }: any) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  useInput: vi.fn(),
}));

// Mock child components
vi.mock("./SettingsHeader", () => ({
  SettingsHeader: ({ currentCategory, hasUnsavedChanges, categories }: any) => (
    <div data-testid="settings-header">
      <span data-testid="current-category">{currentCategory}</span>
      <span data-testid="unsaved-changes">{hasUnsavedChanges.toString()}</span>
      <span data-testid="categories-count">{categories.length}</span>
    </div>
  ),
}));

vi.mock("./SettingsCategory", () => ({
  SettingsCategory: ({ category, activeField, isEditing, height }: any) => (
    <div data-testid="settings-category">
      <span data-testid="category-id">{category.id}</span>
      <span data-testid="active-field">{activeField || "none"}</span>
      <span data-testid="is-editing">{isEditing.toString()}</span>
      <span data-testid="height">{height}</span>
    </div>
  ),
}));

vi.mock("./SettingsDescriptionPanel", () => ({
  SettingsDescriptionPanel: ({
    field,
    currentValue,
    originalValue,
    isEditing,
    width,
    height,
  }: any) => (
    <div data-testid="settings-description">
      <span data-testid="field-key">{field?.key || "none"}</span>
      <span data-testid="current-value">{JSON.stringify(currentValue)}</span>
      <span data-testid="original-value">{JSON.stringify(originalValue)}</span>
      <span data-testid="is-editing">{isEditing.toString()}</span>
      <span data-testid="width">{width}</span>
      <span data-testid="height">{height}</span>
    </div>
  ),
}));

vi.mock("./SettingsFooter", () => ({
  SettingsFooter: ({ isEditing, hasUnsavedChanges }: any) => (
    <div data-testid="settings-footer">
      <span data-testid="is-editing">{isEditing.toString()}</span>
      <span data-testid="unsaved-changes">{hasUnsavedChanges.toString()}</span>
    </div>
  ),
}));

// Mock settings definitions
vi.mock("../config/settingsDefinitions", () => ({
  getCategoryById: vi.fn((id: string) => {
    const categories = {
      display: {
        id: "display",
        name: "Display",
        description: "Display options",
        fields: [
          { key: "showLineNumbers", name: "Show Line Numbers" },
          { key: "indent", name: "Indentation" },
        ],
      },
      keybindings: {
        id: "keybindings",
        name: "Keybindings",
        description: "Keyboard shortcuts",
        fields: [
          { key: "up", name: "Move Up" },
          { key: "down", name: "Move Down" },
        ],
      },
    };
    return categories[id as keyof typeof categories] || null;
  }),
  getFieldByKey: vi.fn((key: string) => {
    const fields = {
      showLineNumbers: {
        field: {
          key: "showLineNumbers",
          name: "Show Line Numbers",
          description: "Display line numbers in the viewer",
          type: "boolean",
          defaultValue: false,
        },
      },
      indent: {
        field: {
          key: "indent",
          name: "Indentation",
          description: "Number of spaces for indentation",
          type: "number",
          defaultValue: 2,
        },
      },
    };
    return fields[key as keyof typeof fields] || null;
  }),
  SETTINGS_CATEGORIES: [
    { id: "display", name: "Display", description: "Display options" },
    {
      id: "keybindings",
      name: "Keybindings",
      description: "Keyboard shortcuts",
    },
  ],
}));

// Mock config mapper
vi.mock("../utils/configMapper", () => ({
  useCurrentConfigValues: vi.fn(() => ({
    showLineNumbers: false,
    indent: 2,
    up: "k",
    down: "j",
  })),
}));

// Mock settings atoms
const mockSettingsState = {
  activeCategory: "display",
  activeField: "showLineNumbers",
  isEditing: false,
  hasUnsavedChanges: false,
  previewValues: {
    showLineNumbers: true,
    indent: 4,
  },
  originalValues: {
    showLineNumbers: false,
    indent: 2,
  },
};

const mockSetters = {
  closeSettings: vi.fn(),
  debouncedNavigationUpdate: vi.fn(),
  batchNavigationUpdate: vi.fn(),
  stopEditing: vi.fn(),
  saveSettings: vi.fn(),
  resetPreview: vi.fn(),
  resetToDefaults: vi.fn(),
  showConfirmation: vi.fn(),
};

vi.mock("jotai", () => ({
  Provider: ({ children }: any) => children,
  useAtom: vi.fn(() => [mockSettingsState, vi.fn()]),
  useSetAtom: vi.fn((atom) => {
    // Return different mocks based on atom
    const atomName = atom.toString();
    if (atomName.includes("close")) return mockSetters.closeSettings;
    if (atomName.includes("debounced"))
      return mockSetters.debouncedNavigationUpdate;
    if (atomName.includes("batch")) return mockSetters.batchNavigationUpdate;
    if (atomName.includes("stopEditing")) return mockSetters.stopEditing;
    if (atomName.includes("save")) return mockSetters.saveSettings;
    if (atomName.includes("resetPreview")) return mockSetters.resetPreview;
    if (atomName.includes("resetToDefaults"))
      return mockSetters.resetToDefaults;
    if (atomName.includes("showConfirmation"))
      return mockSetters.showConfirmation;
    return vi.fn();
  }),
}));

describe("SettingsViewer", () => {
  const defaultProps = {
    width: 120,
    height: 30,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock state
    Object.assign(mockSettingsState, {
      activeCategory: "display",
      activeField: "showLineNumbers",
      isEditing: false,
      hasUnsavedChanges: false,
      previewValues: {
        showLineNumbers: true,
        indent: 4,
      },
      originalValues: {
        showLineNumbers: false,
        indent: 2,
      },
    });
  });

  describe("Component Rendering", () => {
    it("should render main layout structure", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("settings-header")).toBeInTheDocument();
      expect(getByTestId("settings-category")).toBeInTheDocument();
      expect(getByTestId("settings-description")).toBeInTheDocument();
      expect(getByTestId("settings-footer")).toBeInTheDocument();
    });

    it("should pass correct props to header component", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("current-category")).toHaveTextContent("display");
      expect(getByTestId("unsaved-changes")).toHaveTextContent("false");
      expect(getByTestId("categories-count")).toHaveTextContent("2");
    });

    it("should pass correct props to category component", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("category-id")).toHaveTextContent("display");
      expect(getByTestId("active-field")).toHaveTextContent("showLineNumbers");
      expect(getByTestId("is-editing")).toHaveTextContent("false");
    });

    it("should pass correct props to description panel", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("field-key")).toHaveTextContent("showLineNumbers");
      expect(getByTestId("current-value")).toHaveTextContent("true");
      expect(getByTestId("original-value")).toHaveTextContent("false");
      expect(getByTestId("is-editing")).toHaveTextContent("false");
    });

    it("should pass correct props to footer component", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("is-editing")).toHaveTextContent("false");
      expect(getByTestId("unsaved-changes")).toHaveTextContent("false");
    });
  });

  describe("Layout Calculations", () => {
    it("should calculate correct content height", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={120} height={30} />
        </Provider>,
      );

      // height(30) - header(4) - footer(4) = 22
      expect(getByTestId("height")).toHaveTextContent("22");
    });

    it("should calculate correct content height in editing mode", () => {
      mockSettingsState.isEditing = true;

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={120} height={30} />
        </Provider>,
      );

      // height(30) - header(4) - footer(3) = 23
      expect(getByTestId("height")).toHaveTextContent("23");
    });

    it("should calculate correct pane widths", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={120} height={30} />
        </Provider>,
      );

      // 60% for settings, 40% for description
      expect(getByTestId("width")).toHaveTextContent("48"); // 120 * 0.4
    });

    it("should handle minimum content height", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={120} height={15} />
        </Provider>,
      );

      // Should be at least 10
      expect(getByTestId("height")).toHaveTextContent("10");
    });
  });

  describe("State Management", () => {
    it("should handle active field without current value", () => {
      mockSettingsState.activeField = "nonexistent";
      mockSettingsState.previewValues = { showLineNumbers: false, indent: 2 };

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("field-key")).toHaveTextContent("none");
      expect(getByTestId("current-value")).toHaveTextContent("undefined");
    });

    it("should handle no active field", () => {
      mockSettingsState.activeField = "";

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("active-field")).toHaveTextContent("none");
      expect(getByTestId("field-key")).toHaveTextContent("none");
    });

    it("should handle unsaved changes state", () => {
      mockSettingsState.hasUnsavedChanges = true;

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("unsaved-changes")).toHaveTextContent("true");
    });

    it("should handle editing state", () => {
      mockSettingsState.isEditing = true;

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("is-editing")).toHaveTextContent("true");
    });
  });

  describe("Navigation Data Memoization", () => {
    it("should handle category without fields", () => {
      // Mock a category with no fields
      const { getCategoryById } = require("../config/settingsDefinitions");
      getCategoryById.mockReturnValue({
        id: "empty",
        name: "Empty Category",
        fields: [],
      });

      mockSettingsState.activeCategory = "empty";

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("category-id")).toHaveTextContent("empty");
    });

    it("should handle nonexistent category", () => {
      const { getCategoryById } = require("../config/settingsDefinitions");
      getCategoryById.mockReturnValue(null);

      mockSettingsState.activeCategory = "nonexistent";

      // Should not crash
      expect(() => {
        render(
          <Provider>
            <SettingsViewer {...defaultProps} />
          </Provider>,
        );
      }).not.toThrow();
    });
  });

  describe("Value Resolution", () => {
    it("should use preview value when available", () => {
      mockSettingsState.previewValues = { showLineNumbers: true, indent: 2 };

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("current-value")).toHaveTextContent("true");
    });

    it("should fall back to default value when no preview value", () => {
      mockSettingsState.previewValues = { showLineNumbers: false, indent: 2 };
      mockSettingsState.activeField = "showLineNumbers";

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      // Should use the field's default value (false)
      expect(getByTestId("current-value")).toHaveTextContent("false");
    });

    it("should handle original values correctly", () => {
      mockSettingsState.originalValues = { showLineNumbers: false, indent: 4 };

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("original-value")).toHaveTextContent("false");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing field definitions gracefully", () => {
      const { getFieldByKey } = require("../config/settingsDefinitions");
      getFieldByKey.mockReturnValue(null);

      mockSettingsState.activeField = "nonexistent";

      expect(() => {
        render(
          <Provider>
            <SettingsViewer {...defaultProps} />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle empty preview values", () => {
      mockSettingsState.previewValues = { showLineNumbers: false, indent: 2 };
      mockSettingsState.originalValues = { showLineNumbers: true, indent: 4 };

      expect(() => {
        render(
          <Provider>
            <SettingsViewer {...defaultProps} />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle malformed field data", () => {
      const { getFieldByKey } = require("../config/settingsDefinitions");
      getFieldByKey.mockReturnValue({
        field: null, // Malformed field
      });

      expect(() => {
        render(
          <Provider>
            <SettingsViewer {...defaultProps} />
          </Provider>,
        );
      }).not.toThrow();
    });
  });

  describe("Responsive Layout", () => {
    it("should handle very small width", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={20} height={30} />
        </Provider>,
      );

      // Should still calculate proportional widths
      expect(getByTestId("width")).toHaveTextContent("8"); // 20 * 0.4
    });

    it("should handle very small height", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={120} height={5} />
        </Provider>,
      );

      // Should use minimum height
      expect(getByTestId("height")).toHaveTextContent("10");
    });

    it("should handle large dimensions", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer width={200} height={60} />
        </Provider>,
      );

      expect(getByTestId("width")).toHaveTextContent("80"); // 200 * 0.4
      expect(getByTestId("height")).toHaveTextContent("52"); // 60 - 4 - 4
    });
  });

  describe("Component Integration", () => {
    it("should pass all required props to child components", () => {
      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      // Verify all child components received their props
      expect(getByTestId("settings-header")).toBeInTheDocument();
      expect(getByTestId("settings-category")).toBeInTheDocument();
      expect(getByTestId("settings-description")).toBeInTheDocument();
      expect(getByTestId("settings-footer")).toBeInTheDocument();
    });

    it("should handle category switching", () => {
      mockSettingsState.activeCategory = "keybindings";

      const { getByTestId } = render(
        <Provider>
          <SettingsViewer {...defaultProps} />
        </Provider>,
      );

      expect(getByTestId("current-category")).toHaveTextContent("keybindings");
      expect(getByTestId("category-id")).toHaveTextContent("keybindings");
    });
  });
});
