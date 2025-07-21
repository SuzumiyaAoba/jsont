/**
 * Tree view component for displaying JSON in tree structure
 */

import { useConfig } from "@core/context/ConfigContext";
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
  const config = useConfig();

  const [treeState, setTreeState] = useState<TreeViewState>(() =>
    buildTreeFromJson(data || null, { expandLevel: 1 }),
  );

  // Always start at the top
  const [scrollOffset, setScrollOffset] = useState(0);

  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [showSchemaTypes, setShowSchemaTypes] = useState(
    config.display.tree.showSchemaTypes,
  );
  const [showLineNumbers, setShowLineNumbers] = useState(
    config.display.interface.showLineNumbers,
  );

  // Memoize display options to prevent unnecessary recalculations
  const displayOptions = useMemo(
    () => ({
      ...config.display.tree,
      ...options,
      showSchemaTypes,
    }),
    [config.display.tree, options, showSchemaTypes],
  );

  // Memoize tree lines generation for performance
  const treeLines = useMemo(() => {
    return renderTreeLines(treeState, displayOptions);
  }, [treeState, displayOptions]);

  // Memoize search filtering for performance
  const filteredLines = useMemo(() => {
    return !searchTerm
      ? treeLines
      : treeLines.filter((line) => {
          const lowerSearchTerm = searchTerm.toLowerCase();
          const text = getTreeLineText(line).toLowerCase();
          return text.includes(lowerSearchTerm);
        });
  }, [treeLines, searchTerm]);

  // Calculate visible lines and ensure bounds
  // Subtract 1 from height to account for the header line
  const actualMaxScroll = Math.max(0, filteredLines.length - (height - 1));
  const boundedScrollOffset = Math.min(scrollOffset, actualMaxScroll);
  const boundedSelectedIndex = Math.min(
    selectedLineIndex,
    filteredLines.length - 1,
  );

  // Calculate visible lines: account for header line taking 1 row
  // Available content height = height - 1
  // To get exactly contentHeight lines from slice(start, end), we need end = start + contentHeight
  // slice(start, end) returns elements from start to end-1, so end = start + contentHeight gives us contentHeight elements
  const contentHeight = height - 1; // Available height for content after header
  const visibleLines = getVisibleTreeLines(
    filteredLines,
    boundedScrollOffset,
    boundedScrollOffset + contentHeight,
  );

  // Ensure stable rendering by adding a key that forces proper reconciliation
  const renderKey = useMemo(() => {
    return `${treeState.rootNodes.length}-${filteredLines.length}`;
  }, [treeState.rootNodes.length, filteredLines.length]);

  const maxScroll = actualMaxScroll;

  // Use refs to maintain stable references
  const stateRef = useRef({
    selectedLineIndex: boundedSelectedIndex,
    scrollOffset: boundedScrollOffset,
    filteredLines: [] as TreeLine[],
    height,
    maxScroll: 0,
    displayOptions,
    searchTerm,
  });
  stateRef.current = {
    selectedLineIndex: boundedSelectedIndex,
    scrollOffset: boundedScrollOffset,
    filteredLines,
    height,
    maxScroll,
    displayOptions,
    searchTerm,
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

          // Ensure selected line is visible
          if (newIndex < scrollOffset) {
            setScrollOffset(Math.max(0, newIndex));
          }
          return true;
        } else if (key.downArrow || (input === "j" && !key.ctrl)) {
          const newIndex = Math.min(
            filteredLines.length - 1,
            selectedLineIndex + 1,
          );
          setSelectedLineIndex(newIndex);

          // Ensure selected line is visible and handle array parent selection
          const effectiveHeight = height - 1; // Account for header line
          if (newIndex >= scrollOffset + effectiveHeight) {
            let targetScrollOffset = Math.min(
              maxScroll,
              newIndex - effectiveHeight + 1,
            );

            // Special handling for array parents: ensure first child is visible
            const selectedLine = filteredLines[newIndex];
            if (
              selectedLine &&
              selectedLine.type === "array" &&
              selectedLine.hasChildren
            ) {
              const firstChildId = `${selectedLine.id}.0`;
              const firstChildIndex = filteredLines.findIndex(
                (line) => line.id === firstChildId,
              );
              if (firstChildIndex !== -1) {
                // Ensure first child is visible by adjusting scroll if needed
                const childVisibleStart = targetScrollOffset;
                const childVisibleEnd =
                  targetScrollOffset + effectiveHeight - 1;
                if (
                  firstChildIndex < childVisibleStart ||
                  firstChildIndex > childVisibleEnd
                ) {
                  targetScrollOffset = Math.max(
                    0,
                    Math.min(
                      firstChildIndex - 1, // Show parent and first child
                      maxScroll,
                    ),
                  );
                }
              }
            }

            setScrollOffset(targetScrollOffset);
          }
          return true;
        } else if (key.pageUp || (key.ctrl && input === "b")) {
          const effectiveHeight = height - 1; // Account for header line
          const newIndex = Math.max(0, selectedLineIndex - effectiveHeight);
          const newScrollOffset = Math.max(
            0,
            newIndex - Math.floor(effectiveHeight / 2),
          );
          setSelectedLineIndex(newIndex);
          setScrollOffset(newScrollOffset);
          return true;
        } else if (key.pageDown || (key.ctrl && input === "f")) {
          const effectiveHeight = height - 1; // Account for header line
          const newIndex = Math.min(
            filteredLines.length - 1,
            selectedLineIndex + effectiveHeight,
          );
          const newScrollOffset = Math.min(
            maxScroll,
            newIndex - Math.floor(effectiveHeight / 2),
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

              // After expanding a node, ensure scroll position shows the first child
              setTimeout(() => {
                const currentState = stateRef.current;
                const updatedLines = renderTreeLines(
                  newState,
                  currentState.displayOptions,
                );
                const updatedFilteredLines = !currentState.searchTerm
                  ? updatedLines
                  : updatedLines.filter((line) => {
                      const lowerSearchTerm =
                        currentState.searchTerm.toLowerCase();
                      const text = getTreeLineText(line).toLowerCase();
                      return text.includes(lowerSearchTerm);
                    });

                // Find the current selected line in the new tree
                const currentSelectedLine =
                  updatedFilteredLines[selectedLineIndex];
                if (currentSelectedLine?.hasChildren) {
                  // Check if the node was expanded
                  const expandedNode = newState.nodes.get(
                    currentSelectedLine.id,
                  );
                  if (expandedNode?.isExpanded) {
                    // Find the first child of the expanded node
                    const firstChildId = `${currentSelectedLine.id}.0`;
                    const firstChildIndex = updatedFilteredLines.findIndex(
                      (line) => line.id === firstChildId,
                    );

                    if (firstChildIndex !== -1) {
                      // Ensure the first child is visible
                      const currentScrollOffset = stateRef.current.scrollOffset;
                      const visibleStart = currentScrollOffset;
                      const visibleEnd = currentScrollOffset + (height - 1) - 1;

                      // If first child is not visible, adjust scroll
                      if (
                        firstChildIndex < visibleStart ||
                        firstChildIndex > visibleEnd
                      ) {
                        const newScrollOffset = Math.max(
                          0,
                          Math.min(
                            firstChildIndex - Math.floor((height - 1) / 4),
                            Math.max(
                              0,
                              updatedFilteredLines.length - (height - 1),
                            ),
                          ),
                        );
                        setScrollOffset(newScrollOffset);
                      }
                    }
                  }
                }
              }, 0);

              return newState;
            });
          }
          return true;
        } else if (input === "e") {
          // Expand all

          setTreeState((prev) => {
            try {
              const newState = expandAll(prev);

              // After expanding all, try to maintain selection on the same logical node
              setTimeout(() => {
                try {
                  const currentState = stateRef.current;

                  const newLines = renderTreeLines(
                    newState,
                    currentState.displayOptions,
                  );
                  console.log("=== TREE LINES RENDERED ===");
                  console.log("New lines count:", newLines.length);
                  const newFilteredLines = !currentState.searchTerm
                    ? newLines
                    : newLines.filter((line) => {
                        const lowerSearchTerm =
                          currentState.searchTerm.toLowerCase();
                        const text = getTreeLineText(line).toLowerCase();
                        return text.includes(lowerSearchTerm);
                      });
                  console.log("=== LINES FILTERED ===");
                  console.log("Filtered lines count:", newFilteredLines.length);

                  // Try to find the previously selected line by ID in the new tree
                  const oldSelectedLine =
                    currentState.filteredLines[currentState.selectedLineIndex];
                  console.log("=== STARTING SELECTION CALCULATION ===");
                  let newSelectedIndex = 0;

                  if (oldSelectedLine) {
                    const foundIndex = newFilteredLines.findIndex(
                      (line) => line.id === oldSelectedLine.id,
                    );
                    if (foundIndex !== -1) {
                      newSelectedIndex = foundIndex;
                    } else {
                      // If exact match not found, try to find a similar line
                      const similarIndex = newFilteredLines.findIndex(
                        (line) =>
                          line.key === oldSelectedLine.key &&
                          line.type === oldSelectedLine.type,
                      );
                      newSelectedIndex =
                        similarIndex !== -1
                          ? similarIndex
                          : Math.min(
                              currentState.selectedLineIndex,
                              newFilteredLines.length - 1,
                            );
                    }
                  }

                  // Calculate scroll position to show the selected line
                  const newMaxScroll = Math.max(
                    0,
                    newFilteredLines.length - (height - 1),
                  );
                  let newScrollOffset = 0;

                  // Find keywords section for special handling (legacy code - could be removed)
                  // const keywordsParentIndex = newFilteredLines.findIndex(
                  //   (line) => line.id === "__root__.keywords",
                  // );
                  // const keywordsNode = newState.nodes.get("__root__.keywords");

                  // Maintain user's current scroll position
                  newScrollOffset = Math.min(
                    currentState.scrollOffset,
                    newMaxScroll,
                  );

                  // Ensure selected line is still visible after any adjustments
                  if (newSelectedIndex < newScrollOffset) {
                    newScrollOffset = Math.max(0, newSelectedIndex);
                  } else if (
                    newSelectedIndex >=
                    newScrollOffset + (height - 1)
                  ) {
                    newScrollOffset = Math.min(
                      newMaxScroll,
                      newSelectedIndex - (height - 1) + 1,
                    );
                  }

                  // Bound scroll offset
                  newScrollOffset = Math.min(newScrollOffset, newMaxScroll);

                  setSelectedLineIndex(newSelectedIndex);
                  setScrollOffset(newScrollOffset);
                } catch (error) {
                  console.error("Expand all error:", error);
                }
              }, 0);

              return newState;
            } catch (error) {
              console.error("=== EXPAND ALL ERROR ===", error);
              return prev;
            }
          });
          return true;
        } else if (input === "c") {
          // Collapse all
          setTreeState((prev) => {
            const newState = collapseAll(prev);
            // Reset scroll to show from the top after collapsing all
            setTimeout(() => {
              setScrollOffset(0);
              setSelectedLineIndex(0);
            }, 0);
            return newState;
          });
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
        } else if (input === "L") {
          // Toggle line numbers display
          setShowLineNumbers((prev) => {
            const newValue = !prev;
            // Debug info for real app debugging
            if (process.env["NODE_ENV"] === "development" && newValue) {
              console.log("=== LINE NUMBERS DEBUG ===");
              console.log("Total filtered lines:", filteredLines.length);
              console.log("Scroll offset:", scrollOffset);
              console.log("Selected index:", selectedLineIndex);
              console.log("Viewport height:", height);
              console.log("Max scroll:", maxScroll);
              console.log(
                "Visible range:",
                scrollOffset,
                "to",
                scrollOffset + (height - 1),
              );

              // Show first 10 lines for reference
              console.log("First 10 lines:");
              filteredLines.slice(0, 10).forEach((line, i) => {
                console.log(
                  `  ${i + 1}: ${line.id} - "${getTreeLineText(line).substring(0, 40)}"`,
                );
              });

              // Debug visible lines calculation
              const calculatedVisibleLines = getVisibleTreeLines(
                filteredLines,
                boundedScrollOffset,
                boundedScrollOffset + contentHeight,
              );
              console.log("Visible lines calculation:");
              console.log(`  Bounded scroll offset: ${boundedScrollOffset}`);
              console.log(
                `  End index: ${boundedScrollOffset + contentHeight}`,
              );
              console.log(
                `  Calculated visible lines: ${calculatedVisibleLines.length}`,
              );

              // Show what should be visible
              console.log("Should be visible (slice result):");
              for (
                let i = boundedScrollOffset;
                i <
                Math.min(
                  boundedScrollOffset + contentHeight,
                  filteredLines.length,
                );
                i++
              ) {
                if (filteredLines[i]) {
                  const lineNum = i + 1;
                  const line = filteredLines[i];
                  if (line) {
                    console.log(
                      `  ${lineNum}: ${line.id} - "${getTreeLineText(line)}"`,
                    );
                  }
                }
              }

              // Show lines around keywords
              const keywordsIndex = filteredLines.findIndex(
                (line) => line.id === "__root__.keywords",
              );
              if (keywordsIndex >= 0) {
                console.log(`Keywords section at line ${keywordsIndex + 1}:`);
                for (
                  let i = Math.max(0, keywordsIndex - 2);
                  i < Math.min(filteredLines.length, keywordsIndex + 8);
                  i++
                ) {
                  const line = filteredLines[i];
                  if (line) {
                    console.log(
                      `  ${i + 1}: ${line.id} - "${getTreeLineText(line)}"`,
                    );
                  }
                }
              }
            }
            return newValue;
          });
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
    [boundedScrollOffset, contentHeight], // State setters are stable, avoid displayOptions/searchTerm to prevent re-creation
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
    const newTreeState = buildTreeFromJson(data || null, { expandLevel: 1 });
    setTreeState(newTreeState);

    // Always start at the top when data changes
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
          TREE VIEW MODE (j/k: navigate, Space: toggle, t: types, L: lines)
        </Text>
      </Box>

      {/* Tree structure display */}
      <Box key={renderKey} flexDirection="column">
        {visibleLines.map((line, index) => {
          const lineIndex = boundedScrollOffset + index;
          const isSelected = lineIndex === boundedSelectedIndex;
          const isMatched = matchingNodes.has(line.id);

          // Debug logging for line rendering
          if (
            process.env["NODE_ENV"] === "development" &&
            showLineNumbers &&
            lineIndex + 1 === 22
          ) {
            console.log(
              `RENDERING LINE 22: ${line.id} - "${getTreeLineText(line)}"`,
            );
          }

          return (
            <Box key={line.id} width={width}>
              {showLineNumbers ? (
                <>
                  <Text color={isSelected ? "yellow" : "gray"}>
                    {isSelected ? ">" : " "}
                  </Text>
                  <Text
                    color={isSelected ? "yellow" : "gray"}
                    dimColor={!isSelected}
                  >
                    {String(lineIndex + 1).padStart(3, " ")}:{" "}
                  </Text>
                </>
              ) : (
                <Text color={isSelected ? "yellow" : "gray"}>
                  {isSelected ? ">" : " "}
                </Text>
              )}
              {renderTreeLineWithColors(
                line,
                isSelected,
                isMatched,
                displayOptions,
              )}
            </Box>
          );
        })}
      </Box>

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

  // For primitive values, separate key and value with different colors
  if (
    line.type === "primitive" &&
    line.key !== null &&
    line.key !== undefined &&
    line.key !== ""
  ) {
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
    L: "Toggle line numbers",
  };
}
