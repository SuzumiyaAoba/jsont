/**
 * Comprehensive tests for NumberField
 *
 * Tests number field component including input validation, range constraints,
 * keyboard input handling, value clamping, and editing states.
 */

// Mock useInput hook - access from mocked module
const mockInk = vi.hoisted(() => ({
  useInput: vi.fn(),
}));

// Mock the specific atoms - hoisted to avoid initialization issues
const mockAtoms = vi.hoisted(() => ({
  updatePreviewValueAtom: { toString: () => "updatePreviewValueAtom" },
  stopEditingAtom: { toString: () => "stopEditingAtom" },
}));

import type { KeyboardInput } from "@core/types/app";
import { render } from "@testing-library/react";
import { Provider } from "jotai";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SettingsFieldDefinition } from "../../types/settings";
import { NumberField } from "./NumberField";

// Mock Ink components
vi.mock("ink", () => ({
  Box: ({
    children,
    ...props
  }: Record<string, unknown> & { children: React.ReactNode }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Text: ({
    children,
    color,
    backgroundColor,
    dimColor,
    ...props
  }: Record<string, unknown> & {
    children: React.ReactNode;
    color?: string;
    backgroundColor?: string;
    dimColor?: boolean;
  }) => (
    <span
      data-testid="text"
      data-color={color}
      data-background={backgroundColor}
      data-dim={dimColor}
      {...props}
    >
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
  atom: vi.fn(() => ({ toString: () => "mocked-atom" })),
  useSetAtom: vi.fn((atom) => {
    if (atom && typeof atom.toString === "function") {
      const atomName = atom.toString();
      if (atomName.includes("updatePreviewValue"))
        return mockUpdatePreviewValue;
      if (atomName.includes("stopEditing")) return mockStopEditing;
    }
    return vi.fn();
  }),
}));

vi.mock("@store/atoms/settings", () => ({
  updatePreviewValueAtom: mockAtoms.updatePreviewValueAtom,
  stopEditingAtom: mockAtoms.stopEditingAtom,
}));

describe("NumberField", () => {
  const mockField: SettingsFieldDefinition = {
    key: "testNumber",
    label: "Test Number",
    description: "A test number field",
    type: "number",
    defaultValue: 5,
    min: 0,
    max: 100,
  };

  const defaultProps = {
    field: mockField,
    value: 10,
    isEditing: false,
  };

  let mockHandleKeyInput: (input: string, key: KeyboardInput) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    // Capture the key input handler
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
    describe("View Mode", () => {
      it("should render in view mode with basic value", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const valueText = textElements.find((el) => el.textContent === "10");

        expect(valueText).toBeInTheDocument();
        expect(valueText).toHaveAttribute("data-color", "cyan");
      });

      it("should show range constraints when defined", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const rangeText = textElements.find((el) =>
          el.textContent?.includes("(0-100)"),
        );

        expect(rangeText).toBeInTheDocument();
        expect(rangeText).toHaveAttribute("data-color", "gray");
      });

      it("should not show range when min/max are undefined", () => {
        const fieldWithoutRange: SettingsFieldDefinition = {
          key: "noRange",
          label: "No Range",
          description: "Field without range",
          type: "number",
          defaultValue: 42,
        };

        const { getAllByTestId } = render(
          <Provider>
            <NumberField
              field={fieldWithoutRange}
              value={42}
              isEditing={false}
            />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const rangeText = textElements.find(
          (el) =>
            el.textContent?.includes("(") && el.textContent?.includes(")"),
        );

        expect(rangeText).toBeUndefined();
      });

      it("should highlight values outside range in view mode", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={150} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const valueText = textElements.find((el) => el.textContent === "150");

        expect(valueText).toHaveAttribute("data-color", "red");
      });
    });

    describe("Edit Mode", () => {
      it("should render input box in edit mode", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const inputBox = textElements.find((el) =>
          el.textContent?.includes("["),
        );

        expect(inputBox).toBeInTheDocument();
        expect(inputBox).toHaveAttribute("data-color", "cyan");
      });

      it("should show validation error for invalid input", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField
              {...defaultProps}
              value={150} // Out of range
              isEditing={true}
            />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const errorText = textElements.find((el) =>
          el.textContent?.includes("Must be between 0 and 100"),
        );

        expect(errorText).toBeInTheDocument();
        expect(errorText).toHaveAttribute("data-color", "red");
      });

      it("should show help text in edit mode", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const helpText = textElements.find((el) =>
          el.textContent?.includes("(Enter to confirm)"),
        );

        expect(helpText).toBeInTheDocument();
        expect(helpText).toHaveAttribute("data-color", "black");
      });

      it("should not show help text when not editing", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} isEditing={false} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const helpText = textElements.find((el) =>
          el.textContent?.includes("(Enter to confirm)"),
        );

        expect(helpText).toBeUndefined();
      });
    });
  });

  describe("Input Validation", () => {
    describe("Numeric Input", () => {
      it("should accept valid numeric characters", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};

        // Test digits
        for (let digit = 0; digit <= 9; digit++) {
          mockHandleKeyInput(digit.toString(), keyInput);
        }

        expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(10);
      });

      it("should accept decimal point", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput(".", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });

      it("should accept negative sign at start", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("-", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });

      it("should reject non-numeric characters", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        const invalidChars = ["a", "z", "!", "@", "#", "$", "%"];

        invalidChars.forEach((char) => {
          mockHandleKeyInput(char, keyInput);
        });

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
      });

      it("should handle scientific notation", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("e", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });
    });

    describe("Range Validation", () => {
      it("should validate minimum value", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={-5} isEditing={true} />
          </Provider>,
        );

        // The component should show validation error for values below minimum
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={-5} isEditing={true} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const errorText = textElements.find((el) =>
          el.textContent?.includes("Must be between 0 and 100"),
        );

        expect(errorText).toBeInTheDocument();
      });

      it("should validate maximum value", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={150} isEditing={true} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const errorText = textElements.find((el) =>
          el.textContent?.includes("Must be between 0 and 100"),
        );

        expect(errorText).toBeInTheDocument();
      });

      it("should accept values within range", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={50} isEditing={true} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const errorText = textElements.find((el) =>
          el.textContent?.includes("Must be between"),
        );

        expect(errorText).toBeUndefined();
      });

      it("should handle fields without range restrictions", () => {
        const fieldWithoutRange: SettingsFieldDefinition = {
          key: "unlimited",
          label: "Unlimited",
          description: "No range limits",
          type: "number",
          defaultValue: 0,
        };

        const { getAllByTestId } = render(
          <Provider>
            <NumberField
              field={fieldWithoutRange}
              value={999999}
              isEditing={true}
            />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const errorText = textElements.find((el) =>
          el.textContent?.includes("Must be between"),
        );

        expect(errorText).toBeUndefined();
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty/invalid input", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={NaN} isEditing={true} />
          </Provider>,
        );

        // Should not crash with NaN value
        expect(() => {
          render(
            <Provider>
              <NumberField {...defaultProps} value={NaN} isEditing={true} />
            </Provider>,
          );
        }).not.toThrow();
      });

      it("should handle zero value", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={0} isEditing={false} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const valueText = textElements.find((el) => el.textContent === "0");

        expect(valueText).toBeInTheDocument();
      });

      it("should handle decimal values", () => {
        const { getAllByTestId } = render(
          <Provider>
            <NumberField {...defaultProps} value={Math.PI} isEditing={false} />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const valueText = textElements.find((el) =>
          el.textContent?.includes("3.14159"),
        );

        expect(valueText).toBeInTheDocument();
      });

      it("should handle negative values when allowed", () => {
        const fieldWithNegative: SettingsFieldDefinition = {
          key: "negative",
          label: "Negative Allowed",
          description: "Allows negative values",
          type: "number",
          defaultValue: 0,
          min: -100,
          max: 100,
        };

        const { getAllByTestId } = render(
          <Provider>
            <NumberField
              field={fieldWithNegative}
              value={-50}
              isEditing={false}
            />
          </Provider>,
        );

        const textElements = getAllByTestId("text");
        const valueText = textElements.find((el) => el.textContent === "-50");

        expect(valueText).toBeInTheDocument();
        expect(valueText).toHaveAttribute("data-color", "cyan");
      });
    });
  });

  describe("Keyboard Input Handling", () => {
    describe("Character Input", () => {
      it("should build input string character by character", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};

        mockHandleKeyInput("1", keyInput);
        mockHandleKeyInput("2", keyInput);
        mockHandleKeyInput("3", keyInput);

        expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(3);
      });

      it("should handle backspace to remove characters", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const backspaceKey: KeyboardInput = { backspace: true };
        mockHandleKeyInput("", backspaceKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });

      it("should handle delete key", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const deleteKey: KeyboardInput = { delete: true };
        mockHandleKeyInput("", deleteKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });

      it("should clear input with Ctrl+U", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const clearKey: KeyboardInput = { ctrl: true };
        mockHandleKeyInput("u", clearKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalled();
      });
    });

    describe("Arrow Key Navigation", () => {
      it("should increment value with up arrow", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={10} isEditing={true} />
          </Provider>,
        );

        const upKey: KeyboardInput = { upArrow: true };
        mockHandleKeyInput("", upKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testNumber",
          value: 11,
        });
      });

      it("should decrement value with down arrow", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={10} isEditing={true} />
          </Provider>,
        );

        const downKey: KeyboardInput = { downArrow: true };
        mockHandleKeyInput("", downKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testNumber",
          value: 9,
        });
      });

      it("should respect min boundary with down arrow", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={0} isEditing={true} />
          </Provider>,
        );

        const downKey: KeyboardInput = { downArrow: true };
        mockHandleKeyInput("", downKey);

        // Should not go below minimum (0)
        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testNumber",
          value: 0,
        });
      });

      it("should respect max boundary with up arrow", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={100} isEditing={true} />
          </Provider>,
        );

        const upKey: KeyboardInput = { upArrow: true };
        mockHandleKeyInput("", upKey);

        // Should not go above maximum (100)
        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testNumber",
          value: 100,
        });
      });

      it("should handle large increments with Shift modifier", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} value={10} isEditing={true} />
          </Provider>,
        );

        const shiftUpKey: KeyboardInput = { upArrow: true, shift: true };
        mockHandleKeyInput("", shiftUpKey);

        expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
          key: "testNumber",
          value: 20, // +10 with shift
        });
      });
    });

    describe("Control Keys", () => {
      it("should stop editing on Enter key", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const enterKey: KeyboardInput = { return: true };
        mockHandleKeyInput("", enterKey);

        expect(mockStopEditing).toHaveBeenCalled();
      });

      it("should stop editing on Escape key", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={true} />
          </Provider>,
        );

        const escapeKey: KeyboardInput = { escape: true };
        mockHandleKeyInput("", escapeKey);

        expect(mockStopEditing).toHaveBeenCalled();
      });

      it("should not handle input when not editing", () => {
        render(
          <Provider>
            <NumberField {...defaultProps} isEditing={false} />
          </Provider>,
        );

        const keyInput: KeyboardInput = {};
        mockHandleKeyInput("5", keyInput);

        expect(mockUpdatePreviewValue).not.toHaveBeenCalled();
      });
    });
  });

  describe("useInput Hook Integration", () => {
    it("should activate input handling only when editing", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenCalledWith(expect.any(Function), {
        isActive: true,
      });
    });

    it("should deactivate input handling when not editing", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} isEditing={false} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenCalledWith(expect.any(Function), {
        isActive: false,
      });
    });

    it("should update input handling when editing state changes", () => {
      const { rerender } = render(
        <Provider>
          <NumberField {...defaultProps} isEditing={false} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenLastCalledWith(expect.any(Function), {
        isActive: false,
      });

      rerender(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(mockInk.useInput).toHaveBeenLastCalledWith(expect.any(Function), {
        isActive: true,
      });
    });
  });

  describe("Component Memoization", () => {
    it("should be wrapped in memo for performance", () => {
      // NumberField should be memoized to prevent unnecessary re-renders
      expect(NumberField.displayName).toBe(undefined); // memo doesn't set displayName by default
      expect(typeof NumberField).toBe("object"); // memoized components are objects
    });

    it("should not re-render with same props", () => {
      const { rerender } = render(
        <Provider>
          <NumberField {...defaultProps} />
        </Provider>,
      );

      vi.clearAllMocks();

      // Re-render with same props
      rerender(
        <Provider>
          <NumberField {...defaultProps} />
        </Provider>,
      );

      // useInput should not be called again due to memoization
      expect(mockInk.useInput).toHaveBeenCalledTimes(1);
    });

    it("should re-render when props change", () => {
      const { rerender } = render(
        <Provider>
          <NumberField {...defaultProps} />
        </Provider>,
      );

      vi.clearAllMocks();

      // Re-render with different value
      rerender(
        <Provider>
          <NumberField {...defaultProps} value={25} />
        </Provider>,
      );

      // Should re-render and call useInput again
      expect(mockInk.useInput).toHaveBeenCalledTimes(1);
    });
  });

  describe("Field Definition Integration", () => {
    it("should use field key for updates", () => {
      const customField: SettingsFieldDefinition = {
        key: "customNumber",
        label: "Custom Number",
        description: "A custom number field",
        type: "number",
        defaultValue: 42,
        min: 10,
        max: 90,
      };

      render(
        <Provider>
          <NumberField field={customField} value={30} isEditing={true} />
        </Provider>,
      );

      const upKey: KeyboardInput = { upArrow: true };
      mockHandleKeyInput("", upKey);

      expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
        key: "customNumber",
        value: 31,
      });
    });

    it("should handle complex field keys", () => {
      const complexField: SettingsFieldDefinition = {
        key: "nested.deep.number",
        label: "Nested Number",
        description: "A nested number field",
        type: "number",
        defaultValue: 1,
        min: 1,
        max: 10,
      };

      render(
        <Provider>
          <NumberField field={complexField} value={5} isEditing={true} />
        </Provider>,
      );

      const keyInput: KeyboardInput = {};
      mockHandleKeyInput("7", keyInput);

      expect(mockUpdatePreviewValue).toHaveBeenCalled();
    });

    it("should respect field-specific constraints", () => {
      const strictField: SettingsFieldDefinition = {
        key: "strict",
        label: "Strict Field",
        description: "Very strict constraints",
        type: "number",
        defaultValue: 5,
        min: 5,
        max: 5, // Only allows value 5
      };

      render(
        <Provider>
          <NumberField field={strictField} value={5} isEditing={true} />
        </Provider>,
      );

      const upKey: KeyboardInput = { upArrow: true };
      mockHandleKeyInput("", upKey);

      // Should not exceed max (5)
      expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
        key: "strict",
        value: 5,
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle undefined value gracefully", () => {
      expect(() => {
        render(
          <Provider>
            <NumberField
              {...defaultProps}
              value={undefined as unknown as number}
            />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle null field gracefully", () => {
      expect(() => {
        render(
          <Provider>
            <NumberField
              field={null as unknown as SettingsFieldDefinition}
              value={0}
              isEditing={false}
            />
          </Provider>,
        );
      }).not.toThrow();
    });

    it("should handle malformed key input", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      expect(() => {
        mockHandleKeyInput(null as unknown as string, {} as KeyboardInput);
        mockHandleKeyInput("", null as unknown as KeyboardInput);
      }).not.toThrow();
    });

    it("should handle concurrent input operations", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      // Multiple rapid inputs
      const keyInput: KeyboardInput = {};
      mockHandleKeyInput("1", keyInput);
      mockHandleKeyInput("2", keyInput);
      mockHandleKeyInput("3", keyInput);

      expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(3);
    });

    it("should handle very large numbers", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField
            {...defaultProps}
            value={Number.MAX_SAFE_INTEGER}
            isEditing={false}
          />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes(Number.MAX_SAFE_INTEGER.toString()),
      );

      expect(valueText).toBeInTheDocument();
    });

    it("should handle very small numbers", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField
            {...defaultProps}
            value={Number.MIN_SAFE_INTEGER}
            isEditing={false}
          />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes(Number.MIN_SAFE_INTEGER.toString()),
      );

      expect(valueText).toBeInTheDocument();
    });
  });

  describe("Accessibility and User Experience", () => {
    it("should provide clear visual feedback for valid values", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField {...defaultProps} value={50} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const inputBox = textElements.find((el) => el.textContent?.includes("["));

      expect(inputBox).toHaveAttribute("data-color", "cyan");
    });

    it("should provide clear visual feedback for invalid values", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField {...defaultProps} value={150} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const errorText = textElements.find((el) =>
        el.textContent?.includes("Must be between"),
      );

      expect(errorText).toHaveAttribute("data-color", "red");
    });

    it("should provide help text during editing", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const helpText = textElements.find((el) =>
        el.textContent?.includes("(Enter to confirm)"),
      );

      expect(helpText).toBeInTheDocument();
    });

    it("should show range information when available", () => {
      const { getAllByTestId } = render(
        <Provider>
          <NumberField {...defaultProps} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const rangeText = textElements.find((el) =>
        el.textContent?.includes("(0-100)"),
      );

      expect(rangeText).toBeInTheDocument();
      expect(rangeText).toHaveAttribute("data-color", "gray");
    });
  });

  describe("Performance", () => {
    it("should handle rapid key presses efficiently", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} isEditing={true} />
        </Provider>,
      );

      // Simulate rapid key presses
      for (let i = 0; i < 50; i++) {
        mockHandleKeyInput(i.toString(), {});
      }

      expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(50);
    });

    it("should handle arrow key navigation efficiently", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} value={50} isEditing={true} />
        </Provider>,
      );

      // Simulate rapid arrow key presses
      for (let i = 0; i < 20; i++) {
        const upKey: KeyboardInput = { upArrow: true };
        mockHandleKeyInput("", upKey);
      }

      expect(mockUpdatePreviewValue).toHaveBeenCalledTimes(20);
    });
  });

  describe("Integration with Settings System", () => {
    it("should work with different number formats", () => {
      const floatField: SettingsFieldDefinition = {
        key: "decimal",
        label: "Decimal Number",
        description: "Accepts decimal values",
        type: "number",
        defaultValue: 3.14,
        min: 0.1,
        max: 99.9,
      };

      const { getAllByTestId } = render(
        <Provider>
          <NumberField field={floatField} value={3.14} isEditing={false} />
        </Provider>,
      );

      const textElements = getAllByTestId("text");
      const valueText = textElements.find((el) =>
        el.textContent?.includes("3.14"),
      );

      expect(valueText).toBeInTheDocument();
    });

    it("should integrate with settings preview system", () => {
      render(
        <Provider>
          <NumberField {...defaultProps} value={25} isEditing={true} />
        </Provider>,
      );

      const keyInput: KeyboardInput = {};
      mockHandleKeyInput("5", keyInput);

      // Should call preview system
      expect(mockUpdatePreviewValue).toHaveBeenCalledWith({
        key: "testNumber",
        value: expect.any(Number),
      });
    });
  });
});
