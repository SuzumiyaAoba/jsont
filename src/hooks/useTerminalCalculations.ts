/**
 * Terminal size and UI layout calculations
 */

import { useConfig } from "@core/context/ConfigContext";
import type { JsonValue } from "@core/types/index";
import {
  formatJsonSchema,
  inferJsonSchema,
} from "@features/schema/utils/schemaUtils";
import {
  calculateStatusBarHeight,
  getStatusContent,
} from "@features/status/utils/statusUtils";
import { useDebugInfo } from "@store/hooks/useDebug";
import { useJqState } from "@store/hooks/useJq";
import { usePropertyDetails } from "@store/hooks/usePropertyDetails";
import { useSearchState } from "@store/hooks/useSearch";
import { useUI } from "@store/hooks/useUI";
import { useEffect, useMemo, useState } from "react";

interface UseTerminalCalculationsProps {
  keyboardEnabled: boolean;
  error: string | null;
  initialData: unknown;
  collapsibleMode: boolean;
}

export function useTerminalCalculations({
  keyboardEnabled,
  error,
  initialData,
  collapsibleMode,
}: UseTerminalCalculationsProps) {
  const config = useConfig();
  const searchState = useSearchState();
  const jqState = useJqState();
  const [debugInfo] = useDebugInfo();
  const {
    debugVisible,
    helpVisible,
    schemaVisible,
    treeViewMode,
    collapsibleMode: uiCollapsibleMode,
  } = useUI();
  const { config: propertyDetailsConfig, details: propertyDetails } =
    usePropertyDetails();

  // Terminal size state
  const [terminalSize, setTerminalSize] = useState({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  });

  // Monitor terminal size changes
  useEffect(() => {
    const updateTerminalSize = () => {
      setTerminalSize({
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
      });
    };

    // Update size on resize if supported
    if (process.stdout.on && process.stdout.off) {
      // Increase max listeners to prevent warnings in tests
      if (process.stdout.setMaxListeners) {
        process.stdout.setMaxListeners(20);
      }

      process.stdout.on("resize", updateTerminalSize);
      return () => {
        process.stdout.off("resize", updateTerminalSize);
      };
    }

    // Return undefined when process.stdout.on is not available
    return undefined;
  }, []);

  // Calculate debug bar height dynamically based on content length with memoization
  const debugBarHeight = useMemo(() => {
    if (!debugVisible) return 0; // No debug bar when hidden

    const terminalWidth = terminalSize.width;
    let debugContent = `DEBUG: Keyboard: ${keyboardEnabled ? "ON" : "OFF"}`;

    if (searchState.isSearching || searchState.searchTerm) {
      debugContent += ` | Search: ${searchState.isSearching ? "ACTIVE" : "INACTIVE"}`;
      if (searchState.searchTerm) {
        debugContent += ` Term: "${searchState.searchTerm}"`;
      }
    }

    if (debugInfo) {
      debugContent += ` | Last: "${debugInfo.lastKey}" → ${debugInfo.lastKeyAction} @ ${debugInfo.timestamp}`;
    } else {
      debugContent += " | No key pressed yet";
    }

    // Calculate how many lines this content will take
    // Set minimum to 2 lines to account for potential wrapping
    const estimatedLines = Math.max(
      2,
      Math.ceil(debugContent.length / terminalWidth),
    );
    return estimatedLines;
  }, [
    debugVisible,
    keyboardEnabled,
    searchState.isSearching,
    searchState.searchTerm,
    debugInfo?.lastKey,
    debugInfo?.lastKeyAction,
    debugInfo?.timestamp,
    terminalSize.width,
    debugInfo,
  ]);

  // JQ bar height constant - updated for minHeight={5} + borders
  const JQ_BAR_TOTAL_LINES = 7; // minHeight(5) + borders(2) = 7 lines

  // Calculate JQ input bar height when active (fixed height to prevent layout shifts)
  const jqBarHeight = useMemo(() => {
    if (!jqState.isActive) return 0;
    return JQ_BAR_TOTAL_LINES;
  }, [jqState.isActive]);

  // Calculate status bar height dynamically based on content length
  const statusBarHeight = useMemo(() => {
    if (!helpVisible) return 0;

    const statusContent = getStatusContent({
      keyboardEnabled,
      collapsibleMode,
      error,
    });

    return calculateStatusBarHeight(statusContent, terminalSize.width);
  }, [
    helpVisible,
    keyboardEnabled,
    collapsibleMode,
    error,
    terminalSize.width,
  ]);

  // Calculate search bar height dynamically based on content
  const searchBarHeight = useMemo(() => {
    if (!searchState.isSearching && !searchState.searchTerm) return 0;

    // SearchBar uses minHeight={3} which includes borders
    // Actual content: 1 line + padding(1) + borders(2) = 4 lines minimum
    return 4;
  }, [searchState.isSearching, searchState.searchTerm]);

  // Calculate property details height - reserve fixed height for consistent layout
  const propertyDetailsHeight = useMemo(() => {
    // Only reserve height when property details are enabled AND displayed in current view mode
    // Property details are only shown in tree and collapsible modes AND when details exist
    const isPropertyDetailsVisible =
      propertyDetailsConfig.enabled &&
      (treeViewMode || uiCollapsibleMode) &&
      !!propertyDetails;

    if (!isPropertyDetailsVisible) return 0;

    // PropertyDetailsDisplay fixed height calculation:
    // - Header: 1 line ("Property Details")
    // - Borders: 2 lines (top + bottom)
    // - Content sections: Fixed height for all possible sections
    //   1. Path section (1 line)
    //   2. Key section (1 line)
    //   3. Type section (1 line)
    //   4. Children section (1 line)
    //   5. Value section (2 lines) - expanded for better display

    const FIXED_CONTENT_LINES = 6; // 4 single-line sections + 2 lines for Value section

    // Total height: header + fixed content + borders
    return 1 + FIXED_CONTENT_LINES + 2; // = 9 lines total
  }, [
    propertyDetailsConfig.enabled,
    treeViewMode,
    uiCollapsibleMode,
    propertyDetails,
  ]);

  // Conservative calculation to ensure first line is always visible
  const terminalHeight = terminalSize.height;
  // Reserve space for UI elements but ensure we have at least 5 visible lines
  const reservedSpace = Math.min(
    debugBarHeight +
      statusBarHeight +
      searchBarHeight +
      jqBarHeight +
      propertyDetailsHeight +
      2,
    terminalHeight - 5,
  );
  const visibleLines = Math.max(5, terminalHeight - reservedSpace);

  // Calculate JSON lines for scroll calculations - memoized to avoid repeated stringification
  const jsonLines = useMemo(() => {
    if (!initialData) return 0;
    try {
      return JSON.stringify(
        initialData,
        null,
        config.display.json.indent,
      ).split("\n").length;
    } catch {
      // Fallback for objects that can't be stringified
      return 100; // Reasonable default
    }
  }, [initialData, config.display.json.indent]);

  // Calculate schema lines when in schema view mode
  const schemaLines = useMemo(() => {
    if (!initialData || !schemaVisible) return 0;
    const schema = inferJsonSchema(initialData as JsonValue, "JSON Schema");
    const formattedSchema = formatJsonSchema(schema);
    return formattedSchema.split("\n").length;
  }, [initialData, schemaVisible]);

  // Use schema lines for scroll calculation when in schema view
  const currentDataLines = schemaVisible ? schemaLines : jsonLines;
  const maxScroll = Math.max(0, currentDataLines - visibleLines);

  // Search mode calculation - account for SearchBar height
  const searchModeVisibleLines = Math.max(1, visibleLines - searchBarHeight);
  const maxScrollSearchMode = Math.max(
    0,
    currentDataLines - searchModeVisibleLines,
  );

  // Calculate half-page scroll amount
  const halfPageLines = Math.max(1, Math.floor(visibleLines / 2));

  return {
    terminalSize,
    debugBarHeight,
    statusBarHeight,
    searchBarHeight,
    jqBarHeight,
    propertyDetailsHeight,
    UI_RESERVED_LINES: 0, // No reserved lines to ensure first line visibility
    visibleLines,
    searchModeVisibleLines,
    jsonLines,
    schemaLines,
    currentDataLines,
    maxScroll,
    maxScrollSearchMode,
    halfPageLines,
    JSON_INDENT: config.display.json.indent,
  };
}
