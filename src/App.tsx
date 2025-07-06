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
  // Default to navigable viewer, only disable for stdin pipe without file arg
  const isStdinPipe = !process.stdin.isTTY && !process.argv[2];
  const [useNavigableViewer, setUseNavigableViewer] = useState<boolean>(
    !isStdinPipe,
  );
  const { exit } = useApp();

  // Only enable keyboard input in TTY mode
  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        exit();
      } else if (key.ctrl && input === "n") {
        // Toggle between navigable and classic viewer
        setUseNavigableViewer(!useNavigableViewer);
      }
    },
    {
      isActive: process.stdin.isTTY ?? false,
    },
  );

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar error={error} />
      <FilterInput filter={filter} onFilterChange={setFilter} />
      {useNavigableViewer ? (
        <NavigableJsonViewer data={filteredData} />
      ) : (
        <JsonViewer data={filteredData} />
      )}
    </Box>
  );
}
