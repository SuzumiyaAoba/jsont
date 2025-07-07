/**
 * Centralized Error Handling
 */

import { CONFIG, MESSAGES } from "../config/constants.js";

export class ErrorHandler {
  /**
   * Handle fatal errors that should terminate the process
   */
  static handleFatalError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;
    console.error(MESSAGES.FATAL_ERROR, message);
    process.exit(CONFIG.EXIT_CODES.ERROR);
  }

  /**
   * Handle input errors in interactive mode
   */
  static handleInputError(error: unknown, filePath?: string): void {
    const message =
      error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;

    // Only exit with error if we have a terminal (interactive mode)
    if (process.stdin.isTTY && !filePath) {
      console.error("Error:", message);
      process.exit(CONFIG.EXIT_CODES.ERROR);
    }
  }

  /**
   * Handle no input scenario
   */
  static handleNoInput(filePath?: string): void {
    // Only exit with error if we have a terminal (interactive mode)
    if (process.stdin.isTTY && !filePath) {
      console.error(MESSAGES.NO_INPUT);
      console.error(MESSAGES.USAGE);
      process.exit(CONFIG.EXIT_CODES.ERROR);
    }
  }

  /**
   * Convert unknown error to string message
   */
  static getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;
  }
}
