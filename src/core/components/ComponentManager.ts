/**
 * Component management system for multi-platform components
 * Handles component lifecycle, focus management, and communication
 */

import type { PlatformService } from "@core/platform";
import type { RenderManager } from "@core/rendering";
// Input handling types (to be implemented in future phases)
type InputEvent = { 
  key: string; 
  ctrl?: boolean; 
  alt?: boolean; 
  shift?: boolean;
  type?: string;
  modifiers?: string[];
  preventDefault?: () => void;
};
type InputHandler = {
  canHandle: (event: InputEvent) => boolean;
  handle: (event: InputEvent) => boolean;
  priority?: number;
};
interface InputManager {
  registerHandler(handler: InputHandler): () => void;
  addHandler(handler: InputHandler): () => void;
  removeHandler(handler: InputHandler): void;
  handleInput(event: InputEvent): boolean;
}
import type { AbstractComponent, ComponentContext } from "./AbstractComponent";
import {
  ComponentStyling,
  DARK_THEME,
  DEFAULT_THEME,
} from "./ComponentStyling";

/**
 * Component registry entry
 */
interface ComponentRegistryEntry {
  component: AbstractComponent;
  mounted: boolean;
  focused: boolean;
  zIndex: number;
}

/**
 * Focus management configuration
 */
interface FocusConfig {
  /**
   * Allow multiple components to be focused simultaneously
   */
  allowMultipleFocus: boolean;

  /**
   * Auto-focus first focusable component
   */
  autoFocusFirst: boolean;

  /**
   * Focus trap within a container
   */
  trapFocus: boolean;

  /**
   * Focus navigation with Tab/Shift+Tab
   */
  enableTabNavigation: boolean;
}

/**
 * Theme configuration
 */
interface ThemeConfig {
  /**
   * Current theme name
   */
  name: string;

  /**
   * Theme is dark mode
   */
  isDark: boolean;

  /**
   * Custom theme override
   */
  customTheme?: Partial<import("./ComponentStyling").ComponentTheme>;
}

/**
 * Component manager for handling multi-platform components
 */
export class ComponentManager {
  private components = new Map<string, ComponentRegistryEntry>();
  private focusStack: string[] = [];
  private eventBus = new Map<string, Array<(data: any) => void>>();
  private inputManager: InputManager;
  private renderManager: RenderManager;
  private platformService: PlatformService;
  private styling: ComponentStyling;
  private focusConfig: FocusConfig;
  private themeConfig: ThemeConfig;

  constructor(
    inputManager: InputManager,
    renderManager: RenderManager,
    platformService: PlatformService,
    options: {
      focusConfig?: Partial<FocusConfig>;
      themeConfig?: Partial<ThemeConfig>;
    } = {},
  ) {
    this.inputManager = inputManager;
    this.renderManager = renderManager;
    this.platformService = platformService;

    this.focusConfig = {
      allowMultipleFocus: false,
      autoFocusFirst: true,
      trapFocus: false,
      enableTabNavigation: true,
      ...options.focusConfig,
    };

    this.themeConfig = {
      name: "default",
      isDark: false,
      ...options.themeConfig,
    };

    this.styling = this.createStyling();
    this.setupGlobalInputHandlers();
  }

  /**
   * Register a component
   */
  async registerComponent(component: AbstractComponent): Promise<void> {
    const id = component.getId();

    if (this.components.has(id)) {
      throw new Error(`Component with id '${id}' is already registered`);
    }

    // Component context will be passed during construction

    // Register component
    this.components.set(id, {
      component,
      mounted: false,
      focused: false,
      zIndex: this.components.size,
    });

    // Mount component
    await component.mount();
    const entry = this.components.get(id)!;
    entry.mounted = true;

    // Auto-focus if it's the first component and auto-focus is enabled
    if (this.focusConfig.autoFocusFirst && this.components.size === 1) {
      this.requestFocus(id);
    }
  }

  /**
   * Unregister a component
   */
  async unregisterComponent(componentId: string): Promise<void> {
    const entry = this.components.get(componentId);
    if (!entry) {
      return;
    }

    // Remove from focus stack
    this.releaseFocus(componentId);

    // Unmount component
    if (entry.mounted) {
      await entry.component.unmount();
    }

    // Remove from registry
    this.components.delete(componentId);
  }

  /**
   * Get registered component
   */
  getComponent(componentId: string): AbstractComponent | undefined {
    return this.components.get(componentId)?.component;
  }

  /**
   * Get all registered components
   */
  getAllComponents(): AbstractComponent[] {
    return Array.from(this.components.values()).map((entry) => entry.component);
  }

