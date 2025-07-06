import { Box, useApp, useInput } from "ink";
import { useState } from "react";
import { FilterInput } from "./components/FilterInput.js";
import { JsonViewer } from "./components/JsonViewer.js";
import { NavigableJsonViewer } from "./components/NavigableJsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
import { useTheme } from "./hooks/useTheme.js";
import type { JsonValue } from "./types/index.js";

interface AppProps {
  initialData?: JsonValue;
  initialError?: string | null;
}

export function App({ initialData, initialError }: AppProps) {
  const [filter, setFilter] = useState<string>("");
  const [filteredData] = useState<JsonValue>(initialData ?? null);
  const [error] = useState<string | null>(initialError ?? null);
  const [focusMode, setFocusMode] = useState<"filter" | "navigation">("filter");

  // Default to classic JSON viewer for cleaner display, enable navigation with Ctrl+N
  const [useNavigableViewer, setUseNavigableViewer] = useState<boolean>(false);
  const { exit } = useApp();

  // Theme management
  const { themeName, nextTheme } = useTheme("default");

  // Global keyboard input handling (vim-like)
  useInput(
    (input, key) => {
      if (input === "q" && !key.ctrl) {
        // q: quit (vim-like)
        exit();
      } else if (key.ctrl && input === "c") {
        // Ctrl+C: alternative quit
        exit();
      } else if (input === "v") {
        // v: toggle viewer mode (like vim visual mode)
        setUseNavigableViewer((prev) => {
          const newValue = !prev;
          // When switching to navigable viewer, automatically set focus to navigation
          if (newValue) {
            setFocusMode("navigation");
          }
          return newValue;
        });
      } else if (input === "t") {
        // t: theme switching
        nextTheme();
      } else if (key.tab) {
        // Tab: focus switching (keep for ease of use)
        setFocusMode((prev) => (prev === "filter" ? "navigation" : "filter"));
      }
    },
    {
      isActive: process.stdin.isTTY ?? false,
    },
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar
        error={error}
        focusMode={focusMode}
        themeName={themeName}
        useNavigableViewer={useNavigableViewer}
      />
      <FilterInput
        filter={filter}
        onFilterChange={setFilter}
        isActive={focusMode === "filter"}
      />
      <Box flexGrow={1} width="100%">
        {useNavigableViewer ? (
          <NavigableJsonViewer
            data={filteredData}
            options={{ enableKeyboardNavigation: focusMode === "navigation" }}
            themeName={themeName}
          />
        ) : (
          <JsonViewer data={filteredData} themeName={themeName} />
        )}
      </Box>
    </Box>
  );
}
