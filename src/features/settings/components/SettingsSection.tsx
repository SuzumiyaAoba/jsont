/**
 * Settings Section Component with improved UX
 */

import { Box, Text } from "ink";
import { memo } from "react";
import type { SettingsSection as SettingsSectionType } from "../types/settings";
import { SettingsField } from "./SettingsField";

interface SettingsSectionProps {
  section: SettingsSectionType;
  activeField: string | null;
  isEditing: boolean;
  previewValues: Record<string, unknown>;
  originalValues: Record<string, unknown>;
  isExpanded?: boolean;
}

function SettingsSectionComponent({
  section,
  activeField,
  isEditing,
  previewValues,
  originalValues,
  isExpanded = true,
}: SettingsSectionProps) {
  // Check if any field in this section is active
  const hasActiveField = section.fields.some(field => field.key === activeField);
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Section Header */}
      <Box flexDirection="row" alignItems="center" height={1}>
        <Text color="cyan" bold>
          {section.name}
        </Text>
        <Box marginLeft={2}>
          <Text color="gray" dimColor>
            {section.description}
          </Text>
        </Box>
      </Box>

      {/* Section Fields - Only show if expanded */}
      {isExpanded && (
        <Box flexDirection="column" paddingLeft={2}>
          {section.fields.map((field) => {
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
      )}

    </Box>
  );
}

// Memoize component to prevent unnecessary re-renders
export const SettingsSection = memo(SettingsSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.activeField === nextProps.activeField &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isExpanded === nextProps.isExpanded &&
    JSON.stringify(prevProps.previewValues) === JSON.stringify(nextProps.previewValues) &&
    JSON.stringify(prevProps.originalValues) === JSON.stringify(nextProps.originalValues)
  );
});