import { Box, useApp, useInput } from "ink";
import { useState } from "react";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
import type { AppProps } from "./types/app.js";

export function App({ initialData, initialError }: AppProps) {
  const [error] = useState<string | null>(initialError ?? null);

  const { exit } = useApp();

  // Global keyboard input handling
  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        // Ctrl+C: quit
        exit();
      } else if (input === "q" && !key.ctrl) {
        // q: quit (for easier exit)
        exit();
      }
    },
    {
      isActive: process.stdin.isTTY ?? false, // Only enable in TTY mode
    },
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} />
      <Box flexGrow={1} width="100%">
        <JsonViewer data={initialData ?? null} />
      </Box>
    </Box>
  );
}
