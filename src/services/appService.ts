/**
 * Application Service
 * Orchestrates application initialization and lifecycle
 */

import { type Instance, render } from "ink";
import React from "react";
import { App } from "../App.js";
import type { JsonValue } from "../types/index.js";
import { ProcessManager } from "../utils/processManager.js";
import {
  readFromFile,
  readStdinThenReinitialize,
} from "../utils/stdinHandler.js";
import { TerminalManager } from "../utils/terminal.js";

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
    const renderOptions: {
      stdout: NodeJS.WriteStream;
      stderr: NodeJS.WriteStream;
      stdin?: NodeJS.ReadStream;
    } = {
      stdout: process.stdout,
      stderr: process.stderr,
    };

    // Check if raw mode is supported manually
    const rawModeSupported = await this.checkRawModeSupport();
    const actualKeyboardEnabled = enableKeyboard && rawModeSupported;

    // Only provide stdin for keyboard input when raw mode is truly supported
    if (actualKeyboardEnabled) {
      renderOptions.stdin = process.stdin;
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

    // In CI environments, auto-exit after a short delay
    if (this.isCIEnvironment()) {
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
      // Only enable keyboard if process.stdin actually supports raw mode
      if (
        process.stdin.setRawMode &&
        typeof process.stdin.setRawMode === "function"
      ) {
        process.stdin.setRawMode(false);
        return process.stdin.isTTY === true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if we can create a TTY stream for input
   */
  private async canCreateTTYStream(): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        return false; // Skip TTY creation on Windows
      }

      const fs = await import("node:fs");
      // Test if /dev/tty is accessible
      fs.accessSync("/dev/tty", fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
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
