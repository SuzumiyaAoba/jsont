/**
 * Settings TUI Header Component
 */

import { Box, Text } from "ink";
import { memo } from "react";
import type { SettingsCategory } from "../types/settings";

interface SettingsHeaderProps {
  currentCategory: string;
  hasUnsavedChanges: boolean;
  categories: SettingsCategory[];
}

function SettingsHeaderComponent({
  currentCategory,
  hasUnsavedChanges,
  categories,
}: SettingsHeaderProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      height={4}
    >
      {/* Title Bar */}
      <Box justifyContent="space-between" height={1}>
        <Text bold color="cyan">
          jsont Settings
        </Text>
        <Box minWidth={20}>
          {hasUnsavedChanges && <Text color="yellow">[Unsaved changes]</Text>}
        </Box>
      </Box>

      {/* Category Tabs - Fixed width for consistent positioning */}
      <Box height={1}>
        {categories.map((category, _index) => {
          const isActive = category.id === currentCategory;
          return (
            <Box key={category.id} marginRight={1}>
              <Text
                color={isActive ? "black" : "gray"}
                backgroundColor={isActive ? "cyan" : ""}
                bold={isActive}
              >
                {isActive ? `[${category.name}]` : category.name}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Memoize header component to prevent unnecessary re-renders
export const SettingsHeader = memo(
  SettingsHeaderComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.currentCategory === nextProps.currentCategory &&
      prevProps.hasUnsavedChanges === nextProps.hasUnsavedChanges &&
      prevProps.categories.length === nextProps.categories.length
    );
  },
);
