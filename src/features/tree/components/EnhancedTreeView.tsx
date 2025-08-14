/**
 * TreeView component that directly uses tree utilities for TUI JSON visualization
 * Provides keyboard navigation and search without abstraction layers
 */

import { useConfig } from "@core/context/ConfigContext";
import type { KeyboardInput } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { extractPropertyDetailsFromTreeLine } from "@features/property-details";
import type {
  TreeDisplayOptions,
  TreeViewState,
} from "@features/tree/types/tree";
import {
  buildTreeFromJson,
  collapseAll,
  expandAll,
  toggleNodeExpansion,
} from "@features/tree/utils/treeBuilder";
import {
  getTreeLineText,
  renderTreeLines,
} from "@features/tree/utils/treeRenderer";
import { usePropertyDetails } from "@store/hooks";
import { Box, Text } from "ink";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Props interface for the TreeView component
 */
export interface EnhancedTreeViewProps {
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
 * TreeView component for interactive JSON tree visualization
 *
 * Features:
 * - Keyboard navigation (j/k, arrows, page up/down, g/G)
 * - Node expansion/collapse (Space/Enter, e/c for all)
 * - Search filtering
 * - Schema type display toggle (t)
 * - Line number toggle (L)
 * - Scrolling support for large datasets
 *
 * @param props - TreeView component props
 * @returns JSX element containing the tree view interface
 */
export function EnhancedTreeView({
  data,
  height = 20,
  width: _width = 80,
  searchTerm = "",
  scrollOffset = 0,
  options = {},
  onKeyboardHandlerReady,
}: EnhancedTreeViewProps): ReactElement {
  const config = useConfig();
  const { updatePropertyDetails } = usePropertyDetails();

  // Build tree state from JSON data
  const [treeState, setTreeState] = useState<TreeViewState>(() =>
    buildTreeFromJson(data, { expandLevel: 2 }),
  );

  // UI state
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [showSchemaTypes, setShowSchemaTypes] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [currentScrollOffset, setCurrentScrollOffset] = useState(scrollOffset);

  // Use refs to access current values without causing dependency issues
  const selectedLineIndexRef = useRef(selectedLineIndex);
  selectedLineIndexRef.current = selectedLineIndex;

  const filteredLinesRef = useRef<typeof filteredLines>([]);
  const updatePropertyDetailsRef = useRef(updatePropertyDetails);

  const handleKeyboardInputRef = useRef<
    ((input: string, key: KeyboardInput) => boolean) | undefined
  >(undefined);

  // Update tree when data changes
  useEffect(() => {
    const newTreeState = buildTreeFromJson(data, { expandLevel: 2 });
    setTreeState(newTreeState);
    setSelectedLineIndex(0);
    setCurrentScrollOffset(0);
  }, [data]);

  // Update scroll offset when prop changes
  useEffect(() => {
    setCurrentScrollOffset(scrollOffset);
  }, [scrollOffset]);

  // Calculate display options
  const displayOptions = useMemo(
    (): TreeDisplayOptions => ({
      ...config.display.tree,
      ...options,
      showSchemaTypes,
    }),
    [config.display.tree, options, showSchemaTypes],
  );

  // Render tree lines
  const allLines = useMemo(
    () => renderTreeLines(treeState, displayOptions),
    [treeState, displayOptions],
  );

  // Filter lines based on search term
  const filteredLines = useMemo(() => {
    if (!searchTerm.trim()) return allLines;

    // Optimized filtering with for-loop for large datasets
    const filtered = [];
    const searchLower = searchTerm.toLowerCase();
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      if (line) {
        const lineText = getTreeLineText(line, displayOptions);
        if (lineText.toLowerCase().includes(searchLower)) {
          filtered.push(line);
        }
      }
    }
    return filtered;
  }, [allLines, searchTerm, displayOptions]);

  // Update refs to current values
  filteredLinesRef.current = filteredLines;
  updatePropertyDetailsRef.current = updatePropertyDetails;

  // Note: Selection reset on search change is handled in keyboard input logic

