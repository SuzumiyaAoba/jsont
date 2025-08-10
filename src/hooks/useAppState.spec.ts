/**
 * Tests for useAppState hook
 */

import { act, renderHook } from "@testing-library/react";
import { useAppState } from "./useAppState";

describe("useAppState", () => {
  describe("Initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useAppState());

      // Scroll and navigation
      expect(result.current.scrollOffset).toBe(0);

      // JQ state
      expect(result.current.jqState).toEqual({
        isActive: false,
        query: "",
        transformedData: null,
        error: null,
        isProcessing: false,
        showOriginal: false,
      });
      expect(result.current.jqInput).toBe("");
      expect(result.current.jqCursorPosition).toBe(0);
      expect(result.current.jqFocusMode).toBe("input");

      // UI visibility state
      expect(result.current.debugVisible).toBe(false);
      expect(result.current.lineNumbersVisible).toBe(false);
      expect(result.current.schemaVisible).toBe(false);
      expect(result.current.helpVisible).toBe(false);
      expect(result.current.treeViewMode).toBe(false);
      expect(result.current.collapsibleMode).toBe(false);
      expect(result.current.debugLogViewerVisible).toBe(false);

      // Export state
      expect(result.current.exportStatus).toEqual({ isExporting: false });
      expect(result.current.exportDialog).toEqual({
        isVisible: false,
        mode: "simple",
      });

      // Debug info
      expect(result.current.debugInfo).toBe(null);

      // Navigation state
      expect(result.current.waitingForSecondG).toBe(false);
    });

    it("should provide all expected setter functions", () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.setScrollOffset).toBe("function");
      expect(typeof result.current.setJqState).toBe("function");
      expect(typeof result.current.setJqInput).toBe("function");
      expect(typeof result.current.setJqCursorPosition).toBe("function");
      expect(typeof result.current.setJqFocusMode).toBe("function");
      expect(typeof result.current.setDebugVisible).toBe("function");
      expect(typeof result.current.setLineNumbersVisible).toBe("function");
      expect(typeof result.current.setSchemaVisible).toBe("function");
      expect(typeof result.current.setHelpVisible).toBe("function");
      expect(typeof result.current.setTreeViewMode).toBe("function");
      expect(typeof result.current.setCollapsibleMode).toBe("function");
      expect(typeof result.current.setDebugLogViewerVisible).toBe("function");
      expect(typeof result.current.setExportStatus).toBe("function");
      expect(typeof result.current.setExportDialog).toBe("function");
      expect(typeof result.current.setDebugInfo).toBe("function");
      expect(typeof result.current.setWaitingForSecondG).toBe("function");
    });
  });

  describe("Scroll and navigation state", () => {
    it("should update scrollOffset", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setScrollOffset(100);
      });

      expect(result.current.scrollOffset).toBe(100);

      act(() => {
        result.current.setScrollOffset(0);
      });

      expect(result.current.scrollOffset).toBe(0);
    });

    it("should handle negative scroll offset", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setScrollOffset(-10);
      });

      expect(result.current.scrollOffset).toBe(-10);
    });
  });

  describe("JQ state management", () => {
    it("should update jqState", () => {
      const { result } = renderHook(() => useAppState());

      const newJqState = {
        isActive: true,
        query: ".users | length",
        transformedData: { count: 5 },
        error: null,
        isProcessing: false,
        showOriginal: false,
      };

      act(() => {
        result.current.setJqState(newJqState);
      });

      expect(result.current.jqState).toEqual(newJqState);
    });

    it("should update jqState with error", () => {
      const { result } = renderHook(() => useAppState());

      const errorState = {
        isActive: true,
        query: ".invalid syntax",
        transformedData: null,
        error: "Syntax error",
        isProcessing: false,
        showOriginal: false,
      };

      act(() => {
        result.current.setJqState(errorState);
      });

      expect(result.current.jqState).toEqual(errorState);
    });

    it("should update jqInput", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setJqInput(".users[0].name");
      });

      expect(result.current.jqInput).toBe(".users[0].name");
    });

    it("should update jqCursorPosition", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setJqCursorPosition(15);
      });

      expect(result.current.jqCursorPosition).toBe(15);
    });

    it("should update jqFocusMode", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setJqFocusMode("json");
      });

      expect(result.current.jqFocusMode).toBe("json");

      act(() => {
        result.current.setJqFocusMode("input");
      });

      expect(result.current.jqFocusMode).toBe("input");
    });

    it("should handle complex jq state transitions", () => {
      const { result } = renderHook(() => useAppState());

      // Start processing
      act(() => {
        result.current.setJqState({
          isActive: true,
          query: ".users",
          transformedData: null,
          error: null,
          isProcessing: true,
          showOriginal: false,
        });
      });

      expect(result.current.jqState.isProcessing).toBe(true);

      // Complete processing with success
      act(() => {
        result.current.setJqState({
          isActive: true,
          query: ".users",
          transformedData: [{ name: "Alice" }, { name: "Bob" }],
          error: null,
          isProcessing: false,
          showOriginal: false,
        });
      });

      expect(result.current.jqState.isProcessing).toBe(false);
      expect(result.current.jqState.transformedData).toHaveLength(2);
    });
  });

  describe("UI visibility state", () => {
    it("should toggle debugVisible", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setDebugVisible(true);
      });

      expect(result.current.debugVisible).toBe(true);

      act(() => {
        result.current.setDebugVisible(false);
      });

      expect(result.current.debugVisible).toBe(false);
    });

    it("should toggle lineNumbersVisible", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setLineNumbersVisible(true);
      });

      expect(result.current.lineNumbersVisible).toBe(true);
    });

    it("should toggle schemaVisible", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setSchemaVisible(true);
      });

      expect(result.current.schemaVisible).toBe(true);
    });

    it("should toggle helpVisible", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setHelpVisible(true);
      });

      expect(result.current.helpVisible).toBe(true);
    });

    it("should toggle treeViewMode", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setTreeViewMode(true);
      });

      expect(result.current.treeViewMode).toBe(true);
    });

    it("should toggle collapsibleMode", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setCollapsibleMode(true);
      });

      expect(result.current.collapsibleMode).toBe(true);
    });

    it("should toggle debugLogViewerVisible", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setDebugLogViewerVisible(true);
      });

      expect(result.current.debugLogViewerVisible).toBe(true);
    });

    it("should handle multiple UI toggles", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setDebugVisible(true);
        result.current.setLineNumbersVisible(true);
        result.current.setSchemaVisible(true);
        result.current.setHelpVisible(true);
      });

      expect(result.current.debugVisible).toBe(true);
      expect(result.current.lineNumbersVisible).toBe(true);
      expect(result.current.schemaVisible).toBe(true);
      expect(result.current.helpVisible).toBe(true);

      act(() => {
        result.current.setDebugVisible(false);
        result.current.setLineNumbersVisible(false);
        result.current.setSchemaVisible(false);
        result.current.setHelpVisible(false);
      });

      expect(result.current.debugVisible).toBe(false);
      expect(result.current.lineNumbersVisible).toBe(false);
      expect(result.current.schemaVisible).toBe(false);
      expect(result.current.helpVisible).toBe(false);
    });
  });

  describe("Export state management", () => {
    it("should update exportStatus", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setExportStatus({
          isExporting: true,
          message: "Exporting data...",
        });
      });

      expect(result.current.exportStatus).toEqual({
        isExporting: true,
        message: "Exporting data...",
      });
    });

    it("should handle export success", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setExportStatus({
          isExporting: false,
          message: "Export completed successfully",
          type: "success",
        });
      });

      expect(result.current.exportStatus).toEqual({
        isExporting: false,
        message: "Export completed successfully",
        type: "success",
      });
    });

    it("should handle export error", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setExportStatus({
          isExporting: false,
          message: "Export failed: Invalid data",
          type: "error",
        });
      });

      expect(result.current.exportStatus).toEqual({
        isExporting: false,
        message: "Export failed: Invalid data",
        type: "error",
      });
    });

    it("should update exportDialog", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setExportDialog({
          isVisible: true,
          mode: "advanced",
          selectedFormat: "csv",
          fileName: "data.csv",
        });
      });

      expect(result.current.exportDialog).toEqual({
        isVisible: true,
        mode: "advanced",
        selectedFormat: "csv",
        fileName: "data.csv",
      });
    });

    it("should close export dialog", () => {
      const { result } = renderHook(() => useAppState());

      // Open dialog first
      act(() => {
        result.current.setExportDialog({
          isVisible: true,
          mode: "simple",
        });
      });

      expect(result.current.exportDialog.isVisible).toBe(true);

      // Close dialog
      act(() => {
        result.current.setExportDialog({
          isVisible: false,
          mode: "simple",
        });
      });

      expect(result.current.exportDialog.isVisible).toBe(false);
    });
  });

  describe("Debug info management", () => {
    it("should update debugInfo", () => {
      const { result } = renderHook(() => useAppState());

      const debugInfo = {
        lastKey: "j",
        lastKeyAction: "navigate down",
        timestamp: "2023-01-01T10:00:00Z",
      };

      act(() => {
        result.current.setDebugInfo(debugInfo);
      });

      expect(result.current.debugInfo).toEqual(debugInfo);
    });

    it("should clear debugInfo", () => {
      const { result } = renderHook(() => useAppState());

      // Set debug info first
      act(() => {
        result.current.setDebugInfo({
          lastKey: "k",
          lastKeyAction: "navigate up",
          timestamp: "2023-01-01T10:00:00Z",
        });
      });

      expect(result.current.debugInfo).not.toBe(null);

      // Clear debug info
      act(() => {
        result.current.setDebugInfo(null);
      });

      expect(result.current.debugInfo).toBe(null);
    });

    it("should handle multiple debug info updates", () => {
      const { result } = renderHook(() => useAppState());

      const debugInfo1 = {
        lastKey: "j",
        lastKeyAction: "navigate down",
        timestamp: "2023-01-01T10:00:00Z",
      };

      const debugInfo2 = {
        lastKey: "k",
        lastKeyAction: "navigate up",
        timestamp: "2023-01-01T10:01:00Z",
      };

      act(() => {
        result.current.setDebugInfo(debugInfo1);
      });

      expect(result.current.debugInfo).toEqual(debugInfo1);

      act(() => {
        result.current.setDebugInfo(debugInfo2);
      });

      expect(result.current.debugInfo).toEqual(debugInfo2);
    });
  });

  describe("Navigation state", () => {
    it("should update waitingForSecondG", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setWaitingForSecondG(true);
      });

      expect(result.current.waitingForSecondG).toBe(true);

      act(() => {
        result.current.setWaitingForSecondG(false);
      });

      expect(result.current.waitingForSecondG).toBe(false);
    });

    it("should handle gg navigation sequence", () => {
      const { result } = renderHook(() => useAppState());

      // First 'g' key press
      act(() => {
        result.current.setWaitingForSecondG(true);
      });

      expect(result.current.waitingForSecondG).toBe(true);

      // Second 'g' key press (complete the sequence)
      act(() => {
        result.current.setWaitingForSecondG(false);
        result.current.setScrollOffset(0); // Go to top
      });

      expect(result.current.waitingForSecondG).toBe(false);
      expect(result.current.scrollOffset).toBe(0);
    });
  });

  describe("Complex state interactions", () => {
    it("should handle switching between modes", () => {
      const { result } = renderHook(() => useAppState());

      // Enable tree view mode
      act(() => {
        result.current.setTreeViewMode(true);
        result.current.setCollapsibleMode(false);
      });

      expect(result.current.treeViewMode).toBe(true);
      expect(result.current.collapsibleMode).toBe(false);

      // Switch to collapsible mode
      act(() => {
        result.current.setTreeViewMode(false);
        result.current.setCollapsibleMode(true);
      });

      expect(result.current.treeViewMode).toBe(false);
      expect(result.current.collapsibleMode).toBe(true);
    });

    it("should handle JQ mode activation", () => {
      const { result } = renderHook(() => useAppState());

      // Activate JQ mode
      act(() => {
        result.current.setJqState({
          isActive: true,
          query: "",
          transformedData: null,
          error: null,
          isProcessing: false,
          showOriginal: false,
        });
        result.current.setJqInput("");
        result.current.setJqFocusMode("input");
      });

      expect(result.current.jqState.isActive).toBe(true);
      expect(result.current.jqInput).toBe("");
      expect(result.current.jqFocusMode).toBe("input");

      // Deactivate JQ mode
      act(() => {
        result.current.setJqState({
          isActive: false,
          query: "",
          transformedData: null,
          error: null,
          isProcessing: false,
          showOriginal: false,
        });
      });

      expect(result.current.jqState.isActive).toBe(false);
    });

    it("should handle comprehensive state update", () => {
      const { result } = renderHook(() => useAppState());

      // Update multiple states together
      act(() => {
        result.current.setScrollOffset(50);
        result.current.setDebugVisible(true);
        result.current.setLineNumbersVisible(true);
        result.current.setTreeViewMode(true);
        result.current.setJqState({
          isActive: true,
          query: ".users",
          transformedData: [{ name: "Alice" }],
          error: null,
          isProcessing: false,
          showOriginal: false,
        });
        result.current.setExportStatus({
          isExporting: false,
          message: "Ready to export",
          type: "success",
        });
      });

      expect(result.current.scrollOffset).toBe(50);
      expect(result.current.debugVisible).toBe(true);
      expect(result.current.lineNumbersVisible).toBe(true);
      expect(result.current.treeViewMode).toBe(true);
      expect(result.current.jqState.isActive).toBe(true);
      expect(result.current.jqState.transformedData).toHaveLength(1);
      expect(result.current.exportStatus.type).toBe("success");
    });
  });

  describe("State persistence and isolation", () => {
    it("should maintain independent state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useAppState());
      const { result: result2 } = renderHook(() => useAppState());

      act(() => {
        result1.current.setScrollOffset(100);
        result2.current.setScrollOffset(200);
      });

      expect(result1.current.scrollOffset).toBe(100);
      expect(result2.current.scrollOffset).toBe(200);
    });

    it("should not interfere between different state types", () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setDebugVisible(true);
        result.current.setTreeViewMode(false);
        result.current.setScrollOffset(25);
      });

      expect(result.current.debugVisible).toBe(true);
      expect(result.current.treeViewMode).toBe(false);
      expect(result.current.scrollOffset).toBe(25);

      // Other states should remain at initial values
      expect(result.current.schemaVisible).toBe(false);
      expect(result.current.helpVisible).toBe(false);
      expect(result.current.jqInput).toBe("");
    });
  });
});
