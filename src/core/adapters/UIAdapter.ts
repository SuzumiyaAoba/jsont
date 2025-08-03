/**
 * UI adapter interfaces for abstracting different UI implementations
 * Enables support for both TUI (Terminal) and GUI (Web) interfaces
 */

import type { JsontConfig } from "@core/config/types";
import type {
  ExportResult,
  JsonCommand,
  JsonCommandResult,
  JsonEngineState,
} from "@core/engine/JsonEngine";
import type { SearchResult } from "@core/engine/SearchEngine";
import type { TreeRenderResult } from "@core/engine/TreeEngine";
import type { JsonValue } from "@core/types/index";

/**
 * UI event types for user interactions
 */
export type UIEvent =
  | "key-press"
  | "mouse-click"
  | "mouse-scroll"
  | "window-resize"
  | "focus-change";

/**
 * Input event data
 */
export interface UIInputEvent {
  type: UIEvent;
  payload: unknown;
}

/**
 * Display dimensions
 */
export interface DisplayDimensions {
  width: number;
  height: number;
}

/**
 * Rendering context for UI updates
 */
export interface RenderContext {
  /** Current display dimensions */
  dimensions: DisplayDimensions;
  /** Whether UI has focus */
  hasFocus: boolean;
  /** Current theme/appearance settings */
  theme?: Record<string, unknown>;
}

/**
 * UI component rendering data
 */
export interface UIRenderData {
  /** JSON engine state */
  engineState: JsonEngineState;
  /** Tree rendering data */
  treeData?: TreeRenderResult;
  /** Search results */
  searchResults?: SearchResult;
  /** Export data if applicable */
  exportData?: ExportResult;
  /** Error messages */
  errors?: string[];
  /** Status messages */
  status?: string[];
}

/**
 * UI update instruction
 */
export interface UIUpdateInstruction {
  /** Type of update */
  type: "full-refresh" | "partial-update" | "scroll-update" | "status-update";
  /** Areas to update */
  areas?: ("tree" | "search" | "status" | "help" | "modal")[];
  /** Animation/transition hints */
  animation?: "none" | "fade" | "slide" | "scroll";
}

/**
 * Configuration change notification
 */
export interface ConfigChangeEvent {
  /** Changed configuration keys */
  changedKeys: string[];
  /** New configuration */
  newConfig: JsontConfig;
  /** Previous configuration */
  previousConfig: JsontConfig;
}

/**
 * File operation request
 */
export interface FileOperationRequest {
  /** Operation type */
  operation: "save" | "load" | "export";
  /** File path (may be empty for save dialogs) */
  path?: string;
  /** File content for save operations */
  content?: string;
  /** File filters for dialogs */
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * File operation result
 */
export interface FileOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** File path that was used */
  path?: string;
  /** File content for load operations */
  content?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Abstract UI adapter interface
 * Defines the contract for different UI implementations
 */
export abstract class UIAdapter {
  protected config: JsontConfig;
  protected eventHandlers: Map<string, (event: UIInputEvent) => void> =
    new Map();

  constructor(config: JsontConfig) {
    this.config = config;
  }

  /**
   * Initialize the UI
   */
  abstract initialize(data: JsonValue | null): Promise<void>;

  /**
   * Render the current state
   */
  abstract render(data: UIRenderData, context: RenderContext): void;

  /**
   * Update specific UI areas
   */
  abstract update(instruction: UIUpdateInstruction, data: UIRenderData): void;

  /**
   * Show a modal dialog
   */
  abstract showModal(
    type: "info" | "warning" | "error" | "confirm" | "input",
    message: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>;

  /**
   * Hide current modal
   */
  abstract hideModal(): void;

  /**
   * Handle file operations
   */
  abstract handleFileOperation(
    request: FileOperationRequest,
  ): Promise<FileOperationResult>;

  /**
   * Get current display dimensions
   */
  abstract getDimensions(): DisplayDimensions;

  /**
   * Set up event handlers
   */
  abstract setupEventHandlers(): void;

  /**
   * Clean up resources
   */
  abstract cleanup(): void;

  /**
   * Register event handler
   */
  registerEventHandler(
    eventType: string,
    handler: (event: UIInputEvent) => void,
  ): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: JsontConfig): void {
    const previousConfig = this.config;
    this.config = newConfig;
    this.onConfigChange({
      changedKeys: this.getChangedKeys(previousConfig, newConfig),
      newConfig,
      previousConfig,
    });
  }

