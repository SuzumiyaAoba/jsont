/**
 * Virtualized JSON Renderer
 *
 * Efficient rendering of large JSON structures using windowing technique.
 * Only renders visible items to optimize memory usage and performance.
 */

import type { JsonValue } from "@core/types/index";

export interface VirtualizedItem {
  /** Unique identifier for the item */
  id: string;
  /** The JSON value to render */
  value: JsonValue;
  /** Nesting depth level */
  depth: number;
  /** Key name (for object properties) */
  key?: string;
  /** Item type */
  type: "object" | "array" | "property" | "value";
  /** Whether the item is expanded (for containers) */
  expanded: boolean;
  /** Parent item ID */
  parentId?: string;
  /** Index within parent */
  index: number;
}

export interface RenderWindow {
  /** Start index of visible range */
  startIndex: number;
  /** End index of visible range */
  endIndex: number;
  /** Items currently in the visible window */
  visibleItems: VirtualizedItem[];
  /** Total number of items when fully expanded */
  totalItems: number;
  /** Current scroll offset */
  scrollOffset: number;
}

export interface VirtualizedRenderOptions {
  /** Height of the rendering viewport */
  viewportHeight: number;
  /** Height of each item in lines */
  itemHeight: number;
  /** Number of items to render outside visible area (for smooth scrolling) */
  overscan: number;
  /** Maximum number of items to virtualize (safety limit) */
  maxItems: number;
  /** Show line numbers */
  showLineNumbers: boolean;
  /** Initial expansion state for objects/arrays */
  initialExpandLevel: number;
}

/**
 * High-performance virtualized renderer for large JSON structures
 */
export class VirtualizedJsonRenderer {
  private options: Required<VirtualizedRenderOptions>;
  private flatItems: VirtualizedItem[] = [];
  private expandedItems = new Set<string>();
  private collapsedItems = new Set<string>();
  private maxExpandDepth: number | null = null;
  private currentWindow: RenderWindow;
  private itemCache = new Map<string, VirtualizedItem>();

  constructor(options: VirtualizedRenderOptions) {
    this.options = {
      viewportHeight: options.viewportHeight,
      itemHeight: options.itemHeight || 1,
      overscan: options.overscan || 5,
      maxItems: options.maxItems || 100000,
      showLineNumbers: options.showLineNumbers ?? true,
      initialExpandLevel: options.initialExpandLevel || 2,
    };

    this.currentWindow = {
      startIndex: 0,
      endIndex: 0,
      visibleItems: [],
      totalItems: 0,
      scrollOffset: 0,
    };
  }

  /**
   * Initialize renderer with JSON data
   */
  initialize(data: JsonValue): void {
    this.flatItems = [];
    this.expandedItems.clear();
    this.collapsedItems.clear();
    this.maxExpandDepth = null;
    this.itemCache.clear();

    // Build flat item list from JSON structure
    this.buildFlatItemList(data, "", 0, undefined, 0);

    // Apply initial expansion
    this.applyInitialExpansion();

    // Update window
    this.updateWindow(0);
  }

  /**
   * Get current render window
   */
  getCurrentWindow(): RenderWindow {
    return { ...this.currentWindow };
  }

  /**
   * Scroll to specific index
   */
  scrollToIndex(index: number): void {
    const clampedIndex = Math.max(
      0,
      Math.min(index, this.flatItems.length - 1),
    );
    this.updateWindow(clampedIndex);
  }

  /**
   * Scroll by relative amount
   */
  scrollBy(delta: number): void {
    const newOffset = Math.max(0, this.currentWindow.scrollOffset + delta);
    const newIndex = Math.floor(newOffset / this.options.itemHeight);
    this.scrollToIndex(newIndex);
  }

  /**
   * Toggle expansion state of an item
   */
  toggleExpansion(itemId: string): boolean {
    const item = this.itemCache.get(itemId);
    if (!item || (item.type !== "object" && item.type !== "array")) {
      return false;
    }

    // Reset maxExpandDepth when manually toggling
    this.maxExpandDepth = null;

    if (
      this.expandedItems.has(itemId) ||
      (!this.collapsedItems.has(itemId) &&
        item.depth < this.options.initialExpandLevel)
    ) {
      // Currently expanded - collapse it
      this.expandedItems.delete(itemId);
      this.collapsedItems.add(itemId);
      this.collapseItem(itemId);
    } else {
      // Currently collapsed - expand it
      this.collapsedItems.delete(itemId);
      this.expandedItems.add(itemId);
      this.expandItem(itemId);
    }

    this.rebuildFlatList();
    this.updateWindow(this.currentWindow.startIndex);
    return true;
  }

  /**
   * Expand all items up to specified depth
   */
  expandToDepth(maxDepth: number): void {
    this.expandedItems.clear();
    this.collapsedItems.clear();
    this.maxExpandDepth = maxDepth;

    this.rebuildFlatList();
    this.updateWindow(this.currentWindow.startIndex);
  }

  /**
   * Collapse all items
   */
  collapseAll(): void {
    this.expandedItems.clear();
    this.collapsedItems.clear();
    this.maxExpandDepth = null;
    this.rebuildFlatList();
    this.updateWindow(0);
  }

