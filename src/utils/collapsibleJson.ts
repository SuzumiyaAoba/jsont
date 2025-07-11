/**
 * Utilities for managing collapsible JSON structure
 */

import type {
  CollapsibleState,
  CursorPosition,
  JsonNode,
  JsonPath,
  NavigationAction,
  NavigationResult,
} from "../types/collapsible";
import type { JsonValue } from "../types/index";

/**
 * Generate a unique ID for a JSON node based on its path
 */
export function generateNodeId(path: (string | number)[]): string {
  return path.length === 0 ? "root" : path.join(".");
}

/**
 * Determine the type of a JSON value
 */
export function getValueType(
  value: JsonValue,
): "object" | "array" | "primitive" {
  if (value === null || value === undefined) return "primitive";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "primitive";
}

/**
 * Check if a value can be collapsed (objects and arrays with content)
 */
export function isCollapsible(value: JsonValue): boolean {
  const type = getValueType(value);
  if (type === "primitive") return false;

  if (type === "array") return Array.isArray(value) && value.length > 0;
  if (type === "object")
    return value && typeof value === "object" && Object.keys(value).length > 0;

  return false;
}

/**
 * Convert JSON data to a tree of JsonNode objects
 */
export function buildJsonTree(
  data: JsonValue,
  path: (string | number)[] = [],
  level: number = 0,
  parent?: JsonNode,
): JsonNode {
  const nodeId = generateNodeId(path);
  const valueType = getValueType(data);
  const canCollapse = isCollapsible(data);

  const jsonPath: JsonPath = {
    type:
      path.length === 0
        ? "root"
        : Array.isArray(parent?.value)
          ? "array"
          : "object",
    key: path.length > 0 ? path[path.length - 1] : undefined,
    path: [...path],
  };

  const node: JsonNode = {
    id: nodeId,
    path: jsonPath,
    value: data,
    type: valueType,
    level,
    isCollapsible: canCollapse,
    isCollapsed: false, // Start expanded by default
    parent,
  };

  // Build children for objects and arrays
  if (valueType === "object" && data && typeof data === "object") {
    node.children = Object.entries(data).map(([key, value]) =>
      buildJsonTree(value, [...path, key], level + 1, node),
    );
  } else if (valueType === "array" && Array.isArray(data)) {
    node.children = data.map((value, index) =>
      buildJsonTree(value, [...path, index], level + 1, node),
    );
  }

  return node;
}

/**
 * Flatten the tree into a list of visible nodes (respecting collapsed state)
 */
export function flattenNodes(
  root: JsonNode,
  expandedNodes: Set<string>,
): JsonNode[] {
  const result: JsonNode[] = [];

  function traverse(node: JsonNode) {
    result.push(node);

    // Only traverse children if the node is expanded (or not collapsible)
    if (node.children && (!node.isCollapsible || expandedNodes.has(node.id))) {
      for (const child of node.children) {
        traverse(child);
      }

      // Add a closing bracket node for expanded objects/arrays
      if (node.isCollapsible && expandedNodes.has(node.id)) {
        const closingNode: JsonNode = {
          id: `${node.id}_closing`,
          path: { ...node.path },
          value: node.type === "object" ? "}" : "]",
          type: "primitive",
          level: node.level,
          isCollapsible: false,
          isCollapsed: false,
          parent: node.parent,
        };
        result.push(closingNode);
      }
    }
  }

  traverse(root);
  return result;
}

/**
 * Initialize collapsible state from JSON data
 */
export function initializeCollapsibleState(data: JsonValue): CollapsibleState {
  const rootNode = buildJsonTree(data);
  const nodes = new Map<string, JsonNode>();
  const expandedNodes = new Set<string>();

  // Collect all nodes and mark them as expanded by default
  function collectNodes(node: JsonNode) {
    nodes.set(node.id, node);
    if (node.isCollapsible) {
      expandedNodes.add(node.id);
    }
    if (node.children) {
      for (const child of node.children) {
        collectNodes(child);
      }
    }
  }

  collectNodes(rootNode);

  const flattenedNodes = flattenNodes(rootNode, expandedNodes);
  const cursorPosition: CursorPosition | null =
    flattenedNodes.length > 0
      ? { nodeId: flattenedNodes[0].id, lineIndex: 0 }
      : null;

  return {
    nodes,
    expandedNodes,
    cursorPosition,
    flattenedNodes,
  };
}

/**
 * Handle navigation actions and update state
 */
