/**
 * Text Input Utilities
 * Common text editing operations for input fields
 */

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
}

export interface TextInputActions {
  setText: (text: string) => void;
  setCursorPosition: (position: number) => void;
}

/**
 * Handle keyboard input for text editing
 */
export function handleTextInput(
  state: TextInputState,
  actions: TextInputActions,
  key: KeyboardEvent,
  input?: string,
): boolean {
  const { text, cursorPosition } = state;
  const { setText, setCursorPosition } = actions;

  // Cursor movement
  if (key.leftArrow && !key.shift) {
    setCursorPosition(Math.max(0, cursorPosition - 1));
    return true;
  }

  if (key.rightArrow && !key.shift) {
    setCursorPosition(Math.min(text.length, cursorPosition + 1));
    return true;
  }

  // Emacs-style cursor movement
  if (key.ctrl && input === "f") {
    // Ctrl-f: Move cursor right
    setCursorPosition(Math.min(text.length, cursorPosition + 1));
    return true;
  }

  if (key.ctrl && input === "b") {
    // Ctrl-b: Move cursor left
    setCursorPosition(Math.max(0, cursorPosition - 1));
    return true;
  }

  if (key.ctrl && input === "a") {
    // Ctrl-a: Move to beginning of line
    setCursorPosition(0);
    return true;
  }

  if (key.ctrl && input === "e") {
    // Ctrl-e: Move to end of line
    setCursorPosition(text.length);
    return true;
  }

  // Text deletion
  if (key.ctrl && input === "k") {
    // Ctrl-k: Delete from cursor to end of line
    const newText = text.slice(0, cursorPosition);
    setText(newText);
    // Cursor position stays the same (now at end of remaining text)
    return true;
  }

  if (key.ctrl && input === "u") {
    // Ctrl-u: Delete from beginning to cursor
    const newText = text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(0);
    return true;
  }

  // Text editing (macOS style)
  if (key.backspace || key.delete) {
    // On macOS, both backspace and delete remove character before cursor
    if (cursorPosition > 0) {
      const newText =
        text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
      setText(newText);
      setCursorPosition(cursorPosition - 1);
    }
    return true;
  }

  // Regular character input
  if (input && !key.ctrl && !key.meta && !key.tab && input.length === 1) {
    const newText =
      text.slice(0, cursorPosition) + input + text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(cursorPosition + 1);
    return true;
  }

  return false; // Event not handled
}

/**
 * Create cursor-aware text display for Ink
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
