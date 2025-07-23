/**
 * Unified Text Input Component and Utilities
 * Consolidated from utils/textInput.ts and features/common/components/TextInput.tsx
 */

import { Box, Text } from "ink";
import { useCallback, useEffect, useState } from "react";

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export interface TextInputState {
  text: string;
  cursorPosition: number;
}

export interface KeyboardEvent {
  input?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  backspace?: boolean;
  delete?: boolean;
  return?: boolean;
  escape?: boolean;
  tab?: boolean;
  left?: boolean;
  right?: boolean;
  home?: boolean;
  end?: boolean;
}

export interface TextInputActions {
  setText: (text: string) => void;
  setCursorPosition: (position: number) => void;
}

export type TextInputKeyHandler = (
  input: string,
  key: KeyboardEvent,
) => boolean; // Returns true if the key was handled

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

// ============================================================================
// Core Text Input Logic (Unified)
// ============================================================================

/**
 * Unified text input handler with comprehensive keyboard shortcuts
 * Combines all functionality from utils/textInput.ts and useTextInput hook
 */
export function handleTextInput(
  state: TextInputState,
  actions: TextInputActions,
  key: KeyboardEvent,
  input?: string,
): boolean {
  console.log("handleTextInput called with key:", key, "input:", input);
  const { text, cursorPosition } = state;
  const { setText, setCursorPosition } = actions;

  // Normalize key properties for consistency
  const normalizedKey = {
    ...key,
    leftArrow: key.leftArrow || key.left,
    rightArrow: key.rightArrow || key.right,
  };

  // ========================================
  // Cursor Movement
  // ========================================

  // Arrow key navigation
  if (normalizedKey.leftArrow && !normalizedKey.shift) {
    console.log("handleTextInput: left arrow handled");
    setCursorPosition(Math.max(0, cursorPosition - 1));
    return true;
  }

  if (normalizedKey.rightArrow && !normalizedKey.shift) {
    console.log("handleTextInput: right arrow handled");
    setCursorPosition(Math.min(text.length, cursorPosition + 1));
    return true;
  }

  // Emacs-style cursor movement and editing shortcuts
  if (normalizedKey.ctrl) {
    // Movement commands
    if (input === "f" || normalizedKey.rightArrow) {
      // Ctrl+F or Ctrl+Right: Move cursor right
      setCursorPosition(Math.min(text.length, cursorPosition + 1));
      return true;
    }

    if (input === "b" || normalizedKey.leftArrow) {
      // Ctrl+B or Ctrl+Left: Move cursor left
      setCursorPosition(Math.max(0, cursorPosition - 1));
      return true;
    }

    if (input === "a" || normalizedKey.home) {
      // Ctrl+A or Home: Move to beginning of line
      setCursorPosition(0);
      return true;
    }

    if (input === "e" || normalizedKey.end) {
      // Ctrl+E or End: Move to end of line
      setCursorPosition(text.length);
      return true;
    }

    // ========================================
    // Text Deletion Commands
    // ========================================

    if (input === "k") {
      // Ctrl+K: Delete from cursor to end of line (kill-line)
      const newText = text.slice(0, cursorPosition);
      setText(newText);
      return true;
    }

    if (input === "u") {
      // Ctrl+U: Delete from beginning to cursor (unix-line-discard)
      const newText = text.slice(cursorPosition);
      setText(newText);
      if (cursorPosition !== 0) {
        setCursorPosition(0);
      }
      return true;
    }

    if (input === "w") {
      // Ctrl+W: Delete word backward (backward-kill-word)
      const beforeCursor = text.substring(0, cursorPosition);
      const afterCursor = text.substring(cursorPosition);

      // Find the start of the current word by looking backward for whitespace
      let newCursorPosition = cursorPosition;

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

      const newText =
        beforeCursor.substring(0, newCursorPosition) + afterCursor;
      setText(newText);
      setCursorPosition(newCursorPosition);
      return true;
    }

    if (input === "d") {
      // Ctrl+D: Delete character at cursor (delete-char)
      if (cursorPosition < text.length) {
        const newText =
          text.substring(0, cursorPosition) +
          text.substring(cursorPosition + 1);
        setText(newText);
      }
      return true;
    }
  }

  // ========================================
  // Standard Delete/Backspace
  // ========================================

  const isMacOS = process.platform === "darwin";

  // Handle delete key with platform-specific behavior
  if (normalizedKey.delete) {
    if (isMacOS) {
      // On macOS: delete key deletes left (like backspace on other platforms)
      if (cursorPosition > 0) {
        const newText =
          text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
        setText(newText);
        setCursorPosition(cursorPosition - 1);
      }
    } else {
      // On other platforms: delete key deletes right
      if (cursorPosition < text.length) {
        const newText =
          text.substring(0, cursorPosition) +
          text.substring(cursorPosition + 1);
        setText(newText);
      }
    }
    return true;
  }

  // Backspace key (deletes left on all platforms)
  if (normalizedKey.backspace && cursorPosition > 0) {
    const newText =
      text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(cursorPosition - 1);
    return true;
  }

  // ========================================
  // Regular Character Input
  // ========================================

  if (
    input &&
    input.length === 1 &&
    !normalizedKey.ctrl &&
    !normalizedKey.meta &&
    !normalizedKey.tab
  ) {
    console.log("handleTextInput: regular character input handled:", input);
    const newText =
      text.slice(0, cursorPosition) + input + text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(cursorPosition + 1);
    return true;
  }

  console.log("handleTextInput returning false - event not handled");
  return false; // Event not handled
}

