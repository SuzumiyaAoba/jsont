/**
 * Multi-platform component system exports
 * Provides abstract base classes and utilities for platform-independent components
 */

// Re-export key types for convenience
export type {
  ComponentContext,
  ComponentEventHandler,
  ComponentEventType,
  ComponentLifecycle,
  ComponentLifecycleState,
  ComponentProps,
  ComponentState,
  ComponentValidationResult,
} from "./AbstractComponent";
// Core component abstractions
export * from "./AbstractComponent";
// Re-export classes
export { AbstractComponent } from "./AbstractComponent";
export * from "./ComponentManager";
export {
  ComponentFactory,
  ComponentManager,
  ComponentUtils,
} from "./ComponentManager";

export type {
  ComponentSize,
  ComponentStyleConfig,
  ComponentTheme,
  ComponentVariant,
  ComputedComponentStyle,
  StyleContext,
} from "./ComponentStyling";
export * from "./ComponentStyling";

export {
  COMPONENT_STYLES,
  ComponentStyling,
  DARK_THEME,
  DEFAULT_THEME,
  TERMINAL_THEME_ADJUSTMENTS,
} from "./ComponentStyling";
// Simplified component abstractions (working version)
export * from "./SimpleAbstractComponent";

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
  } = {},
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
    },
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
  platformService: import("@core/platform").PlatformService,
) {
  return {
    renderManager,
    platformService,
    createExample: () =>
      import("./SimpleAbstractComponent").then((m) =>
        m.createSimpleExampleApp(renderManager, platformService),
      ),
  };
}
