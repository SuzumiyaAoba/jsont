/**
 * Settings Description Panel - Fixed area for field descriptions
 */

import { Box, Text } from "ink";
import { memo } from "react";
import type { SettingsFieldDefinition } from "../types/settings";

interface SettingsDescriptionPanelProps {
  field: SettingsFieldDefinition | null;
  currentValue: unknown;
  originalValue?: unknown;
  isEditing: boolean;
  width: number;
  height: number;
}

function SettingsDescriptionPanelComponent({
  field,
  currentValue,
  originalValue,
  isEditing,
  width,
  height,
}: SettingsDescriptionPanelProps) {
  if (!field) {
    return (
      <Box
        width={width}
        height={height}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
        flexDirection="column"
      >
        <Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Text color="gray" dimColor>
            Select a setting to view details
          </Text>
        </Box>
      </Box>
    );
  }

  const hasChanged = originalValue !== undefined && originalValue !== currentValue;
  const isDefault = currentValue === field.defaultValue;

  return (
    <Box
      width={width}
      height={height}
      borderStyle="single"
      borderColor={isEditing ? "yellow" : "cyan"}
      paddingX={1}
      paddingY={1}
      flexDirection="column"
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          {field.label}
        </Text>
      </Box>

      {/* Description */}
      <Box marginBottom={1}>
        <Text color="white" wrap="wrap">
          {field.description}
        </Text>
      </Box>

      {/* Current Value */}
      <Box marginBottom={1} flexDirection="column">
        <Text color="gray">Current Value:</Text>
        <Box marginLeft={2}>
          <Text color={isEditing ? "yellow" : "cyan"} bold>
            {JSON.stringify(currentValue)}
          </Text>
          {field.type === "number" && field.min !== undefined && field.max !== undefined && (
            <Text color="gray" dimColor>
              {" "}(Range: {field.min}-{field.max})
            </Text>
          )}
        </Box>
      </Box>

      {/* Default Value */}
      <Box marginBottom={1} flexDirection="column">
        <Text color="gray">Default Value:</Text>
        <Box marginLeft={2}>
          <Text color={isDefault ? "green" : "gray"}>
            {JSON.stringify(field.defaultValue)}
          </Text>
        </Box>
      </Box>

      {/* Status Information */}
      <Box marginBottom={1} flexDirection="column">
        <Text color="gray">Status:</Text>
        <Box marginLeft={2} flexDirection="column">
          {hasChanged && (
            <Text color="yellow">
              Modified from: {JSON.stringify(originalValue)}
            </Text>
          )}
          {!isDefault && !hasChanged && (
            <Text color="blue">
              Custom value (non-default)
            </Text>
          )}
          {isDefault && (
            <Text color="green">
              Using default value
            </Text>
          )}
        </Box>
      </Box>

      {/* Type and Constraints */}
      <Box flexDirection="column">
        <Text color="gray">Type: <Text color="white">{field.type}</Text></Text>
        {field.type === "array" && (
          <Text color="gray" dimColor>
            Press 'a' to add, 'e' to edit, 'd' to delete items
          </Text>
        )}
        {field.type === "boolean" && (
          <Text color="gray" dimColor>
            Press Space, 't', 'f', or arrow keys to toggle
          </Text>
        )}
        {field.type === "number" && (
          <Text color="gray" dimColor>
            Use arrow keys or type numbers to adjust
          </Text>
        )}
        {field.type === "string" && (
          <Text color="gray" dimColor>
            Type to edit, arrow keys to navigate cursor
          </Text>
        )}
      </Box>

      {/* Editing Help */}
      {isEditing && (
        <Box marginTop={1} borderTop borderColor="yellow">
          <Box marginTop={1}>
            <Text color="yellow" bold>
              Editing: Press Enter to apply, Esc to cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SettingsDescriptionPanel = memo(SettingsDescriptionPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.field?.key === nextProps.field?.key &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.originalValue === nextProps.originalValue &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height
  );
});