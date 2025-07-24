/**
 * Array Settings Field Component
 */

import { stopEditingAtom, updatePreviewValueAtom } from "@store/atoms/settings";
import { Box, Text, useInput } from "ink";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import type { SettingsFieldDefinition } from "../../types/settings";

interface ArrayFieldProps {
  field: SettingsFieldDefinition;
  value: string[];
  isEditing: boolean;
}

export function ArrayField({ field, value, isEditing }: ArrayFieldProps) {
  const updatePreviewValue = useSetAtom(updatePreviewValueAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [inputValue, setInputValue] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Handle keyboard input for array editing
  const handleKeyInput = useCallback(
    (input: string, key: any) => {
      if (!isEditing) return;

      // If editing an item
      if (editingIndex >= 0) {
        if (key.return) {
          // Save the edited item
          const newArray = [...value];
          if (editingIndex < newArray.length) {
            newArray[editingIndex] = inputValue;
          } else {
            newArray.push(inputValue);
          }
          updatePreviewValue({ key: field.key, value: newArray });
          setEditingIndex(-1);
          setInputValue("");
          setCursorPosition(0);
        } else if (key.escape) {
          // Cancel editing
          setEditingIndex(-1);
          setInputValue("");
          setCursorPosition(0);
        } else if (key.backspace) {
          if (cursorPosition > 0) {
            const newValue =
              inputValue.slice(0, cursorPosition - 1) +
              inputValue.slice(cursorPosition);
            setInputValue(newValue);
            setCursorPosition(cursorPosition - 1);
          }
        } else if (key.leftArrow) {
          setCursorPosition(Math.max(0, cursorPosition - 1));
        } else if (key.rightArrow) {
          setCursorPosition(Math.min(inputValue.length, cursorPosition + 1));
        } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
          const newValue =
            inputValue.slice(0, cursorPosition) +
            input +
            inputValue.slice(cursorPosition);
          setInputValue(newValue);
          setCursorPosition(cursorPosition + 1);
        }
        return;
      }

      // Array navigation and management
      if (key.return) {
        stopEditing();
      } else if (input === "a") {
        // Add new item
        setEditingIndex(value.length);
        setInputValue("");
        setCursorPosition(0);
      } else if (input === "e" && value.length > 0) {
        // Edit first item
        setEditingIndex(0);
        setInputValue(value[0] || "");
        setCursorPosition(value[0]?.length || 0);
      } else if (input === "d" && value.length > 0) {
        // Delete first item
        const newArray = value.slice(1);
        updatePreviewValue({ key: field.key, value: newArray });
      } else if (/^\d$/.test(input)) {
        // Edit item by index
        const index = parseInt(input, 10);
        if (index < value.length) {
          setEditingIndex(index);
          setInputValue(value[index] || "");
          setCursorPosition(value[index]?.length || 0);
        }
      }
    },
    [
      isEditing,
      editingIndex,
      inputValue,
      cursorPosition,
      value,
      field.key,
      updatePreviewValue,
      stopEditing,
    ],
  );

  useInput(handleKeyInput, { isActive: isEditing });

  // Render item being edited
  const renderEditingItem = () => {
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const atCursor = inputValue[cursorPosition] || " ";
    const afterCursor = inputValue.slice(cursorPosition + 1);

    return (
      <Box marginLeft={2} marginTop={1}>
        <Text color="black" bold>Editing item {editingIndex}:</Text>
        <Box marginLeft={1}>
          <Text color="black" backgroundColor="white">
            "{beforeCursor}
            <Text color="white" backgroundColor="black">
              {atCursor}
            </Text>
            {afterCursor}"
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {!isEditing ? (
        // Compact display when not editing
        <Box flexDirection="row" alignItems="center">
          <Text color="cyan">
            [{value.length} items] {value.length > 0 ? value.join(", ") : "(empty)"}
          </Text>
        </Box>
      ) : (
        // Detailed view when editing
        <Box flexDirection="column">
          <Box>
            <Text color="black">Values ({value.length} items):</Text>
          </Box>

          {/* Array items */}
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {value.map((item, index) => (
              <Box key={index}>
                <Text color="black">[{index}]</Text>
                <Box marginLeft={1}>
                  <Text color="cyan">"{item}"</Text>
                </Box>
              </Box>
            ))}

            {value.length === 0 && (
              <Text color="black" italic>
                (empty array)
              </Text>
            )}
          </Box>

          {/* Editing interface */}
          {editingIndex >= 0 && renderEditingItem()}

          {/* Help text */}
          {editingIndex < 0 && (
            <Box marginTop={1}>
              <Text color="black">
                Commands: <Text color="black" bold>a</Text> add •{" "}
                <Text color="black" bold>e</Text> edit first •{" "}
                <Text color="black" bold>d</Text> delete first •{" "}
                <Text color="black" bold>0-9</Text> edit by index
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
