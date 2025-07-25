/**
 * Settings TUI Footer Component
 */

import { Box, Text } from "ink";
import { memo } from "react";

interface SettingsFooterProps {
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

function SettingsFooterComponent({
  isEditing,
  hasUnsavedChanges,
}: SettingsFooterProps) {
  if (isEditing) {
    return (
      <Box
        borderStyle="single"
        borderColor="yellow"
        paddingX={1}
        flexDirection="column"
      >
        <Box justifyContent="center">
          <Text color="yellow" bold>
            Editing Mode - <Text color="white" bold>Enter</Text> Apply • <Text color="white" bold>Esc</Text> Cancel
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      borderStyle="single"
      borderColor={hasUnsavedChanges ? "yellow" : "gray"}
      paddingX={1}
      flexDirection="column"
    >
      {/* Navigation Help */}
      <Box justifyContent="space-between">
        <Text color="gray">
          <Text color="white" bold>Tab</Text> Categories • <Text color="white" bold>j/k</Text> Navigate • <Text color="white" bold>Enter</Text> Edit
        </Text>
        <Text color="gray">
          <Text color="white" bold>Ctrl+S</Text> Save • <Text color="white" bold>q</Text> Exit
          {hasUnsavedChanges && <Text color="yellow" bold> [UNSAVED]</Text>}
        </Text>
      </Box>
    </Box>
  );
}

// Memoize footer component to prevent unnecessary re-renders
export const SettingsFooter = memo(SettingsFooterComponent, (prevProps, nextProps) => {
  return (
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.hasUnsavedChanges === nextProps.hasUnsavedChanges
  );
});
