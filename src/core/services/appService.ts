/**
 * Application Service
 * Orchestrates application initialization and lifecycle
 */

import type { JsonValue } from "@core/types/index";
import { ProcessManager } from "@core/utils/processManager";
import {
  readFromFile,
  readStdinThenReinitialize,
} from "@core/utils/stdinHandler";
import { TerminalManager } from "@core/utils/terminal";
import { type Instance, render } from "ink";
import React from "react";
import { App } from "@/App";

export class AppService {
  private terminalManager = new TerminalManager();
  private processManager = new ProcessManager(this.terminalManager);

  /**
   * Initialize and run the application
   */
  async run(): Promise<void> {
    const filePath = this.getFilePath();

    let result: Awaited<ReturnType<typeof readFromFile>>;

    if (filePath) {
      // File input mode - read from file, stdin should be available for keyboard
      result = await readFromFile(filePath);
    } else {
      // Stdin input mode - read completely then try to reinitialize for keyboard
      result = await readStdinThenReinitialize();
    }

    const { data, error, canUseKeyboard } = result;

    // Setup terminal and process management
    this.setupEnvironment();

    // Render the application with appropriate keyboard support
    const app = await this.renderApp(data, error, canUseKeyboard);

    // Setup exit handling
    this.setupExitHandling(app);
  }

  /**
   * Get file path from command line arguments
   */
  private getFilePath(): string | undefined {
    return process.argv[2];
  }

  /**
   * Setup terminal and process environment
   */
  private setupEnvironment(): void {
    this.terminalManager.initialize();
    this.processManager.setup();
  }

  /**
   * Render the Ink application
   */
  private async renderApp(
    data: JsonValue | null,
    error: string | null,
    enableKeyboard: boolean = false,
  ): Promise<Instance> {
    // Check if we're in test environment
    const isTestEnvironment =
      process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";

    // Check if raw mode is supported manually
    const rawModeSupported = await this.checkRawModeSupport();
    const actualKeyboardEnabled = isTestEnvironment
      ? enableKeyboard
      : enableKeyboard && rawModeSupported;

    const renderOptions: {
      stdout: NodeJS.WriteStream;
      stderr: NodeJS.WriteStream;
      stdin?: NodeJS.ReadStream;
    } = {
      stdout: process.stdout,
      stderr: process.stderr,
      stdin: actualKeyboardEnabled ? process.stdin : undefined,
    };

    // Provide stdin for keyboard input if enabled
    if (actualKeyboardEnabled) {
      // Force stdin to be available for reading
      Object.defineProperty(process.stdin, "readable", { value: true });

      if (process.stdin.readableHighWaterMark === 0) {
        Object.defineProperty(process.stdin, "readableHighWaterMark", {
          value: 16384,
        });
      }
    }

    return render(
      React.createElement(App, {
        initialData: data,
        initialError: error,
        keyboardEnabled: actualKeyboardEnabled,
      }),
      renderOptions,
    );
  }

  /**
   * Setup application exit handling
   */
  private setupExitHandling(app: Instance): void {
    app.waitUntilExit().then(() => {
      this.processManager.cleanup();
    });

    // In CI environments or non-TTY environments, auto-exit after a short delay
    if (this.isCIEnvironment() || !process.stdin.isTTY) {
      setTimeout(() => {
        app.unmount();
        this.processManager.cleanup();
      }, 100); // 100ms delay to allow rendering
    }
  }

  /**
   * Check if raw mode is supported on stdin
   */
  private async checkRawModeSupport(): Promise<boolean> {
    try {
      // Setup stdin properties for Ink compatibility
      this.setupStdinForInk();

      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Setup stdin properties to work with Ink
   */
  private setupStdinForInk(): void {
    // Force TTY properties for Ink compatibility
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Provide a working setRawMode function
    if (!process.stdin.setRawMode) {
      Object.defineProperty(process.stdin, "setRawMode", {
        value: function (_mode: boolean) {
          // Just return this for chaining without actually setting raw mode
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    // Provide required ref/unref functions for Ink
    if (!process.stdin.ref) {
      Object.defineProperty(process.stdin, "ref", {
        value: function () {
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    if (!process.stdin.unref) {
      Object.defineProperty(process.stdin, "unref", {
        value: function () {
          return this;
        },
        writable: true,
        configurable: true,
      });
    }

    // Ensure stdin is readable and resumed
    Object.defineProperty(process.stdin, "readable", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Resume stdin to make it available for reading
    if (process.stdin.resume) {
      process.stdin.resume();
    }
  }

  /**
   * Detect if running in CI environment
   */
  private isCIEnvironment(): boolean {
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

    return ciEnvVars.some((env) => process.env[env]);
  }
}
