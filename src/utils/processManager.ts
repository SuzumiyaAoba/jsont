/**
 * Process Lifecycle Management
 */

import { CONFIG } from "../config/constants.js";
import type { TerminalManager } from "./terminal.js";

export class ProcessManager {
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private signalHandlersAttached = false;

  constructor(private terminalManager: TerminalManager) {}

  /**
   * Setup process management and keep-alive mechanism
   */
  setup(): void {
    this.setupKeepAlive();
    this.setupSignalHandlers();
    this.setupStdinHandlers();
  }

  /**
   * Setup keep-alive timer to prevent process exit
   * Skip in CI environments to prevent hanging
   */
  private setupKeepAlive(): void {
    // Skip keep-alive in CI environments to prevent hanging
    if (this.isCIEnvironment()) {
      return;
    }

    // Keep the event loop alive with a timer that does nothing
    this.keepAliveTimer = setInterval(() => {
      // Do nothing, just keep the event loop alive
    }, CONFIG.KEEP_ALIVE_INTERVAL);
  }

  /**
   * Setup signal handlers for clean shutdown
   */
  private setupSignalHandlers(): void {
    if (this.signalHandlersAttached) {
      return;
    }

    const exitHandler = () => {
      this.cleanup();
      process.exit(CONFIG.EXIT_CODES.SUCCESS);
    };

    process.on("SIGINT", exitHandler);
    process.on("SIGTERM", exitHandler);

    this.signalHandlersAttached = true;
  }

  /**
   * Setup stdin event handlers to prevent auto-exit
   */
  private setupStdinHandlers(): void {
    // In CI environments, exit when stdin closes
    if (this.isCIEnvironment()) {
      process.stdin.on("end", () => {
        this.cleanup();
        process.exit(CONFIG.EXIT_CODES.SUCCESS);
      });

      process.stdin.on("close", () => {
        this.cleanup();
        process.exit(CONFIG.EXIT_CODES.SUCCESS);
      });
    } else {
      // Prevent process from exiting when stdin closes in pipe mode
      process.stdin.on("end", () => {
        // Do nothing - let the TUI continue running
      });

      process.stdin.on("close", () => {
        // Keep process alive by preventing automatic exit
        // Do nothing - let the TUI continue running
      });
    }

    // Increase max listeners to prevent warnings
    process.stdin.setMaxListeners(0);
  }

  /**
   * Cleanup resources and timers
   */
  cleanup(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    this.terminalManager.cleanup();
  }

  /**
   * Setup app exit handler
   */
  onAppExit(callback: () => void): void {
    process.nextTick(() => {
      callback();
      this.cleanup();
    });
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
