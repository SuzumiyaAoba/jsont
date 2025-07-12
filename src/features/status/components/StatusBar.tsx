import { getStatusContent } from "@features/status/utils/statusUtils";
import { Box, Text } from "ink";

interface StatusBarProps {
  error: string | null;
  keyboardEnabled?: boolean;
  collapsibleMode?: boolean;
}

export function StatusBar({
  error,
  keyboardEnabled = false,
  collapsibleMode = false,
}: StatusBarProps) {
  const statusMessage = getStatusContent({
    keyboardEnabled,
    collapsibleMode,
    error,
  });

  return (
    <Box borderStyle="single" borderColor={error ? "red" : "green"} padding={1}>
      <Text color={error ? "red" : "green"}>{statusMessage}</Text>
    </Box>
  );
}
