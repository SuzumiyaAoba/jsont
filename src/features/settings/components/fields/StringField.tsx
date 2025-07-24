/**
 * String Settings Field Component
 */

import { stopEditingAtom, updatePreviewValueAtom } from "@store/atoms/settings";
import { Box, Text, useInput } from "ink";
import { useSetAtom } from "jotai";
import { useCallback, useState, memo } from "react";
import type { SettingsFieldDefinition } from "../../types/settings";

interface StringFieldProps {
  field: SettingsFieldDefinition;
  value: string;
  isEditing: boolean;
}

function StringFieldComponent({ field, value, isEditing }: StringFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const [inputValue, setInputValue] = useState(value);
  const [cursorPosition, setCursorPosition] = useState(value.length);

  // Handle keyboard input for string editing
  const handleKeyInput = useCallback(
    (input: string, key: any) => {
      if (!isEditing) return;

      if (key.return) {
        updatePreviewValue({ key: field.key, value: inputValue });
        stopEditing();
      } else if (key.escape) {
        setInputValue(value);
        setCursorPosition(value.length);
        stopEditing();
      } else if (key.backspace) {
        if (cursorPosition > 0) {
          const newValue =
            inputValue.slice(0, cursorPosition - 1) +
            inputValue.slice(cursorPosition);
          setInputValue(newValue);
          setCursorPosition(cursorPosition - 1);
        }
      } else if (key.delete) {
        if (cursorPosition < inputValue.length) {
          const newValue =
            inputValue.slice(0, cursorPosition) +
            inputValue.slice(cursorPosition + 1);
          setInputValue(newValue);
        }
      } else if (key.leftArrow) {
        setCursorPosition(Math.max(0, cursorPosition - 1));
      } else if (key.rightArrow) {
        setCursorPosition(Math.min(inputValue.length, cursorPosition + 1));
      } else if (key.ctrl && input === "a") {
        setCursorPosition(0);
      } else if (key.ctrl && input === "e") {
        setCursorPosition(inputValue.length);
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        // Insert character at cursor position
        const newValue =
          inputValue.slice(0, cursorPosition) +
          input +
          inputValue.slice(cursorPosition);
        setInputValue(newValue);
        setCursorPosition(cursorPosition + 1);
      }
    },
    [
      isEditing,
      inputValue,
      cursorPosition,
      value,
      field.key,
      updatePreviewValue,
      stopEditing,
    ],
  );

  useInput(handleKeyInput, { isActive: isEditing });

  // Render input with cursor
  const renderInputWithCursor = () => {
    if (!isEditing) {
      return <Text color="cyan">"{value}"</Text>;
    }

    const beforeCursor = inputValue.slice(0, cursorPosition);
    const atCursor = inputValue[cursorPosition] || " ";
    const afterCursor = inputValue.slice(cursorPosition + 1);

    return (
      <Box flexDirection="row" alignItems="center">
        <Text color="black" backgroundColor="white">
          "{beforeCursor}
          <Text color="white" backgroundColor="black">
            {atCursor}
          </Text>
          {afterCursor}"
        </Text>
        <Text color="black" marginLeft={1}>(←/→)</Text>
      </Box>
    );
  };

  return (
    <Box>
      {renderInputWithCursor()}
    </Box>
  );
}

export const StringField = memo(StringFieldComponent);
