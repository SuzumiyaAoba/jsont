/**
 * UI-agnostic tree processing engine for JSON data
 * Separates core tree logic from presentation concerns
 */

import type { JsonValue } from "@core/types/index";
import type {
  TreeDisplayOptions,
  TreeLine,
  TreeViewState,
} from "@features/tree/types/tree";
import {
  buildTreeFromJson,
  collapseAll,
  expandAll,
  toggleNodeExpansion,
} from "@features/tree/utils/treeBuilder";
import {
  getTreeLineText,
  getVisibleTreeLines,
  renderTreeLines,
  searchTreeNodes,
} from "@features/tree/utils/treeRenderer";

/**
 * Navigation state for tree engine
 */
export interface TreeEngineState {
  /** Tree structure state */
  treeState: TreeViewState;
  /** Currently selected line index */
  selectedLineIndex: number;
  /** Current scroll offset */
  scrollOffset: number;
  /** Whether schema types are displayed */
  showSchemaTypes: boolean;
  /** Whether line numbers are displayed */
  showLineNumbers: boolean;
  /** Last search term applied */
  searchTerm: string;
  /** Filtered tree nodes based on search */
  filteredNodes: Set<string>;
}

/**
 * Navigation commands for tree interaction
 */
export type TreeCommand =
  | "navigate-up"
  | "navigate-down"
  | "navigate-page-up"
  | "navigate-page-down"
  | "navigate-to-top"
  | "navigate-to-bottom"
  | "toggle-node"
  | "expand-all"
  | "collapse-all"
  | "toggle-schema-types"
  | "toggle-line-numbers";

/**
 * Result of executing a tree command
 */
export interface TreeCommandResult {
  /** Whether the command was handled */
  handled: boolean;
  /** New engine state after command execution */
  state: TreeEngineState;
  /** Whether the display needs to be refreshed */
  needsRefresh: boolean;
}

/**
 * Options for tree rendering
 */
export interface TreeRenderOptions {
  /** Tree display options */
  displayOptions: TreeDisplayOptions;
  /** Optional engine state to use for rendering */
  engineState?: TreeEngineState;
}

/**
 * UI-specific viewport options for rendering
 */
export interface ViewportOptions {
  /** Height of the visible area */
  height: number;
  /** Width of the visible area */
  width: number;
}

/**
 * Rendered tree data for UI consumption
 */
export interface TreeRenderResult {
  /** Visible tree lines */
  lines: TreeLine[];
  /** Total number of lines */
  totalLines: number;
  /** Current visible range */
  visibleRange: { start: number; end: number };
  /** Whether there are more lines above */
  hasScrollUp: boolean;
  /** Whether there are more lines below */
  hasScrollDown: boolean;
}

/**
 * UI-agnostic tree engine for JSON processing
 * Handles all tree-related business logic without UI dependencies
 */
export class TreeEngine {
  private state: TreeEngineState;
  private defaultDisplayOptions: TreeDisplayOptions;
  private currentViewHeight: number = 20;
  private cachedDisplayOptions: TreeDisplayOptions | undefined;
  private lastShowSchemaTypes: boolean | undefined;

  constructor(
    data: JsonValue | null,
    options: Partial<TreeDisplayOptions> = {},
  ) {
    this.defaultDisplayOptions = {
      showArrayIndices: true,
      showPrimitiveValues: true,
      maxValueLength: 50,
      useUnicodeTree: true,
      showSchemaTypes: options.showSchemaTypes ?? false,
    };

    this.state = {
      treeState: buildTreeFromJson(data, { expandLevel: 1 }),
      selectedLineIndex: 0,
      scrollOffset: 0,
      showSchemaTypes: options.showSchemaTypes ?? false,
      showLineNumbers: false,
      searchTerm: "",
      filteredNodes: new Set(),
    };
  }

  /**
   * Get current engine state
   */
  getState(): Readonly<TreeEngineState> {
    return { ...this.state };
  }

