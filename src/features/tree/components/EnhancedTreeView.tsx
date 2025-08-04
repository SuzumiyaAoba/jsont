/**
 * Enhanced TreeView component that integrates TreeEngine
 * Provides the same interface as the original TreeView but uses the UI-agnostic TreeEngine
 */

import { useTreeEngineIntegration } from "@components/providers/EngineProvider";
import { useConfig } from "@core/context/ConfigContext";
import type { KeyboardInput } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import type { TreeDisplayOptions, TreeLine } from "@features/tree/types/tree";
import { getTreeLineText } from "@features/tree/utils/treeRenderer";
import { Box, Text } from "ink";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Props interface for the Enhanced TreeView component
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
 * Enhanced TreeView component using TreeEngine for UI-agnostic tree processing
 *
 * Features:
 * - Keyboard navigation (j/k, arrows, page up/down, g/G)
 * - Node expansion/collapse (Space/Enter, e/c for all)
 * - Search filtering
 * - Schema type display toggle (t)
 * - Line number toggle (L)
 * - Scrolling support for large datasets
 *
 * @param props - Enhanced TreeView component props
 * @returns JSX element containing the tree view interface
 */
export function EnhancedTreeView({
  data,
  height = 20,
  width = 80,
  searchTerm = "",
  scrollOffset: _scrollOffset = 0,
  options = {},
  onKeyboardHandlerReady,
}: EnhancedTreeViewProps): ReactElement {
  const config = useConfig();
  const { treeEngine } = useTreeEngineIntegration();

  // Update engine data when props change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Adding treeEngine to deps would cause infinite loops
  useEffect(() => {
    treeEngine.updateData(data);
  }, [data]); // Remove treeEngine from deps to avoid infinite loops

  // Apply search filter
  // biome-ignore lint/correctness/useExhaustiveDependencies: Adding treeEngine to deps would cause infinite loops
  useEffect(() => {
    treeEngine.applySearch(searchTerm);
  }, [searchTerm]); // Remove treeEngine from deps to avoid infinite loops

  // Local state to track engine state changes
  const [localEngineState, setLocalEngineState] = useState(() =>
    treeEngine.getState(),
  );

  // Calculate content height (total height - header - potential footer)
  const contentHeight = useMemo(() => {
    const headerHeight = 1; // Header takes 1 line
    const maxFooterHeight = 1; // Footer may take 1 line
    return Math.max(1, height - headerHeight - maxFooterHeight);
  }, [height]);

  // Get rendered tree data from engine
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedLineIndex and scrollOffset affect rendering output
  const renderResult = useMemo(() => {
    const renderOptions = {
      height: contentHeight,
      width,
      displayOptions: {
        ...config.display.tree,
        ...options,
        showSchemaTypes: localEngineState.showSchemaTypes,
      },
      engineState: localEngineState,
    };
    return treeEngine.render(renderOptions);
  }, [
    treeEngine,
    contentHeight,
    width,
    config.display.tree,
    options,
    localEngineState.showSchemaTypes,
    localEngineState.selectedLineIndex,
    localEngineState.scrollOffset,
  ]);

  // Handle keyboard input
  // biome-ignore lint/correctness/useExhaustiveDependencies: Adding objects that recreate on every render would cause infinite loops
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      let command: string | null = null;
      let needsOptions = false;

      // Map keyboard input to tree commands
      if (key.upArrow || (input === "k" && !key.ctrl)) {
        command = "navigate-up";
        needsOptions = true;
      } else if (key.downArrow || (input === "j" && !key.ctrl)) {
        command = "navigate-down";
        needsOptions = true;
      } else if (key.pageUp || (key.ctrl && input === "b")) {
        command = "navigate-page-up";
        needsOptions = true;
      } else if (key.pageDown || (key.ctrl && input === "f")) {
        command = "navigate-page-down";
        needsOptions = true;
      } else if (input === "g") {
        command = "navigate-to-top";
        needsOptions = true;
      } else if (input === "G") {
        command = "navigate-to-bottom";
        needsOptions = true;
      } else if (key.return || input === " ") {
        command = "toggle-node";
      } else if (input === "e") {
        command = "expand-all";
      } else if (input === "c") {
        command = "collapse-all";
      } else if (input === "t") {
        command = "toggle-schema-types";
      } else if (input === "L") {
        command = "toggle-line-numbers";
      }

      if (command) {
        const commandOptions = needsOptions
          ? {
              height: contentHeight,
              width,
              displayOptions: {
                ...config.display.tree,
                ...options,
                showSchemaTypes: localEngineState.showSchemaTypes,
              },
            }
          : undefined;

        const result = treeEngine.executeCommand(
          // biome-ignore lint/suspicious/noExplicitAny: Engine command types are generic
          command as any,
          commandOptions,
        );

        if (result.handled) {
          setLocalEngineState(result.state);
          return true;
        }
      }

      return false;
    },
    [contentHeight, width, localEngineState.showSchemaTypes], // Remove objects that recreate on every render to prevent infinite loops
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      onKeyboardHandlerReady(handleKeyboardInput);
    }
  }, [onKeyboardHandlerReady, handleKeyboardInput]);

  // Helper function to render a tree line
  // biome-ignore lint/correctness/useExhaustiveDependencies: Adding objects that recreate on every render would cause infinite loops
  const renderTreeLine = useCallback(
    (line: TreeLine, index: number, isSelected: boolean) => {
      const displayOptions: TreeDisplayOptions = {
        ...config.display.tree,
        ...options,
        showSchemaTypes: localEngineState.showSchemaTypes,
      };

      const lineText = getTreeLineText(line, displayOptions);
      const isMatched =
        localEngineState.searchTerm &&
        lineText
          .toLowerCase()
          .includes(localEngineState.searchTerm.toLowerCase());

      return (
        <Box key={line.id} width={width}>
          {localEngineState.showLineNumbers && (
            <>
              <Text color={isSelected ? "yellow" : "gray"}>
                {isSelected ? ">" : " "}
              </Text>
              <Text
                color={isSelected ? "yellow" : "gray"}
                dimColor={!isSelected}
              >
                {String(index + 1).padStart(3, " ")}:
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
    },
    [
      width,
      localEngineState.showSchemaTypes,
      localEngineState.searchTerm,
      localEngineState.showLineNumbers,
    ], // Remove objects that recreate on every render
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box width={width}>
        <Text color="green" bold>
          TREE VIEW (j/k: navigate, Space: toggle, t: types, L: lines)
        </Text>
      </Box>

      {/* Tree content */}
      <Box flexDirection="column" height={contentHeight}>
        {renderResult.lines.length > 0 ? (
          renderResult.lines.map((line, index) => {
            const absoluteIndex = renderResult.visibleRange.start + index;
            const isSelected =
              absoluteIndex === localEngineState.selectedLineIndex;
            return renderTreeLine(line, absoluteIndex, isSelected);
          })
        ) : (
          <Box width={width}>
            <Text color="gray" italic>
              {localEngineState.searchTerm
                ? "No matches found"
                : "No data to display"}
            </Text>
          </Box>
        )}
      </Box>

      {/* Footer with scroll info */}
      {renderResult.hasScrollUp || renderResult.hasScrollDown ? (
        <Box width={width} justifyContent="space-between">
          <Text color="gray">
            {renderResult.hasScrollUp ? "↑ More above" : ""}
          </Text>
          <Text color="gray">
            Line {localEngineState.selectedLineIndex + 1} of{" "}
            {renderResult.totalLines}
          </Text>
          <Text color="gray">
            {renderResult.hasScrollDown ? "More below ↓" : ""}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
