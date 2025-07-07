/**
 * Application Configuration Constants
 */

export const CONFIG = {
  // Input processing
  INPUT_TIMEOUT: 10000, // 10 seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

  // Process management
  KEEP_ALIVE_INTERVAL: 1000, // 1 second

  // Terminal control sequences
  TERMINAL: {
    CLEAR_SCREEN: "\x1b[2J\x1b[H",
    HIDE_CURSOR: "\x1b[?25l",
    SHOW_CURSOR: "\x1b[?25h",
    ENABLE_ALT_BUFFER: "\x1b[?1049h",
    DISABLE_ALT_BUFFER: "\x1b[?1049l",
  },

  // Exit codes
  EXIT_CODES: {
    SUCCESS: 0,
    ERROR: 1,
  },
} as const;

export const MESSAGES = {
  NO_INPUT: "No JSON input provided.",
  USAGE: "Usage: jsont [file.json] or echo '{...}' | jsont",
  UNKNOWN_ERROR: "Unknown error occurred",
  FATAL_ERROR: "Fatal error:",
} as const;

export const DEBUG_PREFIX = "DEBUG:" as const;
