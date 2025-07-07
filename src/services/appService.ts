/**
 * Application Service
 * Orchestrates application initialization and lifecycle
 */

import { type Instance, render } from "ink";
import React from "react";
import { App } from "../App.js";
import type { JsonValue } from "../types/index.js";
import { ProcessManager } from "../utils/processManager.js";
import { TerminalManager } from "../utils/terminal.js";
import { JsonService } from "./jsonService.js";

export class AppService {
  private terminalManager = new TerminalManager();
  private processManager = new ProcessManager(this.terminalManager);
  private jsonService = new JsonService();

  /**
   * Initialize and run the application
   */
  async run(): Promise<void> {
    const filePath = this.getFilePath();

    // Process JSON input
    const { data, error } = await this.jsonService.processInput(filePath);

    // Setup terminal and process management
    this.setupEnvironment();

    // Render the application
    const app = this.renderApp(data, error);

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
  private renderApp(data: JsonValue | null, error: string | null): Instance {
    const renderOptions = {
      stdout: process.stdout,
      stderr: process.stderr,
      ...(this.terminalManager.isTTY() && { stdin: process.stdin }),
    };

    return render(
      React.createElement(App, { initialData: data, initialError: error }),
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
