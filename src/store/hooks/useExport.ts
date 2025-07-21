/**
 * Export and debug state hooks using jotai atoms
 */

import {
  clearDebugInfoAtom,
  completeExportAtom,
  debugInfoAtom,
  exportDialogAtom,
  exportDialogModeAtom,
  exportDialogVisibleAtom,
  exportStatusAtom,
  hideExportDialogAtom,
  resetExportStatusAtom,
  showExportDialogAtom,
  startExportAtom,
  toggleExportDialogModeAtom,
  updateDebugInfoAtom,
} from "@store/atoms/export";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Individual state hooks
export const useExportStatus = () => useAtom(exportStatusAtom);
export const useExportDialogVisible = () => useAtom(exportDialogVisibleAtom);
export const useExportDialogMode = () => useAtom(exportDialogModeAtom);
export const useDebugInfo = () => useAtom(debugInfoAtom);

// Read-only hooks
export const useExportDialog = () => useAtomValue(exportDialogAtom);

// Action hooks
export const useStartExport = () => useSetAtom(startExportAtom);
export const useCompleteExport = () => useSetAtom(completeExportAtom);
export const useResetExportStatus = () => useSetAtom(resetExportStatusAtom);
export const useShowExportDialog = () => useSetAtom(showExportDialogAtom);
export const useHideExportDialog = () => useSetAtom(hideExportDialogAtom);
export const useToggleExportDialogMode = () =>
  useSetAtom(toggleExportDialogModeAtom);
export const useUpdateDebugInfo = () => useSetAtom(updateDebugInfoAtom);
export const useClearDebugInfo = () => useSetAtom(clearDebugInfoAtom);
