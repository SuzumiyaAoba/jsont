import { debugInfoAtom, searchStateAtom } from "@store/atoms";
import { Box, Text } from "ink";
import { useAtomValue } from "jotai";

interface DebugBarProps {
  keyboardEnabled: boolean;
}

export function DebugBar({ keyboardEnabled }: DebugBarProps) {
  const debugInfo = useAtomValue(debugInfoAtom);
  const searchState = useAtomValue(searchStateAtom);
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
