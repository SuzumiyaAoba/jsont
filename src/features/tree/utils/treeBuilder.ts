/**
 * Tree structure builder utilities
 */

import type { JsonValue } from "@core/types/index";
import type { TreeNode, TreeViewState } from "../types/tree";

/**
 * Builds a tree structure from JSON data
 */
export function buildTreeFromJson(
  data: JsonValue | null,
  options: { expandLevel?: number } = {},
): TreeViewState {
  const { expandLevel = 2 } = options;
  const nodes = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];
  const expandedNodes = new Set<string>();

  // Handle null data case
  if (data === null) {
    const nullNode = createNode(null, null, 0, [], undefined);
    rootNodes.push(nullNode);
    return {
      nodes,
      rootNodes,
      expandedNodes,
      selectedNodeId: null,
    };
  }

  function createNode(
    value: JsonValue | null,
    key: string | number | null,
    level: number,
    path: (string | number)[] = [],
    parent?: TreeNode,
  ): TreeNode {
    const id = path.length === 0 ? "__root__" : path.join(".");
    const type = getValueType(value);
    const hasChildren = type === "object" || type === "array";

    const node: TreeNode = {
      id,
      key,
      value,
      type,
      level,
      isExpanded: level < expandLevel,
      hasChildren,
      children: [],
      parent,
      path: [...path],
    };

    nodes.set(id, node);

    if (node.isExpanded) {
      expandedNodes.add(id);
    }

    // Build children
    if (hasChildren && value != null) {
      if (type === "object") {
        const obj = value as Record<string, JsonValue>;
        Object.entries(obj).forEach(([childKey, childValue]) => {
          const childPath = [...path, childKey];
          const childNode = createNode(
            childValue,
            childKey,
            level + 1,
            childPath,
            node,
          );
          node.children.push(childNode);
        });
      } else if (type === "array") {
        const arr = value as JsonValue[];
        arr.forEach((childValue, index) => {
          const childPath = [...path, index];
          const childNode = createNode(
            childValue,
            index,
            level + 1,
            childPath,
            node,
          );
          node.children.push(childNode);
        });
      }
    }

    return node;
  }

  const rootNode = createNode(data, null, 0);
  rootNodes.push(rootNode);

  return {
    nodes,
    rootNodes,
    expandedNodes,
    selectedNodeId: null,
  };
}

/**
 * Gets the type of a JSON value
 */
function getValueType(
  value: JsonValue | null,
): "object" | "array" | "primitive" {
  if (value === null) return "primitive";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "primitive";
}

/**
 * Toggles the expansion state of a node
 */
export function toggleNodeExpansion(
  state: TreeViewState,
  nodeId: string,
): TreeViewState {
  const node = state.nodes.get(nodeId);
  if (!node || !node.hasChildren) return state;

  const newExpandedNodes = new Set(state.expandedNodes);
  const newNodes = new Map(state.nodes);

  const updatedNode = { ...node, isExpanded: !node.isExpanded };
  newNodes.set(nodeId, updatedNode);

  if (updatedNode.isExpanded) {
    newExpandedNodes.add(nodeId);
  } else {
    newExpandedNodes.delete(nodeId);
  }

  // Update all nodes to use the latest state from the nodes map
  const updatedRootNodes = state.rootNodes.map((rootNode) =>
    updateNodeFromMap(rootNode, newNodes),
  );

  return {
    ...state,
    nodes: newNodes,
    rootNodes: updatedRootNodes,
    expandedNodes: newExpandedNodes,
  };
}

/**
 * Updates a node tree recursively using the latest state from the nodes map
 */
function updateNodeFromMap(
  node: TreeNode,
  nodesMap: Map<string, TreeNode>,
): TreeNode {
  const updatedNode = nodesMap.get(node.id) || node;

  // Update children recursively
  const updatedChildren = updatedNode.children.map((child) =>
    updateNodeFromMap(child, nodesMap),
  );

  return {
    ...updatedNode,
    children: updatedChildren,
  };
}

/**
 * Expands all nodes up to a certain level
 */
export function expandToLevel(
  state: TreeViewState,
  level: number,
): TreeViewState {
  const newExpandedNodes = new Set<string>();
  const newNodes = new Map<string, TreeNode>();

  for (const [nodeId, node] of state.nodes) {
    const shouldExpand = node.level < level && node.hasChildren;
    const updatedNode = { ...node, isExpanded: shouldExpand };
    newNodes.set(nodeId, updatedNode);

    if (shouldExpand) {
      newExpandedNodes.add(nodeId);
    }
  }

  return {
    ...state,
    nodes: newNodes,
    expandedNodes: newExpandedNodes,
  };
}

/**
 * Collapses all nodes
 */
export function collapseAll(state: TreeViewState): TreeViewState {
  const newNodes = new Map<string, TreeNode>();

  for (const [nodeId, node] of state.nodes) {
    const updatedNode = { ...node, isExpanded: false };
    newNodes.set(nodeId, updatedNode);
  }

  // Update all nodes to use the latest state from the nodes map
  const updatedRootNodes = state.rootNodes.map((rootNode) =>
    updateNodeFromMap(rootNode, newNodes),
  );

  return {
    ...state,
    nodes: newNodes,
    rootNodes: updatedRootNodes,
    expandedNodes: new Set(),
  };
}

/**
 * Expands all nodes
 */
export function expandAll(state: TreeViewState): TreeViewState {
  const newExpandedNodes = new Set<string>();
  const newNodes = new Map<string, TreeNode>();

  for (const [nodeId, node] of state.nodes) {
    const updatedNode = { ...node, isExpanded: node.hasChildren };
    newNodes.set(nodeId, updatedNode);

    if (node.hasChildren) {
      newExpandedNodes.add(nodeId);
    }
  }

  // Update all nodes to use the latest state from the nodes map
  const updatedRootNodes = state.rootNodes.map((rootNode) =>
    updateNodeFromMap(rootNode, newNodes),
  );

  return {
    ...state,
    nodes: newNodes,
    rootNodes: updatedRootNodes,
    expandedNodes: newExpandedNodes,
  };
}
