import { Box, Text } from "ink";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { CollapsibleState, NavigationAction } from "../types/collapsible";
import type { JsonValue, SearchResult } from "../types/index";
import {
  getNodeDisplayText,
  handleNavigation,
  initializeCollapsibleState,
} from "../utils/collapsibleJson";
import {
  applySearchHighlighting,
  tokenizeLine,
} from "../utils/syntaxHighlight";

interface CollapsibleJsonViewerProps {
  data: JsonValue;
  scrollOffset?: number;
  searchTerm?: string;
  searchResults?: SearchResult[];
  currentSearchIndex?: number;
  visibleLines?: number;
  showLineNumbers?: boolean;
  onNavigate?: (action: NavigationAction) => void;
}

export const CollapsibleJsonViewer = forwardRef<
  { navigate: (action: NavigationAction) => void },
  CollapsibleJsonViewerProps
>(function CollapsibleJsonViewer(
  {
    data,
    scrollOffset = 0,
    searchTerm = "",
    searchResults = [],
    currentSearchIndex = 0,
    visibleLines,
    showLineNumbers = false,
    onNavigate,
  },
  ref,
) {
  const [collapsibleState, setCollapsibleState] = useState<CollapsibleState>(
    () => initializeCollapsibleState(data),
  );

  // Update state when data changes
  useEffect(() => {
    setCollapsibleState(initializeCollapsibleState(data));
  }, [data]);

  // Calculate visible lines
  const effectiveVisibleLines =
    visibleLines || Math.max(1, (process.stdout.rows || 24) - 3);

  // Get the display lines from flattened nodes
  const displayLines = useMemo(() => {
    return collapsibleState.flattenedNodes.map((node) => {
      const isExpanded = collapsibleState.expandedNodes.has(node.id);
      return getNodeDisplayText(node, isExpanded);
    });
  }, [collapsibleState.flattenedNodes, collapsibleState.expandedNodes]);

  // Calculate which lines to display based on scroll offset
  const startLine = scrollOffset;
  const endLine = Math.min(
    displayLines.length,
    startLine + effectiveVisibleLines,
  );
  const visibleLineData = displayLines.slice(startLine, endLine);
  const visibleNodes = collapsibleState.flattenedNodes.slice(
    startLine,
    endLine,
  );

  // Calculate line number width
  const totalLines = displayLines.length;
  const lineNumberWidth = totalLines.toString().length;

  const formatLineNumber = (lineIndex: number): string => {
    const lineNumber = lineIndex + 1;
    return lineNumber.toString().padStart(lineNumberWidth, " ");
  };

  // Handle navigation actions
  const handleNavigationAction = useCallback(
    (action: NavigationAction) => {
      const result = handleNavigation(collapsibleState, action);
      setCollapsibleState(result.newState);

      if (onNavigate) {
        onNavigate(action);
      }
    },
    [collapsibleState, onNavigate],
  );

  // Create search results map for O(1) lookup
  const searchResultsByLine = useMemo(() => {
    const map = new Map<number, SearchResult[]>();
    searchResults.forEach((result) => {
      if (!map.has(result.lineIndex)) {
        map.set(result.lineIndex, []);
      }
      map.get(result.lineIndex)?.push(result);
    });
    return map;
  }, [searchResults]);

  // Render line with combined syntax and search highlighting
  const renderLineWithHighlighting = useCallback(
    (
      line: string,
      originalIndex: number,
      node: (typeof visibleNodes)[0],
      searchTerm: string,
      isCurrentResult: boolean,
    ) => {
      // Check if this is the cursor line
      const isCursorLine = collapsibleState.cursorPosition?.nodeId === node.id;

      // First tokenize the line for syntax highlighting
      const syntaxTokens = tokenizeLine(line, "");

      // Then apply search highlighting to the tokens
      const highlightedTokens = applySearchHighlighting(
        syntaxTokens,
        searchTerm,
        isCurrentResult,
      );

      // Render the tokens with cursor highlighting
      return (
        <Text
          key={originalIndex}
          {...(isCurrentResult ? { backgroundColor: "blue" } : {})}
          {...(isCursorLine && !isCurrentResult
            ? { backgroundColor: "gray", dimColor: true }
            : {})}
        >
          {highlightedTokens.map((token, tokenIndex) => {
            const key = `${originalIndex}-${tokenIndex}-${token.text}`;

            if (token.isMatch) {
              return (
                <Text
                  key={key}
                  color={token.color}
                  backgroundColor={isCurrentResult ? "magenta" : "yellow"}
                  bold={isCurrentResult}
                >
                  {token.text}
                </Text>
              );
            } else {
              return (
                <Text key={key} color={token.color}>
                  {token.text}
                </Text>
              );
            }
          })}
        </Text>
      );
    },
    [collapsibleState.cursorPosition],
  );

  const renderLine = useCallback(
    (line: string, originalIndex: number, node: (typeof visibleNodes)[0]) => {
      const globalLineIndex = startLine + originalIndex;

      // Check if this line has search results
      const lineSearchResults = searchResultsByLine.get(globalLineIndex) || [];
      const hasSearchHighlight = searchTerm && lineSearchResults.length > 0;
      const isCurrentSearchResult =
        searchResults.length > 0 &&
        searchResults[currentSearchIndex]?.lineIndex === globalLineIndex;

      // Use the new token-based rendering approach
      return renderLineWithHighlighting(
        line,
        globalLineIndex,
        node,
        hasSearchHighlight ? searchTerm : "",
        isCurrentSearchResult,
      );
    },
    [
      startLine,
      searchResultsByLine,
      searchTerm,
      searchResults,
      currentSearchIndex,
      renderLineWithHighlighting,
    ],
  );

  // Expose navigation methods for parent components via ref
  useImperativeHandle(
    ref,
    () => ({
      navigate: handleNavigationAction,
    }),
    [handleNavigationAction],
  );

  return (
    <Box flexGrow={1} flexDirection="column" padding={1}>
      <Box flexDirection="column">
        {visibleLineData.map((line, index) => {
          const originalIndex = index;
          const node = visibleNodes[index];
          const globalLineIndex = startLine + index;
          const uniqueKey = `collapsible-line-${globalLineIndex}`;

          return (
            <Box key={uniqueKey} flexDirection="row">
              {showLineNumbers && (
                <Box marginRight={1}>
                  <Text color="gray" dimColor>
                    {formatLineNumber(globalLineIndex)}
                  </Text>
                </Box>
              )}
              <Box flexGrow={1}>{renderLine(line, originalIndex, node)}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

// Helper function to check if a node can be toggled
export function canToggleNode(
  state: CollapsibleState,
  nodeId: string,
): boolean {
  const node = state.nodes.get(nodeId);
  return node ? node.isCollapsible : false;
}

// Helper function to get current cursor node
export function getCurrentCursorNode(state: CollapsibleState) {
  if (!state.cursorPosition) return null;
  return state.nodes.get(state.cursorPosition.nodeId) || null;
}
