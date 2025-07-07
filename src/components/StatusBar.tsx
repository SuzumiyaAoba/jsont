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
      return `JSON TUI Viewer - q: Quit | Ctrl+C: Exit | j/k: Line | Ctrl+f/b: Half-page | gg/G: Top/Bottom`;
    } else {
      return `JSON TUI Viewer - q: Quit | Ctrl+C: Exit | Navigation: Initializing...`;
    }
  };

  return (
    <Box borderStyle="single" borderColor={error ? "red" : "green"} padding={1}>
      <Text color={error ? "red" : "green"}>{getStatusMessage()}</Text>
    </Box>
  );
}
