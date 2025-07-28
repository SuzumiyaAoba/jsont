/**
 * Hook for calculating display lines from collapsible state
 */

import type { Config } from "@core/config/schema";
import type { CollapsibleState } from "@features/collapsible/types/collapsible";
import { getNodeDisplayText } from "@features/collapsible/utils/collapsibleJson";
import { useMemo } from "react";

export function useDisplayLines(
  collapsibleState: CollapsibleState,
  config: Config,
) {
  const displayLines = useMemo(() => {
    const indentConfig = {
      size: config.display.json.indent,
      useTabs: config.display.json.useTabs,
    };

    const result = new Array(collapsibleState.flattenedNodes.length);
    const expandedNodes = collapsibleState.expandedNodes;

    for (let i = 0; i < collapsibleState.flattenedNodes.length; i++) {
      const node = collapsibleState.flattenedNodes[i];
      if (node) {
        const isExpanded = expandedNodes.has(node.id);
        result[i] = getNodeDisplayText(node, isExpanded, indentConfig);
      }
    }

    return result;
  }, [collapsibleState, config]);

  return displayLines;
}
