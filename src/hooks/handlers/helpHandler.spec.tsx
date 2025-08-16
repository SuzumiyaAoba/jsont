/**
 * Comprehensive tests for helpHandler
 *
 * Tests help mode keyboard input handling including help close operations,
 * terminal buffer restoration, and input blocking behavior.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type HelpHandlerDependencies, useHelpHandler } from "./helpHandler";
import type { IKeybindingMatcher } from "./types";

describe("useHelpHandler", () => {
  let mockDependencies: HelpHandlerDependencies;
  let mockKeybindings: IKeybindingMatcher;
  let originalStdoutWrite: typeof process.stdout.write;

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

    // Mock stdout.write
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = vi.fn();

    mockDependencies = {
      helpVisible: true,
      setHelpVisible: vi.fn(),
      keybindings: mockKeybindings,
      updateDebugInfo: vi.fn(),
    };
  });

  afterEach(() => {
    // Restore stdout.write
    process.stdout.write = originalStdoutWrite;
  });

  describe("Help Mode Activation", () => {
    it("should only handle input when help is visible", () => {
      const invisibleDeps = {
        ...mockDependencies,
        helpVisible: false,
      };

      const { result } = renderHook(() => useHelpHandler(invisibleDeps));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleHelpInput("", keyInput);
        expect(handled).toBe(false);
      });

      expect(invisibleDeps.setHelpVisible).not.toHaveBeenCalled();
      expect(invisibleDeps.updateDebugInfo).not.toHaveBeenCalled();
    });

    it("should handle input when help is visible", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleHelpInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setHelpVisible).toHaveBeenCalledWith(false);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (Esc)",
        "",
      );
    });
  });

  describe("Help Close Operations", () => {
    it("should close help with help keybinding", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleHelpInput("?", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isHelp).toHaveBeenCalledWith("?", keyInput);
      expect(mockDependencies.setHelpVisible).toHaveBeenCalledWith(false);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (?)",
        "?",
      );
    });

    it("should close help with Escape key", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleHelpInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setHelpVisible).toHaveBeenCalledWith(false);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (Esc)",
        "",
      );
    });

    it("should not close help when keybinding returns false", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleHelpInput("x", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isHelp).toHaveBeenCalledWith("x", keyInput);
      expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
    });

    it("should prioritize help keybinding over Escape", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleHelpInput("?", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (?)",
        "?",
      );
      expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalledWith(
        "Close help (Esc)",
        "?",
      );
    });
  });

  describe("Terminal Buffer Restoration", () => {
    it("should restore main screen buffer when closing with help keybinding", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleHelpInput("?", keyInput);
      });

      expect(process.stdout.write).toHaveBeenCalledWith("\x1b[?1049l");
      expect(process.stdout.write).toHaveBeenCalledWith("\x1b[2J\x1b[H\x1b[0m");
    });

    it("should restore main screen buffer when closing with Escape", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleHelpInput("", keyInput);
      });

      expect(process.stdout.write).toHaveBeenCalledWith("\x1b[?1049l");
      expect(process.stdout.write).toHaveBeenCalledWith("\x1b[2J\x1b[H\x1b[0m");
    });

    it("should handle missing stdout.write gracefully", () => {
      // Remove stdout.write temporarily
      const originalWrite = process.stdout.write;
      delete (process.stdout as any).write;

      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      expect(() => {
        act(() => {
          result.current.handleHelpInput("?", keyInput);
        });
      }).not.toThrow();

      expect(mockDependencies.setHelpVisible).toHaveBeenCalledWith(false);

      // Restore stdout.write
      process.stdout.write = originalWrite;
    });

    it("should handle stdout.write errors gracefully", () => {
      process.stdout.write = vi.fn().mockImplementation(() => {
        throw new Error("Write error");
      });

      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      expect(() => {
        act(() => {
          result.current.handleHelpInput("?", keyInput);
        });
      }).toThrow("Write error");
    });
  });

  describe("Input Blocking Behavior", () => {
    it("should block all other keyboard inputs when help is visible", () => {
      const testInputs = [
        { input: "a", key: {} },
        { input: "j", key: {} },
        { input: "k", key: {} },
        { input: "T", key: {} },
        { input: "S", key: {} },
        { input: "q", key: {} },
        { input: "", key: { return: true } },
        { input: "", key: { tab: true } },
        { input: "", key: { upArrow: true } },
        { input: "", key: { downArrow: true } },
        { input: "", key: { pageUp: true } },
        { input: "", key: { pageDown: true } },
        { input: "", key: { ctrl: true } },
        { input: "", key: { shift: true } },
      ];

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      testInputs.forEach(({ input, key }) => {
        vi.clearAllMocks();

        act(() => {
          const handled = result.current.handleHelpInput(input, key);
          expect(handled).toBe(true);
        });

        // Should not trigger any actions for blocked inputs
        expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
      });
    });

    it("should block special character inputs", () => {
      const specialChars = ["€", "🎉", "ñ", "\\", "|", "@", "#", "~", "`"];

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      specialChars.forEach((char) => {
        vi.clearAllMocks();

        act(() => {
          const handled = result.current.handleHelpInput(char, {});
          expect(handled).toBe(true);
        });

        expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
      });
    });

    it("should block numeric inputs", () => {
      const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      numbers.forEach((num) => {
        vi.clearAllMocks();

        act(() => {
          const handled = result.current.handleHelpInput(num, {});
          expect(handled).toBe(true);
        });

        expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
      });
    });

    it("should block complex key combinations", () => {
      const complexKeys = [
        { input: "c", key: { ctrl: true } },
        { input: "v", key: { ctrl: true } },
        { input: "z", key: { ctrl: true } },
        { input: "a", key: { meta: true } },
        { input: "s", key: { ctrl: true, shift: true } },
        { input: "", key: { ctrl: true, alt: true } },
      ];

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      complexKeys.forEach(({ input, key }) => {
        vi.clearAllMocks();

        act(() => {
          const handled = result.current.handleHelpInput(input, key);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleHelpInput(null as any, {});
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleHelpInput(
          "test",
          undefined as any,
        );
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
    });

    it("should handle broken keybinding methods", () => {
      const brokenKeybindings = {
        ...mockKeybindings,
        isHelp: undefined as any,
      };

      const brokenDeps = {
        ...mockDependencies,
        keybindings: brokenKeybindings,
      };

      const { result } = renderHook(() => useHelpHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleHelpInput("?", {});
        });
      }).toThrow();
    });

    it("should handle missing dependencies gracefully", () => {
      const brokenDeps = {
        ...mockDependencies,
        setHelpVisible: undefined as any,
      };

      const { result } = renderHook(() => useHelpHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleHelpInput("", { escape: true });
        });
      }).toThrow();
    });

    it("should handle empty input string", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleHelpInput("", {});
        expect(handled).toBe(true);
      });

      expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
    });
  });

  describe("Callback Dependencies and Memoization", () => {
    it("should maintain stable callback reference with same dependencies", () => {
      const { result, rerender } = renderHook((deps) => useHelpHandler(deps), {
        initialProps: mockDependencies,
      });

      const firstCallback = result.current.handleHelpInput;

      rerender(mockDependencies);

      expect(result.current.handleHelpInput).toBe(firstCallback);
    });

    it("should update callback when dependencies change", () => {
      const { result, rerender } = renderHook((deps) => useHelpHandler(deps), {
        initialProps: mockDependencies,
      });

      const firstCallback = result.current.handleHelpInput;

      const newDeps = {
        ...mockDependencies,
        setHelpVisible: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleHelpInput).not.toBe(firstCallback);
    });

    it("should call current dependencies even after updates", () => {
      const originalSetHelp = vi.fn();
      const newSetHelp = vi.fn();

      const { result, rerender } = renderHook((deps) => useHelpHandler(deps), {
        initialProps: {
          ...mockDependencies,
          setHelpVisible: originalSetHelp,
        },
      });

      rerender({
        ...mockDependencies,
        setHelpVisible: newSetHelp,
      });

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleHelpInput("", keyInput);
      });

      expect(newSetHelp).toHaveBeenCalledWith(false);
      expect(originalSetHelp).not.toHaveBeenCalled();
    });

    it("should update callback when helpVisible changes", () => {
      const { result, rerender } = renderHook((deps) => useHelpHandler(deps), {
        initialProps: mockDependencies,
      });

      const firstCallback = result.current.handleHelpInput;

      const newDeps = {
        ...mockDependencies,
        helpVisible: false,
      };

      rerender(newDeps);

      expect(result.current.handleHelpInput).not.toBe(firstCallback);
    });
  });

  describe("Performance", () => {
    it("should handle rapid key sequences efficiently", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const startTime = Date.now();

      act(() => {
        // Simulate rapid key presses (all blocked)
        for (let i = 0; i < 100; i++) {
          result.current.handleHelpInput(
            String.fromCharCode(97 + (i % 26)),
            {},
          );
        }
      });

      const endTime = Date.now();

      // Should complete quickly (less than 50ms for 100 operations)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should handle rapid close operations efficiently", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const startTime = Date.now();

      act(() => {
        // Simulate rapid help close attempts
        for (let i = 0; i < 50; i++) {
          result.current.handleHelpInput("?", {});
        }
      });

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(mockDependencies.setHelpVisible).toHaveBeenCalledTimes(50);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle help open and close workflow", () => {
      // Start with help hidden
      const hiddenDeps = {
        ...mockDependencies,
        helpVisible: false,
      };

      const { result, rerender } = renderHook((deps) => useHelpHandler(deps), {
        initialProps: hiddenDeps,
      });

      // Should not handle input when hidden
      act(() => {
        const handled = result.current.handleHelpInput("?", {});
        expect(handled).toBe(false);
      });

      // Show help
      const visibleDeps = {
        ...mockDependencies,
        helpVisible: true,
      };

      rerender(visibleDeps);

      // Should block all inputs
      act(() => {
        const handled1 = result.current.handleHelpInput("j", {});
        const handled2 = result.current.handleHelpInput("k", {});
        expect(handled1).toBe(true);
        expect(handled2).toBe(true);
      });

      // Close with Escape
      act(() => {
        result.current.handleHelpInput("", { escape: true });
      });

      expect(visibleDeps.setHelpVisible).toHaveBeenCalledWith(false);
      expect(visibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (Esc)",
        "",
      );
    });

    it("should handle alternating help keybinding and Escape", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      // Close with help keybinding
      act(() => {
        result.current.handleHelpInput("?", {});
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (?)",
        "?",
      );

      vi.clearAllMocks();
      mockKeybindings.isHelp = vi.fn().mockReturnValue(false);

      // Close with Escape
      act(() => {
        result.current.handleHelpInput("", { escape: true });
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (Esc)",
        "",
      );
    });

    it("should handle mixed input types during help mode", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const mixedInputs = [
        { input: "regular text", key: {} },
        { input: "", key: { ctrl: true } },
        { input: "123", key: {} },
        { input: "€", key: {} },
        { input: "", key: { return: true } },
        { input: "", key: { escape: false } }, // not actually escape
      ];

      mixedInputs.forEach(({ input, key }) => {
        act(() => {
          const handled = result.current.handleHelpInput(input, key);
          expect(handled).toBe(true);
        });
      });

      // None should trigger close
      expect(mockDependencies.setHelpVisible).not.toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
    });
  });

  describe("Debug Integration", () => {
    it("should call updateDebugInfo for help close operations", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      // Test help keybinding close
      act(() => {
        result.current.handleHelpInput("?", {});
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (?)",
        "?",
      );

      vi.clearAllMocks();
      mockKeybindings.isHelp = vi.fn().mockReturnValue(false);

      // Test Escape close
      act(() => {
        result.current.handleHelpInput("", { escape: true });
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Close help (Esc)",
        "",
      );
    });

    it("should not call updateDebugInfo for blocked inputs", () => {
      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const blockedInputs = ["a", "j", "k", "1", "€", " "];

      blockedInputs.forEach((input) => {
        vi.clearAllMocks();

        act(() => {
          result.current.handleHelpInput(input, {});
        });

        expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
      });
    });

    it("should include correct input in debug messages", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useHelpHandler(mockDependencies));

      const testInputs = ["?", "help", "h"];

      testInputs.forEach((input) => {
        vi.clearAllMocks();

        act(() => {
          result.current.handleHelpInput(input, {});
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Close help (?)",
          input,
        );
      });
    });
  });
});
