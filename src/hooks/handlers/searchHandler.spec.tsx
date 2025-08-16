/**
 * Comprehensive tests for searchHandler
 *
 * Tests search input functionality including text input, search confirmation,
 * cancellation, mode toggles, and integration with text input utilities.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type SearchHandlerDependencies,
  useSearchHandler,
} from "./searchHandler";
import type { IKeybindingMatcher } from "./types";

describe("useSearchHandler", () => {
  let mockDependencies: SearchHandlerDependencies;
  let mockKeybindings: IKeybindingMatcher;

  beforeEach(() => {
    // Create mock keybinding matcher
    mockKeybindings = {
      isSearchExit: vi.fn(),
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
    };

    mockDependencies = {
      searchState: {
        isSearching: true,
        searchTerm: "",
      },
      searchInput: "",
      searchCursorPosition: 0,
      setSearchInput: vi.fn(),
      setSearchCursorPosition: vi.fn(),
      startSearch: vi.fn(),
      cancelSearch: vi.fn(),
      cycleScope: vi.fn(),
      toggleRegexMode: vi.fn(),
      resetScroll: vi.fn(),
      keybindings: mockKeybindings,
      updateDebugInfoCallback: vi.fn(),
      handleTextInput: vi.fn().mockReturnValue(false),
    };
  });

  describe("Search Mode Activation", () => {
    it("should only handle input when in search mode", () => {
      const notSearchingDeps = {
        ...mockDependencies,
        searchState: { isSearching: false, searchTerm: "" },
      };

      const { result } = renderHook(() => useSearchHandler(notSearchingDeps));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(false);
      });

      expect(notSearchingDeps.startSearch).not.toHaveBeenCalled();
    });

    it("should handle input when in search mode", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });
    });
  });

  describe("Search Confirmation", () => {
    it("should confirm search on Enter key", () => {
      const depsWithInput = {
        ...mockDependencies,
        searchInput: "test query",
      };

      const { result } = renderHook(() => useSearchHandler(depsWithInput));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(depsWithInput.updateDebugInfoCallback).toHaveBeenCalledWith(
        "Confirm search",
        "",
      );
      expect(depsWithInput.startSearch).toHaveBeenCalledWith("test query");
      expect(depsWithInput.resetScroll).toHaveBeenCalled();
    });

    it("should confirm search with empty input", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.startSearch).toHaveBeenCalledWith("");
    });

    it("should confirm search with special characters", () => {
      const depsWithSpecialInput = {
        ...mockDependencies,
        searchInput: ".*[regex]?@#$%^&*()",
      };

      const { result } = renderHook(() =>
        useSearchHandler(depsWithSpecialInput),
      );

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(depsWithSpecialInput.startSearch).toHaveBeenCalledWith(
        ".*[regex]?@#$%^&*()",
      );
    });
  });

  describe("Search Cancellation", () => {
    it("should cancel search on exit keybinding", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleSearchInput("escape", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockKeybindings.isSearchExit).toHaveBeenCalledWith(
        "escape",
        keyInput,
      );
      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        "Cancel search",
        "escape",
      );
      expect(mockDependencies.cancelSearch).toHaveBeenCalled();
      expect(mockDependencies.resetScroll).toHaveBeenCalled();
    });

    it("should not cancel on non-exit keys", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleSearchInput("q", keyInput);
      });

      expect(mockDependencies.cancelSearch).not.toHaveBeenCalled();
    });
  });

  describe("Mode Toggle Operations", () => {
    it("should cycle search scope on Tab key", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { tab: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        "Toggle search scope",
        "",
      );
      expect(mockDependencies.cycleScope).toHaveBeenCalled();
    });

    it("should toggle regex mode on Ctrl+R", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleSearchInput("r", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        "Toggle regex mode",
        "r",
      );
      expect(mockDependencies.toggleRegexMode).toHaveBeenCalled();
    });

    it("should not toggle regex mode without Ctrl", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleSearchInput("r", keyInput);
      });

      expect(mockDependencies.toggleRegexMode).not.toHaveBeenCalled();
    });

    it("should not toggle regex mode with Ctrl+other letter", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleSearchInput("a", keyInput);
      });

      expect(mockDependencies.toggleRegexMode).not.toHaveBeenCalled();
    });
  });

  describe("Text Input Integration", () => {
    it("should delegate text input to handleTextInput utility", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const depsWithState = {
        ...mockDependencies,
        searchInput: "current text",
        searchCursorPosition: 5,
      };

      const { result } = renderHook(() => useSearchHandler(depsWithState));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleSearchInput("a", keyInput);
        expect(handled).toBe(true);
      });

      expect(depsWithState.handleTextInput).toHaveBeenCalledWith(
        { text: "current text", cursorPosition: 5 },
        {
          setText: depsWithState.setSearchInput,
          setCursorPosition: depsWithState.setSearchCursorPosition,
        },
        keyInput,
        "a",
      );
    });

    it("should handle text input with correct state setters", () => {
      let capturedSetters: any = null;
      mockDependencies.handleTextInput = vi
        .fn()
        .mockImplementation((_textState, setters, _key, _input) => {
          capturedSetters = setters;
          return true;
        });

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      act(() => {
        result.current.handleSearchInput("x", {});
      });

      expect(capturedSetters).toBeTruthy();
      expect(capturedSetters.setText).toBe(mockDependencies.setSearchInput);
      expect(capturedSetters.setCursorPosition).toBe(
        mockDependencies.setSearchCursorPosition,
      );
    });

    it("should continue processing when handleTextInput returns false", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleSearchInput("unknown", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        'Ignored in search mode: "unknown"',
        "unknown",
      );
    });
  });

  describe("Command Priority and Processing Order", () => {
    it("should prioritize Enter over text input", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.startSearch).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
    });

    it("should prioritize search exit over text input", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        const handled = result.current.handleSearchInput("escape", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.cancelSearch).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
    });

    it("should prioritize Tab over text input", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { tab: true };

      act(() => {
        const handled = result.current.handleSearchInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.cycleScope).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
    });

    it("should prioritize Ctrl+R over text input", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleSearchInput("r", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockDependencies.toggleRegexMode).toHaveBeenCalled();
      expect(mockDependencies.handleTextInput).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleSearchInput(null as any, {});
        expect(handled).toBe(true);
      });

      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        'Ignored in search mode: "null"',
        null,
      );
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      act(() => {
        const handled = result.current.handleSearchInput(
          "test",
          undefined as any,
        );
        expect(handled).toBe(true);
      });
    });

    it("should handle broken handleTextInput function", () => {
      mockDependencies.handleTextInput = vi.fn().mockImplementation(() => {
        throw new Error("Text input error");
      });

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      expect(() => {
        act(() => {
          result.current.handleSearchInput("test", {});
        });
      }).toThrow("Text input error");
    });

    it("should handle missing dependencies gracefully", () => {
      const brokenDeps = {
        ...mockDependencies,
        startSearch: undefined as any,
      };

      const { result } = renderHook(() => useSearchHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleSearchInput("", { return: true });
        });
      }).toThrow();
    });
  });

  describe("Debug Integration", () => {
    it("should call debug callback for all handled operations", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      // Test all debug-logged operations
      const operations = [
        { input: "", key: { return: true }, expectedDebug: "Confirm search" },
        {
          input: "tab",
          key: { tab: true },
          expectedDebug: "Toggle search scope",
        },
        { input: "r", key: { ctrl: true }, expectedDebug: "Toggle regex mode" },
        {
          input: "unknown",
          key: {},
          expectedDebug: 'Ignored in search mode: "unknown"',
        },
      ];

      operations.forEach(({ input, key, expectedDebug }) => {
        vi.clearAllMocks();

        if (input === "escape") {
          mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);
        }

        act(() => {
          result.current.handleSearchInput(input, key);
        });

        expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
          expectedDebug,
          input,
        );
      });
    });

    it("should include search exit in debug logs", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      act(() => {
        result.current.handleSearchInput("escape", { escape: true });
      });

      expect(mockDependencies.updateDebugInfoCallback).toHaveBeenCalledWith(
        "Cancel search",
        "escape",
      );
    });
  });

  describe("State Management Integration", () => {
    it("should work with different search input values", () => {
      const testInputs = [
        "",
        "simple",
        "complex query",
        ".*regex.*",
        "unicode éñ🎉",
      ];

      testInputs.forEach((input) => {
        const deps = {
          ...mockDependencies,
          searchInput: input,
        };

        const { result } = renderHook(() => useSearchHandler(deps));

        act(() => {
          result.current.handleSearchInput("", { return: true });
        });

        expect(deps.startSearch).toHaveBeenCalledWith(input);
        vi.clearAllMocks();
      });
    });

    it("should work with different cursor positions", () => {
      const testPositions = [0, 5, 10, 100];

      testPositions.forEach((position) => {
        const deps = {
          ...mockDependencies,
          searchCursorPosition: position,
          searchInput: "test input",
        };

        deps.handleTextInput = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() => useSearchHandler(deps));

        act(() => {
          result.current.handleSearchInput("a", {});
        });

        expect(deps.handleTextInput).toHaveBeenCalledWith(
          { text: "test input", cursorPosition: position },
          expect.any(Object),
          {},
          "a",
        );
        vi.clearAllMocks();
      });
    });
  });

  describe("Performance and Memory", () => {
    it("should handle rapid key sequences efficiently", () => {
      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      act(() => {
        // Simulate rapid typing
        for (let i = 0; i < 100; i++) {
          result.current.handleSearchInput(
            String.fromCharCode(97 + (i % 26)),
            {},
          );
        }
      });
    });

    it("should maintain stable callback reference", () => {
      const { result, rerender } = renderHook(
        (deps) => useSearchHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleSearchInput;

      // Re-render with same dependencies
      rerender(mockDependencies);

      expect(result.current.handleSearchInput).toBe(firstCallback);
    });

    it("should update callback when dependencies change", () => {
      const { result, rerender } = renderHook(
        (deps) => useSearchHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleSearchInput;

      // Change dependencies
      const newDeps = {
        ...mockDependencies,
        startSearch: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleSearchInput).not.toBe(firstCallback);
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle complete search workflow", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      // 1. Type some text (handled by text input utility)
      act(() => {
        result.current.handleSearchInput("t", {});
        result.current.handleSearchInput("e", {});
        result.current.handleSearchInput("s", {});
        result.current.handleSearchInput("t", {});
      });

      expect(mockDependencies.handleTextInput).toHaveBeenCalledTimes(4);

      // 2. Toggle regex mode
      act(() => {
        result.current.handleSearchInput("r", { ctrl: true });
      });

      expect(mockDependencies.toggleRegexMode).toHaveBeenCalled();

      // 3. Change scope
      act(() => {
        result.current.handleSearchInput("", { tab: true });
      });

      expect(mockDependencies.cycleScope).toHaveBeenCalled();

      // 4. Confirm search
      const finalDeps = {
        ...mockDependencies,
        searchInput: "test",
      };

      const { result: finalResult } = renderHook(() =>
        useSearchHandler(finalDeps),
      );

      act(() => {
        finalResult.current.handleSearchInput("", { return: true });
      });

      expect(finalDeps.startSearch).toHaveBeenCalledWith("test");
      expect(finalDeps.resetScroll).toHaveBeenCalled();
    });

    it("should handle search cancellation workflow", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useSearchHandler(mockDependencies));

      // Type some text
      act(() => {
        result.current.handleSearchInput("t", {});
      });

      // Cancel search
      act(() => {
        result.current.handleSearchInput("escape", { escape: true });
      });

      expect(mockDependencies.cancelSearch).toHaveBeenCalled();
      expect(mockDependencies.resetScroll).toHaveBeenCalled();
    });
  });
});
