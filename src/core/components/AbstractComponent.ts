/**
 * Abstract component system for multi-platform UI components
 * Provides base classes and interfaces for platform-independent component development
 */

import type { ReactElement } from "react";
import type { RenderNode, RenderManager } from "@core/rendering";
import type { InputEvent, InputHandler } from "../input";
import type { PlatformService } from "@core/platform";

/**
 * Component lifecycle state
 */
export type ComponentLifecycleState = 
  | "initializing"
  | "mounting"
  | "mounted" 
  | "updating"
  | "unmounting"
  | "unmounted"
  | "error";

/**
 * Component event types
 */
export type ComponentEventType = 
  | "mount"
  | "unmount"
  | "update"
  | "focus"
  | "blur"
  | "resize"
  | "error";

/**
 * Component event handler
 */
export interface ComponentEventHandler<T = any> {
  (event: ComponentEventType, data?: T): void | Promise<void>;
}

/**
 * Component lifecycle hooks
 */
export interface ComponentLifecycle {
  /**
   * Called before component mounts
   */
  onWillMount?(): void | Promise<void>;

  /**
   * Called after component mounts
   */
  onDidMount?(): void | Promise<void>;

  /**
   * Called before component updates
   */
  onWillUpdate?(prevProps: any, nextProps: any): void | Promise<void>;

  /**
   * Called after component updates
   */
  onDidUpdate?(prevProps: any, currentProps: any): void | Promise<void>;

  /**
   * Called before component unmounts
   */
  onWillUnmount?(): void | Promise<void>;

  /**
   * Called after component unmounts
   */
  onDidUnmount?(): void | Promise<void>;

  /**
   * Called when component encounters an error
   */
  onError?(error: Error): void | Promise<void>;

  /**
   * Called when component gains focus
   */
  onFocus?(): void | Promise<void>;

  /**
   * Called when component loses focus
   */
  onBlur?(): void | Promise<void>;

  /**
   * Called when component is resized
   */
  onResize?(width: number, height: number): void | Promise<void>;
}

/**
 * Component state management interface
 */
export interface ComponentState<T = any> {
  /**
   * Get current state
   */
  getState(): T;

  /**
   * Set new state
   */
  setState(newState: Partial<T>): void;

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: T) => void): () => void;

  /**
   * Reset state to initial value
   */
  resetState(): void;
}

/**
 * Component properties interface
 */
export interface ComponentProps {
  /**
   * Component unique identifier
   */
  id?: string;

  /**
   * Component CSS class name
   */
  className?: string;

  /**
   * Component test identifier
   */
  testId?: string;

  /**
   * Component visibility
   */
  visible?: boolean;

  /**
   * Component focus state
   */
  focused?: boolean;

  /**
   * Component disabled state
   */
  disabled?: boolean;

  /**
   * Component event handlers
   */
  onMount?: ComponentEventHandler;
  onUnmount?: ComponentEventHandler;
  onFocus?: ComponentEventHandler;
  onBlur?: ComponentEventHandler;
  onError?: ComponentEventHandler;

  /**
   * Custom properties
   */
  [key: string]: any;
}

/**
 * Component context providing access to platform services
 */
export interface ComponentContext {
  /**
   * Render manager for UI rendering
   */
  renderManager: RenderManager;

  /**
   * Platform service for platform-specific operations
   */
  platformService: PlatformService;

  /**
   * Input handler registration
   */
  registerInputHandler?(handler: InputHandler): () => void;

  /**
   * Component focus management
   */
  requestFocus?(componentId: string): void;
  releaseFocus?(componentId: string): void;

  /**
   * Component communication
   */
  emit?(event: string, data?: any): void;
  listen?(event: string, handler: (data: any) => void): () => void;
}

/**
 * Component validation result
 */
export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Abstract base class for all platform-independent components
 */
export abstract class AbstractComponent<
  TProps extends ComponentProps = ComponentProps,
  TState = any
