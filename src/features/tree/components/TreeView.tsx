/**
 * Tree view component for displaying JSON in tree structure
 */

import { useConfig } from "@core/context/ConfigContext";
import type { KeyboardInput } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import {
  calculateNavigationHeight,
  calculateScrollBounds,
  calculateTreeViewHeights,
  calculateVisibleRange,
} from "@core/utils/heightCalculations";
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
  /** Initial scroll offset for the tree view */
  scrollOffset?: number;
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
  scrollOffset: initialScrollOffset = 0,
  options = {},
  onKeyboardHandlerReady,
}: TreeViewProps) {
  const config = useConfig();

  const [treeState, setTreeState] = useState<TreeViewState>(() =>
    buildTreeFromJson(data || null, { expandLevel: 1 }),
  );

  // Initialize scroll offset from props, then manage internally
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);

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

  // Memoize search filtering for performance with early return optimization
  const filteredLines = useMemo(() => {
    if (!searchTerm) return treeLines;

    const lowerSearchTerm = searchTerm.toLowerCase();
    const result: TreeLine[] = [];

    // Optimized filtering with early break for large datasets
    for (let i = 0; i < treeLines.length; i++) {
      const line = treeLines[i];
      if (
        line &&
        getTreeLineText(line).toLowerCase().includes(lowerSearchTerm)
      ) {
        result.push(line);
      }
    }

    return result;
  }, [treeLines, searchTerm]);

  // ROOT CAUSE SOLUTION: Conservative approach to ensure reliable line display
  // The core issue: subtle mismatch between calculated and actual displayable lines

  // Memoize height calculations using utility functions
  const heightCalculations = useMemo(
    () => calculateTreeViewHeights(height),
    [height],
  );

  // Memoize scroll calculations using utility functions
  const scrollCalculations = useMemo(() => {
    const scrollBounds = calculateScrollBounds(
      scrollOffset,
      filteredLines.length,
      heightCalculations.safeContentHeight,
    );

    const boundedSelectedIndex = Math.min(
      selectedLineIndex,
      filteredLines.length - 1,
    );

    return {
      ...scrollBounds,
      boundedSelectedIndex,
    };
  }, [
    filteredLines.length,
    heightCalculations.safeContentHeight,
    scrollOffset,
    selectedLineIndex,
  ]);

  // Memoize visible lines calculation using utility functions
  const visibleLines = useMemo(() => {
    if (filteredLines.length === 0) return [];

    const { safeContentHeight } = heightCalculations;
    const { boundedScrollOffset, isNearEnd } = scrollCalculations;

    const visibleRange = calculateVisibleRange(
      boundedScrollOffset,
      safeContentHeight,
      filteredLines.length,
      isNearEnd,
    );

    return getVisibleTreeLines(
      filteredLines,
      visibleRange.startIndex,
      visibleRange.endIndex,
    );
  }, [filteredLines, heightCalculations, scrollCalculations]);

  // Debug info for verification
  if (process.env["NODE_ENV"] === "development" && showLineNumbers) {
    console.log("=== CONSERVATIVE TREE VIEW CALCULATION ===");
    console.log(`Total lines: ${filteredLines.length}`);
    console.log(
      `Height: ${height}, Base: ${heightCalculations.baseContentHeight}, Safe: ${heightCalculations.safeContentHeight}, Conservative: ${heightCalculations.conservativeContentHeight}`,
    );
    console.log(`Max scroll: ${scrollCalculations.maxScroll}`);
    console.log(
      `Bounded scroll offset: ${scrollCalculations.boundedScrollOffset}`,
    );
    console.log(`Is near end: ${scrollCalculations.isNearEnd}`);
    console.log(`Visible lines count: ${visibleLines.length}`);
    if (visibleLines.length > 0) {
      const firstLine = visibleLines[0];
      const lastLine = visibleLines[visibleLines.length - 1];
      if (firstLine && lastLine) {
        const firstIndex = filteredLines.indexOf(firstLine);
        const lastIndex = filteredLines.indexOf(lastLine);
        console.log(
          `Displaying lines ${firstIndex + 1} to ${lastIndex + 1} (1-based)`,
        );
      }
    }
  }

  // Ensure stable rendering by adding a key that forces proper reconciliation
  const renderKey = useMemo(() => {
    return `${treeState.rootNodes.length}-${filteredLines.length}`;
  }, [treeState.rootNodes.length, filteredLines.length]);

  // Memoize state reference for stable access in callbacks
  const stableState = useMemo(
    () => ({
      selectedLineIndex: scrollCalculations.boundedSelectedIndex,
      scrollOffset: scrollCalculations.boundedScrollOffset,
      filteredLines,
      height,
      maxScroll: scrollCalculations.maxScroll,
      heightCalculations,
      displayOptions,
      searchTerm,
    }),
    [
      scrollCalculations,
      filteredLines,
      height,
      heightCalculations,
      displayOptions,
      searchTerm,
    ],
  );

  // Use refs to maintain stable references for callback access
  const stateRef = useRef(stableState);
  stateRef.current = stableState;

  // Navigation handler functions - split for better maintainability
  const handleArrowNavigation = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      const {
        selectedLineIndex,
        scrollOffset,
        filteredLines,
        height,
        maxScroll,
      } = stateRef.current;

      if (key.upArrow || (input === "k" && !key.ctrl)) {
        const newIndex = Math.max(0, selectedLineIndex - 1);
        setSelectedLineIndex(newIndex);

        // Ensure selected line is visible
        if (newIndex < scrollOffset) {
          setScrollOffset(Math.max(0, newIndex));
        }
        return true;
      }

      if (key.downArrow || (input === "j" && !key.ctrl)) {
        const newIndex = Math.min(
          filteredLines.length - 1,
          selectedLineIndex + 1,
        );
        setSelectedLineIndex(newIndex);

        // Ensure selected line is visible and handle array parent selection
        const effectiveHeight = calculateNavigationHeight(height);
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
              const childVisibleEnd = targetScrollOffset + effectiveHeight - 1;
              if (
                firstChildIndex < childVisibleStart ||
                firstChildIndex > childVisibleEnd
              ) {
                targetScrollOffset = Math.max(
                  0,
                  Math.min(firstChildIndex - 1, maxScroll),
                );
              }
            }
          }

          setScrollOffset(targetScrollOffset);
        }
        return true;
      }

      return false;
    },
    [],
  );

  const handlePageNavigation = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      const { selectedLineIndex, filteredLines, height, maxScroll } =
        stateRef.current;

      if (key.pageUp || (key.ctrl && input === "b")) {
        const effectiveHeight = calculateNavigationHeight(height);
        const newIndex = Math.max(0, selectedLineIndex - effectiveHeight);
        const newScrollOffset = Math.max(
          0,
          newIndex - Math.floor(effectiveHeight / 2),
        );
        setSelectedLineIndex(newIndex);
        setScrollOffset(newScrollOffset);
        return true;
      }

      if (key.pageDown || (key.ctrl && input === "f")) {
        const effectiveHeight = calculateNavigationHeight(height);
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
      }

      return false;
    },
    [],
  );

  const handleJumpNavigation = useCallback((input: string): boolean => {
    const { filteredLines, heightCalculations } = stateRef.current;

    if (input === "g") {
      // Go to top (similar to vim's gg)
      setSelectedLineIndex(0);
      setScrollOffset(0);
      return true;
    }

    if (input === "G") {
      // Go to bottom (similar to vim's G)
      const maxIndex = filteredLines.length - 1;
      const maxScroll = Math.max(
        0,
        filteredLines.length - heightCalculations.safeContentHeight,
      );
      setSelectedLineIndex(maxIndex);
      setScrollOffset(maxScroll);
      return true;
    }

    return false;
  }, []);

  const handleToggleActions = useCallback((input: string): boolean => {
    if (input === "t") {
      // Toggle schema type display
      setShowSchemaTypes((prev) => !prev);
      return true;
    }

    if (input === "L") {
      // Toggle line numbers display (with extensive debug logging)
      setShowLineNumbers((prev) => {
        const newValue = !prev;
        // Debug info for real app debugging
        if (process.env["NODE_ENV"] === "development" && newValue) {
          const {
            filteredLines,
            scrollOffset,
            selectedLineIndex,
            height,
            maxScroll,
            heightCalculations,
          } = stateRef.current;

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
            scrollOffset + heightCalculations.baseContentHeight,
          );

          // Show first 10 lines for reference
          console.log("First 10 lines:");
          filteredLines.slice(0, 10).forEach((line, i) => {
            console.log(
              `  ${i + 1}: ${line.id} - "${getTreeLineText(line).substring(0, 40)}"`,
            );
          });

          // Debug visible lines calculation
          const currentScrollOffset = stateRef.current.scrollOffset;
          const currentHeight =
            stateRef.current.heightCalculations.baseContentHeight;
          const calculatedVisibleLines = getVisibleTreeLines(
            filteredLines,
            currentScrollOffset,
            currentScrollOffset + currentHeight,
          );
          console.log("Visible lines calculation:");
          console.log(`  Current scroll offset: ${currentScrollOffset}`);
          console.log(`  End index: ${currentScrollOffset + currentHeight}`);
          console.log(
            `  Calculated visible lines: ${calculatedVisibleLines.length}`,
          );

          // Show what should be visible
          console.log("Should be visible (slice result):");
          for (
            let i = currentScrollOffset;
            i <
            Math.min(currentScrollOffset + currentHeight, filteredLines.length);
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
  }, []);

  const handleNodeExpansion = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      const { selectedLineIndex, filteredLines } = stateRef.current;

      if (key.return || input === " ") {
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
                const expandedNode = newState.nodes.get(currentSelectedLine.id);
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
                    const visibleEnd =
                      currentScrollOffset +
                      stateRef.current.heightCalculations.baseContentHeight -
                      1;

                    // If first child is not visible, adjust scroll
                    if (
                      firstChildIndex < visibleStart ||
                      firstChildIndex > visibleEnd
                    ) {
                      const newScrollOffset = Math.max(
                        0,
                        Math.min(
                          firstChildIndex -
                            Math.floor(
                              stateRef.current.heightCalculations
                                .baseContentHeight / 4,
                            ),
                          Math.max(
                            0,
                            updatedFilteredLines.length -
                              stateRef.current.heightCalculations
                                .baseContentHeight,
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
      }

      if (input === "e") {
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
                  newFilteredLines.length -
                    stateRef.current.heightCalculations.baseContentHeight,
                );
                let newScrollOffset = 0;

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
                  newScrollOffset +
                    stateRef.current.heightCalculations.baseContentHeight
                ) {
                  newScrollOffset = Math.min(
                    newMaxScroll,
                    newSelectedIndex -
                      stateRef.current.heightCalculations.baseContentHeight +
                      1,
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
      }

      if (input === "c") {
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
      }

      return false;
    },
    [],
  );

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
        const { filteredLines } = stateRef.current;

        // Validate state data
        if (!Array.isArray(filteredLines) || filteredLines.length < 0) {
          return false; // Invalid state, don't process
        }

        // Delegate to specific handlers
        if (handleArrowNavigation(input, key)) return true;
        if (handlePageNavigation(input, key)) return true;
        if (handleJumpNavigation(input)) return true;
        if (handleToggleActions(input)) return true;
        if (handleNodeExpansion(input, key)) return true;

        // If no handler matched, return false
        return false;
      } catch (error) {
        // Log error in development but fail gracefully
        if (process.env["NODE_ENV"] === "development") {
          console.error("TreeView keyboard handler error:", error);
        }
        return false;
      }
    },
    [
      handleArrowNavigation,
      handlePageNavigation,
      handleJumpNavigation,
      handleToggleActions,
      handleNodeExpansion,
    ], // Include all handler dependencies
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

    // Use initial scroll offset when data changes
    setScrollOffset(initialScrollOffset);
    setSelectedLineIndex(0);
  }, [data, initialScrollOffset]);

  // Update scroll offset when initialScrollOffset changes
  useEffect(() => {
    setScrollOffset(initialScrollOffset);
  }, [initialScrollOffset]);

  // Ensure selected index is valid when filtered lines change
  useEffect(() => {
    if (filteredLines.length > 0 && selectedLineIndex >= filteredLines.length) {
      setSelectedLineIndex(Math.max(0, filteredLines.length - 1));
    }
  }, [filteredLines.length, selectedLineIndex]);

  // Memoize search highlighting to avoid recalculation
  const matchingNodes = useMemo(() => {
    return searchTerm
      ? searchTreeNodes(treeState, searchTerm, { searchValues: true })
      : new Set<string>();
  }, [treeState, searchTerm]);

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
        {useMemo(
          () =>
            visibleLines.map((line, index) => {
              const lineIndex = scrollCalculations.boundedScrollOffset + index;
              const isSelected =
                lineIndex === scrollCalculations.boundedSelectedIndex;
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
            }),
          [
            visibleLines,
            scrollCalculations,
            matchingNodes,
            showLineNumbers,
            displayOptions,
            width,
          ],
        )}
      </Box>

      {/* Show help text if no lines */}
      {filteredLines.length === 0 && (
        <Box
          justifyContent="center"
          alignItems="center"
          height={Math.max(1, heightCalculations.baseContentHeight)}
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
