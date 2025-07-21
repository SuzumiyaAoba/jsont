/**
 * UI state hooks using jotai atoms
 */

import {
  collapsibleModeAtom,
  currentModeAtom,
  debugLogViewerVisibleAtom,
  debugVisibleAtom,
  helpVisibleAtom,
  lineNumbersVisibleAtom,
  schemaVisibleAtom,
  toggleCollapsibleAtom,
  toggleDebugAtom,
  toggleDebugLogViewerAtom,
  toggleHelpAtom,
  toggleLineNumbersAtom,
  toggleSchemaAtom,
  toggleTreeViewAtom,
  treeViewModeAtom,
} from "@store/atoms/ui";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useDebugVisible = () => useAtom(debugVisibleAtom);
export const useLineNumbersVisible = () => useAtom(lineNumbersVisibleAtom);
export const useSchemaVisible = () => useAtom(schemaVisibleAtom);
export const useHelpVisible = () => useAtom(helpVisibleAtom);
export const useTreeViewMode = () => useAtom(treeViewModeAtom);
export const useCollapsibleMode = () => useAtom(collapsibleModeAtom);
export const useDebugLogViewerVisible = () =>
  useAtom(debugLogViewerVisibleAtom);

// Read-only hooks
export const useCurrentMode = () => useAtomValue(currentModeAtom);

// Toggle action hooks
export const useToggleDebug = () => useSetAtom(toggleDebugAtom);
export const useToggleLineNumbers = () => useSetAtom(toggleLineNumbersAtom);
export const useToggleSchema = () => useSetAtom(toggleSchemaAtom);
export const useToggleHelp = () => useSetAtom(toggleHelpAtom);
export const useToggleTreeView = () => useSetAtom(toggleTreeViewAtom);
export const useToggleCollapsible = () => useSetAtom(toggleCollapsibleAtom);
export const useToggleDebugLogViewer = () =>
  useSetAtom(toggleDebugLogViewerAtom);

// Convenience hook for all UI state (for compatibility)
export const useUIState = () => ({
  debugVisible: useAtomValue(debugVisibleAtom),
  lineNumbersVisible: useAtomValue(lineNumbersVisibleAtom),
  schemaVisible: useAtomValue(schemaVisibleAtom),
  helpVisible: useAtomValue(helpVisibleAtom),
  treeViewMode: useAtomValue(treeViewModeAtom),
  collapsibleMode: useAtomValue(collapsibleModeAtom),
  debugLogViewerVisible: useAtomValue(debugLogViewerVisibleAtom),
  currentMode: useAtomValue(currentModeAtom),
});

// Main UI hook that returns both state and setters (for App.tsx compatibility)
export const useUI = () => {
  const [debugVisible, setDebugVisible] = useDebugVisible();
  const [lineNumbersVisible, setLineNumbersVisible] = useLineNumbersVisible();
  const [schemaVisible, setSchemaVisible] = useSchemaVisible();
  const [helpVisible, setHelpVisible] = useHelpVisible();
  const [treeViewMode, setTreeViewMode] = useTreeViewMode();
  const [collapsibleMode, setCollapsibleMode] = useCollapsibleMode();
  const [debugLogViewerVisible, setDebugLogViewerVisible] =
    useDebugLogViewerVisible();

  return {
    debugVisible,
    setDebugVisible,
    lineNumbersVisible,
    setLineNumbersVisible,
    schemaVisible,
    setSchemaVisible,
    helpVisible,
    setHelpVisible,
    treeViewMode,
    setTreeViewMode,
    collapsibleMode,
    setCollapsibleMode,
    debugLogViewerVisible,
    setDebugLogViewerVisible,
  };
};