  /**
   * Search for items matching query
   */
  search(query: string, caseSensitive = false): string[] {
    const matchingIds: string[] = [];
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    for (const item of this.flatItems) {
      let searchTarget = "";

      if (item.key) {
        searchTarget += item.key;
      }

      if (typeof item.value === "string") {
        searchTarget += item.value;
      } else if (item.value !== null && typeof item.value === "object") {
        searchTarget += JSON.stringify(item.value);
      } else {
        searchTarget += String(item.value);
      }

      if (!caseSensitive) {
        searchTarget = searchTarget.toLowerCase();
      }

      if (searchTarget.includes(searchTerm)) {
        matchingIds.push(item.id);
      }
    }

    return matchingIds;
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): VirtualizedItem | undefined {
    return this.itemCache.get(itemId);
  }

  /**
   * Get total number of visible items
   */
  getTotalItems(): number {
    return this.flatItems.length;
  }

  /**
   * Get viewport info
   */
  getViewportInfo(): { maxVisibleItems: number; totalHeight: number } {
    const maxVisibleItems = Math.ceil(
      this.options.viewportHeight / this.options.itemHeight,
    );
    const totalHeight = this.flatItems.length * this.options.itemHeight;

    return { maxVisibleItems, totalHeight };
  }

  /**
   * Build flat item list from JSON structure
   */
  private buildFlatItemList(
    value: JsonValue,
    key: string,
    depth: number,
    parentId: string | undefined,
    index: number,
  ): void {
    if (this.flatItems.length >= this.options.maxItems) {
      return; // Safety limit reached
    }

    const itemId = `${parentId || "root"}_${key || index}_${depth}`;
    const shouldExpand = this.shouldExpand(itemId, depth);

    let item: VirtualizedItem;

    if (Array.isArray(value)) {
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "array",
        expanded: shouldExpand,
        parentId: parentId || undefined,
        index,
      };

      this.flatItems.push(item);
      this.itemCache.set(itemId, item);

      // Add array items if expanded
      if (shouldExpand) {
        value.forEach((arrayItem, arrayIndex) => {
          this.buildFlatItemList(
            arrayItem,
            `[${arrayIndex}]`,
            depth + 1,
            itemId,
            arrayIndex,
          );
        });
      }
    } else if (value !== null && typeof value === "object") {
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "object",
        expanded: shouldExpand,
        parentId: parentId || undefined,
        index,
      };

      this.flatItems.push(item);
      this.itemCache.set(itemId, item);

