/**
 * Individual Settings Field Component
 */

import { Box, Text } from 'ink';
import type { SettingsFieldDefinition } from '../types/settings';
import { BooleanField } from './fields/BooleanField';
import { NumberField } from './fields/NumberField';
import { StringField } from './fields/StringField';
import { ArrayField } from './fields/ArrayField';

interface SettingsFieldProps {
  field: SettingsFieldDefinition;
  value: unknown;
  isActive: boolean;
  isEditing: boolean;
}

export function SettingsField({ field, value, isActive, isEditing }: SettingsFieldProps) {
  // Render field editor based on type
  const renderFieldEditor = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <BooleanField
            field={field}
            value={value as boolean}
            isEditing={isEditing}
          />
        );
      case 'number':
        return (
          <NumberField
            field={field}
            value={value as number}
            isEditing={isEditing}
          />
        );
      case 'string':
        return (
          <StringField
            field={field}
            value={value as string}
            isEditing={isEditing}
          />
        );
      case 'array':
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
      borderStyle={isActive ? 'single' : undefined}
      borderColor={isActive ? (isEditing ? 'yellow' : 'cyan') : undefined}
      paddingX={isActive ? 1 : 0}
      paddingY={isActive ? 0 : 0}
    >
      {/* Field Label and Description */}
      <Box flexDirection="column" marginBottom={1}>
        <Box justifyContent="space-between">
          <Text bold color={isActive ? 'cyan' : 'white'}>
            {field.label}
          </Text>
          {isActive && (
            <Text color="gray" dimColor>
              {field.key}
            </Text>
          )}
        </Box>
        <Text color="gray" wrap="wrap">
          {field.description}
        </Text>
      </Box>

      {/* Field Editor */}
      <Box>
        {renderFieldEditor()}
      </Box>

      {/* Default Value Info */}
      {isActive && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Default: {JSON.stringify(field.defaultValue)}
          </Text>
        </Box>
      )}
    </Box>
  );
}