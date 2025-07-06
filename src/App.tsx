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

  // Global keyboard input handling
  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        exit();
      } else if (key.ctrl && input === "n") {
        // Toggle between navigable and classic viewer
        setUseNavigableViewer(!useNavigableViewer);
      } else if (key.ctrl && input === "t") {
        // Cycle through themes
        nextTheme();
      } else if (key.tab) {
        // Toggle focus between filter and navigation
        setFocusMode((prev) => (prev === "filter" ? "navigation" : "filter"));
      } else if (input === "/" && focusMode === "navigation") {
        // Quick filter access from navigation mode
        setFocusMode("filter");
      }
    },
    {
      isActive: process.stdin.isTTY ?? false,
    },
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} focusMode={focusMode} themeName={themeName} />
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
