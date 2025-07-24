/**
 * Settings Category Display Component
 */

import { Box, Text } from "ink";
import { useMemo } from "react";
import type { SettingsCategory as SettingsCategoryType } from "../types/settings";
import { SettingsField } from "./SettingsField";

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
  // Calculate scroll position based on active field
  const { visibleFields, scrollOffset } = useMemo(() => {
    const activeIndex = category.fields.findIndex(f => f.key === activeField);
    const availableHeight = height - 5; // Account for header, description, scroll indicators
    const fieldsPerPage = Math.max(1, Math.floor(availableHeight / 3)); // ~3 lines per field (more compact)
    const startIndex = Math.max(0, activeIndex - Math.floor(fieldsPerPage / 2));
    const endIndex = Math.min(category.fields.length, startIndex + fieldsPerPage);
    
    return {
      visibleFields: category.fields.slice(startIndex, endIndex),
      scrollOffset: startIndex,
    };
  }, [category.fields, activeField, height]);

  const totalFields = category.fields.length;
  const hasMore = scrollOffset + visibleFields.length < totalFields;
  const hasPrevious = scrollOffset > 0;

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} height={height}>
      {/* Category Description */}
      <Box marginBottom={1}>
        <Text color="gray" italic>
          {category.description}
        </Text>
      </Box>

      {/* Scroll indicator (top) */}
      {hasPrevious && (
        <Box justifyContent="center" marginBottom={1}>
          <Text color="gray" dimColor>
            ▲ More settings above ({scrollOffset} items)
          </Text>
        </Box>
      )}

      {/* Settings Fields */}
      <Box flexDirection="column">
        {visibleFields.map((field) => {
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

      {/* Scroll indicator (bottom) */}
      {hasMore && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="gray" dimColor>
            ▼ More settings below ({totalFields - scrollOffset - visibleFields.length} items)
          </Text>
        </Box>
      )}
    </Box>
  );
}
