/**
 * Vitest setup file
 * Configure testing environment for React components and DOM testing
 */

import "@testing-library/jest-dom";

// Mock Node.js modules
vi.mock("node:tty", () => ({
  ReadStream: vi.fn(),
  WriteStream: vi.fn(),
  isatty: vi.fn(() => true),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => "{}"),
    writeFileSync: vi.fn(),
  };
});

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue("{}"),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    unlink: vi.fn().mockResolvedValue(undefined),
    rmdir: vi.fn().mockResolvedValue(undefined),
  };
});

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
