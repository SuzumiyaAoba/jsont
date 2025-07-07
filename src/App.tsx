import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useState } from "react";
import { JsonViewer } from "./components/JsonViewer.js";
import { StatusBar } from "./components/StatusBar.js";
import type { AppProps } from "./types/app.js";
import { type KeyEvent, keyboardHandler } from "./utils/keyboardHandler.js";

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
        setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
      } else if (input === "k" && !key.ctrl) {
        setScrollOffset((prev) => Math.max(0, prev - 1));
      }
    },
    [exit, maxScroll],
  );

  // Global keyboard input handling - try both Ink's useInput and custom handler
  useInput(handleKeyInput, {
    isActive: keyboardEnabled, // Enable only when explicitly allowed
  });

  // Custom keyboard handler for cases where Ink's useInput doesn't work
  useEffect(() => {
    if (!keyboardEnabled) {
      return;
    }

    // Set up custom keyboard handler as fallback
    const handleCustomKey = (keyEvent: KeyEvent) => {
      // Convert custom key event to Ink-style format
      const input = keyEvent.name || keyEvent.sequence;
      const key = {
        ctrl: keyEvent.ctrl,
        meta: keyEvent.meta,
        shift: keyEvent.shift,
      };

      handleKeyInput(input, key);
    };

    // Start custom keyboard handler
    keyboardHandler.on("key", handleCustomKey);
    keyboardHandler.start();

    // Cleanup
    return () => {
      keyboardHandler.off("key", handleCustomKey);
      keyboardHandler.stop();
    };
  }, [keyboardEnabled, handleKeyInput]); // Include handleKeyInput dependency

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar error={error} keyboardEnabled={keyboardEnabled} />
      <Box flexGrow={1} width="100%">
        <JsonViewer data={initialData ?? null} scrollOffset={scrollOffset} />
      </Box>
    </Box>
  );
}
