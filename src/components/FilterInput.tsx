import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";

interface FilterInputProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  isActive?: boolean;
}

export function FilterInput({
  filter,
  onFilterChange,
  isActive = false,
}: FilterInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentInput, setCurrentInput] = useState(filter);

  // Sync with external filter changes
  useEffect(() => {
    setCurrentInput(filter);
  }, [filter]);

  useInput(
    (input, key) => {
      if (!isActive) return;

      if (key.return) {
        if (isEditing) {
          // Apply filter and exit edit mode
          onFilterChange(currentInput);
          setIsEditing(false);
        } else {
          // Enter edit mode
          setIsEditing(true);
        }
      } else if (key.escape) {
        // Cancel editing
        setCurrentInput(filter);
        setIsEditing(false);
      } else if (isEditing) {
        if (key.backspace || key.delete) {
          setCurrentInput((prev) => prev.slice(0, -1));
        } else if (input && !key.ctrl && !key.meta) {
          // Add character to input
          setCurrentInput((prev) => prev + input);
        }
      }
    },
    {
      isActive: isActive && (process.stdin.isTTY ?? false),
    },
  );

  const displayText = isEditing ? currentInput : filter || "(empty)";
  const statusText = isEditing
    ? "Editing - Enter: Apply, Esc: Cancel"
    : "Enter: Edit filter";

  return (
    <Box
      borderStyle="single"
      borderColor={isEditing ? "yellow" : "gray"}
      padding={1}
    >
      <Box flexGrow={1}>
        <Text color="gray">Filter: </Text>
        <Text color={isEditing ? "yellow" : "white"}>{displayText}</Text>
        {isEditing && <Text color="yellow">█</Text>}
      </Box>
      <Box>
        <Text color="gray" dimColor>
          {statusText}
        </Text>
      </Box>
    </Box>
  );
}
