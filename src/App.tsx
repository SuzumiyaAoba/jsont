import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [waitingForSecondG, setWaitingForSecondG] = useState<boolean>(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clear timeout when component unmounts or when g sequence is reset
  useEffect(() => {
    return () => {
      if (gTimeoutRef.current) {
        clearTimeout(gTimeoutRef.current);
      }
    };
  }, []);

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
      } else if (input === "g" && !key.ctrl && !key.meta) {
        if (waitingForSecondG) {
          // Second 'g' pressed - goto top (gg)
          setScrollOffset(0);
          setWaitingForSecondG(false);
          if (gTimeoutRef.current) {
            clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = null;
          }
        } else {
          // First 'g' pressed - wait for second 'g'
          setWaitingForSecondG(true);
          // Reset after 1 second if second 'g' is not pressed
          gTimeoutRef.current = setTimeout(() => {
            setWaitingForSecondG(false);
            gTimeoutRef.current = null;
          }, 1000);
        }
      } else if (input === "G" && !key.ctrl && !key.meta) {
        // Goto bottom (G)
        setScrollOffset(maxScroll);
      } else {
        // Any other key resets the 'g' sequence
        if (waitingForSecondG) {
          setWaitingForSecondG(false);
          if (gTimeoutRef.current) {
            clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = null;
          }
        }
      }
    },
    [exit, maxScroll, halfPageLines, waitingForSecondG],
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
