/**
 * Unified status bar component
 * Manages search bar, JQ input, warnings, export status
 */

import { useAppState } from "@components/providers/AppStateProvider";
import { JqQueryInput } from "@features/jq/components/JqQueryInput";
import { SearchBar } from "@features/search/components/SearchBar";
import { Box, Text } from "ink";
import type { ReactElement } from "react";

interface StatusBarManagerProps {
  keyboardEnabled?: boolean;
}

export function StatusBarManager({
  keyboardEnabled = false,
}: StatusBarManagerProps): ReactElement {
  const {
    searchState,
    searchInput,
    searchCursorPosition,
    jqState,
    jqInput,
    jqCursorPosition,
    jqErrorScrollOffset,
    jqFocusMode,
    exportStatus,
    exportDialog,
    ui,
  } = useAppState();

  const { helpVisible } = ui;

  // Don't show status bars when export dialogs or help are visible
  const shouldHideStatusBars = exportDialog.isVisible || helpVisible;

  return (
    <>
      {/* Search bar fixed at top when in search mode */}
      {(searchState.isSearching || searchState.searchTerm) &&
        !shouldHideStatusBars && (
          <Box flexShrink={0} width="100%">
            <SearchBar
              searchState={searchState}
              searchInput={searchInput}
              searchCursorPosition={searchCursorPosition}
            />
          </Box>
        )}

      {/* JQ transformation bar */}
      {jqState.isActive && !shouldHideStatusBars && (
        <Box flexShrink={0} width="100%">
          <JqQueryInput
            jqState={jqState}
            queryInput={jqInput}
            cursorPosition={jqCursorPosition}
            errorScrollOffset={jqErrorScrollOffset}
            focusMode={jqFocusMode}
          />
        </Box>
      )}

      {/* Keyboard unavailable warning */}
      {!keyboardEnabled && !shouldHideStatusBars && (
        <Box flexShrink={0} width="100%">
          <Box
            borderStyle="single"
            borderColor="yellow"
            padding={0}
            paddingLeft={1}
            paddingRight={1}
            width="100%"
          >
            <Text color="yellow" dimColor>
              Warning: Keyboard input unavailable (terminal access failed). Use
              file input: jsont file.json
            </Text>
          </Box>
        </Box>
      )}

      {/* Export status bar */}
      {(exportStatus.isExporting || exportStatus.message) &&
        !shouldHideStatusBars && (
          <Box flexShrink={0} width="100%">
            <Box
              borderStyle="single"
              borderColor={
                exportStatus.isExporting
                  ? "yellow"
                  : exportStatus.type === "success"
                    ? "green"
                    : "red"
              }
              padding={0}
              paddingLeft={1}
              paddingRight={1}
              width="100%"
            >
              {exportStatus.isExporting ? (
                <Text color="yellow">Exporting...</Text>
              ) : (
                <Text color={exportStatus.type === "success" ? "green" : "red"}>
                  {exportStatus.message}
                </Text>
              )}
            </Box>
          </Box>
        )}
    </>
  );
}