/**
 * Create cursor-aware text display for Ink rendering
 */
export function renderTextWithCursor(
  text: string,
  cursorPosition: number,
): {
  beforeCursor: string;
  atCursor: string;
  afterCursor: string;
} {
  return {
    beforeCursor: text.slice(0, cursorPosition),
    atCursor: text[cursorPosition] || " ",
    afterCursor: text.slice(cursorPosition + 1),
  };
}

// ============================================================================
// React Hook Implementation
// ============================================================================

/**
 * Unified text input hook with comprehensive keyboard handling
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
    text: initialValue,
    cursorPosition: initialValue.length,
  });

  const setValue = useCallback((text: string) => {
    setState((prev) => ({
      text,
      cursorPosition: Math.min(prev.cursorPosition, text.length),
    }));
  }, []);

  const setCursorPosition = useCallback((position: number) => {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.max(0, Math.min(position, prev.text.length)),
    }));
  }, []);

  const handleKeyInput = useCallback<TextInputKeyHandler>(
    (input, key) => {
      const actions: TextInputActions = {
        setText: (newText: string) => {
          setState((prev) => ({
            text: newText,
            cursorPosition: Math.min(prev.cursorPosition, newText.length),
          }));
        },
        setCursorPosition: (newPosition: number) => {
          setState((prev) => ({
            ...prev,
            cursorPosition: Math.max(
              0,
              Math.min(newPosition, prev.text.length),
            ),
          }));
        },
      };

      return handleTextInput(state, actions, key, input);
    },
    [state],
  );

  const getDisplayText = useCallback(
    (isActive: boolean, placeholder?: string) => {
      const text = state.text || (placeholder && !isActive ? placeholder : "");
      const cursorPos = isActive ? state.cursorPosition : text.length;

      const { beforeCursor, atCursor, afterCursor } = renderTextWithCursor(
        text,
        cursorPos,
      );

      return {
        beforeCursor,
        atCursor,
        afterCursor,
        displayText: text,
      };
    },
    [state.text, state.cursorPosition],
  );

  return {
    state,
    setValue,
    setCursorPosition,
    handleKeyInput,
    getDisplayText,
  };
}

// ============================================================================
// React Component Implementation
// ============================================================================

/**
 * Unified TextInput component with comprehensive keyboard shortcuts
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
  useEffect(() => {
    if (state.text !== value) {
      setValue(value);
    }
  }, [value, state.text, setValue]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange && state.text !== value) {
      onChange(state.text);
    }
  }, [state.text, value, onChange]);

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

// ============================================================================
// Type Compatibility Exports
// ============================================================================

// Export aliases for backward compatibility
export type { TextInputState as LegacyTextInputState };
export type { KeyboardEvent as LegacyKeyboardEvent };
export type { TextInputActions as LegacyTextInputActions };

/**
 * Backward compatibility wrapper for the old TextInputState interface
 * @deprecated Use TextInputState instead
 */
export interface LegacyTextInputStateCompat {
  value: string;
  cursorPosition: number;
}

/**
 * Convert between legacy and new state formats
 */
export function convertLegacyState(
  legacy: LegacyTextInputStateCompat,
): TextInputState {
  return {
    text: legacy.value,
    cursorPosition: legacy.cursorPosition,
  };
}

export function convertToLegacyState(
  state: TextInputState,
): LegacyTextInputStateCompat {
  return {
    value: state.text,
    cursorPosition: state.cursorPosition,
  };
}
