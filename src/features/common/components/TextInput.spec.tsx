/**
 * Comprehensive test suite for unified TextInput component and utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  KeyboardEvent,
  TextInputActions,
  TextInputState,
} from "./TextInput";
import {
  convertLegacyState,
  convertToLegacyState,
  handleTextInput,
  renderTextWithCursor,
} from "./TextInput";

describe("Unified TextInput System", () => {
  let mockSetText: ReturnType<typeof vi.fn>;
  let mockSetCursorPosition: ReturnType<typeof vi.fn>;
  let actions: TextInputActions;

  beforeEach(() => {
    mockSetText = vi.fn();
    mockSetCursorPosition = vi.fn();
    actions = {
      setText: mockSetText,
      setCursorPosition: mockSetCursorPosition,
    };
  });

  describe("handleTextInput utility", () => {
    describe("Cursor Movement", () => {
      it("should handle left arrow key", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 3,
        };
        const key: KeyboardEvent = { leftArrow: true };

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(2);
      });

      it("should handle right arrow key", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = { rightArrow: true };

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(3);
      });

      it("should handle Ctrl+A (move to beginning)", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 5,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "a");

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
      });

      it("should handle Ctrl+E (move to end)", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 0,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "e");

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(11);
      });

      it("should handle Ctrl+F (move forward)", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "f");

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(3);
      });

      it("should handle Ctrl+B (move backward)", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 3,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "b");

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(2);
      });
    });

    describe("Text Deletion", () => {
      it("should handle Ctrl+K (delete to end of line)", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 5,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "k");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("hello");
      });

      it("should handle Ctrl+U (delete to beginning)", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 6,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "u");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("world");
        expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
      });

      it("should handle Ctrl+U optimization when cursor is at beginning", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 0,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "u");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("hello world");
        expect(mockSetCursorPosition).not.toHaveBeenCalled();
      });

      it("should handle Ctrl+W (delete word backward)", () => {
        const state: TextInputState = {
          text: "hello world test",
          cursorPosition: 16,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "w");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("hello world ");
        expect(mockSetCursorPosition).toHaveBeenCalledWith(12);
      });

      it("should handle Ctrl+D (forward delete)", () => {
        const state: TextInputState = {
          text: "hello world",
          cursorPosition: 5,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "d");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("helloworld");
      });

      it("should handle backspace", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 3,
        };
        const key: KeyboardEvent = { backspace: true };

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("helo");
        expect(mockSetCursorPosition).toHaveBeenCalledWith(2);
      });
    });

    describe("Platform-specific delete behavior", () => {
      it("should handle delete key on macOS (deletes left)", () => {
        // Mock macOS
        const originalPlatform = process.platform;
        Object.defineProperty(process, "platform", { value: "darwin" });

        const state: TextInputState = {
          text: "hello",
          cursorPosition: 3,
        };
        const key: KeyboardEvent = { delete: true };

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("helo");
        expect(mockSetCursorPosition).toHaveBeenCalledWith(2);

        // Restore original platform
        Object.defineProperty(process, "platform", { value: originalPlatform });
      });

      it("should handle delete key on non-macOS (deletes right)", () => {
        // Mock non-macOS
        const originalPlatform = process.platform;
        Object.defineProperty(process, "platform", { value: "linux" });

        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = { delete: true };

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("helo");

        // Restore original platform
        Object.defineProperty(process, "platform", { value: originalPlatform });
      });
    });

    describe("Regular character input", () => {
      it("should insert character at cursor position", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = {};

        const result = handleTextInput(state, actions, key, "x");

        expect(result).toBe(true);
        expect(mockSetText).toHaveBeenCalledWith("hexllo");
        expect(mockSetCursorPosition).toHaveBeenCalledWith(3);
      });

      it("should ignore ctrl key combinations for regular characters", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = { ctrl: true };

        const result = handleTextInput(state, actions, key, "z");

        expect(result).toBe(false);
        expect(mockSetText).not.toHaveBeenCalled();
        expect(mockSetCursorPosition).not.toHaveBeenCalled();
      });
    });

    describe("Key normalization", () => {
      it("should normalize left/leftArrow keys", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 3,
        };
        const key: KeyboardEvent = { left: true }; // Using legacy 'left' instead of 'leftArrow'

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(2);
      });

      it("should normalize right/rightArrow keys", () => {
        const state: TextInputState = {
          text: "hello",
          cursorPosition: 2,
        };
        const key: KeyboardEvent = { right: true }; // Using legacy 'right' instead of 'rightArrow'

        const result = handleTextInput(state, actions, key);

        expect(result).toBe(true);
        expect(mockSetCursorPosition).toHaveBeenCalledWith(3);
      });
    });
  });

  describe("renderTextWithCursor utility", () => {
    it("should split text correctly with cursor in middle", () => {
      const result = renderTextWithCursor("hello world", 5);

      expect(result).toEqual({
        beforeCursor: "hello",
        atCursor: " ",
        afterCursor: "world",
      });
    });

    it("should handle cursor at beginning", () => {
      const result = renderTextWithCursor("hello", 0);

      expect(result).toEqual({
        beforeCursor: "",
        atCursor: "h",
        afterCursor: "ello",
      });
    });

    it("should handle cursor at end", () => {
      const result = renderTextWithCursor("hello", 5);

      expect(result).toEqual({
        beforeCursor: "hello",
        atCursor: " ",
        afterCursor: "",
      });
    });

    it("should handle empty string", () => {
      const result = renderTextWithCursor("", 0);

      expect(result).toEqual({
        beforeCursor: "",
        atCursor: " ",
        afterCursor: "",
      });
    });
  });

  describe("Legacy compatibility", () => {
    it("should convert legacy state to new format", () => {
      const legacy = { value: "hello", cursorPosition: 3 };
      const result = convertLegacyState(legacy);

      expect(result).toEqual({
        text: "hello",
        cursorPosition: 3,
      });
    });

    it("should convert new state to legacy format", () => {
      const state = { text: "hello", cursorPosition: 3 };
      const result = convertToLegacyState(state);

      expect(result).toEqual({
        value: "hello",
        cursorPosition: 3,
      });
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle cursor position beyond text length", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 2,
      };
      const key: KeyboardEvent = { rightArrow: true };

      // Move cursor multiple times to test boundary
      handleTextInput(state, actions, key);
      handleTextInput(state, actions, key);
      handleTextInput(state, actions, key);
      handleTextInput(state, actions, key);

      // Should not go beyond text length
      expect(mockSetCursorPosition).toHaveBeenCalled();
      const lastCall =
        mockSetCursorPosition.mock.calls[
          mockSetCursorPosition.mock.calls.length - 1
        ];
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toBeLessThanOrEqual(5);
    });

    it("should handle cursor position below zero", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 2,
      };
      const key: KeyboardEvent = { leftArrow: true };

      // Move cursor multiple times to test boundary
      handleTextInput(state, actions, key);
      handleTextInput(state, actions, key);
      handleTextInput(state, actions, key);

      // Should not go below zero
      expect(mockSetCursorPosition).toHaveBeenCalled();
      const lastCall =
        mockSetCursorPosition.mock.calls[
          mockSetCursorPosition.mock.calls.length - 1
        ];
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty text operations", () => {
      const state: TextInputState = {
        text: "",
        cursorPosition: 0,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "k");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("");
    });
  });
});
