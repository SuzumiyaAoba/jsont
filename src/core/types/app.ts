/**
 * Application-specific type definitions
 */

import type { JsonValue } from "@core/types/index";

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
