import { Box, useApp, useInput } from "ink";
import { useCallback, useState } from "react";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
import type { AppProps } from "./types/app.js";

export function App({
  initialData,
  initialError,
  keyboardEnabled = false,
}: AppProps) {
  const [error] = useState<string | null>(initialError ?? null);
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  const { exit } = useApp();

  // Calculate max scroll based on JSON data
  const jsonLines = initialData
    ? JSON.stringify(initialData, null, 2).split("\n").length
    : 0;
  const terminalHeight = process.stdout.rows || 24;
  const visibleLines = Math.max(1, terminalHeight - 3);
  const maxScroll = Math.max(0, jsonLines - visibleLines);

  // Calculate half-page scroll amount
  const halfPageLines = Math.max(1, Math.floor(visibleLines / 2));

  // Handle keyboard input function - memoized to prevent unnecessary re-renders
  const handleKeyInput = useCallback(
    (
      input: string,
      key: { ctrl: boolean; meta?: boolean; shift?: boolean },
    ) => {
      if (key.ctrl && input === "c") {
        exit();
      } else if (input === "q" && !key.ctrl) {
        exit();
      } else if (input === "j" && !key.ctrl) {
        // Line down
        setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
      } else if (input === "k" && !key.ctrl) {
        // Line up
        setScrollOffset((prev) => Math.max(0, prev - 1));
      } else if (key.ctrl && input === "f") {
        // Half-page down (Ctrl-f)
        setScrollOffset((prev) => Math.min(maxScroll, prev + halfPageLines));
      } else if (key.ctrl && input === "b") {
        // Half-page up (Ctrl-b)
        setScrollOffset((prev) => Math.max(0, prev - halfPageLines));
      }
    },
    [exit, maxScroll, halfPageLines],
  );

  // Use Ink's useInput hook for keyboard handling
  useInput(handleKeyInput, {
    isActive: keyboardEnabled,
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} keyboardEnabled={keyboardEnabled} />
      <Box flexGrow={1} width="100%">
        <JsonViewer data={initialData ?? null} scrollOffset={scrollOffset} />
      </Box>
    </Box>
  );
}
