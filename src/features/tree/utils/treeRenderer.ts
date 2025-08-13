/**
 * Tree rendering utilities
 */

import type { JsonValue } from "@core/types/index";
import type {
  TreeDisplayOptions,
  TreeLine,
  TreeNode,
  TreeViewState,
} from "../types/tree";

const TREE_SYMBOLS = {
  unicode: {
    branch: "├─ ",
    lastBranch: "└─ ",
    vertical: "│  ",
    space: "   ",
  },
  ascii: {
    branch: "|-- ",
    lastBranch: "`-- ",
    vertical: "|  ",
    space: "   ",
  },
};

/**
 * Infer JSON Schema type for a value
 */
function inferSchemaType(value: JsonValue | null): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "unknown";
}

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
      schemaType: inferSchemaType(node.value),
      originalValue: node.value, // Store original value for arrays/objects
    };

    lines.push(line);

    // Render children if expanded
    if (node.isExpanded && node.children.length > 0) {
      // For root node (level 0), don't add any prefix before the branch symbol
      const basePrefix = ancestorPrefixes.join("");
      const childPrefix =
        node.level === 0
          ? ""
          : basePrefix + (isLast ? symbols.space : symbols.vertical);

      node.children.forEach((child: TreeNode, index: number) => {
        const isLastChild = index === node.children.length - 1;
        const childPrefixSymbol = isLastChild
          ? symbols.lastBranch
          : symbols.branch;
        const fullChildPrefix = childPrefix + childPrefixSymbol;

        // For root node children, don't add vertical/space to ancestor prefixes
        const newAncestorPrefixes =
          node.level === 0
            ? []
            : [...ancestorPrefixes, isLast ? symbols.space : symbols.vertical];

        renderNode(child, fullChildPrefix, isLastChild, newAncestorPrefixes);
      });
    }
  }

  // Render root nodes
  state.rootNodes.forEach((rootNode: TreeNode, index: number) => {
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
  _type: "object" | "array" | "primitive",
  _options: TreeDisplayOptions,
): string {
  if (key === null) return ""; // Root node

  // For tree command style, remove quotes and brackets
  if (typeof key === "number") {
    return String(key);
  }

  if (typeof key === "string") {
    // Remove quotes for cleaner tree display
    return key.replace(/^"(.*)"$/, "$1");
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
  // For tree command style, don't show container summaries for objects/arrays
  // They will be shown as directory-like entries
  if (type === "object" || type === "array") {
    return "";
  }

  // Primitive value - remove quotes for cleaner display
  if (!options.showPrimitiveValues) return "";

  let formatted = JSON.stringify(value);

  // Keep quotes for string values to distinguish them from other types

  if (formatted.length > options.maxValueLength) {
    formatted = `${formatted.substring(0, options.maxValueLength - 3)}...`;
  }

  return formatted;
}

/**
 * Gets the display text for a tree line
 */
export function getTreeLineText(
  line: TreeLine,
  options?: TreeDisplayOptions,
): string {
  // For tree command style, show key names for objects/arrays and values for primitives
  let displayText = "";

  if (line.type === "primitive") {
    // For primitive values, show key and value like "name: John"
    if (line.key !== null && line.key !== undefined && line.key !== "") {
      displayText = `${line.key}: ${line.value}`;
    } else {
      // Root primitive value
      displayText = line.value || "";
    }
  } else {
    // For objects and arrays, show just the key name like a directory
    if (line.key !== null && line.key !== undefined && line.key !== "") {
      displayText = line.key;
    } else {
      // Root object/array: "." for object, show array length for arrays
      if (line.type === "object") {
        displayText = ".";
      } else if (line.type === "array") {
        // For arrays, show the array length using originalValue
        const arrayValue = line.originalValue;
        if (Array.isArray(arrayValue)) {
          displayText = `${arrayValue.length}:`;
        } else {
          displayText = "1:"; // fallback
        }
      } else {
        displayText = "1:"; // fallback
      }
    }
  }

  // Add collapsed indicators for objects and arrays that have children but are not expanded
  if (line.hasChildren && !line.isExpanded) {
    if (line.type === "object") {
      displayText += " {...}";
    } else if (line.type === "array") {
      displayText += " [...]";
    }
  }

  // Add schema type if enabled
  if (options?.showSchemaTypes && line.schemaType) {
    displayText += ` <${line.schemaType}>`;
  }

  return line.prefix + displayText;
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
