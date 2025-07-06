import { Box, Text } from "ink";

interface StatusBarProps {
  error: string | null;
  focusMode?: "filter" | "navigation";
  themeName?: string;
}

export function StatusBar({ error, focusMode, themeName }: StatusBarProps) {
  const getFocusHint = () => {
    if (!focusMode) return "";
    const current = focusMode === "filter" ? "Filter" : "Navigation";
    const shortcuts =
      focusMode === "filter"
        ? "Tab: Switch to Navigation"
        : "↑↓: Navigate | Tab: Switch to Filter";
    return ` | Focus: ${current} | ${shortcuts}`;
  };

  const getThemeInfo = () => {
    return themeName ? ` | Theme: ${themeName} (Ctrl+T: Switch)` : "";
  };

  return (
    <Box borderStyle="single" borderColor={error ? "red" : "green"} padding={1}>
      <Text color={error ? "red" : "green"}>
        {error
          ? `Error: ${error}`
          : `JSON TUI Viewer - Ctrl+C: Exit${getThemeInfo()}${getFocusHint()}`}
      </Text>
    </Box>
  );
}
