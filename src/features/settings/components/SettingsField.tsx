/**
 * Individual Settings Field Component
 */

import { Box, Text } from "ink";
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
}

export function SettingsField({
  field,
  value,
  isActive,
  isEditing,
}: SettingsFieldProps) {
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
      backgroundColor={isActive ? (isEditing ? "yellow" : "blue") : undefined}
      paddingX={1}
      paddingY={0}
      marginBottom={0}
    >
      {/* Field Label and Value on same line for compact view */}
      <Box justifyContent="space-between">
        <Box minWidth="50%">
          <Text 
            bold 
            color={isActive ? (isEditing ? "black" : "white") : "white"}
          >
            {isActive ? "► " : "  "}{field.label}
          </Text>
        </Box>
        <Box minWidth="50%">
          {renderFieldEditor()}
        </Box>
      </Box>

      {/* Description - only show when active */}
      {isActive && (
        <Box marginTop={1}>
          <Text 
            color={isActive ? (isEditing ? "black" : "gray") : "gray"} 
            wrap="wrap"
            dimColor
          >
            {field.description}
          </Text>
        </Box>
      )}

      {/* Default Value Info - only show when active but not editing */}
      {isActive && !isEditing && (
        <Box>
          <Text color="gray" dimColor>
            Default: {JSON.stringify(field.defaultValue)}
          </Text>
        </Box>
      )}
    </Box>
  );
}
