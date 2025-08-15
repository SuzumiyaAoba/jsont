/**
 * Regression tests for useTerminalCalculations based on past bugs
 *
 * This test suite focuses on critical bugs that occurred in the past:
 * 1. Inconsistent line count calculation between useTerminalCalculations and JsonViewer
 * 2. MaxScroll calculation errors causing last lines not to display
 * 3. JSON line processing not matching JsonViewer's data processor
 */

import { DEFAULT_CONFIG } from "@core/config/defaults";
import type { JsonValue } from "@core/types";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTerminalCalculations } from "./useTerminalCalculations";

// Mock the required hooks and context
vi.mock("@core/context/ConfigContext", () => ({
  useConfig: () => DEFAULT_CONFIG,
}));

vi.mock("@store/hooks/useSearch", () => ({
  useSearchState: () => ({
    isSearching: false,
    searchTerm: "",
    searchResults: [],
    currentResultIndex: 0,
  }),
}));

vi.mock("@store/hooks/useJq", () => ({
  useJqState: () => ({
    isActive: false,
    query: "",
    result: null,
    error: null,
  }),
}));

vi.mock("@store/hooks/useDebug", () => ({
  useDebugInfo: () => [null],
}));

vi.mock("@store/hooks/useUI", () => ({
  useUI: () => ({
    debugVisible: false,
    helpVisible: false,
    schemaVisible: true, // Enable schema visible for schema tests
    treeViewMode: false,
    collapsibleMode: false,
  }),
}));

vi.mock("@features/property-details/hooks/usePropertyDetails", () => ({
  usePropertyDetails: () => ({
    config: { enabled: false },
    details: null,
  }),
}));

vi.mock("@features/schema/utils/schemaUtils", () => ({
  inferJsonSchema: () => ({ type: "object" }),
  formatJsonSchema: () => '{\n  "type": "object"\n}',
}));