      // Add object properties if expanded
      if (shouldExpand) {
        Object.entries(value).forEach(([objKey, objValue], objIndex) => {
          this.buildFlatItemList(objValue, objKey, depth + 1, itemId, objIndex);
        });
      }
    } else {
      // Primitive value
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "value",
        expanded: false,
        parentId: parentId || undefined,
        index,
      };

      this.flatItems.push(item);
      this.itemCache.set(itemId, item);
    }
  }

  /**
   * Apply initial expansion based on configuration
   */
  private applyInitialExpansion(): void {
    for (const item of this.flatItems) {
      if (
        (item.type === "object" || item.type === "array") &&
        item.depth < this.options.initialExpandLevel
      ) {
        this.expandedItems.add(item.id);
        item.expanded = true;
      }
    }
  }

  /**
   * Check if item should be expanded
   */
  private shouldExpand(itemId: string, depth: number): boolean {
    // Don't expand if explicitly collapsed
    if (this.collapsedItems.has(itemId)) {
      return false;
    }

    // Use maxExpandDepth if set by expandToDepth()
    if (this.maxExpandDepth !== null) {
      return depth <= this.maxExpandDepth;
    }

    return (
      this.expandedItems.has(itemId) || depth < this.options.initialExpandLevel
    );
  }

  /**
   * Expand specific item
   */
  private expandItem(itemId: string): void {
    const item = this.itemCache.get(itemId);
    if (!item) return;

    item.expanded = true;

    // Add child items after this item
    const insertIndex = this.flatItems.findIndex((i) => i.id === itemId) + 1;
    const childItems: VirtualizedItem[] = [];

    if (Array.isArray(item.value)) {
      item.value.forEach((arrayItem, arrayIndex) => {
        this.buildChildItems(
          arrayItem,
          `[${arrayIndex}]`,
          item.depth + 1,
          itemId,
          arrayIndex,
          childItems,
        );
      });
    } else if (item.value !== null && typeof item.value === "object") {
      Object.entries(item.value).forEach(([objKey, objValue], objIndex) => {
        this.buildChildItems(
          objValue,
          objKey,
          item.depth + 1,
          itemId,
          objIndex,
          childItems,
        );
      });
    }

    this.flatItems.splice(insertIndex, 0, ...childItems);
  }

  /**
   * Build child items for insertion
   */
  private buildChildItems(
    value: JsonValue,
    key: string,
    depth: number,
    parentId: string,
    index: number,
    childItems: VirtualizedItem[],
  ): void {
    if (childItems.length >= this.options.maxItems) {
      return;
    }

    const itemId = `${parentId}_${key}_${depth}`;

    let item: VirtualizedItem;

    if (Array.isArray(value)) {
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "array",
        expanded: this.expandedItems.has(itemId),
        parentId,
        index,
      };

      childItems.push(item);
      this.itemCache.set(itemId, item);

      if (item.expanded) {
        value.forEach((arrayItem, arrayIndex) => {
          this.buildChildItems(
            arrayItem,
            `[${arrayIndex}]`,
            depth + 1,
            itemId,
            arrayIndex,
            childItems,
          );
        });
      }
    } else if (value !== null && typeof value === "object") {
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "object",
        expanded: this.expandedItems.has(itemId),
        parentId,
        index,
      };

      childItems.push(item);
      this.itemCache.set(itemId, item);

      if (item.expanded) {
        Object.entries(value).forEach(([objKey, objValue], objIndex) => {
          this.buildChildItems(
            objValue,
            objKey,
            depth + 1,
            itemId,
            objIndex,
            childItems,
          );
        });
      }
    } else {
      item = {
        id: itemId,
        value,
        depth,
        key,
        type: "value",
        expanded: false,
        parentId,
        index,
      };

      childItems.push(item);
      this.itemCache.set(itemId, item);
    }
  }

  /**
   * Collapse specific item
   */
  private collapseItem(itemId: string): void {
    const item = this.itemCache.get(itemId);
    if (!item) return;

    item.expanded = false;

    // Remove all descendant items
    const startIndex = this.flatItems.findIndex((i) => i.id === itemId) + 1;
    let endIndex = startIndex;

    // Find where descendants end
    while (endIndex < this.flatItems.length) {
      const currentItem = this.flatItems[endIndex];
      if (!currentItem) break;

      if (
        currentItem.depth <= item.depth &&
        !this.isDescendantOf(currentItem.id, itemId)
      ) {
        break;
      }

      // Remove from cache
      this.itemCache.delete(currentItem.id);
      endIndex++;
    }

    this.flatItems.splice(startIndex, endIndex - startIndex);
  }

  /**
   * Check if item is descendant of another item
   */
  private isDescendantOf(itemId: string, ancestorId: string): boolean {
    let current = this.itemCache.get(itemId);

    while (current?.parentId) {
      if (current.parentId === ancestorId) {
        return true;
      }
      current = this.itemCache.get(current.parentId);
    }

    return false;
  }

  /**
   * Rebuild flat list after expansion changes
   */
  private rebuildFlatList(): void {
    const rootItems = this.flatItems.filter((item) => !item.parentId);
    this.flatItems = [];
    this.itemCache.clear();

    for (const rootItem of rootItems) {
      this.rebuildFromRoot(
        rootItem.value,
        rootItem.key || "",
        0,
        undefined,
        rootItem.index,
      );
    }
  }

  /**
   * Rebuild from root item
   */
  private rebuildFromRoot(
    value: JsonValue,
    key: string,
    depth: number,
    parentId: string | undefined,
    index: number,
  ): void {
    this.buildFlatItemList(value, key, depth, parentId, index);
  }

  /**
   * Update current window based on scroll position
   */
  private updateWindow(scrollIndex: number): void {
    const startIndex = Math.max(0, scrollIndex - this.options.overscan);
    const maxVisibleItems = Math.ceil(
      this.options.viewportHeight / this.options.itemHeight,
    );
    const endIndex = Math.min(
      this.flatItems.length - 1,
      scrollIndex + maxVisibleItems + this.options.overscan,
    );

    const visibleItems = this.flatItems.slice(startIndex, endIndex + 1);

    this.currentWindow = {
      startIndex,
      endIndex,
      visibleItems,
      totalItems: this.flatItems.length,
      scrollOffset: scrollIndex * this.options.itemHeight,
    };
  }

  /**
   * Format item for display
   */
  formatItem(item: VirtualizedItem, lineNumber?: number): string {
    const indent = "  ".repeat(item.depth);
    const lineNum =
      this.options.showLineNumbers && lineNumber !== undefined
        ? `${lineNumber.toString().padStart(4)}: `
        : "";

    let prefix = "";
    let content = "";

    if (item.type === "object" || item.type === "array") {
      const isArray = item.type === "array";
      const length = isArray
        ? (item.value as any[]).length
        : Object.keys(item.value as object).length;

      prefix = item.expanded ? "▼" : "▶";

      if (item.key) {
        content = `${item.key}: ${isArray ? "[" : "{"}${length} ${isArray ? "items" : "keys"}${isArray ? "]" : "}"}`;
      } else {
        content = `${isArray ? "[" : "{"}${length} ${isArray ? "items" : "keys"}${isArray ? "]" : "}"}`;
      }
    } else {
      if (item.key) {
        content = `${item.key}: ${this.formatValue(item.value)}`;
      } else {
        content = this.formatValue(item.value);
      }
    }

    return `${lineNum}${indent}${prefix}${content}`;
  }

  /**
   * Format value for display
   */
  private formatValue(value: JsonValue): string {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "boolean" || typeof value === "number")
      return String(value);
    return "[Complex Object]"; // Shouldn't reach here in normal flow
  }
}