> {
  protected props: TProps;
  protected state: ComponentState<TState>;
  protected context: ComponentContext;
  protected lifecycleState: ComponentLifecycleState = "initializing";
  protected eventHandlers = new Map<ComponentEventType, ComponentEventHandler[]>();
  protected inputHandler?: InputHandler;
  protected focusUnsubscribe?: () => void;

  constructor(props: TProps, context: ComponentContext, initialState?: TState) {
    this.props = props;
    this.context = context;
    this.state = this.createState(initialState);
    this.setupDefaultEventHandlers();
  }

  /**
   * Get component identifier
   */
  getId(): string {
    return this.props.id || `component-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current lifecycle state
   */
  getLifecycleState(): ComponentLifecycleState {
    return this.lifecycleState;
  }

  /**
   * Check if component is mounted
   */
  isMounted(): boolean {
    return this.lifecycleState === "mounted";
  }

  /**
   * Check if component is focused
   */
  isFocused(): boolean {
    return this.props.focused || false;
  }

  /**
   * Check if component is visible
   */
  isVisible(): boolean {
    return this.props.visible !== false;
  }

  /**
   * Check if component is disabled
   */
  isDisabled(): boolean {
    return this.props.disabled || false;
  }

  /**
   * Update component properties
   */
  async updateProps(newProps: Partial<TProps>): Promise<void> {
    const prevProps = { ...this.props };
    this.props = { ...this.props, ...newProps };

    if (this.isMounted()) {
      await this.onWillUpdate?.(prevProps, this.props);
      this.lifecycleState = "updating";
      await this.onDidUpdate?.(prevProps, this.props);
      this.lifecycleState = "mounted";
    }
  }

  /**
   * Mount the component
   */
  async mount(): Promise<void> {
    if (this.lifecycleState !== "initializing") {
      throw new Error(`Cannot mount component in state: ${this.lifecycleState}`);
    }

    try {
      await this.onWillMount?.();
      this.lifecycleState = "mounting";
      
      // Setup input handling
      this.setupInputHandling();
      
      // Setup focus management
      this.setupFocusManagement();
      
      this.lifecycleState = "mounted";
      await this.onDidMount?.();
      
      this.emit("mount");
    } catch (error) {
      this.lifecycleState = "error";
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Unmount the component
   */
  async unmount(): Promise<void> {
    if (this.lifecycleState === "unmounted") {
      return;
    }

    try {
      await this.onWillUnmount?.();
      this.lifecycleState = "unmounting";
      
      // Cleanup input handling
      this.cleanupInputHandling();
      
      // Cleanup focus management
      this.cleanupFocusManagement();
      
      // Cleanup event handlers
      this.eventHandlers.clear();
      
      this.lifecycleState = "unmounted";
      await this.onDidUnmount?.();
      
      this.emit("unmount");
    } catch (error) {
      this.lifecycleState = "error";
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Request focus for this component
   */
  requestFocus(): void {
    if (!this.isMounted() || this.isDisabled()) {
      return;
    }

    this.context.requestFocus?.(this.getId());
  }

  /**
   * Release focus from this component
   */
  releaseFocus(): void {
    this.context.releaseFocus?.(this.getId());
  }

  /**
   * Handle input events
   */
  protected handleInput(event: InputEvent): boolean {
    if (!this.isMounted() || !this.isVisible() || this.isDisabled()) {
      return false;
    }

    return this.onInput?.(event) || false;
  }

  /**
   * Render the component to a RenderNode
   */
  abstract render(): RenderNode;

  /**
   * Render the component to platform-specific output
   */
  renderToPlatform(): ReactElement {
    const renderNode = this.render();
    return this.context.renderManager.render(renderNode);
  }

  /**
   * Validate component properties and state
   */
  validate(): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required props
    const validation = this.validateProps(this.props);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    // Validate state
    const stateValidation = this.validateState(this.state.getState());
    errors.push(...stateValidation.errors);
    warnings.push(...stateValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Emit a component event
   */
  protected emit(event: ComponentEventType, data?: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      try {
        handler(event, data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }

    // Emit to context if available
    this.context.emit?.(event, { componentId: this.getId(), data });
  }

  /**
   * Listen to component events
   */
  protected listen(event: ComponentEventType, handler: ComponentEventHandler): () => void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);

    return () => {
      const currentHandlers = this.eventHandlers.get(event) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.eventHandlers.set(event, currentHandlers);
      }
    };
  }

  /**
   * Handle component errors
   */
  protected async handleError(error: Error): Promise<void> {
    console.error(`Component ${this.getId()} error:`, error);
    
    try {
      await this.onError?.(error);
      this.emit("error", error);
    } catch (handlerError) {
      console.error("Error in error handler:", handlerError);
    }
  }

  /**
   * Create component state management
   */
  protected createState(initialState?: TState): ComponentState<TState> {
    let currentState = initialState || ({} as TState);
    const subscribers: Array<(state: TState) => void> = [];

    return {
      getState: () => currentState,
      setState: (newState: Partial<TState>) => {
        currentState = { ...currentState, ...newState };
        subscribers.forEach(callback => {
          try {
            callback(currentState);
          } catch (error) {
            console.error("Error in state subscriber:", error);
          }
        });
      },
      subscribe: (callback: (state: TState) => void) => {
        subscribers.push(callback);
        return () => {
          const index = subscribers.indexOf(callback);
          if (index > -1) {
            subscribers.splice(index, 1);
          }
        };
      },
      resetState: () => {
        currentState = initialState || ({} as TState);
        subscribers.forEach(callback => {
          try {
            callback(currentState);
          } catch (error) {
            console.error("Error in state subscriber:", error);
          }
        });
      },
    };
  }

  /**
   * Setup default event handlers
   */
  protected setupDefaultEventHandlers(): void {
    if (this.props.onMount) {
      this.listen("mount", this.props.onMount);
    }
    if (this.props.onUnmount) {
      this.listen("unmount", this.props.onUnmount);
    }
    if (this.props.onFocus) {
      this.listen("focus", this.props.onFocus);
    }
    if (this.props.onBlur) {
      this.listen("blur", this.props.onBlur);
    }
    if (this.props.onError) {
      this.listen("error", this.props.onError);
    }
  }

  /**
   * Setup input handling
   */
  protected setupInputHandling(): void {
    if (this.context.registerInputHandler) {
      this.inputHandler = {
        canHandle: (event: InputEvent) => this.canHandleInput(event),
        handle: (event: InputEvent) => this.handleInput(event),
        priority: this.getInputPriority(),
      };
      
      this.focusUnsubscribe = this.context.registerInputHandler(this.inputHandler);
    }
  }

  /**
   * Cleanup input handling
   */
  protected cleanupInputHandling(): void {
    if (this.focusUnsubscribe) {
      this.focusUnsubscribe();
      this.focusUnsubscribe = undefined;
    }
  }

  /**
   * Setup focus management
   */
  protected setupFocusManagement(): void {
    // Focus management is handled by the context
  }

  /**
   * Cleanup focus management
   */
  protected cleanupFocusManagement(): void {
    this.releaseFocus();
  }

  // Abstract/overridable methods

  /**
   * Lifecycle hook: called before component mounts
   */
  protected onWillMount?(): void | Promise<void>;

  /**
   * Lifecycle hook: called after component mounts
   */
  protected onDidMount?(): void | Promise<void>;

  /**
   * Lifecycle hook: called before component updates
   */
  protected onWillUpdate?(prevProps: TProps, nextProps: TProps): void | Promise<void>;

  /**
   * Lifecycle hook: called after component updates
   */
  protected onDidUpdate?(prevProps: TProps, currentProps: TProps): void | Promise<void>;

  /**
   * Lifecycle hook: called before component unmounts
   */
  protected onWillUnmount?(): void | Promise<void>;

  /**
   * Lifecycle hook: called after component unmounts
   */
  protected onDidUnmount?(): void | Promise<void>;

  /**
   * Lifecycle hook: called when component encounters an error
   */
  protected onError?(error: Error): void | Promise<void>;

  /**
   * Lifecycle hook: called when component gains focus
   */
  protected onFocus?(): void | Promise<void>;

  /**
   * Lifecycle hook: called when component loses focus
   */
  protected onBlur?(): void | Promise<void>;

  /**
   * Lifecycle hook: called when component is resized
   */
  protected onResize?(width: number, height: number): void | Promise<void>;

  /**
   * Input handling: called when input event occurs
   */
  protected onInput?(event: InputEvent): boolean;

  /**
   * Check if component can handle input event
   */
  protected canHandleInput(_event: InputEvent): boolean {
    return this.isMounted() && this.isVisible() && !this.isDisabled() && this.isFocused();
  }

  /**
   * Get input handling priority
   */
  protected getInputPriority(): number {
    return 0; // Default priority
  }

  /**
   * Validate component properties
   */
  protected validateProps(_props: TProps): ComponentValidationResult {
    return { isValid: true, errors: [], warnings: [] };
  }

  /**
   * Validate component state
   */
  protected validateState(_state: TState): ComponentValidationResult {
    return { isValid: true, errors: [], warnings: [] };
  }
}