import { Box, Text } from "ink";

interface StatusBarProps {
  error: string | null;
  focusMode?: "filter" | "navigation";
}

export function StatusBar({ error, focusMode }: StatusBarProps) {
  const getFocusHint = () => {
    if (!focusMode) return "";
    const current = focusMode === "filter" ? "Filter" : "Navigation";
    const shortcuts = "Tab: Switch focus";
    return ` | Focus: ${current} | ${shortcuts}`;
  };

  return (
    <Box borderStyle="single" borderColor={error ? "red" : "green"} padding={1}>
      <Text color={error ? "red" : "green"}>
        {error
          ? `Error: ${error}`
          : `JSON TUI Viewer - Ctrl+C: Exit${getFocusHint()}`}
      </Text>
    </Box>
  );
}
