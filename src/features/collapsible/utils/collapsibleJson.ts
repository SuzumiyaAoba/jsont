/**
 * Utilities for managing collapsible JSON structure
 */

import type { JsonValue } from "@core/types/index";
import type {
  CollapsibleState,
  CursorPosition,
  JsonNode,
  JsonPath,
  NavigationAction,
  NavigationResult,
} from "@features/collapsible/types/collapsible";

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
    return !!(
      value &&
      typeof value === "object" &&
      Object.keys(value).length > 0
    );

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
    ...(path.length > 0 && { key: path[path.length - 1] }),
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
    ...(parent && { parent }),
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
          parent: node, // The closing bracket's parent is the node itself
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
    flattenedNodes.length > 0 && flattenedNodes[0]
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
      if (!newState.cursorPosition || newState.flattenedNodes.length === 0)
        break;

      const currentIndex = findCursorIndex(
        newState.cursorPosition,
        newState.flattenedNodes,
      );

      if (currentIndex > 0) {
        const newNode = newState.flattenedNodes[currentIndex - 1];
        if (newNode) {
          newState.cursorPosition = {
            nodeId: newNode.id,
            lineIndex: currentIndex - 1,
          };
          scrollToLine = currentIndex - 1;
        }
      } else if (currentIndex === -1) {
        // Cursor position is invalid, reset to first node
        const resetResult = resetCursorToFirstNode(newState);
        if (resetResult.scrollToLine !== undefined) {
          scrollToLine = resetResult.scrollToLine;
        }
      }
      break;
    }

    case "move_down": {
      if (!newState.cursorPosition || newState.flattenedNodes.length === 0)
        break;

      const currentIndex = findCursorIndex(
        newState.cursorPosition,
        newState.flattenedNodes,
      );

      if (
        currentIndex >= 0 &&
        currentIndex < newState.flattenedNodes.length - 1
      ) {
        const newNode = newState.flattenedNodes[currentIndex + 1];
        if (newNode) {
          newState.cursorPosition = {
            nodeId: newNode.id,
            lineIndex: currentIndex + 1,
          };
          scrollToLine = currentIndex + 1;
        }
      } else if (currentIndex === -1) {
        // Cursor position is invalid, reset to first node
        const resetResult = resetCursorToFirstNode(newState);
        if (resetResult.scrollToLine !== undefined) {
          scrollToLine = resetResult.scrollToLine;
        }
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
      const rootNode = newState.nodes.get("root");
      if (rootNode) {
        newState.flattenedNodes = flattenNodes(
          rootNode,
          newState.expandedNodes,
        );

        // Update cursor line index and handle scroll adjustment
        const newIndex = findCursorIndex(
          newState.cursorPosition,
          newState.flattenedNodes,
        );
        if (newIndex >= 0) {
          const oldLineIndex = newState.cursorPosition.lineIndex;
          newState.cursorPosition.lineIndex = newIndex;

          // If the cursor moved significantly due to collapse/expand,
          // set scroll to keep cursor visible
          const lineDelta = Math.abs(newIndex - oldLineIndex);
          if (lineDelta > 0) {
            scrollToLine = newIndex;
          }
        } else if (newState.flattenedNodes.length > 0) {
          // Cursor node is no longer visible (collapsed), move to parent or first available node
          const parentNode = currentNode.parent;
          let targetNode = null;

          if (parentNode) {
            targetNode = newState.flattenedNodes.find(
              (node) => node.id === parentNode.id,
            );
          }

          if (!targetNode) {
            // Fall back to first available node
            const resetResult = resetCursorToFirstNode(newState);
            if (resetResult.scrollToLine !== undefined) {
              scrollToLine = resetResult.scrollToLine;
            }
          } else {
            const targetIndex = findCursorIndex(
              { nodeId: targetNode.id, lineIndex: 0 },
              newState.flattenedNodes,
            );
            newState.cursorPosition = {
              nodeId: targetNode.id,
              lineIndex: targetIndex,
            };
            scrollToLine = targetIndex;
          }
        }
      }
      break;
    }

    case "expand_node": {
      if (!newState.cursorPosition) break;

      const currentNode = newState.nodes.get(newState.cursorPosition.nodeId);
      if (!currentNode || !currentNode.isCollapsible) break;

      // Only expand if not already expanded
      newState.expandedNodes = new Set(state.expandedNodes);
      if (!newState.expandedNodes.has(currentNode.id)) {
        newState.expandedNodes.add(currentNode.id);

        // Rebuild flattened nodes
        const rootNode = newState.nodes.get("root");
        if (rootNode) {
          newState.flattenedNodes = flattenNodes(
            rootNode,
            newState.expandedNodes,
          );

          // Update cursor line index
          const newIndex = findCursorIndex(
            newState.cursorPosition,
            newState.flattenedNodes,
          );
          if (newIndex >= 0) {
            newState.cursorPosition.lineIndex = newIndex;
            scrollToLine = newIndex;
          }
        }
      }
      break;
    }

    case "collapse_node": {
      if (!newState.cursorPosition) break;

      const currentNode = newState.nodes.get(newState.cursorPosition.nodeId);
      if (!currentNode || !currentNode.isCollapsible) break;

      // Only collapse if currently expanded
      newState.expandedNodes = new Set(state.expandedNodes);
      if (newState.expandedNodes.has(currentNode.id)) {
        newState.expandedNodes.delete(currentNode.id);

        // Rebuild flattened nodes
        const rootNode = newState.nodes.get("root");
        if (rootNode) {
          newState.flattenedNodes = flattenNodes(
            rootNode,
            newState.expandedNodes,
          );

          // Update cursor line index
          const newIndex = findCursorIndex(
            newState.cursorPosition,
            newState.flattenedNodes,
          );
          if (newIndex >= 0) {
            newState.cursorPosition.lineIndex = newIndex;
            scrollToLine = newIndex;
          }
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

      const rootNode = newState.nodes.get("root");
      if (rootNode) {
        newState.flattenedNodes = flattenNodes(
          rootNode,
          newState.expandedNodes,
        );

        // Update cursor position
        if (newState.cursorPosition) {
          const newIndex = findCursorIndex(
            newState.cursorPosition,
            newState.flattenedNodes,
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

      const rootNode = newState.nodes.get("root");
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
            const newIndex = findCursorIndex(
              newState.cursorPosition,
              newState.flattenedNodes,
            );
            if (newIndex >= 0) {
              newState.cursorPosition.lineIndex = newIndex;
            }
          }
        }
      }
      break;
    }

    case "page_up": {
      if (!newState.cursorPosition || newState.flattenedNodes.length === 0)
        break;

      const currentIndex = findCursorIndex(
        newState.cursorPosition,
        newState.flattenedNodes,
      );
      const pageSize = action.count || 10; // Default page size
      const newIndex = Math.max(0, currentIndex - pageSize);

      if (newIndex !== currentIndex && newIndex >= 0) {
        const newNode = newState.flattenedNodes[newIndex];
        if (newNode) {
          newState.cursorPosition = {
            nodeId: newNode.id,
            lineIndex: newIndex,
          };
          scrollToLine = newIndex;
        }
      }
      break;
    }

    case "page_down": {
      if (!newState.cursorPosition || newState.flattenedNodes.length === 0)
        break;

      const currentIndex = findCursorIndex(
        newState.cursorPosition,
        newState.flattenedNodes,
      );
      const pageSize = action.count || 10; // Default page size
      const newIndex = Math.min(
        newState.flattenedNodes.length - 1,
        currentIndex + pageSize,
      );

      if (
        newIndex !== currentIndex &&
        newIndex < newState.flattenedNodes.length
      ) {
        const newNode = newState.flattenedNodes[newIndex];
        if (newNode) {
          newState.cursorPosition = {
            nodeId: newNode.id,
            lineIndex: newIndex,
          };
          scrollToLine = newIndex;
        }
      }
      break;
    }

    case "goto_top": {
      if (newState.flattenedNodes.length === 0) break;

      const firstNode = newState.flattenedNodes[0];
      if (firstNode) {
        newState.cursorPosition = {
          nodeId: firstNode.id,
          lineIndex: 0,
        };
        scrollToLine = 0;
      }
      break;
    }

    case "goto_bottom": {
      if (newState.flattenedNodes.length === 0) break;

      const lastIndex = newState.flattenedNodes.length - 1;
      const lastNode = newState.flattenedNodes[lastIndex];
      if (lastNode) {
        newState.cursorPosition = {
          nodeId: lastNode.id,
          lineIndex: lastIndex,
        };
        scrollToLine = lastIndex;
      }
      break;
    }
  }

  return { newState, ...(scrollToLine !== undefined && { scrollToLine }) };
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
  indentConfig?: { useTabs: boolean; indent: number },
): string {
  const indentString = indentConfig?.useTabs
    ? "\t"
    : " ".repeat(indentConfig?.indent ?? 2);
  const indent = indentString.repeat(node.level);
  let prefix = "";
  let suffix = "";
  let comma = "";

  // No visual indicators needed

  // Handle closing bracket nodes specially
  if (node.id.endsWith("_closing")) {
    // For closing brackets, check if the node that is being closed needs a comma
    // The parent of closing node is the node being closed
    const originalNode = node.parent;

    if (originalNode?.parent && originalNode.path.key !== undefined) {
      // Check if this is the last element in its parent
      const isLastElement = (() => {
        if (!originalNode.parent.children) return true;
        const siblingIndex = originalNode.parent.children.findIndex(
          (child) => child.id === originalNode.id,
        );
        return siblingIndex === originalNode.parent.children.length - 1;
      })();

      if (!isLastElement) {
        comma = ",";
      }
    }

    return `${indent}${node.value}${comma}`;
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

  // Add comma if this is not the last element in an array or object
  // Only add comma for non-expanded collapsible nodes or primitive nodes
  if (
    node.parent &&
    node.path.key !== undefined &&
    (node.type === "primitive" || (node.isCollapsible && !isExpanded))
  ) {
    const isLastElement = (() => {
      if (!node.parent.children) return true;

      const siblingIndex = node.parent.children.findIndex(
        (child) => child.id === node.id,
      );
      return siblingIndex === node.parent.children.length - 1;
    })();

    if (!isLastElement) {
      comma = ",";
    }
  }

  return `${indent}${prefix}${suffix}${comma}`;
}

/**
 * Helper function to check if a node can be toggled
 */
export function canToggleNode(
  state: CollapsibleState,
  nodeId: string,
): boolean {
  const node = state.nodes.get(nodeId);
  return node ? node.isCollapsible : false;
}

/**
 * Helper function to get current cursor node
 */
export function getCurrentCursorNode(state: CollapsibleState) {
  if (!state.cursorPosition) return null;
  return state.nodes.get(state.cursorPosition.nodeId) || null;
}

/**
 * Helper function to find cursor index in flattened nodes
 */
export function findCursorIndex(
  cursorPosition: CursorPosition | null,
  flattenedNodes: JsonNode[],
): number {
  if (!cursorPosition) return -1;
  return flattenedNodes.findIndex((node) => node.id === cursorPosition.nodeId);
}

/**
 * Helper function to reset cursor to first available node when current position is invalid
 */
export function resetCursorToFirstNode(state: CollapsibleState): {
  scrollToLine?: number;
} {
  if (state.flattenedNodes.length > 0) {
    const firstNode = state.flattenedNodes[0];
    if (firstNode) {
      state.cursorPosition = {
        nodeId: firstNode.id,
        lineIndex: 0,
      };
      return { scrollToLine: 0 };
    }
  }
  return {};
}
