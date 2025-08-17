/**
 * Comprehensive tests for useKeyboardHandler
 *
 * Tests the integration of all keyboard handlers including priority chain,
 * handler delegation, and mode coordination.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ICollapsibleViewerRef, IKeybindingMatcher } from "./handlers";
import {
  type KeyboardHandlerDependencies,
  useKeyboardHandler,
} from "./useKeyboardHandler";

describe("useKeyboardHandler", () => {
  let mockDependencies: KeyboardHandlerDependencies;
  let mockKeybindings: IKeybindingMatcher;
  let mockCollapsibleRef: React.RefObject<ICollapsibleViewerRef>;
  let mockCollapsibleViewer: ICollapsibleViewerRef;

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

    // Create mock collapsible viewer
    mockCollapsibleViewer = {
      navigate: vi.fn(),
    };

    mockCollapsibleRef = {
      current: mockCollapsibleViewer,
    };

    mockDependencies = {
      // Debug utilities
      updateDebugInfo: vi.fn(),
      updateDebugInfoCallback: vi.fn(),

      // App state
      helpVisible: false,
      setHelpVisible: vi.fn(),

      // Search state
      searchState: {
        isSearching: false,
        searchTerm: "",
      },
      searchInput: "",
      searchCursorPosition: 0,
      setSearchInput: vi.fn(),
      setSearchCursorPosition: vi.fn(),
      setIsSearching: vi.fn(),
      startSearch: vi.fn(),
      cancelSearch: vi.fn(),
      cycleScope: vi.fn(),
      toggleRegexMode: vi.fn(),
      nextSearchResult: vi.fn(),
      previousSearchResult: vi.fn(),

      // JQ state
      jqState: { isActive: false },
      jqInput: "",
      jqCursorPosition: 0,
      jqFocusMode: "input",
      setJqInput: vi.fn(),
      setJqCursorPosition: vi.fn(),
      setJqFocusMode: vi.fn(),
      setJqErrorScrollOffset: vi.fn(),
      handleJqTransformation: vi.fn(),
      exitJqMode: vi.fn(),
      toggleJqMode: vi.fn(),
      toggleJqView: vi.fn(),

      // Navigation state
      maxScroll: 100,
      maxScrollSearchMode: 50,
      halfPageLines: 10,
      waitingForSecondG: false,
      adjustScroll: vi.fn(),
      scrollToTop: vi.fn(),
      scrollToBottom: vi.fn(),
      resetScroll: vi.fn(),
      resetGSequence: vi.fn(),
      startGSequence: vi.fn(),

      // View modes
      treeViewMode: false,
      collapsibleMode: false,
      schemaVisible: false,
      lineNumbersVisible: false,
      toggleTreeView: vi.fn(),
      toggleCollapsible: vi.fn(),
      toggleSchema: vi.fn(),
      toggleLineNumbers: vi.fn(),
      toggleDebugLogViewer: vi.fn(),
      openSettings: vi.fn(),

      // Handlers from child components
      treeViewKeyboardHandler: vi.fn(),
      collapsibleViewerRef: mockCollapsibleRef,

      // Utilities
      keybindings: mockKeybindings,
      handleTextInput: vi.fn().mockReturnValue(false),
      handleExportSchema: vi.fn(),
      handleExportData: vi.fn(),
      exit: vi.fn(),
    };
  });

  describe("Handler Priority Chain", () => {
    it("should prioritize global commands first", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleKeyInput("c", keyInput);
      });

      // Global handler should handle Ctrl+C and exit
      expect(mockDependencies.exit).toHaveBeenCalled();
      expect(mockDependencies.adjustScroll).not.toHaveBeenCalled();
    });

    it("should prioritize help mode over other modes", () => {
      const helpDeps = {
        ...mockDependencies,
        helpVisible: true,
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(helpDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      // Help handler should block navigation
      expect(helpDeps.adjustScroll).not.toHaveBeenCalled();
      // Input should be blocked but handled
    });

    it("should prioritize search mode over navigation", () => {
      const searchDeps = {
        ...mockDependencies,
        searchState: { isSearching: true, searchTerm: "" },
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(searchDeps));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        result.current.handleKeyInput("", keyInput);
      });

      // Search handler should handle Enter to confirm search
      expect(searchDeps.startSearch).toHaveBeenCalled();
      expect(searchDeps.adjustScroll).not.toHaveBeenCalled();
    });

    it("should prioritize jq mode over navigation", () => {
      const jqDeps = {
        ...mockDependencies,
        jqState: { isActive: true },
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(jqDeps));

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        result.current.handleKeyInput("", keyInput);
      });

      // JQ handler should handle Enter to execute transformation
      expect(jqDeps.handleJqTransformation).toHaveBeenCalled();
      expect(jqDeps.adjustScroll).not.toHaveBeenCalled();
    });

    it("should fall through to navigation mode as default", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      // Navigation handler should handle default movement
      expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(1, 100);
    });
  });

  describe("Mode Switching Integration", () => {
    it("should switch from navigation to search mode", () => {
      mockKeybindings.isSearch = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("/", keyInput);
      });

      expect(mockDependencies.setIsSearching).toHaveBeenCalledWith(true);
    });

    it("should switch from navigation to jq mode", () => {
      mockKeybindings.isJq = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      expect(mockDependencies.toggleJqMode).toHaveBeenCalled();
    });

    it("should switch from navigation to help mode", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("?", keyInput);
      });

      expect(mockDependencies.setHelpVisible).toHaveBeenCalled();
    });

    it("should exit search mode and return to navigation", () => {
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);

      const searchDeps = {
        ...mockDependencies,
        searchState: { isSearching: true, searchTerm: "" },
      };

      const { result } = renderHook(() => useKeyboardHandler(searchDeps));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleKeyInput("", keyInput);
      });

      expect(searchDeps.cancelSearch).toHaveBeenCalled();
    });

    it("should exit jq mode and return to navigation", () => {
      const jqDeps = {
        ...mockDependencies,
        jqState: { isActive: true },
      };

      const { result } = renderHook(() => useKeyboardHandler(jqDeps));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleKeyInput("", keyInput);
      });

      expect(jqDeps.exitJqMode).toHaveBeenCalled();
    });

    it("should exit help mode and return to navigation", () => {
      const helpDeps = {
        ...mockDependencies,
        helpVisible: true,
      };

      const { result } = renderHook(() => useKeyboardHandler(helpDeps));

      const keyInput: KeyboardInput = { escape: true };

      act(() => {
        result.current.handleKeyInput("", keyInput);
      });

      expect(helpDeps.setHelpVisible).toHaveBeenCalledWith(false);
    });
  });

  describe("Handler Delegation", () => {
    it("should delegate to tree view handler when available", () => {
      const treeDeps = {
        ...mockDependencies,
        treeViewMode: true,
        treeViewKeyboardHandler: vi.fn().mockReturnValue(true),
      };

      const { result } = renderHook(() => useKeyboardHandler(treeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      expect(treeDeps.treeViewKeyboardHandler).toHaveBeenCalledWith(
        "j",
        keyInput,
      );
    });

    it("should delegate to collapsible viewer when in collapsible mode", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const collapsibleDeps = {
        ...mockDependencies,
        collapsibleMode: true,
      };

      const { result } = renderHook(() => useKeyboardHandler(collapsibleDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "move_down",
      });
    });

    it("should handle text input in search mode", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const searchDeps = {
        ...mockDependencies,
        searchState: { isSearching: true, searchTerm: "" },
      };

      const { result } = renderHook(() => useKeyboardHandler(searchDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("a", keyInput);
      });

      expect(searchDeps.handleTextInput).toHaveBeenCalled();
    });

    it("should handle text input in jq mode", () => {
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const jqDeps = {
        ...mockDependencies,
        jqState: { isActive: true },
        jqFocusMode: "input" as const,
      };

      const { result } = renderHook(() => useKeyboardHandler(jqDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("a", keyInput);
      });

      expect(jqDeps.handleTextInput).toHaveBeenCalled();
    });
  });

  describe("Multiple Mode Scenarios", () => {
    it("should handle global commands even when in search mode", () => {
      const searchDeps = {
        ...mockDependencies,
        searchState: { isSearching: true, searchTerm: "" },
      };

      const { result } = renderHook(() => useKeyboardHandler(searchDeps));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleKeyInput("c", keyInput);
      });

      // Global handler should still work
      expect(searchDeps.exit).toHaveBeenCalled();
      expect(searchDeps.startSearch).not.toHaveBeenCalled();
    });

    it("should handle global commands even when in jq mode", () => {
      const jqDeps = {
        ...mockDependencies,
        jqState: { isActive: true },
      };

      const { result } = renderHook(() => useKeyboardHandler(jqDeps));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleKeyInput("c", keyInput);
      });

      // Global handler should still work
      expect(jqDeps.exit).toHaveBeenCalled();
      expect(jqDeps.handleJqTransformation).not.toHaveBeenCalled();
    });

    it("should handle global commands even when help is visible", () => {
      const helpDeps = {
        ...mockDependencies,
        helpVisible: true,
      };

      const { result } = renderHook(() => useKeyboardHandler(helpDeps));

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        result.current.handleKeyInput("c", keyInput);
      });

      // Global handler should still work
      expect(helpDeps.exit).toHaveBeenCalled();
      expect(helpDeps.setHelpVisible).not.toHaveBeenCalled();
    });

    it("should block navigation when multiple modes are active", () => {
      // This shouldn't happen in practice, but test defensive behavior
      const multiModeDeps = {
        ...mockDependencies,
        helpVisible: true,
        searchState: { isSearching: true, searchTerm: "" },
        jqState: { isActive: true },
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(multiModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        result.current.handleKeyInput("j", keyInput);
      });

      // Help should block everything else
      expect(multiModeDeps.adjustScroll).not.toHaveBeenCalled();
      expect(multiModeDeps.startSearch).not.toHaveBeenCalled();
      expect(multiModeDeps.handleJqTransformation).not.toHaveBeenCalled();
    });
  });

  describe("Handler Return Values", () => {
    it("should return all individual handlers", () => {
      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      expect(result.current.handleKeyInput).toBeDefined();
      expect(result.current.handleNavigationInput).toBeDefined();
      expect(result.current.handleSearchInput).toBeDefined();
      expect(result.current.handleJqInput).toBeDefined();
      expect(result.current.handleHelpInput).toBeDefined();
      expect(result.current.handleGlobalInput).toBeDefined();
    });

    it("should maintain stable handler references", () => {
      const { result, rerender } = renderHook(
        (deps) => useKeyboardHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstHandlers = { ...result.current };

      rerender(mockDependencies);

      // All handlers should be the same reference
      expect(result.current.handleKeyInput).toBe(firstHandlers.handleKeyInput);
      expect(result.current.handleNavigationInput).toBe(
        firstHandlers.handleNavigationInput,
      );
      expect(result.current.handleSearchInput).toBe(
        firstHandlers.handleSearchInput,
      );
      expect(result.current.handleJqInput).toBe(firstHandlers.handleJqInput);
      expect(result.current.handleHelpInput).toBe(
        firstHandlers.handleHelpInput,
      );
      expect(result.current.handleGlobalInput).toBe(
        firstHandlers.handleGlobalInput,
      );
    });

    it("should update handlers when dependencies change", () => {
      const { result, rerender } = renderHook(
        (deps) => useKeyboardHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstHandler = result.current.handleKeyInput;

      const newDeps = {
        ...mockDependencies,
        exit: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleKeyInput).not.toBe(firstHandler);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      expect(() => {
        act(() => {
          result.current.handleKeyInput(null as any, {});
        });
      }).not.toThrow();
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      expect(() => {
        act(() => {
          result.current.handleKeyInput("test", undefined as any);
        });
      }).not.toThrow();
    });

    it("should handle broken child handlers gracefully", () => {
      const brokenDeps = {
        ...mockDependencies,
        exit: undefined as any,
      };

      const { result } = renderHook(() => useKeyboardHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleKeyInput("c", { ctrl: true });
        });
      }).toThrow();
    });

    it("should handle missing optional handlers", () => {
      const depsWithoutTreeHandler = {
        ...mockDependencies,
        treeViewKeyboardHandler: null,
        treeViewMode: true,
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useKeyboardHandler(depsWithoutTreeHandler),
      );

      expect(() => {
        act(() => {
          result.current.handleKeyInput("j", {});
        });
      }).not.toThrow();

      expect(depsWithoutTreeHandler.adjustScroll).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should handle rapid key sequences efficiently", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleKeyInput("j", {});
        }
      });

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(mockDependencies.adjustScroll).toHaveBeenCalledTimes(100);
    });

    it("should efficiently route to correct handlers", () => {
      mockKeybindings.isQuit = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      const startTime = Date.now();

      act(() => {
        // Test global handler efficiency
        for (let i = 0; i < 50; i++) {
          result.current.handleKeyInput("q", {});
        }
      });

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(mockDependencies.exit).toHaveBeenCalledTimes(50);
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle complete workflow from navigation to search and back", () => {
      mockKeybindings.isSearch = vi.fn().mockReturnValue(true);
      mockKeybindings.isSearchExit = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      // Start in navigation mode - movement should work
      act(() => {
        result.current.handleKeyInput("j", {});
      });
      expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(1, 100);

      // Switch to search mode
      act(() => {
        result.current.handleKeyInput("/", {});
      });
      expect(mockDependencies.setIsSearching).toHaveBeenCalledWith(true);

      // In search mode - navigation should be blocked
      const searchDeps = {
        ...mockDependencies,
        searchState: { isSearching: true, searchTerm: "" },
      };

      const { result: searchResult } = renderHook(() =>
        useKeyboardHandler(searchDeps),
      );

      vi.clearAllMocks();

      act(() => {
        searchResult.current.handleKeyInput("j", {});
      });
      expect(searchDeps.adjustScroll).not.toHaveBeenCalled();

      // Exit search mode
      act(() => {
        searchResult.current.handleKeyInput("", { escape: true });
      });
      expect(searchDeps.cancelSearch).toHaveBeenCalled();
    });

    it("should handle workflow from navigation to jq mode", () => {
      mockKeybindings.isJq = vi.fn().mockReturnValue(true);
      mockDependencies.handleTextInput = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      // Switch to jq mode
      act(() => {
        result.current.handleKeyInput("j", {});
      });
      expect(mockDependencies.toggleJqMode).toHaveBeenCalled();

      // Test jq mode functionality
      const jqDeps = {
        ...mockDependencies,
        jqState: { isActive: true },
        jqFocusMode: "input" as const,
      };

      const { result: jqResult } = renderHook(() => useKeyboardHandler(jqDeps));

      // Type query
      act(() => {
        jqResult.current.handleKeyInput(".", {});
      });
      expect(jqDeps.handleTextInput).toHaveBeenCalled();

      // Execute query
      act(() => {
        jqResult.current.handleKeyInput("", { return: true });
      });
      expect(jqDeps.handleJqTransformation).toHaveBeenCalled();

      // Exit jq mode
      act(() => {
        jqResult.current.handleKeyInput("", { escape: true });
      });
      expect(jqDeps.exitJqMode).toHaveBeenCalled();
    });

    it("should handle help mode workflow", () => {
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      // Open help
      act(() => {
        result.current.handleKeyInput("?", {});
      });
      expect(mockDependencies.setHelpVisible).toHaveBeenCalled();

      // Test help mode blocking
      const helpDeps = {
        ...mockDependencies,
        helpVisible: true,
      };

      const { result: helpResult } = renderHook(() =>
        useKeyboardHandler(helpDeps),
      );

      // Navigation should be blocked
      act(() => {
        helpResult.current.handleKeyInput("j", {});
      });
      expect(helpDeps.adjustScroll).not.toHaveBeenCalled();

      // Close help
      act(() => {
        helpResult.current.handleKeyInput("", { escape: true });
      });
      expect(helpDeps.setHelpVisible).toHaveBeenCalledWith(false);
    });

    it("should handle emergency exit from any mode", () => {
      const allModesDeps = {
        ...mockDependencies,
        helpVisible: true,
        searchState: { isSearching: true, searchTerm: "test" },
        jqState: { isActive: true },
      };

      const { result } = renderHook(() => useKeyboardHandler(allModesDeps));

      // Ctrl+C should work from any mode
      act(() => {
        result.current.handleKeyInput("c", { ctrl: true });
      });

      expect(allModesDeps.exit).toHaveBeenCalled();
    });
  });

  describe("Handler Coordination", () => {
    it("should coordinate between handlers without conflicts", () => {
      mockKeybindings.isSearch = vi.fn().mockReturnValue(true);
      mockKeybindings.isJq = vi.fn().mockReturnValue(true);
      mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      // Each mode switch should work independently
      act(() => {
        result.current.handleKeyInput("/", {}); // Search
      });
      expect(mockDependencies.setIsSearching).toHaveBeenCalledWith(true);

      vi.clearAllMocks();

      act(() => {
        result.current.handleKeyInput("j", {}); // JQ
      });
      expect(mockDependencies.toggleJqMode).toHaveBeenCalled();

      vi.clearAllMocks();

      act(() => {
        result.current.handleKeyInput("?", {}); // Help
      });
      expect(mockDependencies.setHelpVisible).toHaveBeenCalled();
    });

    it("should maintain handler state consistency", () => {
      const { result } = renderHook(() => useKeyboardHandler(mockDependencies));

      // Get all handlers
      const handlers = {
        main: result.current.handleKeyInput,
        navigation: result.current.handleNavigationInput,
        search: result.current.handleSearchInput,
        jq: result.current.handleJqInput,
        help: result.current.handleHelpInput,
        global: result.current.handleGlobalInput,
      };

      // All handlers should be functions
      Object.values(handlers).forEach((handler) => {
        expect(typeof handler).toBe("function");
      });

      // Handlers should work independently
      expect(() => {
        act(() => {
          handlers.global("c", { ctrl: true });
        });
      }).not.toThrow();

      expect(mockDependencies.exit).toHaveBeenCalled();
    });
  });
});
