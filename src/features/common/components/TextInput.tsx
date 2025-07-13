/**
 * Text input component with cursor movement and basic editing functionality
 */

import { Box, Text } from "ink";
import { useCallback, useState } from "react";

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isActive?: boolean;
  color?: string;
  backgroundColor?: string;
  prefix?: string;
  width?: number;
}

export interface TextInputState {
  value: string;
  cursorPosition: number;
}

export type TextInputKeyHandler = (
  input: string,
  key: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    return?: boolean;
    escape?: boolean;
    backspace?: boolean;
    delete?: boolean;
    left?: boolean;
    right?: boolean;
    home?: boolean;
    end?: boolean;
  },
) => boolean; // Returns true if the key was handled

/**
 * Custom hook for text input state management with cursor movement
 */
export function useTextInput(initialValue: string = ""): {
  state: TextInputState;
  setValue: (value: string) => void;
  setCursorPosition: (position: number) => void;
  handleKeyInput: TextInputKeyHandler;
  getDisplayText: (
    isActive: boolean,
    placeholder?: string,
  ) => {
    beforeCursor: string;
    atCursor: string;
    afterCursor: string;
    displayText: string;
  };
} {
  const [state, setState] = useState<TextInputState>({
    value: initialValue,
    cursorPosition: initialValue.length,
  });

  const setValue = useCallback((value: string) => {
    setState((prev) => ({
      value,
      cursorPosition: Math.min(prev.cursorPosition, value.length),
    }));
  }, []);

  const setCursorPosition = useCallback((position: number) => {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.max(0, Math.min(position, prev.value.length)),
    }));
  }, []);

  const handleKeyInput = useCallback<TextInputKeyHandler>(
    (input, key) => {
      if (key.ctrl) {
        // Ctrl key combinations for cursor movement
        if (input === "a" || key.home) {
          // Ctrl+A or Home: Move cursor to beginning
          setCursorPosition(0);
          return true;
        }
        if (input === "e" || key.end) {
          // Ctrl+E or End: Move cursor to end
          setState((prev) => ({ ...prev, cursorPosition: prev.value.length }));
          return true;
        }
        if (input === "f" || key.right) {
          // Ctrl+F or Right arrow: Move cursor forward
          setState((prev) => ({
            ...prev,
            cursorPosition: Math.min(
              prev.cursorPosition + 1,
              prev.value.length,
            ),
          }));
          return true;
        }
        if (input === "b" || key.left) {
          // Ctrl+B or Left arrow: Move cursor backward
          setState((prev) => ({
            ...prev,
            cursorPosition: Math.max(prev.cursorPosition - 1, 0),
          }));
          return true;
        }
        if (input === "k") {
          // Ctrl+K: Delete from cursor to end of line
          setState((prev) => ({
            value: prev.value.substring(0, prev.cursorPosition),
            cursorPosition: prev.cursorPosition,
          }));
          return true;
        }
        if (input === "u") {
          // Ctrl+U: Delete from beginning to cursor
          setState((prev) => ({
            value: prev.value.substring(prev.cursorPosition),
            cursorPosition: 0,
          }));
          return true;
        }
        if (input === "w") {
          // Ctrl+W: Delete word backward (more Emacs-like behavior)
          setState((prev) => {
            const beforeCursor = prev.value.substring(0, prev.cursorPosition);
            const afterCursor = prev.value.substring(prev.cursorPosition);

            // Find the start of the current word by looking backward for whitespace
            let newCursorPosition = prev.cursorPosition;

            // Skip trailing whitespace first
            while (
              newCursorPosition > 0 &&
              /\s/.test(beforeCursor[newCursorPosition - 1] || "")
            ) {
              newCursorPosition--;
            }

            // Then skip the word characters
            while (
              newCursorPosition > 0 &&
              !/\s/.test(beforeCursor[newCursorPosition - 1] || "")
            ) {
              newCursorPosition--;
            }

            const newBeforeCursor = beforeCursor.substring(
              0,
              newCursorPosition,
            );

            return {
              value: newBeforeCursor + afterCursor,
              cursorPosition: newCursorPosition,
            };
          });
          return true;
        }
        if (input === "d") {
          // Ctrl+D: Delete character at cursor (forward delete)
          if (state.cursorPosition < state.value.length) {
            setState((prev) => ({
              value:
                prev.value.substring(0, prev.cursorPosition) +
                prev.value.substring(prev.cursorPosition + 1),
              cursorPosition: prev.cursorPosition,
            }));
          }
          return true;
        }
      }

      // Regular character input
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setState((prev) => ({
          value:
            prev.value.substring(0, prev.cursorPosition) +
            input +
            prev.value.substring(prev.cursorPosition),
          cursorPosition: prev.cursorPosition + 1,
        }));
        return true;
      }

      // Handle delete/backspace keys - macOS has different behavior
      const isMacOS = process.platform === "darwin";

      // Delete key behavior
      if (key.delete) {
        if (isMacOS) {
          // On macOS: delete key deletes left (like backspace on other platforms)
          if (state.cursorPosition > 0) {
            setState((prev) => ({
              value:
                prev.value.substring(0, prev.cursorPosition - 1) +
                prev.value.substring(prev.cursorPosition),
              cursorPosition: prev.cursorPosition - 1,
            }));
          }
        } else {
          // On other platforms: delete key deletes right
          if (state.cursorPosition < state.value.length) {
            setState((prev) => ({
              value:
                prev.value.substring(0, prev.cursorPosition) +
                prev.value.substring(prev.cursorPosition + 1),
              cursorPosition: prev.cursorPosition,
            }));
          }
        }
        return true;
      }

      // Backspace key behavior (deletes left on all platforms)
      if (key.backspace && state.cursorPosition > 0) {
        setState((prev) => ({
          value:
            prev.value.substring(0, prev.cursorPosition - 1) +
            prev.value.substring(prev.cursorPosition),
          cursorPosition: prev.cursorPosition - 1,
        }));
        return true;
      }

      return false;
    },
    [state.cursorPosition, state.value, setCursorPosition],
  );

  const getDisplayText = useCallback(
    (isActive: boolean, placeholder?: string) => {
      const text = state.value || (placeholder && !isActive ? placeholder : "");
      const cursorPos = isActive ? state.cursorPosition : text.length;

      const beforeCursor = text.substring(0, cursorPos);
      const atCursor = cursorPos < text.length ? text.charAt(cursorPos) : " ";
      const afterCursor = text.substring(
        cursorPos + (cursorPos < text.length ? 1 : 0),
      );

      return {
        beforeCursor,
        atCursor,
        afterCursor,
        displayText: text,
      };
    },
    [state.value, state.cursorPosition],
  );

  return {
    state,
    setValue,
    setCursorPosition,
    handleKeyInput,
    getDisplayText,
  };
}

/**
 * TextInput component with cursor movement support
 */
export function TextInput({
  value,
  onChange,
  placeholder,
  isActive = false,
  color = "white",
  backgroundColor,
  prefix,
  width,
}: TextInputProps) {
  const { state, setValue, getDisplayText } = useTextInput(value);

  // Sync external value changes
  if (state.value !== value) {
    setValue(value);
  }

  // Notify parent of changes
  if (state.value !== value && onChange) {
    onChange(state.value);
  }

  const { beforeCursor, atCursor, afterCursor } = getDisplayText(
    isActive,
    placeholder,
  );

  const displayColor = value || isActive ? color : "gray";
  const cursorProps = isActive ? { backgroundColor: "blue" } : {};

  return (
    <Box width={width}>
      {prefix && <Text color="cyan">{prefix}</Text>}
      <Text
        color={displayColor}
        {...(backgroundColor && !isActive ? { backgroundColor } : {})}
      >
        {beforeCursor}
      </Text>
      {isActive && (
        <Text color={color} {...cursorProps}>
          {atCursor}
        </Text>
      )}
      <Text
        color={displayColor}
        {...(backgroundColor && !isActive ? { backgroundColor } : {})}
      >
        {afterCursor}
      </Text>
    </Box>
  );
}
