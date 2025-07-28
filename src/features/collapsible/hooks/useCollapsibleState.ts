/**
 * Hook for managing collapsible JSON state
 */

import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import type { CollapsibleState } from "@features/collapsible/types/collapsible";
import { initializeCollapsibleState } from "@features/collapsible/utils/collapsibleJson";
import { useEffect, useState } from "react";

export function useCollapsibleState(data: JsonValue | null) {
  const config = useConfig();
  const [collapsibleState, setCollapsibleState] = useState<CollapsibleState>(
    () => initializeCollapsibleState(data),
  );

  // Update state when data changes
  useEffect(() => {
    if (data !== null) {
      setCollapsibleState(initializeCollapsibleState(data));
    }
  }, [data]);

  return {
    collapsibleState,
    setCollapsibleState,
    config,
  };
}
