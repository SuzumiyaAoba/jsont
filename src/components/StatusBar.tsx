import { Box, Text } from "ink";

interface StatusBarProps {
  error: string | null;
  keyboardEnabled?: boolean;
}

export function StatusBar({ error, keyboardEnabled = false }: StatusBarProps) {
  const getStatusMessage = () => {
    if (error) {
      return `Error: ${error}`;
    }

    if (keyboardEnabled) {
      return `JSON TUI Viewer - q: Quit/Search input | Ctrl+C: Exit | j/k: Line | Ctrl+f/b: Half-page | gg/G: Top/Bottom | s: Search | Esc: Exit search | D: Toggle debug | L: Toggle line numbers | S: Toggle schema`;
    } else {
      return `JSON TUI Viewer - Keyboard input not available (try: jsont < file.json in terminal)`;
    }
  };

  return (
    <Box borderStyle="single" borderColor={error ? "red" : "green"} padding={1}>
      <Text color={error ? "red" : "green"}>{getStatusMessage()}</Text>
    </Box>
  );
}
