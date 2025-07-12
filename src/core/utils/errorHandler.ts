/**
 * Centralized Error Handling
 */

import { CONFIG, MESSAGES } from "@core/config/constants";

/**
 * Handle fatal errors that should terminate the process
 */
export function handleFatalError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;
  console.error(MESSAGES.FATAL_ERROR, message);

  // In test environment, throw error instead of calling process.exit
  if (process.env["NODE_ENV"] === "test" || process.env["VITEST"]) {
    throw new Error(`Fatal error: ${message}`);
  }

  process.exit(CONFIG.EXIT_CODES.ERROR);
}

/**
 * Handle input errors in interactive mode
 */
export function handleInputError(error: unknown, filePath?: string): void {
  const message =
    error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;

  // Only exit with error if we have a terminal (interactive mode)
  if (process.stdin.isTTY && !filePath) {
    console.error("Error:", message);

    // In test environment, don't call process.exit
    if (process.env["NODE_ENV"] === "test" || process.env["VITEST"]) {
      return;
    }

    process.exit(CONFIG.EXIT_CODES.ERROR);
  }
}

/**
 * Handle no input scenario
 */
export function handleNoInput(filePath?: string): void {
  // Only exit with error if we have a terminal (interactive mode)
  if (process.stdin.isTTY && !filePath) {
    console.error(MESSAGES.NO_INPUT);
    console.error(MESSAGES.USAGE);

    // In test environment, don't call process.exit
    if (process.env["NODE_ENV"] === "test" || process.env["VITEST"]) {
      return;
    }

    process.exit(CONFIG.EXIT_CODES.ERROR);
  }
}

/**
 * Convert unknown error to string message
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : MESSAGES.UNKNOWN_ERROR;
}
