/**
 * Application-specific type definitions
 */

import type { JsonValue, ViewMode } from "@core/types/index";

/**
 * Application modes for the JSON viewer
 */
export type AppMode =
  | "tree"
  | "search"
  | "filter"
  | "collapsible"
  | "schema"
  | "raw";

/**
 * Keyboard input event from Ink useInput hook
 */
export interface KeyboardInput {
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  pageDown?: boolean;
  pageUp?: boolean;
  return?: boolean;
  escape?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  tab?: boolean;
  backspace?: boolean;
  delete?: boolean;
  meta?: boolean;
}

/**
 * Props for the main App component
 */
export interface AppProps {
  initialData?: JsonValue | null;
  initialError?: string | null;
  keyboardEnabled?: boolean;
  initialViewMode?: ViewMode | undefined;
}

/**
 * CLI arguments parsing result
 */
export interface CliArgs {
  filePath?: string | undefined;
  viewMode?: ViewMode | undefined;
  help?: boolean;
  version?: boolean;
}

/**
 * Configuration options for JSON processing
 */
export interface JsonProcessingOptions {
  timeout?: number;
  maxSize?: number;
  extractFromText?: boolean;
}

/**
 * Result of JSON processing operation
 */
export interface JsonProcessingResult {
  data: JsonValue | null;
  error: string | null;
}

/**
 * Terminal management interface
 */
export interface TerminalState {
  isInitialized: boolean;
  isTTY: boolean;
}

/**
 * Process management state
 */
export interface ProcessState {
  keepAliveTimer: NodeJS.Timeout | null;
  signalHandlersAttached: boolean;
}

/**
 * Keyboard input handler function type
 */
export type KeyboardHandler = (input: string, key: KeyboardInput) => boolean;

/**
 * Safe keyboard handler that validates input before processing
 */
export type SafeKeyboardHandler = (
  input: string,
  key: KeyboardInput,
) => boolean;

/**
 * Keyboard handler registration callback
 */
export type KeyboardHandlerRegistration = (
  handler: KeyboardHandler | null,
) => void;
