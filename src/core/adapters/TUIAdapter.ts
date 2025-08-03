/**
 * TUI (Terminal User Interface) adapter implementation
 * Bridges the UI-agnostic engines with Ink/React terminal components
 */

import type { JsontConfig } from "@core/config/types";
import type { JsonValue } from "@core/types/index";
import {
  type ConfigChangeEvent,
  type DisplayDimensions,
  type FileOperationRequest,
  type FileOperationResult,
  type RenderContext,
  UIAdapter,
  type UIRenderData,
  type UIUpdateInstruction,
} from "./UIAdapter";

/**
 * TUI-specific event data
 */
export interface TUIKeyboardEvent {
  input: string;
  key: {
    upArrow?: boolean;
    downArrow?: boolean;
    leftArrow?: boolean;
    rightArrow?: boolean;
    pageUp?: boolean;
    pageDown?: boolean;
    return?: boolean;
    escape?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
    tab?: boolean;
  };
}

/**
 * TUI adapter for terminal-based interface using Ink
 */
export class TUIAdapter extends UIAdapter {
  private dimensions: DisplayDimensions = { width: 80, height: 24 };
  private isInitialized = false;
  private currentRenderData: UIRenderData | null = null;

  constructor(config: JsontConfig) {
    super(config);
    this.updateDimensionsFromTerminal();
  }

  /**
   * Initialize the TUI
   */
  async initialize(data: JsonValue | null): Promise<void> {
    this.isInitialized = true;
    this.setupEventHandlers();

    // Initialize dimensions from terminal
    this.updateDimensionsFromTerminal();

    // Emit initialization event
    this.emitEvent("initialization", { data });
  }

  /**
   * Render the current state in the terminal
   */
  render(data: UIRenderData, context: RenderContext): void {
    this.currentRenderData = data;

    // Update dimensions from context
    this.dimensions = context.dimensions;

    // Emit render event for React components to consume
    this.emitEvent("render", { data, context });
  }

  /**
   * Update specific UI areas
   */
  update(instruction: UIUpdateInstruction, data: UIRenderData): void {
    this.currentRenderData = data;

    // Emit update event with instruction
    this.emitEvent("update", { instruction, data });
  }

  /**
   * Show a modal dialog (TUI implementation)
   */
  async showModal(
    type: "info" | "warning" | "error" | "confirm" | "input",
    message: string,
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    return new Promise((resolve) => {
      // Emit modal event and wait for response
      this.emitEvent("modal", {
        type,
        message,
        options,
        onResponse: resolve,
      });
    });
  }

  /**
   * Hide current modal
   */
  hideModal(): void {
    this.emitEvent("modal-hide", {});
  }

  /**
   * Handle file operations in TUI context
   */
  async handleFileOperation(
    request: FileOperationRequest,
  ): Promise<FileOperationResult> {
    // TUI file operations are typically simpler than GUI
    switch (request.operation) {
      case "save":
        return this.handleFileSave(request);
      case "load":
        return this.handleFileLoad(request);
      case "export":
        return this.handleFileExport(request);
      default:
        return {
          success: false,
          error: `Unsupported file operation: ${request.operation}`,
        };
    }
  }

  /**
   * Get current display dimensions
   */
  getDimensions(): DisplayDimensions {
    return { ...this.dimensions };
  }

  /**
   * Set up TUI-specific event handlers
   */
  setupEventHandlers(): void {
    // Terminal resize handling
    if (process.stdout.isTTY) {
      process.stdout.on("resize", () => {
        this.updateDimensionsFromTerminal();
        this.emitEvent("resize", this.dimensions);
      });
    }

    // Process keyboard input
    process.stdin.on("keypress", (str, key) => {
      this.handleKeyboardInput(str, key);
    });
  }

  /**
   * Clean up TUI resources
   */
  cleanup(): void {
    this.isInitialized = false;
    this.currentRenderData = null;

    // Remove event listeners
    if (process.stdout.isTTY) {
      process.stdout.removeAllListeners("resize");
    }
    process.stdin.removeAllListeners("keypress");

    this.emitEvent("cleanup", {});
  }

  /**
   * Handle configuration changes
   */
  protected onConfigChange(event: ConfigChangeEvent): void {
    // Emit config change event for components to handle
    this.emitEvent("config-change", event);
  }

  /**
   * Get current render data
   */
  getCurrentRenderData(): UIRenderData | null {
    return this.currentRenderData;
  }

  /**
   * Check if TUI is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Update dimensions from terminal size
   */
  private updateDimensionsFromTerminal(): void {
    if (process.stdout.isTTY) {
      this.dimensions = {
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
      };
    }
  }

  /**
   * Handle keyboard input from terminal
   */
  private handleKeyboardInput(input: string, key: any): void {
    const tuiEvent: TUIKeyboardEvent = {
      input: input || "",
      key: {
        upArrow: key?.name === "up",
        downArrow: key?.name === "down",
        leftArrow: key?.name === "left",
        rightArrow: key?.name === "right",
        pageUp: key?.name === "pageup",
        pageDown: key?.name === "pagedown",
        return: key?.name === "return",
        escape: key?.name === "escape",
        ctrl: key?.ctrl || false,
        shift: key?.shift || false,
        meta: key?.meta || false,
        tab: key?.name === "tab",
      },
    };

    // Emit keyboard event
    this.emitEvent("keyboard", tuiEvent);
  }

  /**
   * Handle file save operation
   */
  private async handleFileSave(
    request: FileOperationRequest,
  ): Promise<FileOperationResult> {
    try {
      if (!request.content) {
        return { success: false, error: "No content to save" };
      }

      const fs = await import("fs/promises");
      const path = request.path || "./output.json";

      await fs.writeFile(path, request.content, "utf8");

      return {
        success: true,
        path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Save failed",
      };
    }
  }

  /**
   * Handle file load operation
   */
  private async handleFileLoad(
    request: FileOperationRequest,
  ): Promise<FileOperationResult> {
    try {
      if (!request.path) {
        return { success: false, error: "No file path provided" };
      }

      const fs = await import("fs/promises");
      const content = await fs.readFile(request.path, "utf8");

      return {
        success: true,
        path: request.path,
        content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Load failed",
      };
    }
  }

  /**
   * Handle file export operation
   */
  private async handleFileExport(
    request: FileOperationRequest,
  ): Promise<FileOperationResult> {
    // Export is similar to save but with specific formatting
    return this.handleFileSave(request);
  }

  /**
   * Emit an event to registered handlers
   */
  private emitEvent(eventType: string, data: any): void {
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      handler({
        type: eventType as any,
        payload: data,
      });
    }
  }
}