  /**
   * Update the JSON data and rebuild tree
   */
  updateData(data: JsonValue | null): void {
    this.state.treeState = buildTreeFromJson(data, { expandLevel: 1 });
    this.state.selectedLineIndex = 0;
    this.state.scrollOffset = 0;
    this.cachedDisplayOptions = undefined; // Clear cache on data update
    this.applySearch(this.state.searchTerm);
  }

  /**
   * Apply search filter to tree
   */
  applySearch(searchTerm: string): void {
    this.state.searchTerm = searchTerm;
    if (searchTerm.trim()) {
      this.state.filteredNodes = searchTreeNodes(
        this.state.treeState,
        searchTerm,
      );
    } else {
      this.state.filteredNodes = new Set();
    }
  }

  /**
   * Execute a tree command
   */
  executeCommand(command: TreeCommand): TreeCommandResult {
    let handled = false;
    let needsRefresh = false;

    switch (command) {
      case "navigate-up":
        handled = this.navigateUp();
        needsRefresh = handled;
        break;

      case "navigate-down":
        handled = this.navigateDown();
        needsRefresh = handled;
        break;

      case "navigate-page-up":
        handled = this.navigatePageUp();
        needsRefresh = handled;
        break;

      case "navigate-page-down":
        handled = this.navigatePageDown();
        needsRefresh = handled;
        break;

      case "navigate-to-top":
        handled = this.navigateToTop();
        needsRefresh = handled;
        break;

      case "navigate-to-bottom":
        handled = this.navigateToBottom();
        needsRefresh = handled;
        break;

      case "toggle-node":
        handled = this.toggleCurrentNode();
        needsRefresh = handled;
        break;

      case "expand-all":
        handled = this.expandAll();
        needsRefresh = handled;
        break;

      case "collapse-all":
        handled = this.collapseAll();
        needsRefresh = handled;
        break;

      case "toggle-schema-types":
        this.state.showSchemaTypes = !this.state.showSchemaTypes;
        this.cachedDisplayOptions = undefined; // Invalidate cache
        handled = true;
        needsRefresh = true;
        break;

      case "toggle-line-numbers":
        this.state.showLineNumbers = !this.state.showLineNumbers;
        handled = true;
        needsRefresh = true;
        break;
    }

    return {
      handled,
      state: { ...this.state },
      needsRefresh,
    };
  }

  /**
   * Render tree for display
   */
  render(
    options: TreeRenderOptions,
    viewport: ViewportOptions,
  ): TreeRenderResult {
    // Update current view height for scroll calculations
    this.currentViewHeight = viewport.height;

    // Use provided engine state or fall back to internal state
    const renderState = options.engineState || this.state;

    const displayOptions: TreeDisplayOptions = {
      ...options.displayOptions,
      showSchemaTypes: renderState.showSchemaTypes,
    };

    const allLines = renderTreeLines(renderState.treeState, displayOptions);
    const visibleLines = getVisibleTreeLines(
      allLines,
      renderState.scrollOffset,
      renderState.scrollOffset + viewport.height,
    );

    const visibleStart = renderState.scrollOffset;
    const visibleEnd = Math.min(
      visibleStart + viewport.height,
      allLines.length,
    );

    return {
      lines: visibleLines,
      totalLines: allLines.length,
      visibleRange: { start: visibleStart, end: visibleEnd },
      hasScrollUp: renderState.scrollOffset > 0,
      hasScrollDown: visibleEnd < allLines.length,
    };
  }

  /**
   * Get current display options with caching
   */
  private getDisplayOptions(): TreeDisplayOptions {
    if (
      !this.cachedDisplayOptions ||
      this.lastShowSchemaTypes !== this.state.showSchemaTypes
    ) {
      this.cachedDisplayOptions = {
        ...this.defaultDisplayOptions,
        showSchemaTypes: this.state.showSchemaTypes,
      };
      this.lastShowSchemaTypes = this.state.showSchemaTypes;
    }
    return this.cachedDisplayOptions;
  }

