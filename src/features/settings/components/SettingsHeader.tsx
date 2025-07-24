/**
 * Settings TUI Header Component
 */

import { Box, Text } from "ink";
import type { SettingsCategory } from "../types/settings";

interface SettingsHeaderProps {
  currentCategory: string;
  hasUnsavedChanges: boolean;
  categories: SettingsCategory[];
}

export function SettingsHeader({
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
    >
      {/* Title Bar */}
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          ⚙️ jsont Settings
        </Text>
        {hasUnsavedChanges && <Text color="yellow">● Unsaved changes</Text>}
      </Box>

      {/* Category Tabs */}
      <Box marginTop={1} gap={1}>
        {categories.map((category, index) => {
          const isActive = category.id === currentCategory;
          return (
            <Box key={category.id}>
              <Text
                color={isActive ? "black" : "gray"}
                backgroundColor={isActive ? "cyan" : ""}
                bold={isActive}
              >
                {` ${category.name} `}
              </Text>
              {index < categories.length - 1 && <Text color="gray"> │ </Text>}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
