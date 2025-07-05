import { Box, Text, useApp, useInput } from "ink";
import React, { useEffect, useState } from "react";
import { FilterInput } from "./components/FilterInput.js";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";

interface AppProps {
  initialData?: any;
}

export function App({ initialData }: AppProps) {
  const [jsonData, setJsonData] = useState<any>(initialData);
  const [filter, setFilter] = useState<string>("");
  const [filteredData, setFilteredData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);
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
