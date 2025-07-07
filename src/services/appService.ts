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
    const app = this.renderApp(data, error, canUseKeyboard);

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
  private renderApp(
    data: JsonValue | null,
    error: string | null,
    enableKeyboard: boolean = false,
  ): Instance {
    const renderOptions: {
      stdout: NodeJS.WriteStream;
      stderr: NodeJS.WriteStream;
      stdin?: NodeJS.ReadStream;
    } = {
      stdout: process.stdout,
      stderr: process.stderr,
    };

    // Always provide stdin for keyboard input when enabled, regardless of TTY status
    // The TTY status may be affected by file reading operations
    if (enableKeyboard) {
      renderOptions.stdin = process.stdin;
    }

    return render(
      React.createElement(App, {
        initialData: data,
        initialError: error,
        keyboardEnabled: enableKeyboard,
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
  }
}
