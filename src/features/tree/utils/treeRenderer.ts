/**
 * Tree rendering utilities
 */

import type {
  TreeDisplayOptions,
  TreeLine,
  TreeNode,
  TreeViewState,
} from "../types/tree.js";

const TREE_SYMBOLS = {
  unicode: {
    branch: "├── ",
    lastBranch: "└── ",
    vertical: "│   ",
    space: "    ",
  },
  ascii: {
    branch: "|-- ",
    lastBranch: "`-- ",
    vertical: "|   ",
    space: "    ",
  },
};

/**
 * Renders tree state to display lines
 */
export function renderTreeLines(
  state: TreeViewState,
  options: TreeDisplayOptions,
): TreeLine[] {
  const lines: TreeLine[] = [];
  const symbols = options.useUnicodeTree
    ? TREE_SYMBOLS.unicode
    : TREE_SYMBOLS.ascii;

  function renderNode(
    node: TreeNode,
    prefix: string,
    isLast: boolean,
    ancestorPrefixes: string[],
  ): void {
    const line: TreeLine = {
      id: node.id,
      level: node.level,
      prefix: prefix,
      key: formatKey(node.key, node.type, options),
      value: formatValue(node.value, node.type, options),
      type: node.type,
      isExpanded: node.isExpanded,
      hasChildren: node.hasChildren,
    };

    lines.push(line);

    // Render children if expanded
    if (node.isExpanded && node.children.length > 0) {
      const childPrefix =
        ancestorPrefixes.join("") + (isLast ? symbols.space : symbols.vertical);

      node.children.forEach((child, index) => {
        const isLastChild = index === node.children.length - 1;
        const childPrefixSymbol = isLastChild
          ? symbols.lastBranch
          : symbols.branch;
        const fullChildPrefix = childPrefix + childPrefixSymbol;

        renderNode(child, fullChildPrefix, isLastChild, [
          ...ancestorPrefixes,
          isLast ? symbols.space : symbols.vertical,
        ]);
      });
    }
  }

  // Render root nodes
  state.rootNodes.forEach((rootNode, index) => {
    const isLast = index === state.rootNodes.length - 1;
    renderNode(rootNode, "", isLast, []);
  });

  return lines;
}

/**
 * Formats a key for display
 */
function formatKey(
  key: string | number | null,
  type: "object" | "array" | "primitive",
  options: TreeDisplayOptions,
): string {
  if (key === null) return ""; // Root node

  if (type === "primitive" && typeof key === "number") {
    return options.showArrayIndices ? `[${key}]` : "";
  }

  if (typeof key === "string") {
    return `"${key}"`;
  }

  if (typeof key === "number") {
    return options.showArrayIndices ? `[${key}]` : "";
  }

  return String(key);
}

/**
 * Formats a value for display
 */
function formatValue(
  value: unknown,
  type: "object" | "array" | "primitive",
  options: TreeDisplayOptions,
): string {
  if (type === "object") {
    if (value === null || value === undefined) return "null";
    const keys = Object.keys(value);
    return `{${keys.length} ${keys.length === 1 ? "key" : "keys"}}`;
  }

  if (type === "array") {
    const length = Array.isArray(value) ? value.length : 0;
    return `[${length} ${length === 1 ? "item" : "items"}]`;
  }

  // Primitive value
  if (!options.showPrimitiveValues) return "";

  let formatted = JSON.stringify(value);

  if (formatted.length > options.maxValueLength) {
    formatted = `${formatted.substring(0, options.maxValueLength - 3)}...`;
  }

  return formatted;
}

/**
 * Gets the display text for a tree line
 */
export function getTreeLineText(line: TreeLine): string {
  const keyPart = line.key ? `${line.key}: ` : "";
  const valuePart = line.value || "";

  // Add expand/collapse indicator for containers
  let indicator = "";
  if (line.hasChildren) {
    indicator = line.isExpanded ? "▼ " : "▶ ";
  }

  return line.prefix + indicator + keyPart + valuePart;
}

/**
 * Finds the visible lines within a scroll window
 */
export function getVisibleTreeLines(
  lines: TreeLine[],
  startLine: number,
  endLine: number,
): TreeLine[] {
  return lines.slice(startLine, endLine);
}

/**
 * Searches for nodes matching a query
 */
export function searchTreeNodes(
  state: TreeViewState,
  query: string,
  options: { caseSensitive?: boolean; searchValues?: boolean } = {},
): Set<string> {
  const { caseSensitive = false, searchValues = true } = options;
  const matchingNodes = new Set<string>();
  const searchTerm = caseSensitive ? query : query.toLowerCase();

  if (!searchTerm) return matchingNodes;

  for (const [nodeId, node] of state.nodes) {
    let searchText = "";

    // Search in key
    if (node.key !== null) {
      searchText += String(node.key);
    }

    // Search in value if enabled
    if (searchValues && node.type === "primitive") {
      searchText += ` ${JSON.stringify(node.value)}`;
    }

    const normalizedSearchText = caseSensitive
      ? searchText
      : searchText.toLowerCase();

    if (normalizedSearchText.includes(searchTerm)) {
      matchingNodes.add(nodeId);
    }
  }

  return matchingNodes;
}
