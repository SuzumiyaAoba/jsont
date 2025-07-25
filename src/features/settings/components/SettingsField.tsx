/**
 * Individual Settings Field Component
 */

import { Box, Text } from "ink";
import { memo } from "react";
import type { SettingsFieldDefinition } from "../types/settings";
import { ArrayField } from "./fields/ArrayField";
import { BooleanField } from "./fields/BooleanField";
import { NumberField } from "./fields/NumberField";
import { StringField } from "./fields/StringField";

interface SettingsFieldProps {
  field: SettingsFieldDefinition;
  value: unknown;
  isActive: boolean;
  isEditing: boolean;
  originalValue?: unknown; // For showing changes
}

function SettingsFieldComponent({
  field,
  value,
  isActive,
  isEditing,
  originalValue,
}: SettingsFieldProps) {
  // Check if value has been changed from original
  const hasChanged = originalValue !== undefined && originalValue !== value;
  const isDefault = value === field.defaultValue;
  // Render field editor based on type
  const renderFieldEditor = () => {
    switch (field.type) {
      case "boolean":
        return (
          <BooleanField
            field={field}
            value={value as boolean}
            isEditing={isEditing}
          />
        );
      case "number":
        return (
          <NumberField
            field={field}
            value={value as number}
            isEditing={isEditing}
          />
        );
      case "string":
        return (
          <StringField
            field={field}
            value={value as string}
            isEditing={isEditing}
          />
        );
      case "array":
        return (
          <ArrayField
            field={field}
            value={value as string[]}
            isEditing={isEditing}
          />
        );
      default:
        return <Text color="red">Unsupported field type: {field.type}</Text>;
    }
  };

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      marginBottom={0}
    >
      {/* Field Label and Value on same line for compact view */}
      <Box justifyContent="space-between">
        <Box minWidth="50%" flexDirection="row" alignItems="center">
          <Text 
            bold 
            color={isActive ? (isEditing ? "black" : "white") : "white"}
          >
            {isActive ? "► " : "  "}{field.label}
          </Text>
          {/* Status indicators */}
          {hasChanged && (
            <Box marginLeft={1}>
              <Text color="yellow">[M]</Text>
            </Box>
          )}
          {!isDefault && !hasChanged && (
            <Box marginLeft={1}>
              <Text color="blue">[C]</Text>
            </Box>
          )}
        </Box>
        <Box minWidth="50%">
          {renderFieldEditor()}
        </Box>
      </Box>

      {/* Status indicators only - descriptions moved to side panel */}
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export const SettingsField = memo(SettingsFieldComponent, (prevProps, nextProps) => {
  return (
    prevProps.field.key === nextProps.field.key &&
    prevProps.value === nextProps.value &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isEditing === nextProps.isEditing
  );
});
