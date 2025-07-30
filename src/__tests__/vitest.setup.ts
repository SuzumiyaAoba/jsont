/**
 * Vitest setup file
 * Configure testing environment for React components and DOM testing
 */

import "@testing-library/jest-dom";

// Mock process.exit to prevent test failures when app tries to exit
const mockExit = vi.fn();
Object.defineProperty(process, "exit", {
  value: mockExit,
  writable: true,
});

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Restore console for specific tests that need it
beforeEach(() => {
  vi.clearAllMocks();
});