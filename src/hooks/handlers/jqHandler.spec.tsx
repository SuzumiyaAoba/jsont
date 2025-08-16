/**
 * Comprehensive tests for jqHandler
 *
 * Tests jq mode keyboard input handling including text input, query execution,
 * focus mode switching, error scrolling, and JSON navigation.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type JqHandlerDependencies, useJqHandler } from "./jqHandler";
import type { IKeybindingMatcher } from "./types";

describe("useJqHandler", () => {
  let mockDependencies: JqHandlerDependencies;
  let mockKeybindings: IKeybindingMatcher;

  beforeEach(() => {
    // Create mock keybinding matcher
    mockKeybindings = {
      isQuit: vi.fn(),
      isExport: vi.fn(),
      isExportData: vi.fn(),
      isUp: vi.fn(),
      isDown: vi.fn(),
      isPageUp: vi.fn(),
      isPageDown: vi.fn(),
      isTop: vi.fn(),
      isBottom: vi.fn(),
      isSearch: vi.fn(),
      isSchema: vi.fn(),
      isTree: vi.fn(),
      isCollapsible: vi.fn(),
      isJq: vi.fn(),
      isLineNumbers: vi.fn(),
      isDebug: vi.fn(),
      isHelp: vi.fn(),
      isSearchNext: vi.fn(),
      isSearchPrevious: vi.fn(),
      isSearchExit: vi.fn(),
    };

    mockDependencies = {
      jqState: { isActive: true },
      jqInput: "",
      jqCursorPosition: 0,
      jqFocusMode: "input",
      setJqInput: vi.fn(),
      setJqCursorPosition: vi.fn(),
      setJqFocusMode: vi.fn(),
      setJqErrorScrollOffset: vi.fn(),
      handleJqTransformation: vi.fn(),
      exitJqMode: vi.fn(),
      toggleJqView: vi.fn(),
      updateDebugInfo: vi.fn(),
      keybindings: mockKeybindings,
      searchState: {
        isSearching: false,
        searchTerm: "",
      },
      maxScroll: 100,
      maxScrollSearchMode: 50,
      halfPageLines: 10,
      adjustScroll: vi.fn(),
      scrollToTop: vi.fn(),
      scrollToBottom: vi.fn(),
      handleTextInput: vi.fn().mockReturnValue(false),
    };
  });

  describe("JQ Mode Activation", () => {
    it("should only handle input when jq mode is active", () => {
      const inactiveDeps = {
        ...mockDependencies,
        jqState: { isActive: false },
      };

      const { result } = renderHook(() => useJqHandler(inactiveDeps));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(false);
      });

      expect(inactiveDeps.handleJqTransformation).not.toHaveBeenCalled();
    });

    it("should handle input when jq mode is active", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleJqTransformation).toHaveBeenCalled();
    });
  });

  describe("Query Execution", () => {
    it("should execute jq transformation on Enter key", () => {
      const depsWithQuery = {
        ...mockDependencies,
        jqInput: ".users[] | select(.age > 30)",
      };

      const { result } = renderHook(() => useJqHandler(depsWithQuery));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(depsWithQuery.handleJqTransformation).toHaveBeenCalledWith(
        ".users[] | select(.age > 30)",
      );
    });

    it("should execute jq transformation with empty query", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleJqTransformation).toHaveBeenCalledWith("");
    });

    it("should prioritize Enter over text input", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleJqTransformation).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
    });
  });

  describe("Text Input Handling", () => {
    it("should handle text input when in input focus mode", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const inputModeDeps = {
        ...mockDependencies,
        jqFocusMode: "input" as const,
        jqInput: "current query",
        jqCursorPosition: 7,
      };

      const { result } = renderHook(() => useJqHandler(inputModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("a", keyInput);
        expect(handled).toBe(true);
      });

      expect(inputModeDeps.handleTextInput).toHaveBeenCalledWith(
        { text: "current query", cursorPosition: 7 },
        {
          setText: inputModeDeps.setJqInput,
          setCursorPosition: inputModeDeps.setJqCursorPosition,
        },
        keyInput,
        "a",
      );
    });

    it("should not handle text input when in json focus mode", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json" as const,
      };

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.handleTextInput).not.toHaveBeenCalled();
      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledWith(1, 100);
    });

    it("should fall through when text input returns false", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("unknown", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.handleTextInput).toHaveBeenCalled();
    });
  });

  describe("Mode Control", () => {
    it("should exit jq mode on Escape key", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.exitJqMode).toHaveBeenCalled();
    });

    it("should switch focus mode on Tab key from input to json", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { tab: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setJqFocusMode).toHaveBeenCalled();

      // Test the callback function
      const mockCallback = mockDependencies.setJqFocusMode as any;
      const callback = mockCallback.mock.calls[0][0];
      expect(callback("input")).toBe("json");
      expect(callback("json")).toBe("input");
    });

    it("should switch focus mode on Tab key from json to input", () => {
      const jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json" as const,
      };

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = { tab: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.setJqFocusMode).toHaveBeenCalled();
    });

    it("should return to input mode with 'i' key", () => {
      const jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json" as const,
      };

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("i", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.setJqFocusMode).toHaveBeenCalledWith("input");
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ: Return to input mode",
        "i",
      );
    });

    it("should not trigger input mode with Ctrl+i", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleJqInput("i", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.setJqFocusMode).not.toHaveBeenCalled();
    });

    it("should toggle view with 'o' key", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("o", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.toggleJqView).toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "JQ: Toggle original/result view",
        "o",
      );
    });

    it("should not trigger view toggle with Ctrl+o", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleJqInput("o", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.toggleJqView).not.toHaveBeenCalled();
    });
  });

  describe("Error Scrolling", () => {
    it("should scroll error messages up with Shift+UpArrow", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { shift: true, upArrow: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setJqErrorScrollOffset).toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "JQ: Scroll error up",
        "Shift+↑",
      );

      // Test the callback function
      const mockCallback = mockDependencies.setJqErrorScrollOffset as any;
      const callback = mockCallback.mock.calls[0][0];
      expect(callback(5)).toBe(4);
      expect(callback(0)).toBe(0); // Should not go below 0
    });

    it("should scroll error messages down with Shift+DownArrow", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { shift: true, downArrow: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setJqErrorScrollOffset).toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "JQ: Scroll error down",
        "Shift+↓",
      );

      // Test the callback function
      const mockCallback = mockDependencies.setJqErrorScrollOffset as any;
      const callback = mockCallback.mock.calls[0][0];
      expect(callback(5)).toBe(6);
    });

    it("should not scroll on arrow keys without Shift", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const upKey: KeyboardInput = { upArrow: true };
      const downKey: KeyboardInput = { downArrow: true };

      act(() => {
        const handled1 = result.current.handleJqInput("", upKey);
        const handled2 = result.current.handleJqInput("", downKey);
        expect(handled1).toBe(false);
        expect(handled2).toBe(false);
      });

      expect(mockDependencies.setJqErrorScrollOffset).not.toHaveBeenCalled();
    });
  });

  describe("JSON Navigation in JSON Focus Mode", () => {
    let jsonModeDeps: JqHandlerDependencies;

    beforeEach(() => {
      jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json",
      };
    });

    it("should scroll down in JSON result", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledWith(1, 100);
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Scroll down",
        "j",
      );
    });

    it("should scroll up in JSON result", () => {
      mockKeybindings.isUp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("k", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledWith(-1, 100);
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Scroll up",
        "k",
      );
    });

    it("should use search mode max scroll when searching", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const searchingDeps = {
        ...jsonModeDeps,
        searchState: { isSearching: true, searchTerm: "test" },
      };

      const { result } = renderHook(() => useJqHandler(searchingDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(searchingDeps.adjustScroll).toHaveBeenCalledWith(1, 50);
    });

    it("should go to top in JSON result", () => {
      mockKeybindings.isTop = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("g", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.scrollToTop).toHaveBeenCalled();
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Go to top",
        "g",
      );
    });

    it("should go to bottom in JSON result", () => {
      mockKeybindings.isBottom = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("G", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.scrollToBottom).toHaveBeenCalledWith(100);
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Go to bottom",
        "G",
      );
    });

    it("should use search mode max scroll for goto bottom when searching", () => {
      mockKeybindings.isBottom = vi.fn().mockReturnValue(true);

      const searchingDeps = {
        ...jsonModeDeps,
        searchState: { isSearching: true, searchTerm: "test" },
      };

      const { result } = renderHook(() => useJqHandler(searchingDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("G", keyInput);
        expect(handled).toBe(true);
      });

      expect(searchingDeps.scrollToBottom).toHaveBeenCalledWith(50);
    });

    it("should handle page down in JSON result", () => {
      mockKeybindings.isPageDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleJqInput("f", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledWith(10, 100);
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Page down",
        "Ctrl+f",
      );
    });

    it("should handle page up in JSON result", () => {
      mockKeybindings.isPageUp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleJqInput("b", keyInput);
        expect(handled).toBe(true);
      });

      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledWith(-10, 100);
      expect(jsonModeDeps.updateDebugInfo).toHaveBeenCalledWith(
        "JQ JSON: Page up",
        "Ctrl+b",
      );
    });

    it("should not handle JSON navigation when in input focus mode", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("j", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.adjustScroll).not.toHaveBeenCalled();
    });
  });

  describe("Command Priority and Processing Order", () => {
    it("should prioritize Enter over all other commands", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleJqTransformation).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
      expect(mockDependencies.adjustScroll).not.toHaveBeenCalled();
    });

    it("should prioritize text input over mode switches when in input mode", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleJqInput("i", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleTextInput).toHaveBeenCalled();
      expect(mockDependencies.setJqFocusMode).not.toHaveBeenCalledWith("input");
    });

    it("should prioritize escape over other commands", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.exitJqMode).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
      expect(mockDependencies.adjustScroll).not.toHaveBeenCalled();
    });

    it("should prioritize tab over other commands", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const keyInput: KeyboardInput = { tab: true };

      act(() => {
        const handled = result.current.handleJqInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setJqFocusMode).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
      expect(mockDependencies.adjustScroll).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleJqInput(null as any, {});
        expect(handled).toBe(false);
      });
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleJqInput("test", undefined as any);
        expect(handled).toBe(false);
      });
    });

    it("should handle broken keybinding methods", () => {
      const brokenKeybindings = {
        ...mockKeybindings,
        isDown: undefined as any,
      };

      const jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json" as const,
        keybindings: brokenKeybindings,
      };

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      expect(() => {
        act(() => {
          result.current.handleJqInput("j", {});
        });
      }).toThrow();
    });

    it("should handle special character inputs", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      const specialChars = ["€", "🎉", "ñ", "\\", "|", "@", "#"];

      specialChars.forEach((char) => {
        act(() => {
          const handled = result.current.handleJqInput(char, {});
          expect(handled).toBe(false);
        });
      });
    });

    it("should handle broken text input function", () => {
      mockDependencies.handleTextInput = vi.fn().mockImplementation(() => {
        throw new Error("Text input error");
      });

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      expect(() => {
        act(() => {
          result.current.handleJqInput("test", {});
        });
      }).toThrow("Text input error");
    });
  });

  describe("Callback Dependencies and Memoization", () => {
    it("should maintain stable callback reference with same dependencies", () => {
      const { result, rerender } = renderHook((deps) => useJqHandler(deps), {
        initialProps: mockDependencies,
      });

      const firstCallback = result.current.handleJqInput;

      rerender(mockDependencies);

      expect(result.current.handleJqInput).toBe(firstCallback);
    });

    it("should update callback when dependencies change", () => {
      const { result, rerender } = renderHook((deps) => useJqHandler(deps), {
        initialProps: mockDependencies,
      });

      const firstCallback = result.current.handleJqInput;

      const newDeps = {
        ...mockDependencies,
        exitJqMode: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleJqInput).not.toBe(firstCallback);
    });

    it("should call current dependencies even after updates", () => {
      const originalExit = vi.fn();
      const newExit = vi.fn();

      const { result, rerender } = renderHook((deps) => useJqHandler(deps), {
        initialProps: {
          ...mockDependencies,
          exitJqMode: originalExit,
        },
      });

      rerender({
        ...mockDependencies,
        exitJqMode: newExit,
      });

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleJqInput("", keyInput);
      });

      expect(newExit).toHaveBeenCalled();
      expect(originalExit).not.toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should handle rapid key sequences efficiently", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const jsonModeDeps = {
        ...mockDependencies,
        jqFocusMode: "json" as const,
      };

      const { result } = renderHook(() => useJqHandler(jsonModeDeps));

      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleJqInput("j", {});
        }
      });

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(jsonModeDeps.adjustScroll).toHaveBeenCalledTimes(100);
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle complete jq workflow", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      // 1. Type query (handled by text input)
      act(() => {
        result.current.handleJqInput(".", {});
      });
      expect(mockDependencies.handleTextInput).toHaveBeenCalled();

      // 2. Execute query
      act(() => {
        result.current.handleJqInput("", { return: true });
      });
      expect(mockDependencies.handleJqTransformation).toHaveBeenCalled();

      // 3. Switch to JSON focus
      act(() => {
        result.current.handleJqInput("", { tab: true });
      });
      expect(mockDependencies.setJqFocusMode).toHaveBeenCalled();

      // 4. Navigate in JSON result
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);
      const jsonDeps = { ...mockDependencies, jqFocusMode: "json" as const };
      const { result: jsonResult } = renderHook(() => useJqHandler(jsonDeps));

      act(() => {
        jsonResult.current.handleJqInput("j", {});
      });
      expect(jsonDeps.adjustScroll).toHaveBeenCalled();

      // 5. Exit jq mode
      act(() => {
        result.current.handleJqInput("", { escape: true });
      });
      expect(mockDependencies.exitJqMode).toHaveBeenCalled();
    });

    it("should handle focus mode switching workflow", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useJqHandler(mockDependencies));

      // Start in input mode - type some text
      act(() => {
        result.current.handleJqInput(".", {});
      });
      expect(mockDependencies.handleTextInput).toHaveBeenCalled();

      // Switch to JSON mode with Tab
      act(() => {
        result.current.handleJqInput("", { tab: true });
      });
      expect(mockDependencies.setJqFocusMode).toHaveBeenCalled();

      // Switch back to input mode with 'i'
      const jsonDeps = { ...mockDependencies, jqFocusMode: "json" as const };
      const { result: jsonResult } = renderHook(() => useJqHandler(jsonDeps));

      act(() => {
        jsonResult.current.handleJqInput("i", {});
      });
      expect(jsonDeps.setJqFocusMode).toHaveBeenCalledWith("input");

      // Toggle view with 'o'
      act(() => {
        result.current.handleJqInput("o", {});
      });
      expect(mockDependencies.toggleJqView).toHaveBeenCalled();
    });

    it("should handle error scrolling workflow", () => {
      const { result } = renderHook(() => useJqHandler(mockDependencies));

      // Scroll error up
      act(() => {
        result.current.handleJqInput("", { shift: true, upArrow: true });
      });
      expect(mockDependencies.setJqErrorScrollOffset).toHaveBeenCalled();

      // Scroll error down
      act(() => {
        result.current.handleJqInput("", { shift: true, downArrow: true });
      });
      expect(mockDependencies.setJqErrorScrollOffset).toHaveBeenCalledTimes(2);
    });
  });
});
