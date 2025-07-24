/**
 * Settings Category Display Component
 */

import { Box, Text } from 'ink';
import type { SettingsCategory as SettingsCategoryType } from '../types/settings';
import { SettingsField } from './SettingsField';

interface SettingsCategoryProps {
  category: SettingsCategoryType;
  activeField: string | null;
  isEditing: boolean;
  previewValues: Record<string, unknown>;
  height: number;
}

export function SettingsCategory({
  category,
  activeField,
  isEditing,
  previewValues,
  height,
}: SettingsCategoryProps) {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} height={height}>
      {/* Category Description */}
      <Box marginBottom={1}>
        <Text color="gray" italic>
          {category.description}
        </Text>
      </Box>

      {/* Settings Fields */}
      <Box flexDirection="column" gap={1}>
        {category.fields.map((field) => {
          const isActive = field.key === activeField;
          const currentValue = previewValues[field.key] ?? field.defaultValue;
          
          return (
            <SettingsField
              key={field.key}
              field={field}
              value={currentValue}
              isActive={isActive}
              isEditing={isEditing && isActive}
            />
          );
        })}
      </Box>
    </Box>
  );
}