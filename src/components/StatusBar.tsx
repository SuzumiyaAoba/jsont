import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  error: string | null;
}

export function StatusBar({ error }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor={error ? 'red' : 'green'} padding={1}>
      <Text color={error ? 'red' : 'green'}>
        {error ? `Error: ${error}` : 'JSON TUI Viewer - Press Ctrl+C to exit'}
      </Text>
    </Box>
  );
}