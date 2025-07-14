import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  KeyboardEvent,
  TextInputActions,
  TextInputState,
} from "./textInput";
import { handleTextInput } from "./textInput";

describe("handleTextInput utility", () => {
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

  describe("Ctrl+K (delete to end of line)", () => {
    it("should delete from cursor to end of line", () => {
      const state: TextInputState = {
        text: "hello world",
        cursorPosition: 5, // After "hello"
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "k");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("hello");
      expect(mockSetCursorPosition).not.toHaveBeenCalled(); // Cursor stays in place
    });

    it("should delete entire line when cursor is at beginning", () => {
      const state: TextInputState = {
        text: "hello world",
        cursorPosition: 0,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "k");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("");
    });

    it("should do nothing when cursor is at end of line", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 5,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "k");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("hello");
    });
  });

  describe("Ctrl+U (delete to beginning of line)", () => {
    it("should delete from beginning to cursor", () => {
      const state: TextInputState = {
        text: "hello world",
        cursorPosition: 5, // After "hello"
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "u");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith(" world");
      expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
    });

    it("should do nothing when cursor is at beginning", () => {
      const state: TextInputState = {
        text: "hello world",
        cursorPosition: 0,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "u");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("hello world");
      expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
    });

    it("should delete entire line when cursor is at end", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 5,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "u");

      expect(result).toBe(true);
      expect(mockSetText).toHaveBeenCalledWith("");
      expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
    });
  });

  describe("existing functionality", () => {
    it("should handle regular character input", () => {
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

    it("should handle Ctrl+A (move to beginning)", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 5,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "a");

      expect(result).toBe(true);
      expect(mockSetCursorPosition).toHaveBeenCalledWith(0);
      expect(mockSetText).not.toHaveBeenCalled();
    });

    it("should handle Ctrl+E (move to end)", () => {
      const state: TextInputState = {
        text: "hello",
        cursorPosition: 0,
      };
      const key: KeyboardEvent = { ctrl: true };

      const result = handleTextInput(state, actions, key, "e");

      expect(result).toBe(true);
      expect(mockSetCursorPosition).toHaveBeenCalledWith(5);
      expect(mockSetText).not.toHaveBeenCalled();
    });
  });
});
