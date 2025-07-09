/**
 * Terminal Control Utilities
 */

import { CONFIG } from "../config/constants";

export class TerminalManager {
  private isInitialized = false;

  /**
   * Initialize terminal for TUI mode
   */
  initialize(): void {
    if (!process.stdin.isTTY || this.isInitialized) {
      return;
    }

    // Clear screen and move cursor to top
    process.stdout.write(CONFIG.TERMINAL.CLEAR_SCREEN);
    // Hide cursor for cleaner display
    process.stdout.write(CONFIG.TERMINAL.HIDE_CURSOR);
    // Enable alternative screen buffer for full terminal usage
    process.stdout.write(CONFIG.TERMINAL.ENABLE_ALT_BUFFER);

    this.isInitialized = true;
  }

  /**
   * Restore terminal to original state
   */
  cleanup(): void {
    if (!process.stdin.isTTY || !this.isInitialized) {
      return;
    }

    // Restore terminal state
    process.stdout.write(CONFIG.TERMINAL.DISABLE_ALT_BUFFER);
    process.stdout.write(CONFIG.TERMINAL.SHOW_CURSOR);

    this.isInitialized = false;
  }

  /**
   * Check if we're in TTY mode
   */
  isTTY(): boolean {
    return process.stdin.isTTY ?? false;
  }
}
