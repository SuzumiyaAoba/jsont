/**
 * Hook for handling navigation in collapsible view
 */

import type {
  CollapsibleState,
  NavigationAction,
} from "@features/collapsible/types/collapsible";
import { handleNavigation } from "@features/collapsible/utils/collapsibleJson";
import { useCallback } from "react";

export function useCollapsibleNavigation(
  collapsibleState: CollapsibleState,
  setCollapsibleState: (state: CollapsibleState) => void,
  scrollOffset: number,
  visibleLines: number,
  onNavigate?: (action: NavigationAction) => void,
  onScrollChange?: (newScrollOffset: number) => void,
) {
  const handleNavigationAction = useCallback(
    (action: NavigationAction) => {
      const result = handleNavigation(collapsibleState, action);
      if (result) {
        setCollapsibleState(result.newState);

        // Handle scroll changes for cursor movements
        if (result.newState.cursorPosition) {
          const targetScrollOffset = Math.max(
            0,
            Math.min(
              result.newState.cursorPosition.lineIndex -
                Math.floor(visibleLines / 2),
              Math.max(0, result.newState.flattenedNodes.length - visibleLines),
            ),
          );

          if (targetScrollOffset !== scrollOffset && onScrollChange) {
            onScrollChange(targetScrollOffset);
          }
        }

        // Notify parent of navigation
        if (onNavigate) {
          onNavigate(action);
        }
      }
    },
    [
      collapsibleState,
      setCollapsibleState,
      scrollOffset,
      visibleLines,
      onNavigate,
      onScrollChange,
    ],
  );

  return { handleNavigationAction };
}
