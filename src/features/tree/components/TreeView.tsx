/**
 * Tree view component for displaying JSON in tree structure
 */

import type { KeyboardInput } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { Box, Text } from "ink";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

/**
 * Props interface for the TreeView component
 */
export interface TreeViewProps {
  /** JSON data to display in tree format */
  data: JsonValue | null;
  /** Height of the tree view in terminal lines (default: 20) */
  height?: number;
  /** Width of the tree view in characters (default: 80) */
  width?: number;
  /** Search term to filter tree nodes */
  searchTerm?: string;
  /** Display options for customizing tree appearance */
  options?: Partial<TreeDisplayOptions>;
  /** Callback to register keyboard input handler with parent component */
  onKeyboardHandlerReady?: (
    handler: (input: string, key: KeyboardInput) => boolean,
  ) => void;
}

const DEFAULT_OPTIONS: TreeDisplayOptions = {
  showArrayIndices: true,
  showPrimitiveValues: true,
  maxValueLength: 50,
  useUnicodeTree: true,
  showSchemaTypes: false,
};

/**
 * TreeView component for displaying JSON data in an interactive tree structure
 *
 * Features:
 * - Keyboard navigation (j/k, arrows, page up/down, g/G)
 * - Node expansion/collapse (Space/Enter, e/c for all)
 * - Search filtering
 * - Schema type display toggle (t)
 * - Scrolling support for large datasets
 *
 * @param props - TreeView component props
 * @returns JSX element containing the tree view interface
 */
