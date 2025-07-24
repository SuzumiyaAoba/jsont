/**
 * Number Settings Field Component
 */

import { Box, Text, useInput } from 'ink';
import { useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import type { SettingsFieldDefinition } from '../../types/settings';
import { updatePreviewValueAtom, stopEditingAtom } from '@store/atoms/settings';

interface NumberFieldProps {
  field: SettingsFieldDefinition;
  value: number;
  isEditing: boolean;
}

export function NumberField({ field, value, isEditing }: NumberFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const [inputValue, setInputValue] = useState(value.toString());

  // Handle keyboard input for number editing
  const handleKeyInput = useCallback((input: string, key: any) => {
    if (!isEditing) return;

    if (key.return) {
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(
          field.min ?? -Infinity,
          Math.min(field.max ?? Infinity, numValue)
        );
        updatePreviewValue({ key: field.key, value: clampedValue });
      }
      stopEditing();
    } else if (key.escape) {
      setInputValue(value.toString());
      stopEditing();
    } else if (key.backspace || key.delete) {
      setInputValue(prev => prev.slice(0, -1));
    } else if (key.upArrow) {
      const currentNum = parseInt(inputValue, 10) || 0;
      const newValue = Math.min(field.max ?? Infinity, currentNum + 1);
      setInputValue(newValue.toString());
    } else if (key.downArrow) {
      const currentNum = parseInt(inputValue, 10) || 0;
      const newValue = Math.max(field.min ?? -Infinity, currentNum - 1);
      setInputValue(newValue.toString());
    } else if (/^\d$/.test(input) || input === '-') {
      // Only allow digits and minus sign
      if (input === '-' && inputValue.includes('-')) return;
      setInputValue(prev => prev + input);
    }
  }, [isEditing, inputValue, value, field.key, field.min, field.max, updatePreviewValue, stopEditing]);

  useInput(handleKeyInput, { isActive: isEditing });

  // Validate current input
  const isValidInput = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num)) return false;
    if (field.min !== undefined && num < field.min) return false;
    if (field.max !== undefined && num > field.max) return false;
    return true;
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">Value: </Text>
        {isEditing ? (
          <Box marginLeft={1}>
            <Text 
              color={isValidInput() ? 'white' : 'red'}
              backgroundColor="black"
            >
              {inputValue}|
            </Text>
            <Box marginLeft={2}>
              <Text color="gray">
                (↑/↓ adjust, Enter save, Esc cancel)
              </Text>
            </Box>
          </Box>
        ) : (
          <Box marginLeft={1}>
            <Text color="cyan">
              {value}
            </Text>
          </Box>
        )}
      </Box>
      
      {/* Range info */}
      {(field.min !== undefined || field.max !== undefined) && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Range: {field.min ?? '∞'} - {field.max ?? '∞'}
          </Text>
        </Box>
      )}
      
      {/* Validation error */}
      {isEditing && !isValidInput() && (
        <Box marginTop={1}>
          <Text color="red">
            ⚠️  Invalid value
          </Text>
        </Box>
      )}
    </Box>
  );
}