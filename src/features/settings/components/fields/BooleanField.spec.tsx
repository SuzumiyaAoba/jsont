/**
 * Comprehensive tests for BooleanField
 *
 * Tests boolean field component including keyboard input handling,
 * value toggling, editing states, and display modes.
 */

import type { KeyboardInput } from "@core/types/app";
import { render } from "@testing-library/react";
import { Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SettingsFieldDefinition } from "../../types/settings";
import { BooleanField } from "./BooleanField";

// Mock useInput hook - access from mocked module
const mockInk = vi.hoisted(() => ({
  useInput: vi.fn(),
}));

// Mock Ink components
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
    color,
    bold,
    ...props
  }: { children: React.ReactNode; color?: string; bold?: boolean } & Record<
    string,
    unknown
  >) => (
    <span data-testid="text" data-color={color} data-bold={bold} {...props}>
      {children}
    </span>
  ),
  useInput: mockInk.useInput,
}));

// Mock Jotai atoms and hooks
const mockUpdatePreviewValue = vi.fn();
const mockStopEditing = vi.fn();

vi.mock("jotai", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  atom: vi.fn(() => ({ toString: () => `atom-${Math.random()}` })),
  useSetAtom: vi.fn((atom) => {
    const atomName = atom.toString();
    if (atomName === "updatePreviewValueAtom") return mockUpdatePreviewValue;
    if (atomName === "stopEditingAtom") return mockStopEditing;
    return vi.fn();
  }),
}));

// Mock the specific atoms
vi.mock("@store/atoms/settings", () => ({
  updatePreviewValueAtom: { toString: () => "updatePreviewValueAtom" },
  stopEditingAtom: { toString: () => "stopEditingAtom" },
}));