export function TreeView({
  data,
  height = 20,
  width = 80,
  searchTerm = "",
  options = {},
  onKeyboardHandlerReady,
}: TreeViewProps) {
  const [treeState, setTreeState] = useState<TreeViewState>(() =>
    buildTreeFromJson(data || null, { expandLevel: 2 }),
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [showSchemaTypes, setShowSchemaTypes] = useState(false);

  // Memoize display options to prevent unnecessary recalculations
  const displayOptions = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
      showSchemaTypes,
    }),
    [options, showSchemaTypes],
  );

  // Memoize tree lines generation for performance
  const treeLines = useMemo(
    () => renderTreeLines(treeState, displayOptions),
    [treeState, displayOptions],
  );

  // Memoize search filtering for performance
  const filteredLines = useMemo(() => {
    const result = !searchTerm
      ? treeLines
      : treeLines.filter((line) => {
          const lowerSearchTerm = searchTerm.toLowerCase();
          const text = getTreeLineText(line).toLowerCase();
          return text.includes(lowerSearchTerm);
        });

    return result;
  }, [treeLines, searchTerm]);

  // Calculate visible lines and ensure bounds
  const actualMaxScroll = Math.max(0, filteredLines.length - height);
  const boundedScrollOffset = Math.min(scrollOffset, actualMaxScroll);
  const boundedSelectedIndex = Math.min(
    selectedLineIndex,
    filteredLines.length - 1,
  );

  const visibleLines = getVisibleTreeLines(
    filteredLines,
    boundedScrollOffset,
    boundedScrollOffset + height,
  );
  const maxScroll = actualMaxScroll;

  // Use refs to maintain stable references
  const stateRef = useRef({
    selectedLineIndex: boundedSelectedIndex,
    scrollOffset: boundedScrollOffset,
    filteredLines: [] as TreeLine[],
    height,
    maxScroll: 0,
  });
  stateRef.current = {
    selectedLineIndex: boundedSelectedIndex,
    scrollOffset: boundedScrollOffset,
    filteredLines,
    height,
    maxScroll,
  };

  // Handle keyboard navigation using refs for stable state access
  const handleTreeKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Comprehensive input validation
      if (
        !key ||
        typeof input !== "string" ||
        input === null ||
        input === undefined
      ) {
        return false; // Safety check for invalid input
      }

      try {
        const {
          selectedLineIndex,
          scrollOffset,
          filteredLines,
          height,
          maxScroll,
        } = stateRef.current;

        // Validate state data
        if (!Array.isArray(filteredLines) || filteredLines.length < 0) {
          return false; // Invalid state, don't process
        }

        if (key.upArrow || (input === "k" && !key.ctrl)) {
          const newIndex = Math.max(0, selectedLineIndex - 1);
          setSelectedLineIndex(newIndex);
          if (newIndex <= scrollOffset) {
            setScrollOffset(Math.max(0, scrollOffset - 1));
          }
          return true;
        } else if (key.downArrow || (input === "j" && !key.ctrl)) {
          const newIndex = Math.min(
            filteredLines.length - 1,
            selectedLineIndex + 1,
          );
          setSelectedLineIndex(newIndex);
          if (newIndex >= scrollOffset + height - 1) {
            setScrollOffset(Math.min(maxScroll, scrollOffset + 1));
          }
          return true;
        } else if (key.pageUp || (key.ctrl && input === "b")) {
          const newIndex = Math.max(0, selectedLineIndex - height);
          const newScrollOffset = Math.max(
            0,
            newIndex - Math.floor(height / 2),
          );
          setSelectedLineIndex(newIndex);
          setScrollOffset(newScrollOffset);
          return true;
        } else if (key.pageDown || (key.ctrl && input === "f")) {
          const newIndex = Math.min(
            filteredLines.length - 1,
            selectedLineIndex + height,
          );
          const newScrollOffset = Math.min(
            maxScroll,
            newIndex - Math.floor(height / 2),
          );
          setSelectedLineIndex(newIndex);
          setScrollOffset(newScrollOffset);
          return true;
        } else if (key.return || input === " ") {
          // Toggle expansion of selected node
          const selectedLine = filteredLines[selectedLineIndex];
          if (selectedLine?.hasChildren) {
            setTreeState((prev) => {
              const newState = toggleNodeExpansion(prev, selectedLine.id);
              return newState;
            });
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
        } else if (input === "t") {
          // Toggle schema type display
          setShowSchemaTypes((prev) => !prev);
          return true;
        }
        return false;
      } catch (error) {
        // Log error in development but fail gracefully
        if (process.env["NODE_ENV"] === "development") {
          console.error("TreeView keyboard handler error:", error);
        }
        return false;
      }
    },
    [], // State setters are stable in React and don't need to be in the dependency array
  );

  // Remove direct useInput - let App.tsx handle all input and delegate to us

  // Input validation utility
  const isValidInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      return !!(
        input !== null &&
        input !== undefined &&
        typeof input === "string" &&
        key &&
        typeof key === "object"
      );
    },
    [],
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      // Create a wrapper function that prevents invalid calls
      const wrappedHandler = (input: string, key: KeyboardInput): boolean => {
        if (!isValidInput(input, key)) {
          return false;
        }
        return handleTreeKeyboardInput(input, key);
      };
      onKeyboardHandlerReady(wrappedHandler);
    }
  }, [onKeyboardHandlerReady, handleTreeKeyboardInput, isValidInput]);

  // Update tree when data changes
  useEffect(() => {
    const newTreeState = buildTreeFromJson(data || null, { expandLevel: 2 });
    setTreeState(newTreeState);
    setScrollOffset(0);
    setSelectedLineIndex(0);
  }, [data]);

  // Ensure selected index is valid when filtered lines change
  useEffect(() => {
    if (filteredLines.length > 0 && selectedLineIndex >= filteredLines.length) {
      setSelectedLineIndex(Math.max(0, filteredLines.length - 1));
    }
  }, [filteredLines.length, selectedLineIndex]);

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
          TREE VIEW MODE (j/k: navigate, Space: toggle, t: types)
        </Text>
      </Box>

      {/* Tree structure display */}
      {visibleLines.map((line, index) => {
        const lineIndex = boundedScrollOffset + index;
        const isSelected = lineIndex === boundedSelectedIndex;
        const isMatched = matchingNodes.has(line.id);

        return (
          <Box key={line.id} width={width}>
            <Text color={isSelected ? "yellow" : "gray"}>
              {isSelected ? ">" : " "}
            </Text>
            {renderTreeLineWithColors(
              line,
              isSelected,
              isMatched,
              displayOptions,
            )}
          </Box>
        );
      })}

      {/* Show help text if no lines */}
      {filteredLines.length === 0 && (
        <Box
          justifyContent="center"
          alignItems="center"
          height={Math.max(1, height - 1)}
        >
          <Text color="gray">
            {searchTerm ? "No matches found" : "No data to display"}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Renders a tree line with different colors for keys and values
 */
function renderTreeLineWithColors(
  line: TreeLine,
  isSelected: boolean,
  isMatched: boolean,
  options: TreeDisplayOptions,
): ReactElement {
  const baseProps = {
    ...(isSelected ? { bgColor: "blue", color: "white" } : {}),
    bold: isSelected,
  };

  if (
    line.type === "primitive" &&
    line.key !== null &&
    line.key !== undefined &&
    line.key !== ""
  ) {
    // For primitive values, separate key and value with different colors
    const keyPart = `${line.key}:`;
    const valuePart = ` ${line.value}`;
    const typePart =
      options.showSchemaTypes && line.schemaType ? ` <${line.schemaType}>` : "";

    return (
      <>
        <Text
          {...baseProps}
          color={isSelected ? "white" : getKeyColor(isMatched)}
        >
          {line.prefix}
          {keyPart}
        </Text>
        <Text {...baseProps} color={isSelected ? "white" : getValueColor()}>
          {valuePart}
        </Text>
        {typePart && (
          <Text {...baseProps} color={isSelected ? "white" : getTypeColor()}>
            {typePart}
          </Text>
        )}
      </>
    );
  } else {
    // For objects, arrays, or root primitives, use single color
    const text = getTreeLineText(line, options);
    return (
      <Text
        {...baseProps}
        color={isSelected ? "white" : getLineColor(line, isMatched)}
      >
        {text}
      </Text>
    );
  }
}

/**
 * Gets the color for keys
 */
function getKeyColor(isMatched: boolean): string {
  if (isMatched) return "yellow";
  return "blue"; // Keys in blue for better distinction
}

/**
 * Gets the color for values (terminal default)
 */
function getValueColor(): string {
  return "white"; // Terminal default color
}

/**
 * Gets the color for schema types
 */
function getTypeColor(): string {
  return "gray"; // Schema types in gray for subtle indication
}

/**
 * Gets the color for a tree line based on its type and state
 */
function getLineColor(line: TreeLine, isMatched: boolean): string {
  if (isMatched) return "yellow";

  switch (line.type) {
    case "object":
      return "blue"; // Object names in blue
    case "array":
      return "blue"; // Array names in blue (consistent with objects)
    case "primitive":
      return "white"; // Use terminal default for primitive values
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
    t: "Toggle schema type display",
  };
}
