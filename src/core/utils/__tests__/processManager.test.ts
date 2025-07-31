/**
 * Tests for process management utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProcessManager } from "../processManager";
import type { TerminalManager } from "../terminal";

// Mock TerminalManager
const mockTerminalManager: TerminalManager = {
  initialize: vi.fn(),
  cleanup: vi.fn(),
  isInitialized: vi.fn().mockReturnValue(true),
  isTTY: vi.fn().mockReturnValue(true),
};

describe("ProcessManager", () => {
  let processManager: ProcessManager;
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdin: typeof process.stdin;
  // originalProcess removed as unused

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Store original values
    originalEnv = { ...process.env };
    originalStdin = process.stdin;
    // originalProcess assignment removed

    // Clean environment variables
    const ciEnvVars = [
      "CI",
      "GITHUB_ACTIONS",
      "JENKINS_URL",
      "TRAVIS",
      "CIRCLECI",
      "GITLAB_CI",
      "BUILDKITE",
      "DRONE",
      "CONTINUOUS_INTEGRATION",
    ];

    ciEnvVars.forEach((env) => {
      delete process.env[env];
    });

    // Mock process.stdin
    const mockStdin = {
      on: vi.fn(),
      setMaxListeners: vi.fn(),
      isTTY: true,
    };
    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      configurable: true,
    });

    // Create process manager
    processManager = new ProcessManager(mockTerminalManager);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      configurable: true,
    });

    // Cleanup any timers
    processManager.cleanup();
  });

  describe("constructor", () => {
    it("should initialize with terminal manager", () => {
      expect(processManager).toBeInstanceOf(ProcessManager);
    });
  });

  describe("setup", () => {
    it("should setup keep-alive, signal handlers, and stdin handlers", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");
      const processOnSpy = vi.spyOn(process, "on");

      processManager.setup();

      // Should setup keep-alive timer (in non-CI environment)
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number),
      );

      // Should setup signal handlers
      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith(
        "SIGTERM",
        expect.any(Function),
      );

      // Should setup stdin handlers
      expect(process.stdin.on).toHaveBeenCalledWith(
        "end",
        expect.any(Function),
      );
      expect(process.stdin.on).toHaveBeenCalledWith(
        "close",
        expect.any(Function),
      );

      // Should set max listeners
      expect(process.stdin.setMaxListeners).toHaveBeenCalledWith(0);

      setIntervalSpy.mockRestore();
      processOnSpy.mockRestore();
    });

    it("should not setup keep-alive in CI environment", () => {
      process.env["CI"] = "true";
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      processManager.setup();

      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it("should setup different stdin handlers in CI environment", () => {
      process.env["GITHUB_ACTIONS"] = "true";
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      processManager.setup();

      // Simulate stdin end in CI
      const stdinOnCalls = process.stdin.on.mock.calls;
      const endHandler = stdinOnCalls.find(
        (call: unknown[]) => call[0] === "end",
      )?.[1];
      const closeHandler = stdinOnCalls.find(
        (call: unknown[]) => call[0] === "close",
      )?.[1];

      if (typeof endHandler === "function") endHandler();
      expect(mockTerminalManager.cleanup).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      if (typeof closeHandler === "function") closeHandler();
      expect(exitSpy).toHaveBeenCalledTimes(2);

      exitSpy.mockRestore();
    });
  });

  describe("signal handlers", () => {
    it("should handle SIGINT signal", () => {
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const processOnSpy = vi.spyOn(process, "on");

      processManager.setup();

      // Find and execute SIGINT handler
      const sigintCall = processOnSpy.mock.calls.find(
        (call) => call[0] === "SIGINT",
      );
      expect(sigintCall).toBeDefined();

      const sigintHandler = sigintCall?.[1] as () => void;
      sigintHandler();

      expect(mockTerminalManager.cleanup).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      processOnSpy.mockRestore();
    });

    it("should handle SIGTERM signal", () => {
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      const processOnSpy = vi.spyOn(process, "on");

      processManager.setup();

      // Find and execute SIGTERM handler
      const sigtermCall = processOnSpy.mock.calls.find(
        (call) => call[0] === "SIGTERM",
      );
      expect(sigtermCall).toBeDefined();

      const sigtermHandler = sigtermCall?.[1] as () => void;
      sigtermHandler();

      expect(mockTerminalManager.cleanup).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      exitSpy.mockRestore();
      processOnSpy.mockRestore();
    });

    it("should not attach signal handlers multiple times", () => {
      const processOnSpy = vi.spyOn(process, "on");

      processManager.setup();
      const firstCallCount = processOnSpy.mock.calls.length;

      processManager.setup();
      const secondCallCount = processOnSpy.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);

      processOnSpy.mockRestore();
    });
  });

  describe("cleanup", () => {
    it("should clear keep-alive timer and cleanup terminal", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      processManager.setup();
      processManager.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockTerminalManager.cleanup).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it("should handle cleanup when no timer exists", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      processManager.cleanup();

      expect(clearIntervalSpy).not.toHaveBeenCalled();
      expect(mockTerminalManager.cleanup).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it("should not crash on multiple cleanup calls", () => {
      processManager.setup();

      expect(() => {
        processManager.cleanup();
        processManager.cleanup();
      }).not.toThrow();
    });
  });

  describe("onAppExit", () => {
    it("should execute callback on next tick and cleanup", () => {
      const callback = vi.fn();
      const nextTickSpy = vi.spyOn(process, "nextTick");

      processManager.onAppExit(callback);

      expect(nextTickSpy).toHaveBeenCalledWith(expect.any(Function));

      // Execute the nextTick callback
      const nextTickCallback = nextTickSpy.mock.calls[0]?.[0];
      if (nextTickCallback) {
        nextTickCallback();
      }

      expect(callback).toHaveBeenCalled();
      expect(mockTerminalManager.cleanup).toHaveBeenCalled();

      nextTickSpy.mockRestore();
    });
  });

  describe("CI environment detection", () => {
    const ciEnvVars = [
      "CI",
      "GITHUB_ACTIONS",
      "JENKINS_URL",
      "TRAVIS",
      "CIRCLECI",
      "GITLAB_CI",
      "BUILDKITE",
      "DRONE",
      "CONTINUOUS_INTEGRATION",
    ];

    it.each(ciEnvVars)("should detect CI environment with %s", (envVar) => {
      process.env[envVar] = "true";
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      processManager.setup();

      // Should not setup keep-alive in CI
      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it("should not detect CI environment when no CI variables are set", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      processManager.setup();

      // Should setup keep-alive in non-CI
      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it("should handle empty CI environment variables", () => {
      process.env["CI"] = "";
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      processManager.setup();

      // Empty string is falsy, so should NOT be detected as CI environment
      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });
  });

  describe("stdin handlers in non-CI environment", () => {
    it("should setup stdin handlers that do not exit", () => {
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      processManager.setup();

      // Execute stdin handlers
      const stdinOnCalls = process.stdin.on.mock.calls;
      const endHandler = stdinOnCalls.find(
        (call: unknown[]) => call[0] === "end",
      )?.[1];
      const closeHandler = stdinOnCalls.find(
        (call: unknown[]) => call[0] === "close",
      )?.[1];

      // These should not cause exit in non-CI environment
      if (typeof endHandler === "function") endHandler();
      if (typeof closeHandler === "function") closeHandler();

      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });
  });

  describe("integration tests", () => {
    it("should handle complete lifecycle", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const processOnSpy = vi.spyOn(process, "on");

      // Setup
      processManager.setup();

      expect(setIntervalSpy).toHaveBeenCalled();
      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith(
        "SIGTERM",
        expect.any(Function),
      );

      // App exit
      const callback = vi.fn();
      const nextTickSpy = vi.spyOn(process, "nextTick");
      processManager.onAppExit(callback);

      expect(nextTickSpy).toHaveBeenCalled();
      const nextTickCallback = nextTickSpy.mock.calls[0]?.[0];
      if (nextTickCallback) {
        nextTickCallback();
      }

      expect(callback).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockTerminalManager.cleanup).toHaveBeenCalled();

      nextTickSpy.mockRestore();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
      processOnSpy.mockRestore();
    });

    it("should handle error scenarios gracefully", () => {
      // Mock terminal manager that throws error
      const errorTerminalManager = {
        cleanup: vi.fn().mockImplementation(() => {
          throw new Error("Cleanup error");
        }),
      };

      const errorProcessManager = new ProcessManager(errorTerminalManager);

      // Should not crash even if terminal cleanup fails
      expect(() => {
        errorProcessManager.cleanup();
      }).not.toThrow();

      expect(errorTerminalManager.cleanup).toHaveBeenCalled();
    });
  });
});
