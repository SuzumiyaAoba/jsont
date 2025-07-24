/**
 * Settings Category Display Component
 */

import { Box, Text } from "ink";
import { useMemo, useCallback } from "react";
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
  // Memoize scroll calculations to prevent unnecessary re-renders
  const scrollData = useMemo(() => {
    if (!activeField || category.fields.length === 0) {
      // Show first few fields when no active field
      const fieldsPerPage = Math.max(1, Math.floor((height - 5) / 3));
      return {
        visibleFields: category.fields.slice(0, fieldsPerPage),
        scrollOffset: 0,
        activeIndex: -1,
      };
    }

    const activeIndex = category.fields.findIndex(f => f.key === activeField);
    if (activeIndex === -1) {
      // Field not found, show from beginning
      const fieldsPerPage = Math.max(1, Math.floor((height - 5) / 3));
      return {
        visibleFields: category.fields.slice(0, fieldsPerPage),
        scrollOffset: 0,
        activeIndex: -1,
      };
    }

    const availableHeight = height - 5; // Account for header, description, scroll indicators
    const fieldsPerPage = Math.max(1, Math.floor(availableHeight / 3)); // ~3 lines per field
    const startIndex = Math.max(0, activeIndex - Math.floor(fieldsPerPage / 2));
    const endIndex = Math.min(category.fields.length, startIndex + fieldsPerPage);
    
    return {
      visibleFields: category.fields.slice(startIndex, endIndex),
      scrollOffset: startIndex,
      activeIndex,
    };
  }, [category.fields, activeField, height]);

  const { visibleFields, scrollOffset } = scrollData;

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
