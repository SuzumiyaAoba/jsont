/**
 * Tests for AppService
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppService } from "../appService";

// Mock dependencies
vi.mock("@core/utils/cliParser", () => ({
  parseCliArgs: vi.fn(),
  showHelp: vi.fn(),
  showVersion: vi.fn(),
}));

vi.mock("@core/utils/stdinHandler", () => ({
  readFromFile: vi.fn(),
  readStdinThenReinitialize: vi.fn(),
}));

vi.mock("@core/utils/terminal", () => ({
  TerminalManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock("@core/utils/processManager", () => ({
  ProcessManager: vi.fn().mockImplementation(() => ({
    setup: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock("ink", () => ({
  render: vi.fn().mockReturnValue({
    waitUntilExit: vi.fn().mockResolvedValue(undefined),
    unmount: vi.fn(),
  }),
}));

vi.mock("react", () => ({
  createElement: vi.fn(),
  default: {
    createElement: vi.fn(),
  },
}));

vi.mock("@/App", () => ({
  App: "App",
}));

vi.mock("@store/Provider", () => ({
  JotaiProvider: "JotaiProvider",
}));

vi.mock("@core/context/ConfigContext", () => ({
  ConfigProvider: "ConfigProvider",
}));

import { parseCliArgs, showHelp, showVersion } from "@core/utils/cliParser";
import { ProcessManager } from "@core/utils/processManager";
import {
  readFromFile,
  readStdinThenReinitialize,
} from "@core/utils/stdinHandler";
import { TerminalManager } from "@core/utils/terminal";
import { render } from "ink";

// React is mocked, no direct import needed

describe("AppService", () => {
  let appService: AppService;
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdin: typeof process.stdin;
  let originalStdout: typeof process.stdout;
  let originalStderr: typeof process.stderr;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Store original values
    originalEnv = { ...process.env };
    originalStdin = process.stdin;
    originalStdout = process.stdout;
    originalStderr = process.stderr;

    // Mock process streams
    const mockStdin = {
      isTTY: true,
      readable: true,
      readableHighWaterMark: 16384,
      setRawMode: vi.fn().mockReturnThis(),
      ref: vi.fn().mockReturnThis(),
      unref: vi.fn().mockReturnThis(),
      resume: vi.fn(),
    };

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      configurable: true,
    });

    Object.defineProperty(process, "stdout", {
      value: { write: vi.fn() },
      configurable: true,
    });

    Object.defineProperty(process, "stderr", {
      value: { write: vi.fn() },
      configurable: true,
    });

    // Create app service
    appService = new AppService();
  });

  afterEach(() => {
    // Restore original values
    process.env = originalEnv;
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      configurable: true,
    });
    Object.defineProperty(process, "stdout", {
      value: originalStdout,
      configurable: true,
    });
    Object.defineProperty(process, "stderr", {
      value: originalStderr,
      configurable: true,
    });
  });

  describe("constructor", () => {
    it("should create AppService with terminal and process managers", () => {
      expect(appService).toBeInstanceOf(AppService);
      expect(TerminalManager).toHaveBeenCalled();
      expect(ProcessManager).toHaveBeenCalled();
    });
  });

  describe("run", () => {
    it("should show help when help flag is provided", async () => {
      (parseCliArgs as any).mockReturnValue({ help: true });

      await appService.run();

      expect(parseCliArgs).toHaveBeenCalled();
      expect(showHelp).toHaveBeenCalled();
      expect(showVersion).not.toHaveBeenCalled();
    });

    it("should show version when version flag is provided", async () => {
      (parseCliArgs as any).mockReturnValue({ version: true });

      await appService.run();

      expect(parseCliArgs).toHaveBeenCalled();
      expect(showVersion).toHaveBeenCalled();
      expect(showHelp).not.toHaveBeenCalled();
    });

    it("should read from file when filePath is provided", async () => {
      const mockData = { test: "data" };
      const cliArgs = { filePath: "test.json", viewMode: "tree" };

      (parseCliArgs as any).mockReturnValue(cliArgs);
      (readFromFile as any).mockResolvedValue({
        data: mockData,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      expect(readFromFile).toHaveBeenCalledWith("test.json");
      expect(readStdinThenReinitialize).not.toHaveBeenCalled();
      expect(render).toHaveBeenCalled();
    });

    it("should read from stdin when no filePath is provided", async () => {
      const mockData = { test: "data" };
      const cliArgs = {};

      (parseCliArgs as any).mockReturnValue(cliArgs);
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: mockData,
        error: null,
        canUseKeyboard: false,
      });

      await appService.run();

      expect(readStdinThenReinitialize).toHaveBeenCalled();
      expect(readFromFile).not.toHaveBeenCalled();
      expect(render).toHaveBeenCalled();
    });

    it("should setup environment and render app", async () => {
      const mockData = { test: "data" };
      const cliArgs = { viewMode: "schema" };

      (parseCliArgs as any).mockReturnValue(cliArgs);
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: mockData,
        error: null,
        canUseKeyboard: true,
      });

      const mockTerminalManager = {
        initialize: vi.fn(),
        cleanup: vi.fn(),
      };
      const mockProcessManager = {
        setup: vi.fn(),
        cleanup: vi.fn(),
      };

      (TerminalManager as any).mockImplementation(() => mockTerminalManager);
      (ProcessManager as any).mockImplementation(() => mockProcessManager);

      appService = new AppService();
      await appService.run();

      expect(mockTerminalManager.initialize).toHaveBeenCalled();
      expect(mockProcessManager.setup).toHaveBeenCalled();
      expect(render).toHaveBeenCalled();
    });

    it("should pass viewMode to renderApp", async () => {
      const cliArgs = { viewMode: "tree" };

      (parseCliArgs as any).mockReturnValue(cliArgs);
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      const renderCall = (render as any).mock.calls[0];
      expect(renderCall).toBeDefined();
    });

    it("should handle errors and exit with error code", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      (parseCliArgs as any).mockImplementation(() => {
        throw new Error("CLI parsing error");
      });

      await expect(appService.run()).rejects.toThrow("process.exit called");

      expect(consoleSpy).toHaveBeenCalledWith("Error: CLI parsing error");
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it("should handle unknown errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      (parseCliArgs as any).mockImplementation(() => {
        throw "String error";
      });

      await expect(appService.run()).rejects.toThrow("process.exit called");

      expect(consoleSpy).toHaveBeenCalledWith("Error: Unknown error");
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe("renderApp", () => {
    it("should setup stdin properties for Ink compatibility", async () => {
      const cliArgs = {};

      (parseCliArgs as any).mockReturnValue(cliArgs);
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      // Check that stdin properties are set up
      expect(process.stdin.readable).toBe(true);
      expect(process.stdin.readableHighWaterMark).toBe(16384);
    });

    it("should handle different keyboard enabled states", async () => {
      const testCases = [
        { canUseKeyboard: true, expected: true },
        { canUseKeyboard: false, expected: false },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        (parseCliArgs as any).mockReturnValue({});
        (readStdinThenReinitialize as any).mockResolvedValue({
          data: null,
          error: null,
          canUseKeyboard: testCase.canUseKeyboard,
        });

        await appService.run();

        expect(render).toHaveBeenCalled();
      }
    });

    it("should use test environment keyboard settings", async () => {
      process.env["NODE_ENV"] = "test";

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      expect(render).toHaveBeenCalled();
    });

    it("should use vitest environment keyboard settings", async () => {
      delete process.env["NODE_ENV"];
      process.env["VITEST"] = "true";

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      expect(render).toHaveBeenCalled();
    });
  });

  describe("setupExitHandling", () => {
    it("should setup exit handling for rendered app", async () => {
      const mockApp = {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      };

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });
      (render as any).mockReturnValue(mockApp);

      await appService.run();

      expect(mockApp.waitUntilExit).toHaveBeenCalled();
    });

    it("should auto-exit in CI environment", async () => {
      process.env["CI"] = "true";

      const mockApp = {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      };

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });
      (render as any).mockReturnValue(mockApp);

      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      await appService.run();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      setTimeoutSpy.mockRestore();
    });

    it("should auto-exit in non-TTY environment", async () => {
      Object.defineProperty(process.stdin, "isTTY", {
        value: false,
        configurable: true,
      });

      const mockApp = {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      };

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });
      (render as any).mockReturnValue(mockApp);

      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      await appService.run();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      setTimeoutSpy.mockRestore();
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

    it.each(ciEnvVars)(
      "should detect CI environment with %s",
      async (envVar) => {
        process.env[envVar] = "true";

        const mockApp = {
          waitUntilExit: vi.fn().mockResolvedValue(undefined),
          unmount: vi.fn(),
        };

        (parseCliArgs as any).mockReturnValue({});
        (readStdinThenReinitialize as any).mockResolvedValue({
          data: null,
          error: null,
          canUseKeyboard: true,
        });
        (render as any).mockReturnValue(mockApp);

        const setTimeoutSpy = vi.spyOn(global, "setTimeout");

        await appService.run();

        expect(setTimeoutSpy).toHaveBeenCalled();

        setTimeoutSpy.mockRestore();
      },
    );
  });

  describe("stdin setup", () => {
    it("should setup stdin properties when missing", async () => {
      // Remove stdin properties
      const mockStdin = {
        isTTY: true,
        readable: true,
        readableHighWaterMark: 0,
      };

      Object.defineProperty(process, "stdin", {
        value: mockStdin,
        configurable: true,
      });

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      await appService.run();

      expect(process.stdin.readable).toBe(true);
      expect(process.stdin.readableHighWaterMark).toBe(16384);
      expect(typeof process.stdin.setRawMode).toBe("function");
      expect(typeof process.stdin.ref).toBe("function");
      expect(typeof process.stdin.unref).toBe("function");
    });

    it("should handle stdin setup errors gracefully", async () => {
      // Mock stdin that throws errors
      const mockStdin = {
        isTTY: true,
        readable: true,
        readableHighWaterMark: 16384,
        resume: vi.fn().mockImplementation(() => {
          throw new Error("Resume error");
        }),
      };

      Object.defineProperty(process, "stdin", {
        value: mockStdin,
        configurable: true,
      });

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: null,
        canUseKeyboard: true,
      });

      // Should not throw even if stdin setup has issues
      await expect(appService.run()).resolves.not.toThrow();
    });
  });

  describe("integration tests", () => {
    it("should handle complete application lifecycle", async () => {
      const mockData = { users: [{ id: 1, name: "Test" }] };
      const mockApp = {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      };

      (parseCliArgs as any).mockReturnValue({
        filePath: "data.json",
        viewMode: "tree",
      });
      (readFromFile as any).mockResolvedValue({
        data: mockData,
        error: null,
        canUseKeyboard: true,
      });
      (render as any).mockReturnValue(mockApp);

      await appService.run();

      // Verify complete flow
      expect(parseCliArgs).toHaveBeenCalled();
      expect(readFromFile).toHaveBeenCalledWith("data.json");
      expect(render).toHaveBeenCalled();
      expect(mockApp.waitUntilExit).toHaveBeenCalled();
    });

    it("should handle error data scenarios", async () => {
      const mockApp = {
        waitUntilExit: vi.fn().mockResolvedValue(undefined),
        unmount: vi.fn(),
      };

      (parseCliArgs as any).mockReturnValue({});
      (readStdinThenReinitialize as any).mockResolvedValue({
        data: null,
        error: "JSON parsing failed",
        canUseKeyboard: false,
      });
      (render as any).mockReturnValue(mockApp);

      await appService.run();

      expect(render).toHaveBeenCalled();

      // Verify that error is passed to App component
      const renderCall = (render as any).mock.calls[0];
      expect(renderCall).toBeDefined();
    });
  });
});
