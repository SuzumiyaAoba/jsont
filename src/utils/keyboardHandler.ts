/**
 * Custom keyboard handler for pipe mode navigation
 * This bypasses Ink's useInput hook when it doesn't work properly
 */

import { EventEmitter } from "node:events";

export interface KeyEvent {
  sequence: string;
  name?: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export class KeyboardHandler extends EventEmitter {
  private isActive = false;

  /**
   * Start listening for keyboard input using raw stdin
   */
  start(): boolean {
    if (this.isActive) {
      return true;
    }

    try {
      // Try to set up raw keyboard input

      // Enable raw mode if possible
      if (process.stdin.setRawMode) {
        try {
          process.stdin.setRawMode(true);
        } catch (error) {
          // Silently handle raw mode errors
        }
      }

      // Set up data listener for keyboard input
      process.stdin.on("data", this.handleKeyData);

      this.isActive = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop listening for keyboard input
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    try {
      // Remove our data listener
      process.stdin.off("data", this.handleKeyData);

      // Restore raw mode if possible
      if (process.stdin.setRawMode) {
        try {
          process.stdin.setRawMode(false);
        } catch (error) {
          // Silently handle raw mode errors
        }
      }

      this.isActive = false;
    } catch (error) {
      // Silently handle stop errors
    }
  }

  /**
   * Handle raw keyboard data from stdin
   */
  private handleKeyData = (data: Buffer): void => {
    const input = data.toString();

    // Parse the input into a key event
    const keyEvent = this.parseKeyInput(input);

    // Emit the key event
    this.emit("key", keyEvent);
  };

  /**
   * Parse raw input into a structured key event
   */
  private parseKeyInput(input: string): KeyEvent {
    const keyEvent: KeyEvent = {
      sequence: input,
      ctrl: false,
      meta: false,
      shift: false,
    };

    // Handle control characters
    if (input.length === 1) {
      const charCode = input.charCodeAt(0);

      // Control characters (Ctrl+A = 1, Ctrl+B = 2, etc.)
      if (charCode >= 1 && charCode <= 26) {
        keyEvent.ctrl = true;
        keyEvent.name = String.fromCharCode(charCode + 96); // Convert to letter
      } else {
        keyEvent.name = input;
      }
    } else if (input.startsWith("\x1b")) {
      // Escape sequences
      keyEvent.meta = true;
      keyEvent.name = "escape";
    } else {
      keyEvent.name = input;
    }

    return keyEvent;
  }

  /**
   * Check if the handler is currently active
   */
  isListening(): boolean {
    return this.isActive;
  }
}

// Singleton instance
export const keyboardHandler = new KeyboardHandler();
