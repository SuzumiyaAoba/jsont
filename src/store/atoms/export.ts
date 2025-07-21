/**
 * Export state atoms
 */

import type { ExportDialogState } from "@features/schema/types/export";
import { atom } from "jotai";
import { create } from "mutative";

// Export status atoms
export const exportStatusAtom = atom<{
  isExporting: boolean;
  message?: string;
  type?: "success" | "error";
}>({
  isExporting: false,
});

// Export dialog atoms
export const exportDialogVisibleAtom = atom<boolean>(false);
export const exportDialogModeAtom = atom<"simple" | "advanced">("simple");

// Derived export dialog state atom (for compatibility)
export const exportDialogAtom = atom<ExportDialogState>((get) => ({
  isVisible: get(exportDialogVisibleAtom),
  mode: get(exportDialogModeAtom),
}));

// Export actions
export const startExportAtom = atom(null, (get, set) => {
  const newStatus = create(get(exportStatusAtom), (draft) => {
    draft.isExporting = true;
    // Clear previous message and type when starting new export
    delete draft.message;
    delete draft.type;
  });
  set(exportStatusAtom, newStatus);
});

export const completeExportAtom = atom(
  null,
  (get, set, result: { success: boolean; message?: string }) => {
    const newStatus = create(get(exportStatusAtom), (draft) => {
      draft.isExporting = false;
      if (result.message) {
        draft.message = result.message;
      }
      draft.type = result.success ? "success" : "error";
    });
    set(exportStatusAtom, newStatus);
  },
);

export const resetExportStatusAtom = atom(null, (get, set) => {
  const newStatus = create(get(exportStatusAtom), (draft) => {
    draft.isExporting = false;
    // Clear message and type when resetting
    delete draft.message;
    delete draft.type;
  });
  set(exportStatusAtom, newStatus);
});

export const setExportErrorAtom = atom(null, (get, set, message: string) => {
  const newStatus = create(get(exportStatusAtom), (draft) => {
    draft.isExporting = false;
    draft.message = message;
    draft.type = "error";
  });
  set(exportStatusAtom, newStatus);
});

export const showExportDialogAtom = atom(
  null,
  (_, set, mode: "simple" | "advanced" = "simple") => {
    set(exportDialogModeAtom, mode);
    set(exportDialogVisibleAtom, true);
  },
);

export const hideExportDialogAtom = atom(null, (_, set) => {
  set(exportDialogVisibleAtom, false);
});

export const toggleExportDialogModeAtom = atom(null, (get, set) => {
  const currentMode = get(exportDialogModeAtom);
  set(exportDialogModeAtom, currentMode === "simple" ? "advanced" : "simple");
});