  /**
   * Request focus for a component
   */
  requestFocus(componentId: string): void {
    const entry = this.components.get(componentId);
    if (!entry || !entry.mounted) {
      return;
    }

    // If multiple focus is not allowed, blur other components
    if (!this.focusConfig.allowMultipleFocus) {
      for (const [id, otherEntry] of this.components) {
        if (id !== componentId && otherEntry.focused) {
          this.releaseFocus(id);
        }
      }
    }

    // Focus the component
    entry.focused = true;
    this.focusStack = this.focusStack.filter((id) => id !== componentId);
    this.focusStack.push(componentId);

    // Emit focus event
    this.emit("component:focus", { componentId });

    // Call component focus handler if available
    const component = entry.component as any;
    if (typeof component.onFocus === "function") {
      component.onFocus();
    }
  }

  /**
   * Release focus from a component
   */
  releaseFocus(componentId: string): void {
    const entry = this.components.get(componentId);
    if (!entry || !entry.focused) {
      return;
    }

    // Blur the component
    entry.focused = false;
    this.focusStack = this.focusStack.filter((id) => id !== componentId);

    // Emit blur event
    this.emit("component:blur", { componentId });

    // Call component blur handler if available
    const component = entry.component as any;
    if (typeof component.onBlur === "function") {
      component.onBlur();
    }
  }

  /**
   * Get currently focused components
   */
  getFocusedComponents(): string[] {
    return this.focusStack.slice();
  }

  /**
   * Navigate focus to next component
   */
  focusNext(): void {
    if (!this.focusConfig.enableTabNavigation) {
      return;
    }

    const componentIds = Array.from(this.components.keys());
    const currentIndex =
      this.focusStack.length > 0
        ? componentIds.indexOf(this.focusStack[this.focusStack.length - 1]!)
        : -1;

    if (componentIds.length > 0) {
      const nextIndex = (currentIndex + 1) % componentIds.length;
      const nextComponentId = componentIds[nextIndex];
      if (nextComponentId) {
        this.requestFocus(nextComponentId);
      }
    }
  }

  /**
   * Navigate focus to previous component
   */
  focusPrevious(): void {
    if (!this.focusConfig.enableTabNavigation) {
      return;
    }

    const componentIds = Array.from(this.components.keys());
    const currentIndex =
      this.focusStack.length > 0
        ? componentIds.indexOf(this.focusStack[this.focusStack.length - 1]!)
        : -1;

    if (componentIds.length > 0) {
      const prevIndex =
        currentIndex <= 0 ? componentIds.length - 1 : currentIndex - 1;
      const prevComponentId = componentIds[prevIndex];
      if (prevComponentId) {
        this.requestFocus(prevComponentId);
      }
    }
  }

  /**
   * Switch theme
   */
  setTheme(themeName: string, isDark = false): void {
    this.themeConfig = {
      ...this.themeConfig,
      name: themeName,
      isDark,
    };

    this.styling = this.createStyling();
    this.emit("theme:change", this.themeConfig);
  }

  /**
   * Get current theme configuration
   */
  getTheme(): ThemeConfig {
    return { ...this.themeConfig };
  }

  /**
   * Get styling utility
   */
  getStyling(): ComponentStyling {
    return this.styling;
  }

  /**
   * Emit event to component event bus
   */
  emit(event: string, data?: any): void {
    const listeners = this.eventBus.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }
  }

  /**
   * Listen to component events
   */
  listen(event: string, listener: (data: any) => void): () => void {
    const listeners = this.eventBus.get(event) || [];
    listeners.push(listener);
    this.eventBus.set(event, listeners);

    return () => {
      const currentListeners = this.eventBus.get(event) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.eventBus.set(event, currentListeners);
      }
    };
  }

  /**
   * Update component z-index
   */
  bringToFront(componentId: string): void {
    const entry = this.components.get(componentId);
    if (!entry) {
      return;
    }

    const maxZIndex = Math.max(
      ...Array.from(this.components.values()).map((e) => e.zIndex),
    );
    entry.zIndex = maxZIndex + 1;
  }

  /**
   * Get component z-index order
   */
  getZIndexOrder(): Array<{ componentId: string; zIndex: number }> {
    return Array.from(this.components.entries())
      .map(([id, entry]) => ({ componentId: id, zIndex: entry.zIndex }))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Cleanup all components
   */
  async cleanup(): Promise<void> {
    // Unmount all components
    const unmountPromises = Array.from(this.components.entries()).map(
      async ([_id, entry]) => {
        if (entry.mounted) {
          await entry.component.unmount();
        }
      },
    );

    await Promise.all(unmountPromises);

    // Clear registry
    this.components.clear();
    this.focusStack.length = 0;
    this.eventBus.clear();
  }

  /**
   * Create styling utility
   */
  private createStyling(): ComponentStyling {
    const baseTheme = this.themeConfig.isDark ? DARK_THEME : DEFAULT_THEME;
    const theme = this.themeConfig.customTheme
      ? { ...baseTheme, ...this.themeConfig.customTheme }
      : baseTheme;

    const platform =
      this.platformService.getCapabilities().type === "web"
        ? "web"
        : "terminal";
    return new ComponentStyling(theme, platform);
  }

  /**
   * Setup global input handlers for focus management
   */
  private setupGlobalInputHandlers(): void {
    const globalHandler: InputHandler = {
      canHandle: (event: InputEvent): boolean => {
        // Handle Tab navigation
        return Boolean(
          event.type === "keyboard" &&
          (event.key === "Tab" ||
            (event.key === "Tab" && event.modifiers?.includes("shift")))
        );
      },
      handle: (event: InputEvent) => {
        if (event.key === "Tab") {
          if (event.modifiers?.includes("shift")) {
            this.focusPrevious();
          } else {
            this.focusNext();
          }
          event.preventDefault?.();
          return true;
        }
        return false;
      },
      priority: -1000, // Low priority to let components handle first
    };

    this.inputManager.addHandler(globalHandler);
  }
}