  /**
   * Handle configuration changes
   */
  protected abstract onConfigChange(event: ConfigChangeEvent): void;

  /**
   * Get changed configuration keys
   */
  private getChangedKeys(
    oldConfig: JsontConfig,
    newConfig: JsontConfig,
  ): string[] {
    const changedKeys: string[] = [];

    const compareObjects = (
      obj1: unknown,
      obj2: unknown,
      prefix = "",
    ): void => {
      if (
        typeof obj1 !== "object" ||
        typeof obj2 !== "object" ||
        obj1 === null ||
        obj2 === null
      ) {
        if (obj1 !== obj2) {
          changedKeys.push(prefix);
        }
        return;
      }

      const keys1 = Object.keys(obj1 as Record<string, unknown>);
      const keys2 = Object.keys(obj2 as Record<string, unknown>);
      const allKeys = new Set([...keys1, ...keys2]);

      for (const key of allKeys) {
        const value1 = (obj1 as Record<string, unknown>)[key];
        const value2 = (obj2 as Record<string, unknown>)[key];
        const keyPath = prefix ? `${prefix}.${key}` : key;

        compareObjects(value1, value2, keyPath);
      }
    };

    compareObjects(oldConfig, newConfig);
    return changedKeys;
  }
}

/**
 * UI controller that manages the UI adapter and JSON engine
 */
export class UIController {
  private adapter: UIAdapter;
  private engineState: JsonEngineState | null = null;

  constructor(adapter: UIAdapter) {
    this.adapter = adapter;
    this.setupAdapterEvents();
  }

  /**
   * Initialize with JSON engine state
   */
  async initialize(state: JsonEngineState): Promise<void> {
    this.engineState = state;
    await this.adapter.initialize(state.data);
    this.renderFull();
  }

  /**
   * Update with new engine state
   */
  updateState(
    newState: JsonEngineState,
    instruction: UIUpdateInstruction = { type: "full-refresh" },
  ): void {
    this.engineState = newState;

    const renderData = this.buildRenderData(newState);
    const context = this.buildRenderContext();

    if (instruction.type === "full-refresh") {
      this.adapter.render(renderData, context);
    } else {
      this.adapter.update(instruction, renderData);
    }
  }

  /**
   * Handle JSON command and update UI
   */
  async handleCommand(
    _command: JsonCommand,
    _payload?: unknown,
  ): Promise<JsonCommandResult> {
    // This would typically call the JSON engine
    // For now, return a placeholder result
    return {
      handled: false,
      state: this.engineState!,
    };
  }

  /**
   * Show modal and handle result
   */
  async showModal(
    type: "info" | "warning" | "error" | "confirm" | "input",
    message: string,
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    return this.adapter.showModal(type, message, options);
  }

  /**
   * Handle file operations
   */
  async handleFileOperation(
    request: FileOperationRequest,
  ): Promise<FileOperationResult> {
    return this.adapter.handleFileOperation(request);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.adapter.cleanup();
  }

  /**
   * Perform full render
   */
  private renderFull(): void {
    if (!this.engineState) return;

    const renderData = this.buildRenderData(this.engineState);
    const context = this.buildRenderContext();

    this.adapter.render(renderData, context);
  }

  /**
   * Build render data from engine state
   */
  private buildRenderData(state: JsonEngineState): UIRenderData {
    return {
      engineState: state,
      // Tree data would be generated here
      // Search results would be included here
      // etc.
    };
  }

  /**
   * Build render context
   */
  private buildRenderContext(): RenderContext {
    return {
      dimensions: this.adapter.getDimensions(),
      hasFocus: true, // This would be tracked properly
    };
  }

  /**
   * Set up adapter event handlers
   */
  private setupAdapterEvents(): void {
    // Register for common events
    this.adapter.registerEventHandler("key-press", (event) => {
      // Handle keyboard events
      this.handleKeyPress(event.payload);
    });

    this.adapter.registerEventHandler("window-resize", (event) => {
      // Handle resize events
      this.handleResize(event.payload as DisplayDimensions);
    });
  }

  /**
   * Handle key press events
   */
  private handleKeyPress(payload: unknown): void {
    // Convert to appropriate command and execute
    console.log("Key press:", payload);
  }

  /**
   * Handle resize events
   */
  private handleResize(_dimensions: DisplayDimensions): void {
    // Update layout with new dimensions
    if (this.engineState) {
      this.updateState(this.engineState, {
        type: "partial-update",
        areas: ["tree", "status"],
      });
    }
  }
}