  // Calculate visible lines with scroll offset
  const contentHeight = height - 2; // Reserve space for header and footer
  const visibleLines = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.min(currentScrollOffset, filteredLines.length - contentHeight),
    );
    const endIndex = Math.min(filteredLines.length, startIndex + contentHeight);
    return filteredLines.slice(startIndex, endIndex);
  }, [filteredLines, currentScrollOffset, contentHeight]);

  // Calculate scroll info
  const scrollInfo = useMemo(() => {
    const totalLines = filteredLines.length;
    const viewportStart = Math.max(
      0,
      Math.min(currentScrollOffset, totalLines - contentHeight),
    );
    const viewportEnd = Math.min(totalLines, viewportStart + contentHeight);
    const hasScrollUp = viewportStart > 0;
    const hasScrollDown = viewportEnd < totalLines;

    return {
      hasScrollUp,
      hasScrollDown,
      totalLines,
      viewportStart,
      viewportEnd,
    };
  }, [filteredLines.length, currentScrollOffset, contentHeight]);

  // Handle keyboard input - store in ref to avoid dependency issues
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      // Navigation
      if (key.upArrow || (input === "k" && !key.ctrl)) {
        setSelectedLineIndex((prev) => Math.max(0, prev - 1));
        return true;
      }
      if (key.downArrow || (input === "j" && !key.ctrl)) {
        setSelectedLineIndex((prev) =>
          Math.min(filteredLinesRef.current.length - 1, prev + 1),
        );
        return true;
      }
      if (key.pageUp || (key.ctrl && input === "b")) {
        setSelectedLineIndex((prev) =>
          Math.max(0, prev - Math.floor(contentHeight / 2)),
        );
        return true;
      }
      if (key.pageDown || (key.ctrl && input === "f")) {
        setSelectedLineIndex((prev) =>
          Math.min(
            filteredLinesRef.current.length - 1,
            prev + Math.floor(contentHeight / 2),
          ),
        );
        return true;
      }
      if (input === "g") {
        setSelectedLineIndex(0);
        return true;
      }
      if (input === "G") {
        setSelectedLineIndex(Math.max(0, filteredLinesRef.current.length - 1));
        return true;
      }

      // Node expansion/collapse
      if (key.return || input === " ") {
        const selectedLine =
          filteredLinesRef.current[selectedLineIndexRef.current];
        if (selectedLine?.hasChildren) {
          setTreeState((prev) => toggleNodeExpansion(prev, selectedLine.id));
        }
        return true;
      }
      if (input === "e") {
        setTreeState((prev) => expandAll(prev));
        return true;
      }
      if (input === "c") {
        setTreeState((prev) => collapseAll(prev));
        return true;
      }

      // Toggle features
      if (input === "t") {
        setShowSchemaTypes((prev) => !prev);
        return true;
      }
      if (input === "L") {
        setShowLineNumbers((prev) => !prev);
        return true;
      }

      return false;
    },
    [contentHeight],
  );

  // Store handler in ref for stable reference
  handleKeyboardInputRef.current = handleKeyboardInput;

  // Register keyboard handler with parent - use wrapper to avoid dependency issues
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      const stableHandler = (input: string, key: KeyboardInput): boolean => {
        return handleKeyboardInputRef.current?.(input, key) ?? false;
      };
      onKeyboardHandlerReady(stableHandler);
    }
  }, [onKeyboardHandlerReady]);

  // Auto-scroll to keep selected line visible
  useEffect(() => {
    const filteredLinesLength = filteredLinesRef.current.length;
    const viewportStart = Math.max(
      0,
      Math.min(currentScrollOffset, filteredLinesLength - contentHeight),
    );
    const viewportEnd = Math.min(
      filteredLinesLength,
      viewportStart + contentHeight,
    );

    if (selectedLineIndex < viewportStart) {
      setCurrentScrollOffset(selectedLineIndex);
    } else if (selectedLineIndex >= viewportEnd) {
      setCurrentScrollOffset(
        Math.max(0, selectedLineIndex - contentHeight + 1),
      );
    }
  }, [selectedLineIndex, contentHeight, currentScrollOffset]);

  // Update property details when selected line changes
  useEffect(() => {
    const selectedLine = filteredLinesRef.current[selectedLineIndex];
    if (selectedLine && data) {
      const details = extractPropertyDetailsFromTreeLine(selectedLine, data);
      updatePropertyDetailsRef.current(details);
    } else {
      updatePropertyDetailsRef.current(null);
    }
  }, [selectedLineIndex, data]);

  return (
    <Box flexDirection="column" width="100%" height={height}>
      {/* Header - outside border */}
      <Box width="100%">
        <Text color="green" bold>
          TREE VIEW (j/k: navigate, Space: toggle, t: types, L: lines)
        </Text>
      </Box>

      {/* Tree content - with border */}
      <Box
        flexDirection="column"
        height={contentHeight}
        borderStyle="single"
        borderColor="gray"
        width="100%"
      >
        {visibleLines.length > 0 ? (
          visibleLines.map((line, index) => {
            if (!line) return null;
            const absoluteIndex = scrollInfo.viewportStart + index;
            const isSelected = absoluteIndex === selectedLineIndex;
            const lineText = getTreeLineText(line, displayOptions);
            const isMatched =
              searchTerm &&
              lineText.toLowerCase().includes(searchTerm.toLowerCase());

            return (
              <Box key={line.id} width="100%">
                {showLineNumbers && (
                  <>
                    <Text color={isSelected ? "yellow" : "gray"}>
                      {isSelected ? ">" : " "}
                    </Text>
                    <Text
                      color={isSelected ? "yellow" : "gray"}
                      dimColor={!isSelected}
                    >
                      {String(absoluteIndex + 1).padStart(3, " ")}:
                    </Text>
                  </>
                )}
                {isSelected ? (
                  <Text backgroundColor="blue" color="white" bold>
                    {lineText}
                  </Text>
                ) : (
                  <Text color={isMatched ? "yellow" : "gray"}>{lineText}</Text>
                )}
              </Box>
            );
          })
        ) : (
          <Box width="100%">
            <Text color="gray" italic>
              {searchTerm ? "No matches found" : "No data to display"}
            </Text>
          </Box>
        )}
      </Box>

      {/* Footer with scroll info - outside border */}
      {(scrollInfo.hasScrollUp || scrollInfo.hasScrollDown) && (
        <Box width="100%" justifyContent="center">
          <Text color="gray">
            Line {selectedLineIndex + 1} of {scrollInfo.totalLines}
          </Text>
        </Box>
      )}
    </Box>
  );
}
