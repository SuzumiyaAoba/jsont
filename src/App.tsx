import { Box, useApp, useInput } from "ink";
import { useState } from "react";
import { FilterInput } from "./components/FilterInput.js";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
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

  const { exit } = useApp();

  // Global keyboard input handling
  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        // Ctrl+C: quit
        exit();
      } else if (key.tab) {
        // Tab: focus switching
        setFocusMode((prev) => (prev === "filter" ? "navigation" : "filter"));
      }
    },
    {
      isActive: process.stdin.isTTY ?? false,
    },
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} focusMode={focusMode} />
      <FilterInput
        filter={filter}
        onFilterChange={setFilter}
        isActive={focusMode === "filter"}
      />
      <Box flexGrow={1} width="100%">
        <JsonViewer data={filteredData} />
      </Box>
    </Box>
  );
}
