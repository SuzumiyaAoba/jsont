/**
 * Settings Category Display Component
 */

import { settingsEqual } from "@core/utils/equality";
import { Box, Text } from "ink";
import { memo } from "react";
import type { SettingsCategory as SettingsCategoryType } from "../types/settings";
import { SettingsField } from "./SettingsField";

interface SettingsCategoryProps {
  category: SettingsCategoryType;
  activeField: string | null;
  isEditing: boolean;
  previewValues: Record<string, unknown>;
  originalValues: Record<string, unknown>;
  height: number;
}

function SettingsCategoryComponent({
  category,
  activeField,
  isEditing,
  previewValues,
  originalValues,
  height: _height,
}: SettingsCategoryProps) {
  // Unified display for all categories - no special sections
  const visibleFields = category.fields;

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Category Title - Unified across all categories */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          {category.name}
        </Text>
        <Text color="gray" italic>
          {category.description}
        </Text>
      </Box>

      {/* Settings Fields */}
      <Box flexDirection="column">
        {visibleFields.map((field) => {
          const isActive = field.key === activeField;
          const currentValue = previewValues[field.key] ?? field.defaultValue;
          const originalValue = originalValues[field.key];

          return (
            <Box key={field.key}>
              <SettingsField
                field={field}
                value={currentValue}
                isActive={isActive}
                isEditing={isEditing && isActive}
                originalValue={originalValue}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SettingsCategory = memo(
  SettingsCategoryComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.category.id === nextProps.category.id &&
      prevProps.activeField === nextProps.activeField &&
      prevProps.isEditing === nextProps.isEditing &&
      settingsEqual(prevProps.previewValues, nextProps.previewValues) &&
      settingsEqual(prevProps.originalValues, nextProps.originalValues)
    );
  },
);