export function handleNavigation(
  state: CollapsibleState,
  action: NavigationAction,
): NavigationResult {
  const newState = { ...state };
  let scrollToLine: number | undefined;

  switch (action.type) {
    case "move_up": {
      if (!newState.cursorPosition) break;

      const currentIndex = newState.flattenedNodes.findIndex(
        (node) => node.id === newState.cursorPosition?.nodeId,
      );

      if (currentIndex > 0) {
        const newNode = newState.flattenedNodes[currentIndex - 1];
        newState.cursorPosition = {
          nodeId: newNode.id,
          lineIndex: currentIndex - 1,
        };
        scrollToLine = currentIndex - 1;
      }
      break;
    }

    case "move_down": {
      if (!newState.cursorPosition) break;

      const currentIndex = newState.flattenedNodes.findIndex(
        (node) => node.id === newState.cursorPosition?.nodeId,
      );

      if (currentIndex < newState.flattenedNodes.length - 1) {
        const newNode = newState.flattenedNodes[currentIndex + 1];
        newState.cursorPosition = {
          nodeId: newNode.id,
          lineIndex: currentIndex + 1,
        };
        scrollToLine = currentIndex + 1;
      }
      break;
    }

    case "toggle_node": {
      if (!newState.cursorPosition) break;

      const currentNode = newState.nodes.get(newState.cursorPosition.nodeId);
      if (!currentNode || !currentNode.isCollapsible) break;

      // Toggle expanded state
      newState.expandedNodes = new Set(state.expandedNodes);
      if (newState.expandedNodes.has(currentNode.id)) {
        newState.expandedNodes.delete(currentNode.id);
      } else {
        newState.expandedNodes.add(currentNode.id);
      }

      // Rebuild flattened nodes
      const rootNode = Array.from(newState.nodes.values()).find(
        (n) => n.path.path.length === 0,
      );
      if (rootNode) {
        newState.flattenedNodes = flattenNodes(
          rootNode,
          newState.expandedNodes,
        );

        // Update cursor line index
        const newIndex = newState.flattenedNodes.findIndex(
          (node) => node.id === newState.cursorPosition?.nodeId,
        );
        if (newIndex >= 0) {
          newState.cursorPosition.lineIndex = newIndex;
          scrollToLine = newIndex;
        }
      }
      break;
    }

    case "expand_all": {
      newState.expandedNodes = new Set();
      for (const node of newState.nodes.values()) {
        if (node.isCollapsible) {
          newState.expandedNodes.add(node.id);
        }
      }

      const rootNode = Array.from(newState.nodes.values()).find(
        (n) => n.path.path.length === 0,
      );
      if (rootNode) {
        newState.flattenedNodes = flattenNodes(
          rootNode,
          newState.expandedNodes,
        );

        // Update cursor position
        if (newState.cursorPosition) {
          const newIndex = newState.flattenedNodes.findIndex(
            (node) => node.id === newState.cursorPosition?.nodeId,
          );
          if (newIndex >= 0) {
            newState.cursorPosition.lineIndex = newIndex;
          }
        }
      }
      break;
    }

    case "collapse_all": {
      newState.expandedNodes = new Set();

      const rootNode = Array.from(newState.nodes.values()).find(
        (n) => n.path.path.length === 0,
      );
      if (rootNode) {
        newState.flattenedNodes = flattenNodes(
          rootNode,
          newState.expandedNodes,
        );

        // Move cursor to root if current node is not visible
        if (newState.cursorPosition) {
          const isVisible = newState.flattenedNodes.some(
            (node) => node.id === newState.cursorPosition?.nodeId,
          );

          if (!isVisible && rootNode) {
            newState.cursorPosition = {
              nodeId: rootNode.id,
              lineIndex: 0,
            };
            scrollToLine = 0;
          } else {
            const newIndex = newState.flattenedNodes.findIndex(
              (node) => node.id === newState.cursorPosition?.nodeId,
            );
            if (newIndex >= 0) {
              newState.cursorPosition.lineIndex = newIndex;
            }
          }
        }
      }
      break;
    }
  }

  return { newState, scrollToLine };
}

/**
 * Format a collapsed node for display
 */
export function formatCollapsedNode(node: JsonNode): string {
  if (!node.isCollapsible) {
    return "";
  }

  if (node.type === "object") {
    const keys = node.children
      ? node.children.length
      : node.value && typeof node.value === "object"
        ? Object.keys(node.value).length
        : 0;
    return keys > 0 ? `{...}` : "{}";
  }

  if (node.type === "array") {
    const length = node.children
      ? node.children.length
      : Array.isArray(node.value)
        ? node.value.length
        : 0;
    return length > 0 ? `[...]` : "[]";
  }

  return "";
}

/**
 * Get the display text for a node
 */
export function getNodeDisplayText(
  node: JsonNode,
  isExpanded: boolean,
): string {
  const indent = "  ".repeat(node.level);
  let prefix = "";
  let suffix = "";

  // Handle closing bracket nodes specially
  if (node.id.endsWith("_closing")) {
    return `${indent}${node.value}`;
  }

  // Add key for object properties and array indices
  if (node.path.key !== undefined) {
    if (node.path.type === "object") {
      prefix = `"${node.path.key}": `;
    } else if (node.path.type === "array") {
      // For arrays, we might want to show index or just the value
      prefix = "";
    }
  }

  // Handle different value types
  if (node.type === "primitive") {
    const value = node.value;
    if (typeof value === "string") {
      suffix = `"${value}"`;
    } else if (value === null) {
      suffix = "null";
    } else {
      suffix = String(value);
    }
  } else if (node.isCollapsible && !isExpanded) {
    // Show collapsed representation
    suffix = formatCollapsedNode(node);
  } else {
    // Expanded object or array - show opening bracket
    if (node.type === "object") {
      suffix = "{";
    } else if (node.type === "array") {
      suffix = "[";
    }
  }

  return `${indent}${prefix}${suffix}`;
}
