/**
 * Centralized modal management system
 * Handles all modal overlays and their z-index stacking
 */

import { useAppState } from "@components/providers/AppStateProvider";
import type { AppMode } from "@core/types/app";
import type { JsonValue } from "@core/types/index";
import { DebugLogViewer } from "@features/debug/components/DebugLogViewer";
import { HelpViewer } from "@features/help/components/HelpViewer";
import { ExportDialog } from "@features/schema/components/ExportDialog";
import type { ExportOptions } from "@features/schema/utils/fileExport";
import {
  exportToFile,
  generateDefaultFilename,
} from "@features/schema/utils/fileExport";
import { SettingsViewer } from "@features/settings/components/SettingsViewer";
import { Box } from "ink";
import type { ReactElement, ReactNode } from "react";
import { useCallback } from "react";

interface ModalManagerProps {
  children: ReactNode;
  currentMode: AppMode;
  displayData: JsonValue;
  initialError?: string | null;
}

export function ModalManager({
  children,
  currentMode,
  displayData,
  initialError: _initialError,
}: ModalManagerProps): ReactElement {
  const {
    config,
    ui,
    settingsVisible,
    exportDialog,
    dataExportDialog,
    setDataExportDialog,
    exportHandlers,
    terminalCalculations,
  } = useAppState();

  const {
    debugLogViewerVisible,
    setDebugLogViewerVisible,
    helpVisible,
    setHelpVisible: _setHelpVisible,
  } = ui;

  const { terminalSize } = terminalCalculations;

  // Handle data export
  const handleDataExport = useCallback(
    async (options: ExportOptions) => {
      try {
        await exportToFile(displayData, options);
        setDataExportDialog({ isVisible: false });
      } catch (error) {
        console.error("Export failed:", error);
      }
    },
    [displayData, setDataExportDialog],
  );

  return (
    <Box flexDirection="column" width="100%">
      {/* Debug Log Viewer - fullscreen modal overlay - highest priority */}
      {debugLogViewerVisible && (
        <DebugLogViewer
          height={terminalSize.height - 1}
          width={terminalSize.width}
          onExit={() => setDebugLogViewerVisible(false)}
        />
      )}

      {/* Settings Modal - high priority overlay */}
      {settingsVisible && (
        <Box width="100%" height="100%">
          <SettingsViewer
            width={terminalSize.width}
            height={terminalSize.height}
          />
        </Box>
      )}

      {/* Export Dialogs - high priority overlays */}
      {exportDialog.isVisible && (
        <ExportDialog
          isVisible={exportDialog.isVisible}
          onConfirm={exportHandlers.handleExportConfirm}
          onCancel={exportHandlers.handleExportCancel}
          defaultFilename={generateDefaultFilename("schema")}
          defaultFormat="schema"
          height={terminalSize.height}
          width={terminalSize.width}
        />
      )}

      {dataExportDialog.isVisible && (
        <ExportDialog
          isVisible={dataExportDialog.isVisible}
          onConfirm={handleDataExport}
          onCancel={() => setDataExportDialog({ isVisible: false })}
          defaultFilename={generateDefaultFilename("json")}
          height={terminalSize.height}
          width={terminalSize.width}
        />
      )}

      {/* Help Viewer - medium priority overlay */}
      {helpVisible &&
        !exportDialog.isVisible &&
        !dataExportDialog.isVisible &&
        !settingsVisible && (
          <Box width="100%" height="100%">
            <HelpViewer
              mode={currentMode}
              keybindings={config.keybindings}
              height={terminalSize.height}
              width={terminalSize.width}
            />
          </Box>
        )}

      {/* Main content - only show when no high-priority modals are visible */}
      {!debugLogViewerVisible &&
        !settingsVisible &&
        !exportDialog.isVisible &&
        !dataExportDialog.isVisible &&
        children}
    </Box>
  );
}