describe("BooleanField", () => {
  const mockField: SettingsFieldDefinition = {
    key: "testBoolean",
    label: "Test Boolean",
    description: "A test boolean field",
    type: "boolean",
    defaultValue: false,
  };

  const defaultProps = {
    field: mockField,
    value: false,
    isEditing: false,
  };

  let mockHandleKeyInput: (input: string, key: KeyboardInput) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    // Capture the key input handler passed to useInput
    mockInk.useInput.mockImplementation(
      (
        handler: (input: string, key: KeyboardInput) => void,
        _options: { isActive: boolean },
      ) => {
        mockHandleKeyInput = handler;
      },
    );
  });

  describe("Component Rendering", () => {
    it("should render in view mode with false value", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const mainText = textElements.find((el) =>
        el.textContent?.includes("✗ false"),
      );

      expect(mainText).toBeInTheDocument();
      expect(mainText).toHaveAttribute("data-color", "red");
    });

    it("should render in view mode with true value", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} value={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const mainText = textElements.find((el) =>
        el.textContent?.includes("✓ true"),
      );

      expect(mainText).toBeInTheDocument();
      expect(mainText).toHaveAttribute("data-color", "green");
    });

    it("should render in editing mode with false value", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes("[○] false"),
      );
      const helpText = textElements.find((el) =>
        el.textContent?.includes("(Space to toggle)"),
      );

      expect(valueText).toBeInTheDocument();
      expect(valueText).toHaveAttribute("data-color", "red");
      expect(valueText).toHaveAttribute("data-bold", "true");
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveAttribute("data-color", "black");
    });

    it("should render in editing mode with true value", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} value={true} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes("[●] true"),
      );

      expect(valueText).toBeInTheDocument();
      expect(valueText).toHaveAttribute("data-color", "green");
      expect(valueText).toHaveAttribute("data-bold", "true");
    });
  });

  describe("Keyboard Input Handling", () => {
    describe("Space Key Toggle", () => {
      it("should toggle false to true with space key", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={false} isEditing={true} />
          </Provider>,
        );

        // The handler should be captured after rendering
        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput(" ", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: true,
        });
      });

      it("should toggle true to false with space key", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={true} isEditing={true} />
          </Provider>,
        );

        // The handler should be captured after rendering
        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput(" ", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: false,
        });
      });
    });

    describe("Letter Key Toggle", () => {
      it("should toggle with 't' key", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={false} isEditing={true} />
          </Provider>,
        );

        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("t", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: true,
        });
      });

      it("should toggle with 'f' key", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={true} isEditing={true} />
          </Provider>,
        );

        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("f", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: false,
        });
      });
    });

    describe("Arrow Key Toggle", () => {
      it("should toggle with left arrow", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={false} isEditing={true} />
          </Provider>,
        );

        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = { leftArrow: true };
        mockHandleKeyInput("", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: true,
        });
      });

      it("should toggle with right arrow", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={true} isEditing={true} />
          </Provider>,
        );

        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = { rightArrow: true };
        mockHandleKeyInput("", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testBoolean",
          value: false,
        });
      });
    });

    describe("Enter Key Handling", () => {
      it("should stop editing on Enter key", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        expect(mockHandleKeyInput).toBeDefined();

        const keyInput: KeyboardInput = { return: true };
        mockHandleKeyInput("", keyInput);

        expect(mockStopEditing).toHaveBeenCalled();
        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
      });
    });

    describe("Input Filtering", () => {
      it("should not handle input when not editing", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} isEditing={false} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput(" ", keyInput);

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
        expect(mockStopEditing).not.toHaveBeenCalled();
      });

      it("should ignore unrecognized keys", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("x", keyInput);

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
        expect(mockStopEditing).not.toHaveBeenCalled();
      });

      it("should ignore other arrow keys", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const upKey: KeyboardInput = { upArrow: true };
        const downKey: KeyboardInput = { downArrow: true };

        mockHandleKeyInput("", upKey);
        mockHandleKeyInput("", downKey);

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
      });

      it("should ignore modifier keys alone", () => {
        render(
          <Provider>
            <BooleanField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const ctrlKey: KeyboardInput = { ctrl: true };
        const shiftKey: KeyboardInput = { shift: true };

        mockHandleKeyInput("", ctrlKey);
        mockHandleKeyInput("", shiftKey);

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
      });
    });
  });

  describe("useInput Hook Integration", () => {
    it("should activate input handling only when editing", () => {
      render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenCalledWith(expect.any(Function), {
        isActive: true,
      });
    });

    it("should deactivate input handling when not editing", () => {
      render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={false} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenCalledWith(expect.any(Function), {
        isActive: false,
      });
    });

    it("should update input handling when editing state changes", () => {
      const { rerender } = render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={false} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenLastCalledWith(expect.any(Function), {
        isActive: false,
      });

      rerender(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenLastCalledWith(expect.any(Function), {
        isActive: true,
      });
    });
  });

  describe("Component Memoization", () => {
    it("should be wrapped in memo for performance", () => {
      // BooleanField should be memoized to prevent unnecessary re-renders
      expect(BooleanField.displayName).toBe(undefined); // memo doesn't set displayName by default
      expect(typeof BooleanField).toBe("object"); // memoized components are objects
    });

    it("should not re-render with same props", () => {
      const { rerender } = render(
        <Provider>
          <BooleanField {...defaultProps} />
        </Provider>,
      );

      vi.clearAllMocks();

      // Re-render with same props
      rerender(
        <Provider>
          <BooleanField {...defaultProps} />
        </Provider>,
      );

      // useInput should not be called again due to memoization
      expect(mockInk.useInput).toHaveBeenCalledTimes(0);
    });

    it("should re-render when props change", () => {
      const { rerender } = render(
        <Provider>
          <BooleanField {...defaultProps} />
        </Provider>,
      );

      vi.clearAllMocks();

      // Re-render with different value
      rerender(
        <Provider>
          <BooleanField {...defaultProps} value={true} />
        </Provider>,
      );

      // Should re-render and call useInput again
      expect(mockInk.useInput).toHaveBeenCalledTimes(1);
    });
  });

  describe("Field Definition Integration", () => {
    it("should use field key for updates", () => {
      const customField: SettingsFieldDefinition = {
        key: "customBoolean",
        label: "Custom Boolean",
        description: "A custom boolean field",
        type: "boolean",
        defaultValue: true,
      };

      render(
        <Provider>
          <BooleanField field={customField} value={false} isEditing={true} />
        </Provider>,
      );

      expect(mockHandleKeyInput).toBeDefined();

      const keyInput: KeyboardInput = {};
      mockHandleKeyInput(" ", keyInput);

      expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
        key: "customBoolean",
        value: true,
      });
    });

    it("should handle complex field keys", () => {
      const complexField: SettingsFieldDefinition = {
        key: "nested.deep.boolean",
        label: "Nested Boolean",
        description: "A nested boolean field",
        type: "boolean",
        defaultValue: false,
      };

      render(
        <Provider>
          <BooleanField field={complexField} value={true} isEditing={true} />
        </Provider>,
      );

      expect(mockHandleKeyInput).toBeDefined();

      const keyInput: KeyboardInput = {};
      mockHandleKeyInput("f", keyInput);

      expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
        key: "nested.deep.boolean",
        value: false,
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle undefined value gracefully", () => {
      expect(() => {
        render(
          <Provider>
            <BooleanField {...defaultProps} value={undefined as any} />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle incomplete field gracefully", () => {
      const incompleteField = { key: "test" } as SettingsFieldDefinition;
      expect(() => {
        render(
          <Provider>
            <BooleanField
              field={incompleteField}
              value={false}
              isEditing={false}
            />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle empty key input", () => {
      render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(() => {
        mockHandleKeyInput("", {} as KeyboardInput);
        mockHandleKeyInput("", { meta: true } as KeyboardInput);
      }).not.toThrow();
    });

    it("should handle concurrent toggle operations", () => {
      render(
        <Provider>
          <BooleanField {...defaultProps} value={false} isEditing={true} />
        </Provider>,
      );

      expect(mockHandleKeyInput).toBeDefined();

      // Multiple rapid toggles
      const keyInput: KeyboardInput = {};
      mockHandleKeyInput(" ", keyInput);
      mockHandleKeyInput("t", keyInput);
      mockHandleKeyInput("f", keyInput);

      expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility and User Experience", () => {
    it("should provide clear visual feedback for false values", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} value={false} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes("[○] false"),
      );

      expect(valueText).toHaveAttribute("data-color", "red");
      expect(valueText).toHaveAttribute("data-bold", "true");
    });

    it("should provide clear visual feedback for true values", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} value={true} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes("[●] true"),
      );

      expect(valueText).toHaveAttribute("data-color", "green");
      expect(valueText).toHaveAttribute("data-bold", "true");
    });

    it("should provide help text during editing", () => {
      const { getAllByTestId } = render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const helpText = textElements.find((el) =>
        el.textContent?.includes("(Space to toggle)"),
      );

      expect(helpText).toBeInTheDocument();
    });

    it("should not show help text when not editing", () => {
      const { queryByText } = render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={false} />
        </Provider>,
      );

      expect(queryByText("(Space to toggle)")).not.toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle rapid key presses efficiently", () => {
      render(
        <Provider>
          <BooleanField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(mockHandleKeyInput).toBeDefined();

      // Simulate rapid key presses
      for (let i = 0; i < 50; i++) {
        mockHandleKeyInput(" ", {});
      }

      expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(50);
    });
  });
});
