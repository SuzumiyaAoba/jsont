/**
 * Export and debug state atoms
 */

import type { ExportDialogState } from "@features/schema/types/export";
import { atom } from "jotai";

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
export const startExportAtom = atom(null, (_, set) => {
  set(exportStatusAtom, {
    isExporting: true,
  });
});

export const completeExportAtom = atom(
  null,
  (_, set, result: { success: boolean; message?: string }) => {
    set(exportStatusAtom, {
      isExporting: false,
      ...(result.message && { message: result.message }),
      type: result.success ? "success" : "error",
    });
  },
);

export const resetExportStatusAtom = atom(null, (_, set) => {
  set(exportStatusAtom, {
    isExporting: false,
  });
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
