import { Box, useApp, useInput } from "ink";
import { useState } from "react";
import { FilterInput } from "./components/FilterInput.js";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
import type { JsonValue } from "./types/index.js";

interface AppProps {
  initialData?: JsonValue;
}

export function App({ initialData }: AppProps) {
  const [filter, setFilter] = useState<string>("");
  const [filteredData] = useState<JsonValue>(initialData ?? null);
  const [error] = useState<string | null>(null);
  const { exit } = useApp();

  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        exit();
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
      <JsonViewer data={filteredData} />
    </Box>
  );
}
