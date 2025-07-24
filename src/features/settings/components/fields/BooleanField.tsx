/**
 * Boolean Settings Field Component
 */

import { Box, Text, useInput } from 'ink';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import type { SettingsFieldDefinition } from '../../types/settings';
import { updatePreviewValueAtom, stopEditingAtom } from '@store/atoms/settings';

interface BooleanFieldProps {
  field: SettingsFieldDefinition;
  value: boolean;
  isEditing: boolean;
}

export function BooleanField({ field, value, isEditing }: BooleanFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);

  // Handle keyboard input for boolean toggle
  const handleKeyInput = useCallback((input: string, key: any) => {
    if (!isEditing) return;

    if (key.return) {
      stopEditing();
    } else if (input === ' ' || input === 't' || input === 'f' || key.leftArrow || key.rightArrow) {
      const newValue = !value;
      updatePreviewValue({ key: field.key, value: newValue });
    }
  }, [isEditing, value, field.key, updatePreviewValue, stopEditing]);

  useInput(handleKeyInput, { isActive: isEditing });

  return (
    <Box>
      <Text color="gray">Value: </Text>
      <Box marginLeft={1}>
        {isEditing ? (
          <Box>
            <Text 
              color={value ? 'green' : 'red'}
              bold
            >
              [{value ? '●' : '○'}] {value ? 'true' : 'false'}
            </Text>
            <Box marginLeft={2}>
              <Text color="gray">
                (Space/←/→ to toggle)
              </Text>
            </Box>
          </Box>
        ) : (
          <Text color={value ? 'green' : 'red'}>
            {value ? '✓ true' : '✗ false'}
          </Text>
        )}
      </Box>
    </Box>
  );
}