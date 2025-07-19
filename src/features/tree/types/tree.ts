/**
 * Types for tree view functionality
 */

import type { JsonValue } from "@core/types/index";

export interface TreeNode {
  id: string;
  key: string | number | null;
  value: JsonValue | null;
  type: "object" | "array" | "primitive";
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  children: TreeNode[];
  parent: TreeNode | undefined;
  path: (string | number)[];
}

export interface TreeViewState {
  nodes: Map<string, TreeNode>;
  rootNodes: TreeNode[];
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
}

export interface TreeDisplayOptions {
  showArrayIndices: boolean;
  showPrimitiveValues: boolean;
  maxValueLength: number;
  useUnicodeTree: boolean;
  showSchemaTypes: boolean; // Toggle for JSON Schema type display
}

export interface TreeLine {
  id: string;
  level: number;
  prefix: string;
  key: string;
  value: string;
  type: "object" | "array" | "primitive";
  isExpanded?: boolean;
  hasChildren: boolean;
  schemaType?: string; // JSON Schema type (string, number, boolean, etc.)
  originalValue?: JsonValue | null; // Original value for arrays/objects to get length/count
}
