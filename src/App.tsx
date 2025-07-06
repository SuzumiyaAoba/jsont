import { Box, useApp, useInput } from "ink";
import { useState } from "react";
import { FilterInput } from "./components/FilterInput.js";
import { JsonViewer } from "./components/JsonViewer.js";
import { NavigableJsonViewer } from "./components/NavigableJsonViewer.js";
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

  // Default to navigable viewer, only disable for stdin pipe without file arg
  const isStdinPipe = !process.stdin.isTTY && !process.argv[2];
  const [useNavigableViewer, setUseNavigableViewer] = useState<boolean>(
    !isStdinPipe,
  );
  const { exit } = useApp();

  // Global keyboard input handling
  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        exit();
      } else if (key.ctrl && input === "n") {
        // Toggle between navigable and classic viewer
        setUseNavigableViewer(!useNavigableViewer);
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
    <Box flexDirection="column" height="100%">
      <StatusBar error={error} focusMode={focusMode} />
      <FilterInput
        filter={filter}
        onFilterChange={setFilter}
        isActive={focusMode === "filter"}
      />
      {useNavigableViewer ? (
        <NavigableJsonViewer
          data={filteredData}
          options={{ enableKeyboardNavigation: focusMode === "navigation" }}
        />
      ) : (
        <JsonViewer data={filteredData} />
      )}
    </Box>
  );
}
