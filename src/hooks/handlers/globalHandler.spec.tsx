/**
 * Comprehensive tests for globalHandler
 *
 * Tests critical application-level keyboard shortcuts including exit commands,
 * export functionality, and global keybinding handling.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type GlobalHandlerDependencies,
  useGlobalHandler,
} from "./globalHandler";
import type { IKeybindingMatcher } from "./types";

describe("useGlobalHandler", () => {
  let mockDependencies: GlobalHandlerDependencies;
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
      updateDebugInfo: vi.fn(),
      keybindings: mockKeybindings,
      searchState: {
        isSearching: false,
        searchTerm: "",
      },
      handleExportSchema: vi.fn(),
      handleExportData: vi.fn(),
      exit: vi.fn(),
    };
  });

  describe("Exit Commands", () => {
    it("should handle Ctrl+C exit command", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleGlobalInput("c", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Exit (Ctrl+C)",
        "c",
      );
      expect(mockDependencies.exit).toHaveBeenCalled();
    });

    it("should handle quit keybinding when not searching", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleGlobalInput("q", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isQuit).toHaveBeenCalledWith("q", keyInput);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Quit",
        "q",
      );
      expect(mockDependencies.exit).toHaveBeenCalled();
    });

    it("should NOT handle quit keybinding when searching", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockDependencies.searchState.isSearching = true;

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleGlobalInput("q", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockKeybindings.isQuit).toHaveBeenCalledWith("q", keyInput);
      expect(mockDependencies.exit).not.toHaveBeenCalled();
    });

    it("should NOT handle quit keybinding when search term exists", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockDependencies.searchState.searchTerm = "test";

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleGlobalInput("q", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.exit).not.toHaveBeenCalled();
    });

    it("should prioritize Ctrl+C over other exit commands", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockDependencies.searchState.isSearching = true;

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleGlobalInput("c", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.exit).toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Exit (Ctrl+C)",
        "c",
      );
    });
  });

  describe("Export Commands", () => {
    it("should handle export schema command", () => {
      mockKeybindings.isExport = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleGlobalInput("e", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isExport).toHaveBeenCalledWith("e", keyInput);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Export schema",
        "e",
      );
      expect(mockDependencies.handleExportSchema).toHaveBeenCalled();
    });

    it("should handle export data command", () => {
      mockKeybindings.isExportData = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true, shift: true };

      act(() => {
        const handled = result.current.handleGlobalInput("e", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isExportData).toHaveBeenCalledWith("e", keyInput);
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Export data",
        "e",
      );
      expect(mockDependencies.handleExportData).toHaveBeenCalled();
    });

    it("should handle export commands regardless of search mode", () => {
      mockKeybindings.isExport = vi.fn().mockReturnValue(true);
      mockDependencies.searchState.isSearching = true;
      mockDependencies.searchState.searchTerm = "test";

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleGlobalInput("e", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleExportSchema).toHaveBeenCalled();
    });

    it("should check export commands in order", () => {
      mockKeybindings.isExport = vi.fn().mockReturnValue(false);
      mockKeybindings.isExportData = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true, shift: true };

      act(() => {
        const handled = result.current.handleGlobalInput("e", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isExport).toHaveBeenCalledWith("e", keyInput);
      expect(mockKeybindings.isExportData).toHaveBeenCalledWith("e", keyInput);
      expect(mockDependencies.handleExportData).toHaveBeenCalled();
      expect(mockDependencies.handleExportSchema).not.toHaveBeenCalled();
    });
  });

  describe("Command Priority and Fallthrough", () => {
    it("should return false when no commands match", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(false);
      mockKeybindings.isExport = vi.fn().mockReturnValue(false);
      mockKeybindings.isExportData = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleGlobalInput("x", keyInput);
        expect(handled).toBe(false);
      });

      expect(mockDependencies.exit).not.toHaveBeenCalled();
      expect(mockDependencies.handleExportSchema).not.toHaveBeenCalled();
      expect(mockDependencies.handleExportData).not.toHaveBeenCalled();
    });

    it("should handle commands in correct priority order", () => {
      // All commands would match this input
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockKeybindings.isExport = vi.fn().mockReturnValue(true);
      mockKeybindings.isExportData = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      // Ctrl+C should take precedence
      const ctrlCKey: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleGlobalInput("c", ctrlCKey);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.exit).toHaveBeenCalled();
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Exit (Ctrl+C)",
        "c",
      );

      // Reset mocks
      vi.clearAllMocks();

      // For non-Ctrl+C input, export should take precedence over quit
      const regularKey: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleGlobalInput("e", regularKey);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.handleExportSchema).toHaveBeenCalled();
      expect(mockDependencies.exit).not.toHaveBeenCalled();
    });
  });

  describe("Search State Integration", () => {
    it("should respect search state for quit commands", () => {
      const testCases = [
        { isSearching: true, searchTerm: "", shouldQuit: false },
        { isSearching: false, searchTerm: "test", shouldQuit: false },
        { isSearching: true, searchTerm: "test", shouldQuit: false },
        { isSearching: false, searchTerm: "", shouldQuit: true },
      ];

      testCases.forEach(({ isSearching, searchTerm, shouldQuit }, _index) => {
        vi.clearAllMocks();
        mockKeybindings.isQuit = vi.fn().mockReturnValue(true);

        const testDeps = {
          ...mockDependencies,
          searchState: { isSearching, searchTerm },
        };

        const { result } = renderHook(() => useGlobalHandler(testDeps));

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleGlobalInput("q", keyInput);
          expect(handled).toBe(shouldQuit);
        });

        if (shouldQuit) {
          expect(testDeps.exit).toHaveBeenCalled();
        } else {
          expect(testDeps.exit).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle undefined keybinding methods gracefully", () => {
      const brokenKeybindings = {
        ...mockKeybindings,
        isQuit: undefined as any,
      };

      const brokenDeps = {
        ...mockDependencies,
        keybindings: brokenKeybindings,
      };

      const { result } = renderHook(() => useGlobalHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleGlobalInput("q", {});
        });
      }).toThrow();
    });

    it("should handle null input gracefully", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleGlobalInput(null as any, {});
        expect(handled).toBe(false);
      });
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleGlobalInput("c", undefined as any);
        expect(handled).toBe(false);
      });
    });

    it("should handle empty input string", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleGlobalInput("", {});
        expect(handled).toBe(false);
      });
    });

    it("should handle special character inputs", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const specialChars = ["€", "🎉", "ñ", "\\", "|", "@", "#"];

      specialChars.forEach((char) => {
        act(() => {
          const handled = result.current.handleGlobalInput(char, {});
          expect(handled).toBe(false);
        });
      });
    });
  });

  describe("Callback Dependencies and Memoization", () => {
    it("should maintain stable callback reference with same dependencies", () => {
      const { result, rerender } = renderHook(
        (deps) => useGlobalHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleGlobalInput;

      // Re-render with same dependencies
      rerender(mockDependencies);

      expect(result.current.handleGlobalInput).toBe(firstCallback);
    });

    it("should update callback when dependencies change", () => {
      const { result, rerender } = renderHook(
        (deps) => useGlobalHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleGlobalInput;

      // Change dependencies
      const newDeps = {
        ...mockDependencies,
        exit: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleGlobalInput).not.toBe(firstCallback);
    });

    it("should call current dependencies even after updates", () => {
      const originalExit = vi.fn();
      const newExit = vi.fn();

      const { result, rerender } = renderHook(
        (deps) => useGlobalHandler(deps),
        {
          initialProps: {
            ...mockDependencies,
            exit: originalExit,
          },
        },
      );

      // Update dependencies
      rerender({
        ...mockDependencies,
        exit: newExit,
      });

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleGlobalInput("c", keyInput);
      });

      expect(newExit).toHaveBeenCalled();
      expect(originalExit).not.toHaveBeenCalled();
    });
  });

  describe("Performance and Stress Testing", () => {
    it("should handle rapid successive key presses", () => {
      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      // Simulate rapid Ctrl+C presses
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleGlobalInput("c", keyInput);
        }
      });

      expect(mockDependencies.exit).toHaveBeenCalledTimes(100);
    });

    it("should handle mixed command sequences efficiently", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockKeybindings.isExport = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      act(() => {
        // Mixed sequence of commands
        for (let i = 0; i < 50; i++) {
          result.current.handleGlobalInput("q", {});
          result.current.handleGlobalInput("e", { ctrl: true });
          result.current.handleGlobalInput("c", { ctrl: true });
        }
      });
    });
  });

  describe("Debug Integration", () => {
    it("should call updateDebugInfo for all handled commands", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);
      mockKeybindings.isExport = vi.fn().mockReturnValue(true);
      mockKeybindings.isExportData = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      // Test all command types
      act(() => {
        result.current.handleGlobalInput("c", { ctrl: true });
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Exit (Ctrl+C)",
        "c",
      );

      act(() => {
        result.current.handleGlobalInput("q", {});
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Quit",
        "q",
      );

      act(() => {
        result.current.handleGlobalInput("e", { ctrl: true });
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Export schema",
        "e",
      );

      act(() => {
        result.current.handleGlobalInput("e", { ctrl: true, shift: true });
      });
      expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
        "Export data",
        "e",
      );
    });

    it("should not call updateDebugInfo for unhandled commands", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(false);
      mockKeybindings.isExport = vi.fn().mockReturnValue(false);
      mockKeybindings.isExportData = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useGlobalHandler(mockDependencies));

      act(() => {
        result.current.handleGlobalInput("x", {});
      });

      expect(mockDependencies.updateDebugInfo).not.toHaveBeenCalled();
    });
  });
});
