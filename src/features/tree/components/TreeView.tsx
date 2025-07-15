/**
 * Tree view component for displaying JSON in tree structure
 */

import type { JsonValue } from "@core/types/index";
import { Box, Text } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TreeDisplayOptions,
  TreeLine,
  TreeViewState,
} from "../types/tree";
import {
  buildTreeFromJson,
  collapseAll,
  expandAll,
  toggleNodeExpansion,
} from "../utils/treeBuilder";
import {
  getTreeLineText,
  getVisibleTreeLines,
  renderTreeLines,
  searchTreeNodes,
} from "../utils/treeRenderer";

export interface TreeViewProps {
  data: JsonValue | null;
  height?: number;
  width?: number;
  searchTerm?: string;
  options?: Partial<TreeDisplayOptions>;
  onKeyboardHandlerReady?: (
    handler: (input: string, key: any) => boolean,
  ) => void;
}

const DEFAULT_OPTIONS: TreeDisplayOptions = {
  showArrayIndices: true,
  showPrimitiveValues: true,
  maxValueLength: 50,
  useUnicodeTree: true,
};

export function TreeView({
  data,
  height = 20,
  width = 80,
  searchTerm = "",
  options = {},
  onKeyboardHandlerReady,
}: TreeViewProps) {
  const displayOptions = { ...DEFAULT_OPTIONS, ...options };
  const [treeState, setTreeState] = useState<TreeViewState>(() =>
    buildTreeFromJson(data || null, { expandLevel: 2 }),
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);

  // Generate tree lines
  const treeLines = renderTreeLines(treeState, displayOptions);
  const filteredLines = searchTerm
    ? treeLines.filter((line) => {
        const text = getTreeLineText(line).toLowerCase();
        return text.includes(searchTerm.toLowerCase());
      })
    : treeLines;

  // Calculate visible lines
  const visibleLines = getVisibleTreeLines(
    filteredLines,
    scrollOffset,
    scrollOffset + height,
  );
  const maxScroll = Math.max(0, filteredLines.length - height);

  // Use refs to maintain stable references
  const stateRef = useRef({
    selectedLineIndex,
    scrollOffset,
    filteredLines: [] as TreeLine[],
    height,
    maxScroll: 0,
  });
  stateRef.current = {
    selectedLineIndex,
    scrollOffset,
    filteredLines,
    height,
    maxScroll,
  };

  // Handle keyboard navigation using refs for stable state access
  const handleTreeKeyboardInput = useCallback(
    (input: string, key: any): boolean => {
      if (!key) {
        return false; // Safety check for undefined key
      }

      const {
        selectedLineIndex,
        scrollOffset,
        filteredLines,
        height,
        maxScroll,
      } = stateRef.current;

      if (key.upArrow || (input === "k" && !key.ctrl)) {
        setSelectedLineIndex((prev) => Math.max(0, prev - 1));
        if (selectedLineIndex <= scrollOffset) {
          setScrollOffset((prev) => Math.max(0, prev - 1));
        }
        return true;
      } else if (key.downArrow || (input === "j" && !key.ctrl)) {
        setSelectedLineIndex((prev) =>
          Math.min(filteredLines.length - 1, prev + 1),
        );
        if (selectedLineIndex >= scrollOffset + height - 1) {
          setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
        }
        return true;
      } else if (key.pageUp || (key.ctrl && input === "b")) {
        const newIndex = Math.max(0, selectedLineIndex - height);
        setSelectedLineIndex(newIndex);
        setScrollOffset(Math.max(0, newIndex - Math.floor(height / 2)));
        return true;
      } else if (key.pageDown || (key.ctrl && input === "f")) {
        const newIndex = Math.min(
          filteredLines.length - 1,
          selectedLineIndex + height,
        );
        setSelectedLineIndex(newIndex);
        setScrollOffset(Math.min(maxScroll, newIndex - Math.floor(height / 2)));
        return true;
      } else if (key.return || input === " ") {
        // Toggle expansion of selected node
        const selectedLine = filteredLines[selectedLineIndex];
        if (selectedLine?.hasChildren) {
          setTreeState((prev) => toggleNodeExpansion(prev, selectedLine.id));
        }
        return true;
      } else if (input === "e") {
        // Expand all
        setTreeState((prev) => expandAll(prev));
        return true;
      } else if (input === "c") {
        // Collapse all
        setTreeState((prev) => collapseAll(prev));
        return true;
      } else if (input === "g") {
        // Go to top (similar to vim's gg)
        setSelectedLineIndex(0);
        setScrollOffset(0);
        return true;
      } else if (input === "G") {
        // Go to bottom (similar to vim's G)
        setSelectedLineIndex(filteredLines.length - 1);
        setScrollOffset(maxScroll);
        return true;
      }
      return false;
    },
    [], // Empty dependency array since we're using ref
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      onKeyboardHandlerReady(handleTreeKeyboardInput);
    }
  }, [onKeyboardHandlerReady, handleTreeKeyboardInput]);

  // Update tree when data changes
  useEffect(() => {
    setTreeState(buildTreeFromJson(data || null, { expandLevel: 2 }));
    setScrollOffset(0);
    setSelectedLineIndex(0);
  }, [data]);

  // Search highlighting
  const matchingNodes = searchTerm
    ? searchTreeNodes(treeState, searchTerm, { searchValues: true })
    : new Set<string>();

  // Simplified TreeView implementation
  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* TreeView identification header */}
      <Box width={width}>
        <Text color="blue" bold>
          TREE VIEW MODE (j/k: navigate, Space: toggle)
        </Text>
      </Box>

      {/* Simple data display */}
      <Box width={width}>
        <Text color="white">
          {data ? JSON.stringify(data, null, 2) : "No data"}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Gets the color for a tree line based on its type and state
 */
function getLineColor(line: TreeLine, isMatched: boolean): string {
  if (isMatched) return "yellow";

  switch (line.type) {
    case "object":
      return "blue";
    case "array":
      return "cyan";
    case "primitive":
      return "green";
    default:
      return "white";
  }
}

/**
 * Hook for tree view keyboard shortcuts
 */
export function useTreeViewShortcuts() {
  return {
    "↑/↓ or j/k": "Navigate up/down",
    "Page Up/Down or Ctrl+b/f": "Navigate by page",
    "Enter/Space": "Toggle expansion",
    e: "Expand all",
    c: "Collapse all",
    "g/G": "Go to first/last item",
  };
}
