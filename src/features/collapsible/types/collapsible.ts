/**
 * Types for collapsible JSON viewer functionality
 */

import type { JsonValue } from "@core/types/index.js";

export interface JsonPath {
  type: "root" | "object" | "array";
  key?: string | number;
  path: (string | number)[];
}

export interface JsonNode {
  id: string; // Unique identifier for the node
  path: JsonPath;
  value: JsonValue;
  type: "object" | "array" | "primitive";
  level: number; // Nesting level for indentation
  isCollapsible: boolean; // Whether this node can be collapsed
  isCollapsed: boolean; // Whether this node is currently collapsed
  children?: JsonNode[];
  parent?: JsonNode;
}

export interface CursorPosition {
  nodeId: string;
  lineIndex: number; // Which line on screen this cursor is on
}

export interface CollapsibleState {
  nodes: Map<string, JsonNode>; // All nodes indexed by ID
  expandedNodes: Set<string>; // IDs of expanded nodes
  cursorPosition: CursorPosition | null;
  flattenedNodes: JsonNode[]; // Current visible nodes in display order
}

export interface NavigationAction {
  type:
    | "move_up"
    | "move_down"
    | "page_up"
    | "page_down"
    | "goto_top"
    | "goto_bottom"
    | "toggle_node"
    | "expand_node"
    | "collapse_node"
    | "expand_all"
    | "collapse_all";
  nodeId?: string;
  count?: number; // For page movements (number of lines to move)
}

/**
 * Result of a navigation action
 */
export interface NavigationResult {
  newState: CollapsibleState;
  scrollToLine?: number; // Line to scroll to if cursor moved off screen
}
