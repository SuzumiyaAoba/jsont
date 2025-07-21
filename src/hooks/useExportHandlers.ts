/**
 * Export handling logic and dialog management
 */

import { exportToFile } from "@features/schema/utils/fileExport";
import {
  useCompleteExport,
  useHideExportDialog,
  useResetExportStatus,
  useSetExportError,
  useShowExportDialog,
  useStartExport,
} from "@store/hooks/useExport";
import { useCallback } from "react";

interface UseExportHandlersProps {
  initialData: unknown;
}

export function useExportHandlers({ initialData }: UseExportHandlersProps) {
  // Export hooks
  const startExport = useStartExport();
  const completeExport = useCompleteExport();
  const resetExportStatus = useResetExportStatus();
  const setExportError = useSetExportError();
  const showExportDialog = useShowExportDialog();
  const hideExportDialog = useHideExportDialog();

  // Handle schema export
  const handleExportSchema = useCallback(() => {
    if (!initialData) {
      setExportError("No data to export. Please load JSON data first.");
      return;
    }
    // Show export dialog
    showExportDialog("simple");
  }, [initialData, showExportDialog, setExportError]);

  // Handle export dialog confirmation
  const handleExportConfirm = useCallback(
    async (options: Parameters<typeof exportToFile>[1]) => {
      if (!initialData) return;

      hideExportDialog();
      startExport();

      try {
        const result = await exportToFile(initialData as any, options);
        if (result.success) {
          const exportType =
            options?.format === "json" ? "JSON data" : "JSON Schema";
          completeExport({
            success: true,
            message: `${exportType} exported to ${result.filePath}`,
          });
        } else {
          completeExport({
            success: false,
            message: result.error || "Export failed",
          });
        }
      } catch (error) {
        completeExport({
          success: false,
          message: error instanceof Error ? error.message : "Export failed",
        });
      }
      // Clear export status after 3 seconds
      setTimeout(() => {
        resetExportStatus();
      }, 3000);
    },
    [
      initialData,
      hideExportDialog,
      startExport,
      completeExport,
      resetExportStatus,
    ],
  );

  // Handle export dialog cancellation
  const handleExportCancel = useCallback(() => {
    hideExportDialog();
  }, [hideExportDialog]);

  return {
    handleExportSchema,
    handleExportConfirm,
    handleExportCancel,
  };
}