describe("useTerminalCalculations Regression Tests", () => {
  describe("JSON Line Count Calculation Consistency", () => {
    it("should calculate JSON lines consistently with JsonViewer data processor", () => {
      // This test addresses the bug where useTerminalCalculations used simple
      // JSON.stringify().split("\n").length while JsonViewer used a more complex
      // data processor that splits long lines

      const testData: JsonValue = {
        name: "test",
        longDescription:
          "This is a very long description that exceeds the maxLineLength setting and should be split into multiple lines by the data processor",
        array: ["item1", "item2", "item3"],
        nested: {
          property: "value",
        },
      };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // Should calculate jsonLines using the same logic as JsonViewer
      expect(result.current.jsonLines).toBeGreaterThan(0);

      // The line count should account for line splitting due to maxLineLength
      // Original JSON.stringify would give fewer lines than the processed version
      const simpleLineCount = JSON.stringify(testData, null, 2).split(
        "\n",
      ).length;
      expect(result.current.jsonLines).toBeGreaterThanOrEqual(simpleLineCount);
    });

    it("should handle maxLineLength correctly in line calculations", () => {
      // Test with data that will definitely be split due to long lines
      const testData: JsonValue = {
        veryLongPropertyNameThatExceedsMaxLength:
          "This is an extremely long value that will definitely be split across multiple lines when the maxLineLength constraint is applied during JSON processing and rendering",
        another: "short",
      };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      const simpleLineCount = JSON.stringify(testData, null, 2).split(
        "\n",
      ).length;

      // Processed lines should be more than simple count due to splitting
      expect(result.current.jsonLines).toBeGreaterThan(simpleLineCount);
    });

    it("should calculate maxScroll correctly to display all content", () => {
      // This addresses the bug where maxScroll was calculated incorrectly,
      // causing the last lines of JSON not to be displayed

      const testData: JsonValue = {
        line1: "content1",
        line2: "content2",
        line3: "content3",
        line4: "content4",
        line5: "content5",
        line6: "content6",
        line7: "content7",
        line8: "content8",
        line9: "content9",
        line10: "content10",
      };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // maxScroll should be calculated as jsonLines - visibleLines
      const expectedMaxScroll = Math.max(
        0,
        result.current.jsonLines - result.current.visibleLines,
      );
      expect(result.current.maxScroll).toBe(expectedMaxScroll);

      // Should ensure that scrolling to maxScroll displays the last line
      expect(result.current.maxScroll).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Terminal Size and Height Calculations", () => {
    it("should not double-subtract border heights", () => {
      // This addresses the bug where border heights were subtracted both in
      // useTerminalCalculations and in BaseViewer, causing insufficient height

      const testData: JsonValue = { simple: "test" };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // visibleLines should already account for all UI elements
      // and should not be further reduced in BaseViewer
      expect(result.current.visibleLines).toBeGreaterThan(0);
      expect(result.current.visibleLines).toBeLessThanOrEqual(
        result.current.terminalSize.height,
      );
    });

    it("should handle small terminal sizes gracefully", () => {
      const testData: JsonValue = { test: "data" };

      // Mock a small terminal size
      const originalRows = process.stdout.rows;
      const originalCols = process.stdout.columns;

      // @ts-ignore - Mocking process.stdout for testing
      process.stdout.rows = 10;
      // @ts-ignore - Mocking process.stdout for testing
      process.stdout.columns = 40;

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // Should maintain minimum visible lines even in small terminals
      expect(result.current.visibleLines).toBeGreaterThanOrEqual(5);

      // Restore original values
      // @ts-ignore
      process.stdout.rows = originalRows;
      // @ts-ignore
      process.stdout.columns = originalCols;
    });
  });

  describe("Schema Mode Line Calculations", () => {
    it("should calculate schema lines correctly when in schema view", () => {
      const testData: JsonValue = {
        complex: {
          nested: {
            structure: ["with", "arrays", "and", "objects"],
          },
        },
      };

      const { result, rerender } = renderHook(
        (props) => useTerminalCalculations(props),
        {
          initialProps: {
            keyboardEnabled: true,
            error: null,
            initialData: testData,
            collapsibleMode: false,
          },
        },
      );

      // Should have schema lines calculated
      expect(result.current.schemaLines).toBeGreaterThan(0);

      // Should use schema lines for scroll calculation when in schema view
      expect(result.current.currentDataLines).toBe(result.current.schemaLines);
    });
  });

  describe("Search Mode Calculations", () => {
    it("should adjust visible lines correctly for search mode", () => {
      const testData: JsonValue = { test: "data" };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // searchModeVisibleLines should be less than regular visibleLines
      // to account for search bar height
      expect(result.current.searchModeVisibleLines).toBeLessThanOrEqual(
        result.current.visibleLines,
      );
      expect(result.current.searchModeVisibleLines).toBeGreaterThan(0);
    });

    it("should calculate maxScrollSearchMode correctly", () => {
      const testData: JsonValue = {
        searchable1: "content",
        searchable2: "more content",
        searchable3: "even more content",
      };

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: testData,
          collapsibleMode: false,
        }),
      );

      // maxScrollSearchMode should account for reduced visible lines in search mode
      const expectedMaxScrollSearchMode = Math.max(
        0,
        result.current.currentDataLines - result.current.searchModeVisibleLines,
      );
      expect(result.current.maxScrollSearchMode).toBe(
        expectedMaxScrollSearchMode,
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null/undefined initial data", () => {
      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: null,
          collapsibleMode: false,
        }),
      );

      expect(result.current.jsonLines).toBe(0);
      expect(result.current.maxScroll).toBe(0);
      expect(result.current.maxScrollSearchMode).toBe(0);
    });

    it("should handle unstringifiable objects gracefully", () => {
      const circularRef: any = { name: "test" };
      circularRef.self = circularRef; // Create circular reference

      const { result } = renderHook(() =>
        useTerminalCalculations({
          keyboardEnabled: true,
          error: null,
          initialData: circularRef,
          collapsibleMode: false,
        }),
      );

      // Should fallback to reasonable default
      expect(result.current.jsonLines).toBe(100);
    });

    it("should maintain consistent calculations across re-renders", () => {
      const testData: JsonValue = { stable: "data" };

      const { result, rerender } = renderHook(
        (props) => useTerminalCalculations(props),
        {
          initialProps: {
            keyboardEnabled: true,
            error: null,
            initialData: testData,
            collapsibleMode: false,
          },
        },
      );

      const firstRender = {
        jsonLines: result.current.jsonLines,
        visibleLines: result.current.visibleLines,
        maxScroll: result.current.maxScroll,
      };

      // Re-render with same props
      rerender({
        keyboardEnabled: true,
        error: null,
        initialData: testData,
        collapsibleMode: false,
      });

      // Should maintain same values
      expect(result.current.jsonLines).toBe(firstRender.jsonLines);
      expect(result.current.visibleLines).toBe(firstRender.visibleLines);
      expect(result.current.maxScroll).toBe(firstRender.maxScroll);
    });
  });
});
