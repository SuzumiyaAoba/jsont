/**
 * Comprehensive tests for navigationHandler
 *
 * Tests navigation keyboard input handling including tree view delegation,
 * collapsible mode navigation, standard scrolling, mode toggles, and goto operations.
 */

import type { KeyboardInput } from "@core/types/app";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type NavigationHandlerDependencies,
  useNavigationHandler,
} from "./navigationHandler";
import type { ICollapsibleViewerRef, IKeybindingMatcher } from "./types";

describe("useNavigationHandler", () => {
  let mockDependencies: NavigationHandlerDependencies;
  let mockKeybindings: IKeybindingMatcher;
  let mockTreeViewHandler: (input: string, key: KeyboardInput) => boolean;
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

    // Create mock tree view handler
    mockTreeViewHandler = vi.fn();

    // Create mock collapsible viewer
    mockCollapsibleViewer = {
      navigate: vi.fn(),
    };

    mockCollapsibleRef = {
      current: mockCollapsibleViewer,
    };

    mockDependencies = {
      treeViewMode: false,
      treeViewKeyboardHandler: mockTreeViewHandler,
      collapsibleMode: false,
      collapsibleViewerRef: mockCollapsibleRef,
      updateDebugInfo: vi.fn(),
      keybindings: mockKeybindings,
      halfPageLines: 10,
      setIsSearching: vi.fn(),
      setSearchInput: vi.fn(),
      setSearchCursorPosition: vi.fn(),
      resetScroll: vi.fn(),
      searchState: {
        isSearching: false,
        searchTerm: "",
      },
      maxScroll: 100,
      maxScrollSearchMode: 50,
      adjustScroll: vi.fn(),
      toggleJqMode: vi.fn(),
      jqState: { isActive: false },
      setHelpVisible: vi.fn(),
      helpVisible: false,
      openSettings: vi.fn(),
      toggleTreeView: vi.fn(),
      toggleSchema: vi.fn(),
      schemaVisible: false,
      toggleCollapsible: vi.fn(),
      toggleLineNumbers: vi.fn(),
      lineNumbersVisible: false,
      toggleDebugLogViewer: vi.fn(),
      waitingForSecondG: false,
      scrollToTop: vi.fn(),
      resetGSequence: vi.fn(),
      startGSequence: vi.fn(),
      scrollToBottom: vi.fn(),
      nextSearchResult: vi.fn(),
      previousSearchResult: vi.fn(),
    };
  });

  describe("TreeView Handler Delegation", () => {
    it("should delegate to tree view handler when in tree mode", () => {
      (mockTreeViewHandler as any).mockReturnValue(true);
      const depsWithTreeView = {
        ...mockDependencies,
        treeViewMode: true,
      };

      const { result } = renderHook(() =>
        useNavigationHandler(depsWithTreeView),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockTreeViewHandler).toHaveBeenCalledWith("j", keyInput);
      expect(depsWithTreeView.updateDebugInfo).toHaveBeenCalledWith(
        "TreeView handled",
        "j",
      );
    });

    it("should fall through to standard navigation when tree handler returns false", () => {
      (mockTreeViewHandler as any).mockReturnValue(false);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const depsWithTreeView = {
        ...mockDependencies,
        treeViewMode: true,
      };

      const { result } = renderHook(() =>
        useNavigationHandler(depsWithTreeView),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockTreeViewHandler).toHaveBeenCalledWith("j", keyInput);
      expect(depsWithTreeView.adjustScroll).toHaveBeenCalledWith(1, 100);
    });

    it("should not delegate when tree view mode is disabled", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockTreeViewHandler).not.toHaveBeenCalled();
      expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(1, 100);
    });

    it("should not delegate when tree view handler is null", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const depsWithoutHandler = {
        ...mockDependencies,
        treeViewMode: true,
        treeViewKeyboardHandler: null,
      };

      const { result } = renderHook(() =>
        useNavigationHandler(depsWithoutHandler),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(depsWithoutHandler.adjustScroll).toHaveBeenCalledWith(1, 100);
    });
  });

  describe("Collapsible Mode Navigation", () => {
    let collapsibleDeps: NavigationHandlerDependencies;

    beforeEach(() => {
      collapsibleDeps = {
        ...mockDependencies,
        collapsibleMode: true,
      };
    });

    it("should handle down arrow in collapsible mode", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = { downArrow: true };

      act(() => {
        const handled = result.current.handleNavigationInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "move_down",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Move cursor down",
        "",
      );
    });

    it("should handle up arrow in collapsible mode", () => {
      mockKeybindings.isUp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = { upArrow: true };

      act(() => {
        const handled = result.current.handleNavigationInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "move_up",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Move cursor up",
        "",
      );
    });

    it("should handle Enter key for toggle node", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = { return: true };

      act(() => {
        const handled = result.current.handleNavigationInput("", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "toggle_node",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Toggle node",
        "",
      );
    });

    it("should handle space key for toggle node", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput(" ", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "toggle_node",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Toggle node",
        " ",
      );
    });

    it("should handle 'o' key for expand node", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("o", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "expand_node",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Expand node",
        "o",
      );
    });

    it("should handle 'c' key for collapse node", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("c", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "collapse_node",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Collapse node",
        "c",
      );
    });

    it("should handle 'O' key for expand all", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("O", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "expand_all",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Expand all",
        "O",
      );
    });

    it("should handle page down in collapsible mode", () => {
      mockKeybindings.isPageDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleNavigationInput("f", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "page_down",
        count: 10,
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Page down",
        "Ctrl+f",
      );
    });

    it("should handle page up in collapsible mode", () => {
      mockKeybindings.isPageUp = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = { ctrl: true };

      act(() => {
        const handled = result.current.handleNavigationInput("b", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "page_up",
        count: 10,
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Page up",
        "Ctrl+b",
      );
    });

    it("should handle goto top in collapsible mode", () => {
      mockKeybindings.isTop = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("g", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "goto_top",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Go to top",
        "g",
      );
    });

    it("should handle goto bottom in collapsible mode", () => {
      mockKeybindings.isBottom = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("G", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "goto_bottom",
      });
      expect(collapsibleDeps.updateDebugInfo).toHaveBeenCalledWith(
        "Collapsible: Go to bottom",
        "G",
      );
    });

    it("should not handle collapsible navigation without ref", () => {
      const depsWithoutRef = {
        ...collapsibleDeps,
        collapsibleViewerRef: { current: null },
      };

      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() => useNavigationHandler(depsWithoutRef));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      // Should fall through to standard navigation
      expect(depsWithoutRef.adjustScroll).toHaveBeenCalledWith(1, 100);
    });

    it("should not trigger on Ctrl+c or Ctrl+o combinations", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const ctrlKey: KeyboardInput = { ctrl: true };

      act(() => {
        const handled1 = result.current.handleNavigationInput("c", ctrlKey);
        const handled2 = result.current.handleNavigationInput("o", ctrlKey);
        expect(handled1).toBe(false);
        expect(handled2).toBe(false);
      });

      expect(mockCollapsibleViewer.navigate).not.toHaveBeenCalled();
    });
  });

  describe("Standard Navigation Mode", () => {
    describe("Search Mode Activation", () => {
      it("should start search mode", () => {
        mockKeybindings.isSearch = vi.fn().mockReturnValue(true);

        const depsWithSearchTerm = {
          ...mockDependencies,
          searchState: { isSearching: false, searchTerm: "previous" },
        };

        const { result } = renderHook(() =>
          useNavigationHandler(depsWithSearchTerm),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("/", keyInput);
          expect(handled).toBe(true);
        });

        expect(depsWithSearchTerm.updateDebugInfo).toHaveBeenCalledWith(
          "Start search mode",
          "/",
        );
        expect(depsWithSearchTerm.setIsSearching).toHaveBeenCalledWith(true);
        expect(depsWithSearchTerm.setSearchInput).toHaveBeenCalledWith(
          "previous",
        );
        expect(depsWithSearchTerm.setSearchCursorPosition).toHaveBeenCalledWith(
          8,
        );
        expect(depsWithSearchTerm.resetScroll).toHaveBeenCalled();
      });
    });

    describe("Scroll Operations", () => {
      it("should scroll down", () => {
        mockKeybindings.isDown = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("j", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Scroll down",
          "j",
        );
        expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(1, 100);
      });

      it("should scroll up", () => {
        mockKeybindings.isUp = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("k", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Scroll up",
          "k",
        );
        expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(-1, 100);
      });

      it("should use search mode max scroll when searching", () => {
        mockKeybindings.isDown = vi.fn().mockReturnValue(true);

        const searchingDeps = {
          ...mockDependencies,
          searchState: { isSearching: true, searchTerm: "test" },
        };

        const { result } = renderHook(() =>
          useNavigationHandler(searchingDeps),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("j", keyInput);
          expect(handled).toBe(true);
        });

        expect(searchingDeps.adjustScroll).toHaveBeenCalledWith(1, 50);
      });

      it("should handle page down", () => {
        mockKeybindings.isPageDown = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = { ctrl: true };

        act(() => {
          const handled = result.current.handleNavigationInput("f", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Page down (Ctrl+f)",
          "f",
        );
        expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(10, 100);
      });

      it("should handle page up", () => {
        mockKeybindings.isPageUp = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = { ctrl: true };

        act(() => {
          const handled = result.current.handleNavigationInput("b", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Page up (Ctrl+b)",
          "b",
        );
        expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(-10, 100);
      });
    });

    describe("Mode Toggles", () => {
      it("should toggle jq mode", () => {
        mockKeybindings.isJq = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("j", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleJqMode).toHaveBeenCalled();
        expect(mockDependencies.resetScroll).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle jq mode ON",
          "j",
        );
      });

      it("should show correct jq mode status when active", () => {
        mockKeybindings.isJq = vi.fn().mockReturnValue(true);

        const jqActiveDeps = {
          ...mockDependencies,
          jqState: { isActive: true },
        };

        const { result } = renderHook(() => useNavigationHandler(jqActiveDeps));

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("j", keyInput);
          expect(handled).toBe(true);
        });

        expect(jqActiveDeps.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle jq mode OFF",
          "j",
        );
      });

      it("should toggle help", () => {
        mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("?", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.setHelpVisible).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle help ON",
          "?",
        );
      });

      it("should show correct help status when visible", () => {
        mockKeybindings.isHelp = vi.fn().mockReturnValue(true);

        const helpVisibleDeps = {
          ...mockDependencies,
          helpVisible: true,
        };

        const { result } = renderHook(() =>
          useNavigationHandler(helpVisibleDeps),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("?", keyInput);
          expect(handled).toBe(true);
        });

        expect(helpVisibleDeps.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle help OFF",
          "?",
        );
      });

      it("should open settings with P key", () => {
        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("P", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.openSettings).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Open settings",
          "P",
        );
      });

      it("should not open settings with Ctrl+P", () => {
        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = { ctrl: true };

        act(() => {
          const handled = result.current.handleNavigationInput("P", keyInput);
          expect(handled).toBe(false);
        });

        expect(mockDependencies.openSettings).not.toHaveBeenCalled();
      });

      it("should toggle tree view", () => {
        mockKeybindings.isTree = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("T", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleTreeView).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle tree view ON",
          "T",
        );
      });

      it("should toggle schema view", () => {
        mockKeybindings.isSchema = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("S", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleSchema).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle schema view ON",
          "S",
        );
      });

      it("should toggle collapsible mode", () => {
        mockKeybindings.isCollapsible = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("C", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleCollapsible).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle collapsible mode ON",
          "C",
        );
      });

      it("should toggle line numbers", () => {
        mockKeybindings.isLineNumbers = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("L", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleLineNumbers).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle line numbers ON",
          "L",
        );
      });

      it("should toggle debug log viewer", () => {
        mockKeybindings.isDebug = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("D", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.toggleDebugLogViewer).toHaveBeenCalled();
        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Toggle debug log viewer",
          "D",
        );
      });
    });

    describe("Goto Operations", () => {
      it("should start G sequence on first g", () => {
        mockKeybindings.isTop = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("g", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Start G sequence (g)",
          "g",
        );
        expect(mockDependencies.startGSequence).toHaveBeenCalled();
        expect(mockDependencies.scrollToTop).not.toHaveBeenCalled();
      });

      it("should go to top on second g", () => {
        mockKeybindings.isTop = vi.fn().mockReturnValue(true);

        const waitingDeps = {
          ...mockDependencies,
          waitingForSecondG: true,
        };

        const { result } = renderHook(() => useNavigationHandler(waitingDeps));

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("g", keyInput);
          expect(handled).toBe(true);
        });

        expect(waitingDeps.updateDebugInfo).toHaveBeenCalledWith(
          "Go to top (gg)",
          "g",
        );
        expect(waitingDeps.scrollToTop).toHaveBeenCalled();
        expect(waitingDeps.resetGSequence).toHaveBeenCalled();
      });

      it("should go to bottom with G", () => {
        mockKeybindings.isBottom = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("G", keyInput);
          expect(handled).toBe(true);
        });

        expect(mockDependencies.updateDebugInfo).toHaveBeenCalledWith(
          "Go to bottom (G)",
          "G",
        );
        expect(mockDependencies.scrollToBottom).toHaveBeenCalledWith(100);
        expect(mockDependencies.resetGSequence).toHaveBeenCalled();
      });

      it("should use search mode max scroll for goto bottom when searching", () => {
        mockKeybindings.isBottom = vi.fn().mockReturnValue(true);

        const searchingDeps = {
          ...mockDependencies,
          searchState: { isSearching: true, searchTerm: "test" },
        };

        const { result } = renderHook(() =>
          useNavigationHandler(searchingDeps),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("G", keyInput);
          expect(handled).toBe(true);
        });

        expect(searchingDeps.scrollToBottom).toHaveBeenCalledWith(50);
      });
    });

    describe("Search Navigation", () => {
      it("should go to next search result when search term exists", () => {
        mockKeybindings.isSearchNext = vi.fn().mockReturnValue(true);

        const searchDeps = {
          ...mockDependencies,
          searchState: { isSearching: false, searchTerm: "test" },
        };

        const { result } = renderHook(() => useNavigationHandler(searchDeps));

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("n", keyInput);
          expect(handled).toBe(true);
        });

        expect(searchDeps.updateDebugInfo).toHaveBeenCalledWith(
          "Next search result (n)",
          "n",
        );
        expect(searchDeps.nextSearchResult).toHaveBeenCalled();
      });

      it("should go to previous search result when search term exists", () => {
        mockKeybindings.isSearchPrevious = vi.fn().mockReturnValue(true);

        const searchDeps = {
          ...mockDependencies,
          searchState: { isSearching: false, searchTerm: "test" },
        };

        const { result } = renderHook(() => useNavigationHandler(searchDeps));

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled = result.current.handleNavigationInput("N", keyInput);
          expect(handled).toBe(true);
        });

        expect(searchDeps.updateDebugInfo).toHaveBeenCalledWith(
          "Previous search result (N)",
          "N",
        );
        expect(searchDeps.previousSearchResult).toHaveBeenCalled();
      });

      it("should not handle search navigation without search term", () => {
        mockKeybindings.isSearchNext = vi.fn().mockReturnValue(true);
        mockKeybindings.isSearchPrevious = vi.fn().mockReturnValue(true);

        const { result } = renderHook(() =>
          useNavigationHandler(mockDependencies),
        );

        const keyInput: KeyboardInput = {};

        act(() => {
          const handled1 = result.current.handleNavigationInput("n", keyInput);
          const handled2 = result.current.handleNavigationInput("N", keyInput);
          expect(handled1).toBe(false);
          expect(handled2).toBe(false);
        });

        expect(mockDependencies.nextSearchResult).not.toHaveBeenCalled();
        expect(mockDependencies.previousSearchResult).not.toHaveBeenCalled();
      });
    });
  });

  describe("Handler Priority and Fallthrough", () => {
    it("should return false when no handlers match", () => {
      // All keybindings return false
      Object.values(mockKeybindings).forEach((binding) => {
        if (typeof binding === "function") {
          binding.mockReturnValue(false);
        }
      });

      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("x", keyInput);
        expect(handled).toBe(false);
      });
    });

    it("should prioritize tree view over other handlers", () => {
      (mockTreeViewHandler as any).mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const treeModeDeps = {
        ...mockDependencies,
        treeViewMode: true,
      };

      const { result } = renderHook(() => useNavigationHandler(treeModeDeps));

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockTreeViewHandler).toHaveBeenCalled();
      expect(treeModeDeps.adjustScroll).not.toHaveBeenCalled();
    });

    it("should prioritize collapsible mode over standard navigation", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const collapsibleDeps = {
        ...mockDependencies,
        collapsibleMode: true,
      };

      const { result } = renderHook(() =>
        useNavigationHandler(collapsibleDeps),
      );

      const keyInput: KeyboardInput = {};

      act(() => {
        const handled = result.current.handleNavigationInput("j", keyInput);
        expect(handled).toBe(true);
      });

      expect(mockCollapsibleViewer.navigate).toHaveBeenCalledWith({
        type: "move_down",
      });
      expect(collapsibleDeps.adjustScroll).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      act(() => {
        const handled = result.current.handleNavigationInput(null as any, {});
        expect(handled).toBe(false);
      });
    });

    it("should handle undefined key object", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      act(() => {
        const handled = result.current.handleNavigationInput(
          "test",
          undefined as any,
        );
        expect(handled).toBe(false);
      });
    });

    it("should handle broken keybinding methods", () => {
      const brokenKeybindings = {
        ...mockKeybindings,
        isDown: undefined as any,
      };

      const brokenDeps = {
        ...mockDependencies,
        keybindings: brokenKeybindings,
      };

      const { result } = renderHook(() => useNavigationHandler(brokenDeps));

      expect(() => {
        act(() => {
          result.current.handleNavigationInput("j", {});
        });
      }).toThrow();
    });

    it("should handle special character inputs", () => {
      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      const specialChars = ["€", "🎉", "ñ", "\\", "|", "@", "#"];

      specialChars.forEach((char) => {
        act(() => {
          const handled = result.current.handleNavigationInput(char, {});
          expect(handled).toBe(false);
        });
      });
    });
  });

  describe("Callback Dependencies and Memoization", () => {
    it("should maintain stable callback reference with same dependencies", () => {
      const { result, rerender } = renderHook(
        (deps) => useNavigationHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleNavigationInput;

      rerender(mockDependencies);

      expect(result.current.handleNavigationInput).toBe(firstCallback);
    });

    it("should update callback when dependencies change", () => {
      const { result, rerender } = renderHook(
        (deps) => useNavigationHandler(deps),
        { initialProps: mockDependencies },
      );

      const firstCallback = result.current.handleNavigationInput;

      const newDeps = {
        ...mockDependencies,
        toggleJqMode: vi.fn(),
      };

      rerender(newDeps);

      expect(result.current.handleNavigationInput).not.toBe(firstCallback);
    });
  });

  describe("Performance", () => {
    it("should handle rapid key sequences efficiently", () => {
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleNavigationInput("j", {});
        }
      });

      expect(mockDependencies.adjustScroll).toHaveBeenCalledTimes(100);
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle mode switching workflow", () => {
      mockKeybindings.isTree = vi.fn().mockReturnValue(true);
      mockKeybindings.isCollapsible = vi.fn().mockReturnValue(true);
      mockKeybindings.isSchema = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      // Toggle tree view
      act(() => {
        result.current.handleNavigationInput("T", {});
      });
      expect(mockDependencies.toggleTreeView).toHaveBeenCalled();

      // Toggle collapsible mode
      act(() => {
        result.current.handleNavigationInput("C", {});
      });
      expect(mockDependencies.toggleCollapsible).toHaveBeenCalled();

      // Toggle schema view
      act(() => {
        result.current.handleNavigationInput("S", {});
      });
      expect(mockDependencies.toggleSchema).toHaveBeenCalled();
    });

    it("should handle complete navigation workflow", () => {
      mockKeybindings.isSearch = vi.fn().mockReturnValue(true);
      mockKeybindings.isDown = vi.fn().mockReturnValue(true);
      mockKeybindings.isTop = vi.fn().mockReturnValue(true);

      const { result } = renderHook(() =>
        useNavigationHandler(mockDependencies),
      );

      // Start search
      act(() => {
        result.current.handleNavigationInput("/", {});
      });
      expect(mockDependencies.setIsSearching).toHaveBeenCalledWith(true);

      // Navigate down
      act(() => {
        result.current.handleNavigationInput("j", {});
      });
      expect(mockDependencies.adjustScroll).toHaveBeenCalledWith(1, 100);

      // Go to top
      act(() => {
        result.current.handleNavigationInput("g", {});
      });
      expect(mockDependencies.startGSequence).toHaveBeenCalled();
    });
  });
});
