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
   */
  private setupKeepAlive(): void {
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
    // Prevent process from exiting when stdin closes in pipe mode
    process.stdin.on("end", () => {
      // Do nothing - let the TUI continue running
    });

    process.stdin.on("close", () => {
      // Keep process alive by preventing automatic exit
      // Do nothing - let the TUI continue running
    });

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
}
