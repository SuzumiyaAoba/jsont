import { Box, Text } from "ink";

interface DebugBarProps {
  debugInfo: {
    lastKey: string;
    lastKeyAction: string;
    timestamp: string;
  } | null;
  keyboardEnabled: boolean;
  searchState?: {
    isSearching: boolean;
    searchTerm: string;
  };
}

export function DebugBar({
  debugInfo,
  keyboardEnabled,
  searchState,
}: DebugBarProps) {
  return (
    <Box flexDirection="column">
      <Box flexGrow={1} flexWrap="wrap">
        <Text color="blue">DEBUG: </Text>
        <Text color="gray">Keyboard: </Text>
        <Text color={keyboardEnabled ? "green" : "red"}>
          {keyboardEnabled ? "ON" : "OFF"}
        </Text>
        {searchState && (
          <>
            <Text color="gray"> | Search: </Text>
            <Text color={searchState.isSearching ? "green" : "red"}>
              {searchState.isSearching ? "ACTIVE" : "INACTIVE"}
            </Text>
            {searchState.searchTerm && (
              <>
                <Text color="gray"> Term: </Text>
                <Text color="cyan">"{searchState.searchTerm}"</Text>
              </>
            )}
          </>
        )}
        {debugInfo && (
          <>
            <Text color="gray"> | Last: </Text>
            <Text color="yellow">"{debugInfo.lastKey}"</Text>
            <Text color="gray"> → </Text>
            <Text color="white">{debugInfo.lastKeyAction}</Text>
            <Text color="gray"> @ {debugInfo.timestamp}</Text>
          </>
        )}
        {!debugInfo && <Text color="gray"> | No key pressed yet</Text>}
      </Box>
    </Box>
  );
}
