/**
 * Boolean Settings Field Component
 */

import type { KeyboardInput } from "@core/types/app";
import { stopEditingAtom, updatePreviewValueAtom } from "@store/atoms/settings";
import { Box, Text, useInput } from "ink";
import { useSetAtom } from "jotai";
import { memo, useCallback } from "react";
import type { SettingsFieldDefinition } from "../../types/settings";

interface BooleanFieldProps {
  field: SettingsFieldDefinition;
  value: boolean;
  isEditing: boolean;
}

function BooleanFieldComponent({ field, value, isEditing }: BooleanFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);

  // Handle keyboard input for boolean toggle
  const handleKeyInput = useCallback(
    (input: string, key: KeyboardInput) => {
      if (!isEditing) return;

      if (key.return) {
        stopEditing();
      } else if (
        input === " " ||
        input === "t" ||
        input === "f" ||
        key.leftArrow ||
        key.rightArrow
      ) {
        const newValue = !value;
        updatePreviewValue({ key: field.key, value: newValue });
      }
    },
    [isEditing, value, field.key, updatePreviewValue, stopEditing],
  );

  useInput(handleKeyInput, { isActive: isEditing });

  return (
    <Box flexDirection="row" alignItems="center">
      {isEditing ? (
        <Box flexDirection="row" alignItems="center">
          <Text color={value ? "green" : "red"} bold>
            [{value ? "●" : "○"}] {value ? "true" : "false"}
          </Text>
          <Box marginLeft={1}>
            <Text color="black">(Space to toggle)</Text>
          </Box>
        </Box>
      ) : (
        <Text color={value ? "green" : "red"}>
          {value ? "✓ true" : "✗ false"}
        </Text>
      )}
    </Box>
  );
}

export const BooleanField = memo(BooleanFieldComponent);
