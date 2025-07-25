/**
 * Number Settings Field Component
 */

import { stopEditingAtom, updatePreviewValueAtom } from "@store/atoms/settings";
import { Box, Text, useInput } from "ink";
import { useSetAtom } from "jotai";
import { useCallback, useState, memo } from "react";
import type { SettingsFieldDefinition } from "../../types/settings";

interface NumberFieldProps {
  field: SettingsFieldDefinition;
  value: number;
  isEditing: boolean;
}

function NumberFieldComponent({ field, value, isEditing }: NumberFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const [inputValue, setInputValue] = useState(value.toString());

  // Handle keyboard input for number editing
  const handleKeyInput = useCallback(
    (input: string, key: any) => {
      if (!isEditing) return;

      if (key.return) {
        const numValue = parseInt(inputValue, 10);
        if (!Number.isNaN(numValue)) {
          const clampedValue = Math.max(
            field.min ?? -Infinity,
            Math.min(field.max ?? Infinity, numValue),
          );
          updatePreviewValue({ key: field.key, value: clampedValue });
        }
        stopEditing();
      } else if (key.escape) {
        setInputValue(value.toString());
        stopEditing();
      } else if (key.backspace || key.delete) {
        setInputValue((prev) => prev.slice(0, -1));
      } else if (key.upArrow) {
        const currentNum = parseInt(inputValue, 10) || 0;
        const newValue = Math.min(field.max ?? Infinity, currentNum + 1);
        setInputValue(newValue.toString());
      } else if (key.downArrow) {
        const currentNum = parseInt(inputValue, 10) || 0;
        const newValue = Math.max(field.min ?? -Infinity, currentNum - 1);
        setInputValue(newValue.toString());
      } else if (/^\d$/.test(input) || input === "-") {
        // Only allow digits and minus sign
        if (input === "-" && inputValue.includes("-")) return;
        setInputValue((prev) => prev + input);
      }
    },
    [
      isEditing,
      inputValue,
      value,
      field.key,
      field.min,
      field.max,
      updatePreviewValue,
      stopEditing,
    ],
  );

  useInput(handleKeyInput, { isActive: isEditing });

  // Validate current input
  const isValidInput = () => {
    const num = parseInt(inputValue, 10);
    if (Number.isNaN(num)) return false;
    if (field.min !== undefined && num < field.min) return false;
    if (field.max !== undefined && num > field.max) return false;
    return true;
  };

  return (
    <Box flexDirection="row" alignItems="center">
      {isEditing ? (
        <Box flexDirection="row" alignItems="center">
          <Text
            color={isValidInput() ? "black" : "red"}
            backgroundColor="white"
          >
            {inputValue}|
          </Text>
          <Box marginLeft={1}>
            <Text color="black">(↑/↓)</Text>
          </Box>
          {!isValidInput() && (
            <Box marginLeft={1}>
              <Text color="red">⚠️</Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box flexDirection="row" alignItems="center">
          <Text color="cyan">{value}</Text>
          {(field.min !== undefined || field.max !== undefined) && (
            <Box marginLeft={1}>
              <Text color="gray" dimColor>
                ({field.min ?? "∞"}-{field.max ?? "∞"})
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export const NumberField = memo(NumberFieldComponent);
