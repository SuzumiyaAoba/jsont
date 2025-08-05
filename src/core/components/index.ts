/**
 * Multi-platform component system exports
 * Provides abstract base classes and utilities for platform-independent components
 */

// Core component abstractions
export * from "./AbstractComponent";
export * from "./ComponentStyling";
export * from "./ComponentManager";

// Simplified component abstractions (working version)
export * from "./SimpleAbstractComponent";

// Re-export key types for convenience
export type {
  ComponentLifecycleState,
  ComponentEventType,
  ComponentEventHandler,
  ComponentLifecycle,
  ComponentState,
  ComponentProps,
  ComponentContext,
  ComponentValidationResult,
} from "./AbstractComponent";

export type {
  ComponentSize,
  ComponentVariant,
  ComponentTheme,
  ComponentStyleConfig,
  ComputedComponentStyle,
  StyleContext,
} from "./ComponentStyling";

// Re-export classes
export {
  AbstractComponent,
} from "./AbstractComponent";

export {
  ComponentStyling,
  DEFAULT_THEME,
  DARK_THEME,
  TERMINAL_THEME_ADJUSTMENTS,
  COMPONENT_STYLES,
} from "./ComponentStyling";

export {
  ComponentManager,
  ComponentFactory,
  ComponentUtils,
} from "./ComponentManager";

/**
 * Create a basic component setup for multi-platform development
 */
export function createComponentSystem(
  inputManager: import("../input").InputManager,
  renderManager: import("@core/rendering").RenderManager,
  platformService: import("@core/platform").PlatformService,
  options: {
    theme?: "light" | "dark";
    allowMultipleFocus?: boolean;
    enableTabNavigation?: boolean;
  } = {}
) {
  const componentManager = new ComponentManager(
    inputManager,
    renderManager,
    platformService,
    {
      focusConfig: {
        allowMultipleFocus: options.allowMultipleFocus || false,
        enableTabNavigation: options.enableTabNavigation !== false,
        autoFocusFirst: true,
        trapFocus: false,
      },
      themeConfig: {
        name: options.theme || "light",
        isDark: options.theme === "dark",
      },
    }
  );

  const componentFactory = new ComponentFactory(componentManager);

  return {
    componentManager,
    componentFactory,
    styling: componentManager.getStyling(),
  };
}

/**
 * Create a simple component system for basic multi-platform development
 */
export function createSimpleComponentSystem(
  renderManager: import("@core/rendering").RenderManager,
  platformService: import("@core/platform").PlatformService
) {
  return {
    renderManager,
    platformService,
    createExample: () => import("./SimpleAbstractComponent").then(m => 
      m.createSimpleExampleApp(renderManager, platformService)
    ),
  };
}