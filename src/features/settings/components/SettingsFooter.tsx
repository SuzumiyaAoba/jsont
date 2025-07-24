/**
 * Settings TUI Footer Component
 */

import { Box, Text } from 'ink';

interface SettingsFooterProps {
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

export function SettingsFooter({ isEditing, hasUnsavedChanges }: SettingsFooterProps) {
  if (isEditing) {
    return (
      <Box 
        borderStyle="single" 
        borderColor="yellow" 
        paddingX={1} 
        justifyContent="center"
      >
        <Text color="yellow">
          Editing: <Text color="white">Enter</Text> save • <Text color="white">Esc</Text> cancel
        </Text>
      </Box>
    );
  }

  return (
    <Box 
      borderStyle="single" 
      borderColor="gray" 
      paddingX={1}
      flexDirection="column"
    >
      <Box justifyContent="space-between">
        <Text color="gray">
          <Text color="white">Tab/Shift+Tab</Text> switch category • <Text color="white">j/k</Text> navigate • <Text color="white">Enter/e</Text> edit
        </Text>
        <Text color="gray">
          <Text color="white">Ctrl+S</Text> save • <Text color="white">Ctrl+R</Text> reset • <Text color="white">Ctrl+D</Text> defaults • <Text color="white">q/Esc</Text> exit
        </Text>
      </Box>
      {hasUnsavedChanges && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="yellow">
            ⚠️  You have unsaved changes
          </Text>
        </Box>
      )}
    </Box>
  );
}