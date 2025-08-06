/**
 * Multi-platform input system abstraction
 * Enables both terminal and web UI input handling through a unified interface
 */

/**
 * Unified input event interface for all platforms
 */
export interface InputEvent {
  /** Type of input event */
  type: "keyboard" | "mouse" | "touch";
  /** Key pressed (for keyboard events) */
  key?: string;
  /** Modifier keys state */
  modifiers: InputModifiers;
  /** Position for mouse/touch events */
  position?: { x: number; y: number };
  /** Prevent default behavior */
  preventDefault(): void;
  /** Stop event propagation */
  stopPropagation?(): void;
}

/**
 * Modifier keys state
 */
export interface InputModifiers {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/**
 * Input handler interface for processing input events
 */
export interface InputHandler {
  /** Check if this handler can process the given event */
  canHandle(event: InputEvent): boolean;
  /** Process the input event, return true if handled */
  handle(event: InputEvent): boolean;
  /** Priority for handler execution (higher = earlier) */
  priority: number;
  /** Optional identifier for debugging */
  name?: string;
}

/**
 * Abstract base class for platform-specific input adapters
 */
export abstract class InputAdapter {
  protected inputManager?: InputManager;

  /** Set the input manager for event routing */
  setInputManager(manager: InputManager): void {
    this.inputManager = manager;
  }

  /** Register a global input handler */
  abstract registerGlobalHandler(): void;

  /** Unregister global input handler */
  abstract unregisterGlobalHandler(): void;

  /** Check if input is currently active */
  abstract isActive(): boolean;

  /** Enable/disable input handling */
  abstract setActive(active: boolean): void;
}

/**
 * Central input manager coordinating all input handlers
 */
export class InputManager {
  private handlers: InputHandler[] = [];
  private adapter: InputAdapter;
  private isActive = true;

  constructor(adapter: InputAdapter) {
    if (!adapter) {
      throw new Error("InputAdapter is required");
    }
    this.adapter = adapter;
    this.adapter.setInputManager(this);
    this.adapter.registerGlobalHandler();
  }

  /**
   * Register an input handler
   */
  registerHandler(handler: InputHandler): void {
    this.handlers.push(handler);
    // Sort by priority (higher priority first)
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unregister an input handler
   */
  unregisterHandler(handler: InputHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index >= 0) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Process an input event through all registered handlers
   */
  processEvent(event: InputEvent): boolean {
    if (!this.isActive) {
      return false;
    }

    for (const handler of this.handlers) {
      try {
        if (handler.canHandle(event) && handler.handle(event)) {
          return true; // Event was handled
        }
      } catch (error) {
        console.error(
          `Error in input handler ${handler.name || "unnamed"}:`,
          error,
        );
      }
    }
    return false; // Event was not handled
  }

  /**
   * Enable/disable input processing
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.adapter.setActive(active);
  }

  /**
   * Check if input processing is active
   */
  getActive(): boolean {
    return this.isActive;
  }

  /**
   * Get all registered handlers (for debugging)
   */
  getHandlers(): readonly InputHandler[] {
    return [...this.handlers];
  }

  /**
   * Cleanup and unregister from adapter
   */
  destroy(): void {
    this.adapter.unregisterGlobalHandler();
    this.handlers.length = 0;
  }
}

/**
 * Base class for creating input handlers with common functionality
 */
export abstract class BaseInputHandler implements InputHandler {
  abstract priority: number;
  abstract name?: string;

  abstract canHandle(event: InputEvent): boolean;
  abstract handle(event: InputEvent): boolean;

  /**
   * Helper to check if a keyboard event matches specific keys
   */
  protected matchesKey(
    event: InputEvent,
    key: string,
    modifiers?: Partial<InputModifiers>,
  ): boolean {
    if (event.type !== "keyboard" || event.key !== key) {
      return false;
    }

    if (modifiers) {
      const { ctrl, alt, shift, meta } = modifiers;
      return (
        (ctrl === undefined || event.modifiers.ctrl === ctrl) &&
        (alt === undefined || event.modifiers.alt === alt) &&
        (shift === undefined || event.modifiers.shift === shift) &&
        (meta === undefined || event.modifiers.meta === meta)
      );
    }

    return true;
  }

  /**
   * Helper to check if any modifier keys are pressed
   */
  protected hasModifiers(event: InputEvent): boolean {
    const { ctrl, alt, shift, meta } = event.modifiers;
    return ctrl || alt || shift || meta;
  }
}

/**
 * Utility functions for input event handling
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utility class pattern for input handling
export class InputUtils {
  /**
   * Create a keyboard input event
   */
  static createKeyboardEvent(
    key: string,
    modifiers: Partial<InputModifiers> = {},
    preventDefault: () => void = () => {},
    stopPropagation?: () => void,
  ): InputEvent {
    const event: InputEvent = {
      type: "keyboard",
      key,
      modifiers: {
        ctrl: false,
        alt: false,
        shift: false,
        meta: false,
        ...modifiers,
      },
      preventDefault,
    };

    // Only add stopPropagation if it's provided to avoid exactOptionalPropertyTypes issues
    if (stopPropagation) {
      event.stopPropagation = stopPropagation;
    }

    return event;
  }

  /**
   * Check if an event represents a navigation key
   */
  static isNavigationKey(event: InputEvent): boolean {
    if (event.type !== "keyboard") return false;

    const navKeys = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ];
    return navKeys.includes(event.key || "");
  }

  /**
   * Check if an event represents a printable character
   */
  static isPrintableKey(event: InputEvent): boolean {
    if (event.type !== "keyboard" || !event.key) return false;

    // Single character keys that are printable
    if (event.key.length === 1) {
      return /^[\x20-\x7E]$/.test(event.key); // ASCII printable characters
    }

    return false;
  }

  /**
   * Convert a key string to a display name
   */
  static getKeyDisplayName(key: string, modifiers: InputModifiers): string {
    const parts: string[] = [];

    if (modifiers.ctrl) parts.push("Ctrl");
    if (modifiers.alt) parts.push("Alt");
    if (modifiers.shift) parts.push("Shift");
    if (modifiers.meta) parts.push("Meta");

    // Convert common key names to more readable forms
    const keyMap: Record<string, string> = {
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      Enter: "⏎",
      Escape: "Esc",
      " ": "Space",
    };

    const displayKey = keyMap[key] || key;
    parts.push(displayKey);

    return parts.join("+");
  }
}
