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
import { useSearchState } from "@store/hooks/useSearch";
import { useUI } from "@store/hooks/useUI";
import { useEffect, useMemo, useState } from "react";

interface UseTerminalCalculationsProps {
  keyboardEnabled: boolean;
  error: string | null;
  searchInput: string;
  initialData: unknown;
  collapsibleMode: boolean;
}

export function useTerminalCalculations({
  keyboardEnabled,
  error,
  searchInput,
  initialData,
  collapsibleMode,
}: UseTerminalCalculationsProps) {
  const config = useConfig();
  const searchState = useSearchState();
  const jqState = useJqState();
  const [debugInfo] = useDebugInfo();
  const { debugVisible, helpVisible, schemaVisible } = useUI();

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
    debugInfo,
    terminalSize.width,
  ]);

  // Calculate JQ input bar height when active (fixed height to prevent layout shifts)
  const jqBarHeight = useMemo(() => {
    if (!jqState.isActive) return 0;

    // JQ Query actual height is 5 lines:
    // - Border: 2 lines (top + bottom)
    // - Query label + Input + Status with padding: 3 lines
    return 5;
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

    const terminalWidth = terminalSize.width;
    let searchContent = "";

    if (searchState.isSearching) {
      searchContent = `Search: ${searchInput} (Enter: confirm, Esc: cancel)`;
    } else {
      const navigationInfo =
        searchState.searchResults.length > 0
          ? `${searchState.currentResultIndex + 1}/${searchState.searchResults.length}`
          : "0/0";
      searchContent = `Search: ${searchState.searchTerm} (${navigationInfo}) n: next, N: prev, s: new search`;
    }

    // SearchBar uses borderStyle="single" + padding={1}
    // Available width = terminalWidth - 4 (2 borders + 2 padding)
    const availableWidth = Math.max(terminalWidth - 4, 20);
    const _contentLines = Math.ceil(searchContent.length / availableWidth);

    // SearchBar actual height is 3 lines (border + padding + content)
    return 3;
  }, [
    searchState.isSearching,
    searchState.searchTerm,
    searchInput,
    searchState.searchResults.length,
    searchState.currentResultIndex,
    terminalSize.width,
  ]);

  // Conservative calculation to ensure first line is always visible
  const terminalHeight = terminalSize.height;
  // Reserve space for UI elements but ensure we have at least 5 visible lines
  const reservedSpace = Math.min(
    debugBarHeight + statusBarHeight + searchBarHeight + jqBarHeight + 2,
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
