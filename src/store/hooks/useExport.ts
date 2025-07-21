/**
 * Export state hooks using jotai atoms
 */

import {
  completeExportAtom,
  exportDialogAtom,
  exportDialogModeAtom,
  exportDialogVisibleAtom,
  exportStatusAtom,
  hideExportDialogAtom,
  resetExportStatusAtom,
  setExportErrorAtom,
  showExportDialogAtom,
  startExportAtom,
  toggleExportDialogModeAtom,
} from "@store/atoms/export";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useExportStatus = () => useAtom(exportStatusAtom);
export const useExportDialogVisible = () => useAtom(exportDialogVisibleAtom);
export const useExportDialogMode = () => useAtom(exportDialogModeAtom);

// Read-only hooks
export const useExportDialog = () => useAtomValue(exportDialogAtom);

// Action hooks
export const useStartExport = () => useSetAtom(startExportAtom);
export const useCompleteExport = () => useSetAtom(completeExportAtom);
export const useResetExportStatus = () => useSetAtom(resetExportStatusAtom);
export const useSetExportError = () => useSetAtom(setExportErrorAtom);
export const useShowExportDialog = () => useSetAtom(showExportDialogAtom);
export const useHideExportDialog = () => useSetAtom(hideExportDialogAtom);
export const useToggleExportDialogMode = () =>
  useSetAtom(toggleExportDialogModeAtom);
