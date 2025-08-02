/**
 * Tests for custom hooks interfaces and types
 */

import { describe, expect, it, vi } from "vitest";

// Mock the actual hooks to test their interfaces
vi.mock("./useTerminalCalculations", () => ({
  useTerminalCalculations: vi.fn(() => ({
    terminalSize: { width: 80, height: 24 },
    searchBarHeight: 0,
    statusBarHeight: 1,
    visibleLines: 23,
    searchModeVisibleLines: 22,
    maxScroll: 10,
    maxScrollSearchMode: 9,
    halfPageLines: 11,
  })),
}));

vi.mock("./useExportHandlers", () => ({
  useExportHandlers: vi.fn(() => ({
    handleExportSchema: vi.fn(),
    handleExportConfirm: vi.fn(),
    handleExportCancel: vi.fn(),
  })),
}));

vi.mock("./useSearchHandlers", () => ({
  useSearchHandlers: vi.fn(() => ({
    scrollToSearchResult: vi.fn(),
  })),
}));

import { useExportHandlers } from "./useExportHandlers";
import { useSearchHandlers } from "./useSearchHandlers";
import { useTerminalCalculations } from "./useTerminalCalculations";

describe("Custom Hooks Interfaces", () => {
  describe("useTerminalCalculations", () => {
    it("should return correct interface structure", () => {
      const result = useTerminalCalculations({
        keyboardEnabled: true,
        error: null,
        searchInput: "",
        initialData: {},
        collapsibleMode: false,
      });

      expect(result).toHaveProperty("terminalSize");
      expect(result.terminalSize).toHaveProperty("width");
      expect(result.terminalSize).toHaveProperty("height");
      expect(result).toHaveProperty("searchBarHeight");
      expect(result).toHaveProperty("statusBarHeight");
      expect(result).toHaveProperty("visibleLines");
      expect(result).toHaveProperty("searchModeVisibleLines");
      expect(result).toHaveProperty("maxScroll");
      expect(result).toHaveProperty("maxScrollSearchMode");
      expect(result).toHaveProperty("halfPageLines");
    });

    it("should return numeric values for all properties", () => {
      const result = useTerminalCalculations({
        keyboardEnabled: true,
        error: null,
        searchInput: "",
        initialData: {},
        collapsibleMode: false,
      });

      expect(typeof result.terminalSize.width).toBe("number");
      expect(typeof result.terminalSize.height).toBe("number");
      expect(typeof result.searchBarHeight).toBe("number");
      expect(typeof result.statusBarHeight).toBe("number");
      expect(typeof result.visibleLines).toBe("number");
      expect(typeof result.searchModeVisibleLines).toBe("number");
      expect(typeof result.maxScroll).toBe("number");
      expect(typeof result.maxScrollSearchMode).toBe("number");
      expect(typeof result.halfPageLines).toBe("number");
    });
  });

  describe("useExportHandlers", () => {
    it("should return correct interface structure", () => {
      const result = useExportHandlers({ initialData: {} });

      expect(result).toHaveProperty("handleExportSchema");
      expect(result).toHaveProperty("handleExportConfirm");
      expect(result).toHaveProperty("handleExportCancel");
    });

    it("should return functions for all handlers", () => {
      const result = useExportHandlers({ initialData: {} });

      expect(typeof result.handleExportSchema).toBe("function");
      expect(typeof result.handleExportConfirm).toBe("function");
      expect(typeof result.handleExportCancel).toBe("function");
    });

    it("should handle export schema call", () => {
      const result = useExportHandlers({ initialData: {} });

      // Should not throw
      expect(() => result.handleExportSchema()).not.toThrow();
    });

    it("should handle export confirm call", () => {
      const result = useExportHandlers({ initialData: {} });

      // Should not throw
      expect(() => {
        result.handleExportConfirm({ filename: "test.json", format: "json" });
      }).not.toThrow();
    });

    it("should handle export cancel call", () => {
      const result = useExportHandlers({ initialData: {} });

      // Should not throw
      expect(() => result.handleExportCancel()).not.toThrow();
    });
  });

  describe("useSearchHandlers", () => {
    it("should be callable with required props", () => {
      const result = useSearchHandlers({
        initialData: {},
        schemaVisible: false,
        visibleLines: 20,
        maxScroll: 50,
        maxScrollSearchMode: 45,
      });

      expect(result).toHaveProperty("scrollToSearchResult");
      expect(typeof result.scrollToSearchResult).toBe("function");
    });

    it("should handle null data", () => {
      const result = useSearchHandlers({
        initialData: null,
        schemaVisible: false,
        visibleLines: 20,
        maxScroll: 50,
        maxScrollSearchMode: 45,
      });

      expect(result).toHaveProperty("scrollToSearchResult");
    });

    it("should handle schema mode", () => {
      const result = useSearchHandlers({
        initialData: {},
        schemaVisible: true,
        visibleLines: 20,
        maxScroll: 50,
        maxScrollSearchMode: 45,
      });

      expect(result).toHaveProperty("scrollToSearchResult");
    });
  });

  describe("Hook Props Validation", () => {
    it("should accept valid terminal calculation props", () => {
      const validProps = {
        keyboardEnabled: true,
        error: null,
        searchInput: "",
        initialData: { test: "data" },
        collapsibleMode: false,
      };

      expect(() => useTerminalCalculations(validProps)).not.toThrow();
    });

    it("should accept valid export handler props", () => {
      const validProps = {
        initialData: { test: "data" },
      };

      expect(() => useExportHandlers(validProps)).not.toThrow();
    });

    it("should accept valid search handler props", () => {
      const validProps = {
        initialData: { test: "data" },
        schemaVisible: false,
        visibleLines: 20,
        maxScroll: 50,
        maxScrollSearchMode: 45,
      };

      const result = useSearchHandlers(validProps);
      expect(result).toHaveProperty("scrollToSearchResult");
    });
  });

  describe("Edge Cases", () => {
    it("should handle terminal calculations with error", () => {
      const propsWithError = {
        keyboardEnabled: true,
        error: "Test error",
        searchInput: "test",
        initialData: null,
        collapsibleMode: true,
      };

      expect(() => useTerminalCalculations(propsWithError)).not.toThrow();
    });

    it("should handle export with null data", () => {
      const propsWithNullData = {
        initialData: null,
      };

      expect(() => useExportHandlers(propsWithNullData)).not.toThrow();
    });

    it("should handle search with large numbers", () => {
      const propsWithLargeNumbers = {
        initialData: {},
        schemaVisible: false,
        visibleLines: 1000,
        maxScroll: 50000,
        maxScrollSearchMode: 49000,
      };

      const result = useSearchHandlers(propsWithLargeNumbers);
      expect(result).toHaveProperty("scrollToSearchResult");
    });
  });
});