  /**
   * Get text representation of a tree line
   */
  getLineText(line: TreeLine, options?: Partial<TreeDisplayOptions>): string {
    const displayOptions = options
      ? { ...this.getDisplayOptions(), ...options }
      : this.getDisplayOptions();
    return getTreeLineText(line, displayOptions);
  }

  /**
   * Navigate up one line
   */
  private navigateUp(): boolean {
    if (this.state.selectedLineIndex > 0) {
      this.state.selectedLineIndex--;
      this.adjustScrollForSelection();
      return true;
    }
    return false;
  }

  /**
   * Navigate down one line
   */
  private navigateDown(): boolean {
    const allLines = renderTreeLines(
      this.state.treeState,
      this.getDisplayOptions(),
    );
    if (this.state.selectedLineIndex < allLines.length - 1) {
      this.state.selectedLineIndex++;
      this.adjustScrollForSelection();
      return true;
    }
    return false;
  }

  /**
   * Navigate up by page
   */
  private navigatePageUp(): boolean {
    const pageSize = Math.max(1, Math.floor(this.currentViewHeight / 2));
    const newIndex = Math.max(0, this.state.selectedLineIndex - pageSize);
    if (newIndex !== this.state.selectedLineIndex) {
      this.state.selectedLineIndex = newIndex;
      this.adjustScrollForSelection();
      return true;
    }
    return false;
  }

  /**
   * Navigate down by page
   */
  private navigatePageDown(): boolean {
    const allLines = renderTreeLines(
      this.state.treeState,
      this.getDisplayOptions(),
    );
    const pageSize = Math.max(1, Math.floor(this.currentViewHeight / 2));
    const newIndex = Math.min(
      allLines.length - 1,
      this.state.selectedLineIndex + pageSize,
    );
    if (newIndex !== this.state.selectedLineIndex) {
      this.state.selectedLineIndex = newIndex;
      this.adjustScrollForSelection();
      return true;
    }
    return false;
  }

  /**
   * Navigate to top
   */
  private navigateToTop(): boolean {
    if (this.state.selectedLineIndex > 0) {
      this.state.selectedLineIndex = 0;
      this.state.scrollOffset = 0;
      return true;
    }
    return false;
  }

  /**
   * Navigate to bottom
   */
  private navigateToBottom(): boolean {
    const allLines = renderTreeLines(
      this.state.treeState,
      this.getDisplayOptions(),
    );
    if (allLines.length > 0) {
      const newIndex = allLines.length - 1;
      if (newIndex !== this.state.selectedLineIndex) {
        this.state.selectedLineIndex = newIndex;
        this.adjustScrollForSelection();
        return true;
      }
    }
    return false;
  }

  /**
   * Toggle expansion of current node
   */
  private toggleCurrentNode(): boolean {
    const allLines = renderTreeLines(
      this.state.treeState,
      this.getDisplayOptions(),
    );
    const currentLine = allLines[this.state.selectedLineIndex];

    if (currentLine?.hasChildren) {
      this.state.treeState = toggleNodeExpansion(
        this.state.treeState,
        currentLine.id,
      );
      return true;
    }
    return false;
  }

  /**
   * Expand all nodes
   */
  private expandAll(): boolean {
    this.state.treeState = expandAll(this.state.treeState);
    return true;
  }

  /**
   * Collapse all nodes
   */
  private collapseAll(): boolean {
    this.state.treeState = collapseAll(this.state.treeState);
    return true;
  }

  /**
   * Adjust scroll offset to keep selected line visible
   */
  private adjustScrollForSelection(): void {
    if (this.state.selectedLineIndex < this.state.scrollOffset) {
      this.state.scrollOffset = this.state.selectedLineIndex;
    } else if (
      this.state.selectedLineIndex >=
      this.state.scrollOffset + this.currentViewHeight
    ) {
      this.state.scrollOffset =
        this.state.selectedLineIndex - this.currentViewHeight + 1;
    }

    // Ensure scroll offset is not negative
    this.state.scrollOffset = Math.max(0, this.state.scrollOffset);
  }
}
