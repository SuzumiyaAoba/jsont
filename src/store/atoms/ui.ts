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

// Notification system atoms
export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number; // milliseconds, undefined means persistent until dismissed
}

export const notificationAtom = atom<Notification | null>(null);

// Action atom to show notifications
export const showNotificationAtom = atom(
  null,
  (_get, set, notification: Omit<Notification, "id">) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set(notificationAtom, { ...notification, id });

    // Handle auto-dismiss logic
    if (notification.duration === undefined && notification.type === "error") {
      // Sticky error notification, do not auto-dismiss
      return;
    }

    // Auto-dismiss after specified duration or default based on type
    const duration =
      notification.duration ??
      (notification.type === "error" || notification.type === "warning"
        ? 10000 // 10 seconds for errors/warnings
        : 5000); // 5 seconds for success/info

    setTimeout(() => {
      set(notificationAtom, (current) => (current?.id === id ? null : current));
    }, duration);
  },
);

// Action atom to dismiss notification
export const dismissNotificationAtom = atom(null, (_get, set) => {
  set(notificationAtom, null);
});

// Confirmation dialog atoms
export interface ConfirmationDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const confirmationDialogAtom = atom<ConfirmationDialog | null>(null);

// Action atom to show confirmation dialog
export const showConfirmationAtom = atom(
  null,
  (_get, set, dialog: ConfirmationDialog) => {
    set(confirmationDialogAtom, dialog);
  },
);

// Action atom to dismiss confirmation dialog
export const dismissConfirmationAtom = atom(null, (_get, set) => {
  set(confirmationDialogAtom, null);
});
