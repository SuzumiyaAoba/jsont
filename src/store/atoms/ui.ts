/**
 * UI state atoms for visibility toggles and display modes
 */

import { atom } from "jotai";

// UI visibility atoms
export const debugVisibleAtom = atom<boolean>(false);
export const lineNumbersVisibleAtom = atom<boolean>(false);
export const schemaVisibleAtom = atom<boolean>(false);
export const helpVisibleAtom = atom<boolean>(false);
export const treeViewModeAtom = atom<boolean>(false);
export const collapsibleModeAtom = atom<boolean>(false);
export const debugLogViewerVisibleAtom = atom<boolean>(false);

// Derived atom for current display mode
export const currentModeAtom = atom((get) => {
  const treeView = get(treeViewModeAtom);
  const collapsible = get(collapsibleModeAtom);
  const schema = get(schemaVisibleAtom);
  const help = get(helpVisibleAtom);
  const debugLogViewer = get(debugLogViewerVisibleAtom);

  if (help) return "help";
  if (debugLogViewer) return "debug-log";
  if (schema) return "schema";
  if (treeView) return "tree";
  if (collapsible) return "collapsible";
  return "json";
});

// Toggle actions (write-only atoms)
export const toggleDebugAtom = atom(null, (get, set) => {
  set(debugVisibleAtom, !get(debugVisibleAtom));
});

export const toggleLineNumbersAtom = atom(null, (get, set) => {
  set(lineNumbersVisibleAtom, !get(lineNumbersVisibleAtom));
});

export const toggleSchemaAtom = atom(null, (get, set) => {
  const currentSchema = get(schemaVisibleAtom);
  const newSchema = !currentSchema;

  // When enabling schema, disable other modes
  if (newSchema) {
    set(helpVisibleAtom, false);
    set(debugLogViewerVisibleAtom, false);
  }

  set(schemaVisibleAtom, newSchema);
});

export const toggleHelpAtom = atom(null, (get, set) => {
  const currentHelp = get(helpVisibleAtom);
  const newHelp = !currentHelp;

  // When enabling help, disable other modes
  if (newHelp) {
    set(schemaVisibleAtom, false);
    set(debugLogViewerVisibleAtom, false);
  }

  set(helpVisibleAtom, newHelp);
});

export const toggleTreeViewAtom = atom(null, (get, set) => {
  const current = get(treeViewModeAtom);
  const newValue = !current;

  // When enabling tree view, disable collapsible mode
  if (newValue) {
    set(collapsibleModeAtom, false);
  }

  set(treeViewModeAtom, newValue);
});

export const toggleCollapsibleAtom = atom(null, (get, set) => {
  const current = get(collapsibleModeAtom);
  const newValue = !current;

  // When enabling collapsible, disable tree view mode
  if (newValue) {
    set(treeViewModeAtom, false);
  }

  set(collapsibleModeAtom, newValue);
});

export const toggleDebugLogViewerAtom = atom(null, (get, set) => {
  const current = get(debugLogViewerVisibleAtom);
  const newValue = !current;

  // When enabling debug log viewer, disable other modes
  if (newValue) {
    set(helpVisibleAtom, false);
    set(schemaVisibleAtom, false);
  }

  set(debugLogViewerVisibleAtom, newValue);
});
