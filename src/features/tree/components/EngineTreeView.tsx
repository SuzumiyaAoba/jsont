/**
 * Engine-based TreeView component
 * Uses the new TreeEngine for UI-agnostic tree processing
 */

import { useConfig } from "@core/context/ConfigContext";
import type {
  TreeCommand,
  TreeEngineState,
  TreeRenderOptions,
} from "@core/engine/TreeEngine";
import { TreeEngine } from "@core/engine/TreeEngine";
import type { JsonValue } from "@core/types/index";
import type { TreeDisplayOptions } from "@features/tree/types/tree";
import { getTreeLineText } from "@features/tree/utils/treeRenderer";
import { Box, Text } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props for the engine-based TreeView
 */
export interface EngineTreeViewProps {
  /** JSON data to display */
  data: JsonValue | null;
  /** Display height in lines */
  height?: number;
  /** Display width in characters */
  width?: number;
  /** Search term for filtering */
  searchTerm?: string;
  /** Tree display options */
  options?: Partial<TreeDisplayOptions>;
  /** Callback when keyboard handler is ready */
  onKeyboardHandlerReady?: (
    handler: (input: string, key: any) => boolean,
  ) => void;
}

/**
 * Keyboard input interface
 */
interface KeyboardInput {
  upArrow?: boolean;
  downArrow?: boolean;
  pageUp?: boolean;
  pageDown?: boolean;
  return?: boolean;
  ctrl?: boolean;
}

/**
 * Engine-based TreeView component
 */
export function EngineTreeView({
  data,
  height = 20,
  width = 80,
  searchTerm = "",
  options = {},
  onKeyboardHandlerReady,
}: EngineTreeViewProps) {
  const config = useConfig();

  // Initialize tree engine
  const [treeEngine] = useState(
    () =>
      new TreeEngine(data, {
        ...config.display.tree,
        ...options,
      }),
  );

  // Engine state
  const [engineState, setEngineState] = useState<TreeEngineState>(() =>
    treeEngine.getState(),
  );

  // Update engine data when props change
  useEffect(() => {
    treeEngine.updateData(data);
    setEngineState(treeEngine.getState());
  }, [data, treeEngine]);

  // Apply search filter
  useEffect(() => {
    treeEngine.applySearch(searchTerm);
    setEngineState(treeEngine.getState());
  }, [searchTerm, treeEngine]);

  // Memoize render options
  const renderOptions = useMemo(
    (): TreeRenderOptions => ({
      height,
      width,
      displayOptions: {
        ...config.display.tree,
        ...options,
        showSchemaTypes: engineState.showSchemaTypes,
      },
    }),
    [height, width, config.display.tree, options, engineState.showSchemaTypes],
  );

  // Get rendered tree data
  const renderResult = useMemo(() => {
    return treeEngine.render(renderOptions);
  }, [treeEngine, renderOptions, engineState]);

  // Handle keyboard input
  const handleKeyboardInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      let command: TreeCommand | null = null;

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
        const result = treeEngine.executeCommand(command, renderOptions);
        if (result.handled) {
          setEngineState(result.state);
          return true;
        }
      }

      return false;
    },
    [treeEngine, renderOptions],
  );

  // Register keyboard handler with parent
  useEffect(() => {
    if (onKeyboardHandlerReady) {
      onKeyboardHandlerReady(handleKeyboardInput);
    }
  }, [onKeyboardHandlerReady, handleKeyboardInput]);

  // Helper function to render a tree line
  const renderTreeLine = useCallback(
    (line: any, index: number, isSelected: boolean) => {
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
      engineState.showSchemaTypes,
      engineState.showLineNumbers,
      engineState.searchTerm,
      width,
    ],
  );

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box width={width}>
        <Text color="blue" bold>
          ENGINE TREE VIEW (j/k: navigate, Space: toggle, t: types, L: lines)
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
