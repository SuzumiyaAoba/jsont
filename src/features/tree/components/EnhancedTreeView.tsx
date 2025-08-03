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
  const { treeEngine, state: engineState } = useTreeEngineIntegration();

  // Update engine data when props change
  useEffect(() => {
    treeEngine.updateData(data);
  }, [data, treeEngine]);

  // Apply search filter
  useEffect(() => {
    treeEngine.applySearch(searchTerm);
  }, [searchTerm, treeEngine]);

  // Force re-render when engine state changes
  const [, forceUpdate] = useState(0);

  // Get rendered tree data from engine
  const renderResult = useMemo(() => {
    const renderOptions = {
      height,
      width,
      displayOptions: {
        ...config.display.tree,
        ...options,
        showSchemaTypes: engineState.showSchemaTypes,
      },
    };
    return treeEngine.render(renderOptions);
  }, [
    treeEngine,
    height,
    width,
    config.display.tree,
    options,
    engineState.showSchemaTypes,
  ]);

  // Handle keyboard input
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      let command: string | null = null;
      let payload: unknown;

      // Map keyboard input to tree commands
      if (key.upArrow || (input === "k" && !key.ctrl)) {
        command = "navigate-up";
      } else if (key.downArrow || (input === "j" && !key.ctrl)) {
        command = "navigate-down";
      } else if (key.pageUp || (key.ctrl && input === "b")) {
        command = "navigate-page-up";
      } else if (key.pageDown || (key.ctrl && input === "f")) {
        command = "navigate-page-down";
      } else if (input === "g") {
        command = "navigate-to-top";
      } else if (input === "G") {
        command = "navigate-to-bottom";
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
        const result = treeEngine.executeCommand(
          // biome-ignore lint/suspicious/noExplicitAny: Engine command types are generic
          command as any,
          // biome-ignore lint/suspicious/noExplicitAny: Runtime type safety for generic payload
          payload as any,
        );
        if (result.handled) {
          forceUpdate((prev) => prev + 1);
          return true;
        }
      }

      return false;
    },
    [treeEngine],
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      onKeyboardHandlerReady(handleKeyboardInput);
    }
  }, [onKeyboardHandlerReady, handleKeyboardInput]);

  // Helper function to render a tree line
  const renderTreeLine = useCallback(
    (line: TreeLine, index: number, isSelected: boolean) => {
      const displayOptions: TreeDisplayOptions = {
        ...config.display.tree,
        ...options,
        showSchemaTypes: engineState.showSchemaTypes,
      };

      const lineText = getTreeLineText(line, displayOptions);
      const isMatched =
        engineState.searchTerm &&
        lineText.toLowerCase().includes(engineState.searchTerm.toLowerCase());

      return (
        <Box key={line.id} width={width}>
          {engineState.showLineNumbers && (
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
      config.display.tree,
      options,
      width,
      engineState.showSchemaTypes,
      engineState.searchTerm,
      engineState.showLineNumbers,
    ],
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box width={width}>
        <Text color="green" bold>
          🌲 TREE VIEW (j/k: navigate, Space: toggle, t: types, L: lines)
        </Text>
      </Box>

      {/* Tree content */}
      <Box flexDirection="column">
        {renderResult.lines.length > 0 ? (
          renderResult.lines.map((line, index) => {
            const absoluteIndex = renderResult.visibleRange.start + index;
            const isSelected = absoluteIndex === engineState.selectedLineIndex;
            return renderTreeLine(line, absoluteIndex, isSelected);
          })
        ) : (
          <Box width={width}>
            <Text color="gray" italic>
              {engineState.searchTerm
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
            Line {engineState.selectedLineIndex + 1} of{" "}
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
