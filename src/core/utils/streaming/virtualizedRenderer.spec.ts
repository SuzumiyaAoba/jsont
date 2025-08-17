/**
 * Tests for VirtualizedJsonRenderer
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  type VirtualizedItem,
  VirtualizedJsonRenderer,
  type VirtualizedRenderOptions,
} from "./virtualizedRenderer";

describe("VirtualizedJsonRenderer", () => {
  let renderer: VirtualizedJsonRenderer;
  const defaultOptions: VirtualizedRenderOptions = {
    viewportHeight: 20,
    itemHeight: 1,
    overscan: 5,
    maxItems: 10000,
    showLineNumbers: true,
    initialExpandLevel: 2,
  };

  beforeEach(() => {
    renderer = new VirtualizedJsonRenderer(defaultOptions);
  });

  describe("Initialization", () => {
    it("should initialize with simple object", () => {
      const data = { name: "test", value: 42 };
      renderer.initialize(data);

      const window = renderer.getCurrentWindow();
      expect(window.totalItems).toBeGreaterThan(0);
      expect(window.visibleItems.length).toBeGreaterThan(0);
    });

    it("should initialize with array", () => {
      const data = [1, 2, 3, "test"];
      renderer.initialize(data);

      const window = renderer.getCurrentWindow();
      expect(window.totalItems).toBeGreaterThan(0);
    });

    it("should initialize with nested structure", () => {
      const data = {
        users: [
          { id: 1, name: "John", profile: { age: 30 } },
          { id: 2, name: "Jane", profile: { age: 25 } },
        ],
        metadata: { total: 2 },
      };

      renderer.initialize(data);

      const window = renderer.getCurrentWindow();
      expect(window.totalItems).toBeGreaterThan(5); // Should have multiple items
    });

    it("should handle primitive values", () => {
      const primitives = [42, "string", true, null];

      primitives.forEach((data) => {
        renderer.initialize(data);
        const window = renderer.getCurrentWindow();
        expect(window.totalItems).toBe(1);
      });
    });
  });

  describe("Windowing", () => {
    beforeEach(() => {
      // Create data with many items
      const data = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          details: { value: i * 2 },
        })),
      };
      renderer.initialize(data);
    });

    it("should provide correct window for viewport", () => {
      const window = renderer.getCurrentWindow();

      expect(window.startIndex).toBeGreaterThanOrEqual(0);
      expect(window.endIndex).toBeGreaterThan(window.startIndex);
      expect(window.visibleItems.length).toBeGreaterThan(0);
      expect(window.totalItems).toBeGreaterThan(50); // Should have many items
    });

    it("should scroll to specific index", () => {
      const targetIndex = 50;
      renderer.scrollToIndex(targetIndex);

      const window = renderer.getCurrentWindow();
      expect(window.startIndex).toBeLessThanOrEqual(targetIndex);
      expect(window.endIndex).toBeGreaterThanOrEqual(targetIndex);
    });

    it("should scroll by relative amount", () => {
      const initialWindow = renderer.getCurrentWindow();
      const initialOffset = initialWindow.scrollOffset;

      renderer.scrollBy(10);

      const newWindow = renderer.getCurrentWindow();
      expect(newWindow.scrollOffset).toBeGreaterThan(initialOffset);
    });

    it("should handle scroll bounds correctly", () => {
      // Scroll beyond bounds
      renderer.scrollToIndex(-10);
      let window = renderer.getCurrentWindow();
      expect(window.startIndex).toBe(0);

      // Scroll to very large index
      renderer.scrollToIndex(999999);
      window = renderer.getCurrentWindow();
      expect(window.startIndex).toBeLessThan(window.totalItems);
    });
  });

  describe("Expansion and Collapse", () => {
    let rootItem: VirtualizedItem;

    beforeEach(() => {
      const data = {
        expandable: {
          nested: {
            deep: ["item1", "item2", "item3"],
          },
        },
        simple: "value",
      };
      renderer.initialize(data);

      // Find an expandable item
      const window = renderer.getCurrentWindow();
      rootItem = window.visibleItems.find(
        (item) => item.type === "object" && item.key === "expandable",
      )!;
    });

    it("should toggle expansion of objects", () => {
      expect(rootItem).toBeDefined();
      expect(rootItem.type).toBe("object");

      const initialTotal = renderer.getTotalItems();
      const success = renderer.toggleExpansion(rootItem.id);

      expect(success).toBe(true);

      // Total items should change after expansion/collapse
      const newTotal = renderer.getTotalItems();
      expect(newTotal).not.toBe(initialTotal);
    });

    it("should not toggle expansion of primitive values", () => {
      const window = renderer.getCurrentWindow();
      const primitiveItem = window.visibleItems.find(
        (item) => item.type === "value",
      );

      if (primitiveItem) {
        const success = renderer.toggleExpansion(primitiveItem.id);
        expect(success).toBe(false);
      }
    });

    it("should expand to specific depth", () => {
      const initialTotal = renderer.getTotalItems();

      renderer.expandToDepth(3);

      const newTotal = renderer.getTotalItems();
      expect(newTotal).toBeGreaterThanOrEqual(initialTotal);
    });

    it("should collapse all items", () => {
      // First expand some items
      renderer.expandToDepth(5);
      const expandedTotal = renderer.getTotalItems();

      // Then collapse all
      renderer.collapseAll();
      const collapsedTotal = renderer.getTotalItems();

      expect(collapsedTotal).toBeLessThan(expandedTotal);
    });
  });

  describe("Search", () => {
    beforeEach(() => {
      const data = {
        users: [
          { name: "John Doe", email: "john@example.com" },
          { name: "Jane Smith", email: "jane@example.com" },
        ],
        settings: { theme: "dark", language: "en" },
      };
      renderer.initialize(data);
    });

    it("should find items by key", () => {
      const results = renderer.search("name");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should find items by value", () => {
      const results = renderer.search("John");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle case sensitivity", () => {
      const caseSensitiveResults = renderer.search("JOHN", true);
      const caseInsensitiveResults = renderer.search("JOHN", false);

      expect(caseInsensitiveResults.length).toBeGreaterThanOrEqual(
        caseSensitiveResults.length,
      );
    });

    it("should return empty array for non-existent search term", () => {
      const results = renderer.search("nonexistent");
      expect(results).toHaveLength(0);
    });
  });

  describe("Item Formatting", () => {
    beforeEach(() => {
      const data = {
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        object: { nested: "value" },
        array: [1, 2, 3],
      };
      renderer.initialize(data);
    });

    it("should format different value types correctly", () => {
      const window = renderer.getCurrentWindow();

      const stringItem = window.visibleItems.find(
        (item) => item.type === "value" && typeof item.value === "string",
      );
      if (stringItem) {
        const formatted = renderer.formatItem(stringItem, 1);
        expect(formatted).toContain('"test"');
      }

      const numberItem = window.visibleItems.find(
        (item) => item.type === "value" && typeof item.value === "number",
      );
      if (numberItem) {
        const formatted = renderer.formatItem(numberItem, 2);
        expect(formatted).toContain("42");
      }

      const booleanItem = window.visibleItems.find(
        (item) => item.type === "value" && typeof item.value === "boolean",
      );
      if (booleanItem) {
        const formatted = renderer.formatItem(booleanItem, 3);
        expect(formatted).toContain("true");
      }

      const nullItem = window.visibleItems.find(
        (item) => item.type === "value" && item.value === null,
      );
      if (nullItem) {
        const formatted = renderer.formatItem(nullItem, 4);
        expect(formatted).toContain("null");
      }
    });

    it("should show line numbers when enabled", () => {
      const window = renderer.getCurrentWindow();
      const item = window.visibleItems[0];

      const formatted = renderer.formatItem(item, 5);
      expect(formatted).toContain("5:");
    });

    it("should show expansion indicators for containers", () => {
      const window = renderer.getCurrentWindow();
      const objectItem = window.visibleItems.find(
        (item) => item.type === "object",
      );

      if (objectItem) {
        const formatted = renderer.formatItem(objectItem);
        expect(formatted).toMatch(/[▼▶]/); // Should contain expansion indicator
      }
    });

    it("should show correct indentation for nested items", () => {
      renderer.expandToDepth(2);
      const window = renderer.getCurrentWindow();

      const rootItem = window.visibleItems.find((item) => item.depth === 0);
      const nestedItem = window.visibleItems.find((item) => item.depth === 1);

      if (rootItem && nestedItem) {
        const rootFormatted = renderer.formatItem(rootItem);
        const nestedFormatted = renderer.formatItem(nestedItem);

        // Nested item should have more indentation
        const rootIndentCount = (rootFormatted.match(/ {2}/g) || []).length;
        const nestedIndentCount = (nestedFormatted.match(/ {2}/g) || []).length;
        expect(nestedIndentCount).toBeGreaterThan(rootIndentCount);
      }
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      // Create large dataset
      const largeData = {
        items: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: Array.from({ length: 10 }, (_, j) => ({ value: i * j })),
        })),
      };

      const startTime = performance.now();
      renderer.initialize(largeData);
      const initTime = performance.now() - startTime;

      expect(initTime).toBeLessThan(1000); // Should initialize within 1 second

      // Test scrolling performance
      const scrollStart = performance.now();
      for (let i = 0; i < 100; i++) {
        renderer.scrollToIndex(i * 10);
      }
      const scrollTime = performance.now() - scrollStart;

      expect(scrollTime).toBeLessThan(100); // Should scroll efficiently
    });

    it("should respect maxItems limit", () => {
      const limitedRenderer = new VirtualizedJsonRenderer({
        ...defaultOptions,
        maxItems: 100,
      });

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i })),
      };

      limitedRenderer.initialize(largeData);
      const total = limitedRenderer.getTotalItems();

      expect(total).toBeLessThanOrEqual(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty objects and arrays", () => {
      const data = {
        emptyObject: {},
        emptyArray: [],
        nested: {
          alsoEmpty: {},
        },
      };

      renderer.initialize(data);
      const window = renderer.getCurrentWindow();

      expect(window.totalItems).toBeGreaterThan(0);
      expect(window.visibleItems.length).toBeGreaterThan(0);
    });

    it("should handle deeply nested structures", () => {
      let nested: any = { value: "deep" };
      for (let i = 0; i < 20; i++) {
        nested = { [`level${i}`]: nested };
      }

      renderer.initialize(nested);
      renderer.expandToDepth(10);

      const window = renderer.getCurrentWindow();
      expect(window.totalItems).toBeGreaterThan(10);
    });

    it("should handle circular reference prevention", () => {
      const obj: any = { name: "test" };
      obj.self = obj; // Create circular reference

      // The renderer should handle this gracefully (it depends on the JSON serialization)
      expect(() => {
        renderer.initialize(obj);
      }).not.toThrow();
    });

    it("should handle mixed data types in arrays", () => {
      const data = ["string", 42, true, null, { object: "value" }, [1, 2, 3]];

      renderer.initialize(data);
      const window = renderer.getCurrentWindow();

      expect(window.totalItems).toBeGreaterThan(6);
    });
  });

  describe("Viewport Info", () => {
    it("should provide correct viewport information", () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      renderer.initialize(data);

      const viewportInfo = renderer.getViewportInfo();

      expect(viewportInfo.maxVisibleItems).toBe(
        Math.ceil(defaultOptions.viewportHeight / defaultOptions.itemHeight),
      );
      expect(viewportInfo.totalHeight).toBe(
        renderer.getTotalItems() * defaultOptions.itemHeight,
      );
    });
  });

  describe("Item Retrieval", () => {
    beforeEach(() => {
      const data = { test: "value", number: 42 };
      renderer.initialize(data);
    });

    it("should retrieve items by ID", () => {
      const window = renderer.getCurrentWindow();
      const firstItem = window.visibleItems[0];

      const retrievedItem = renderer.getItem(firstItem.id);
      expect(retrievedItem).toEqual(firstItem);
    });

    it("should return undefined for non-existent item ID", () => {
      const nonExistentItem = renderer.getItem("non-existent-id");
      expect(nonExistentItem).toBeUndefined();
    });
  });
});