/**
 * Component factory for creating platform-specific components
 */
export class ComponentFactory {
  private componentManager: ComponentManager;

  constructor(componentManager: ComponentManager) {
    this.componentManager = componentManager;
  }

  /**
   * Create a component with automatic registration
   */
  async createComponent<T extends AbstractComponent>(
    ComponentClass: new (...args: any[]) => T,
    props: any,
    initialState?: any,
  ): Promise<T> {
    const context = this.createComponentContext();
    const component = new ComponentClass(props, context, initialState);

    await this.componentManager.registerComponent(component);

    return component;
  }

  /**
   * Create component context
   */
  private createComponentContext(): ComponentContext {
    return {
      renderManager: this.componentManager["renderManager"],
      platformService: this.componentManager["platformService"],
      registerInputHandler: (handler: InputHandler) => {
        this.componentManager["inputManager"].addHandler(handler);
        return () =>
          this.componentManager["inputManager"].removeHandler(handler);
      },
      requestFocus: (componentId: string) =>
        this.componentManager.requestFocus(componentId),
      releaseFocus: (componentId: string) =>
        this.componentManager.releaseFocus(componentId),
      emit: (event: string, data?: any) =>
        this.componentManager.emit(event, data),
      listen: (event: string, handler: (data: any) => void) =>
        this.componentManager.listen(event, handler),
    };
  }
}

/**
 * Utility functions for component management
 */
export class ComponentUtils {
  /**
   * Generate unique component ID
   */
  static generateId(prefix = "component"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate component props
   */
  static validateProps(props: any, requiredProps: string[]): string[] {
    const errors: string[] = [];

    for (const prop of requiredProps) {
      if (
        !(prop in props) ||
        props[prop] === undefined ||
        props[prop] === null
      ) {
        errors.push(`Required prop '${prop}' is missing`);
      }
    }

    return errors;
  }

  /**
   * Deep merge component props
   */
  static mergeProps<T extends Record<string, any>>(
    base: T,
    override: Partial<T>,
  ): T {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          result[key as keyof T] =
            typeof base[key] === "object" && base[key] !== null
              ? ComponentUtils.mergeProps(base[key], value)
              : value;
        } else {
          result[key as keyof T] = value;
        }
      }
    }

    return result;
  }

  /**
   * Check if component is focusable
   */
  static isFocusable(component: AbstractComponent): boolean {
    return (
      component.isMounted() && component.isVisible() && !component.isDisabled()
    );
  }

  /**
   * Find next focusable component
   */
  static findNextFocusable(
    components: AbstractComponent[],
    currentIndex: number,
  ): AbstractComponent | null {
    for (let i = 1; i < components.length; i++) {
      const index = (currentIndex + i) % components.length;
      const component = components[index];
      if (component && ComponentUtils.isFocusable(component)) {
        return component;
      }
    }
    return null;
  }

  /**
   * Find previous focusable component
   */
  static findPreviousFocusable(
    components: AbstractComponent[],
    currentIndex: number,
  ): AbstractComponent | null {
    for (let i = 1; i < components.length; i++) {
      const index = (currentIndex - i + components.length) % components.length;
      const component = components[index];
      if (component && ComponentUtils.isFocusable(component)) {
        return component;
      }
    }
    return null;
  }
}
