/**
 * Utilities for generating status bar content
 */

interface StatusContentOptions {
  keyboardEnabled: boolean;
  collapsibleMode: boolean;
  error?: string | null;
}

const STATUS_MESSAGES = {
  COLLAPSIBLE: `JSON TUI Viewer (Collapsible) - q: Quit | Ctrl+C: Exit | j/k: Move cursor | Enter: Toggle expand/collapse | s: Search | C: Toggle collapsible mode | D: Debug | L: Line numbers | S: Schema | E: Export schema | ?: Toggle help`,
  NORMAL: `JSON TUI Viewer - q: Quit/Search input | Ctrl+C: Exit | j/k: Line | Ctrl+f/b: Half-page | gg/G: Top/Bottom | s: Search | Esc: Exit search | D: Toggle debug | L: Toggle line numbers | S: Toggle schema | C: Toggle collapsible | E: Export schema | ?: Toggle help`,
  NO_KEYBOARD: `JSON TUI Viewer - Keyboard input not available (try: jsont < file.json in terminal) | ?: Toggle help`,
} as const;

/**
 * Generate status content based on application state
 */
export function getStatusContent(options: StatusContentOptions): string {
  const { keyboardEnabled, collapsibleMode, error } = options;

  if (error) {
    return `Error: ${error}`;
  }

  if (keyboardEnabled) {
    return collapsibleMode
      ? STATUS_MESSAGES.COLLAPSIBLE
      : STATUS_MESSAGES.NORMAL;
  } else {
    return STATUS_MESSAGES.NO_KEYBOARD;
  }
}

const UI_CONSTANTS = {
  BORDER_AND_PADDING_WIDTH: 4,
  MIN_AVAILABLE_WIDTH: 20,
  BORDER_AND_PADDING_HEIGHT: 3,
  MIN_STATUS_HEIGHT: 5,
} as const;

/**
 * Calculate dynamic height for status content based on terminal width
 */
export function calculateStatusBarHeight(
  content: string,
  terminalWidth: number,
): number {
  // StatusBar uses borderStyle="single" (2 lines) + padding={1} (2 lines) = 4 lines overhead
  // Available width = terminalWidth - 2 (left/right borders) - 2 (left/right padding) = terminalWidth - 4
  const availableWidth = Math.max(
    terminalWidth - UI_CONSTANTS.BORDER_AND_PADDING_WIDTH,
    UI_CONSTANTS.MIN_AVAILABLE_WIDTH,
  );
  const contentLines = Math.ceil(content.length / availableWidth);

  // Total height = top border + top padding + content lines + bottom padding + bottom border
  // Optimized calculation: contentLines + 3 (Ink typically optimizes border+padding to 3 total overhead)
  const calculatedHeight =
    contentLines + UI_CONSTANTS.BORDER_AND_PADDING_HEIGHT;

  // For typical 80-char terminal, messages are ~300 chars, so need ~4-5 content lines + overhead = 7-8 total
  // Use balanced calculation: just enough height without waste
  return Math.max(UI_CONSTANTS.MIN_STATUS_HEIGHT, calculatedHeight);
}
