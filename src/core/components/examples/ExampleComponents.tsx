/**
 * Example components demonstrating the abstract component system
 * Shows how to create platform-independent components using the abstraction layer
 */

import type { ButtonNode, ContainerNode, RenderNode } from "@core/rendering";
import type { ReactElement } from "react";

// Input handling types (to be implemented in future phases)
type InputEvent = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  type?: string;
  preventDefault?: () => void;
};

import {
  AbstractComponent,
  COMPONENT_STYLES,
  type ComponentContext,
  type ComponentProps,
  type ComponentSize,
  type ComponentValidationResult,
  type ComponentVariant,
} from "../index";

/**
 * Button component properties
 */
interface ButtonProps extends ComponentProps {
  /**
   * Button text content
   */
  text: string;

  /**
   * Button size
   */
  size?: ComponentSize;

  /**
   * Button visual variant
   */
  variant?: ComponentVariant;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * Button component state
 */
interface ButtonState {
  isPressed: boolean;
  isHovered: boolean;
}

/**
 * Example button component using the abstract component system
 */
export class AbstractButton extends AbstractComponent<
  ButtonProps,
  ButtonState
> {
  constructor(props: ButtonProps, context: ComponentContext) {
    super(props, context, {
      isPressed: false,
      isHovered: false,
    });
  }

  /**
   * Render button as RenderNode
   */
  override render(): RenderNode {
    const { ComponentStyling, DEFAULT_THEME } = require("../ComponentStyling");
    const styling = new ComponentStyling(DEFAULT_THEME, "terminal");

    const computedStyle = styling.computeStyles(COMPONENT_STYLES.button, {
      props: {
        size: this.props.size || "md",
        variant: this.props.variant || "primary",
        disabled: this.props.disabled,
        loading: this.props.loading,
      },
      state: {
        hover: this.state.getState().isHovered,
        focus: this.isFocused(),
        active: this.state.getState().isPressed,
      },
    });

    const buttonNode: ButtonNode = {
      type: "button",
      key: this.getId(),
      className: computedStyle.className,
      style: computedStyle.style,
      ...(this.props.testId ? { testId: this.props.testId } : {}),
      props: {
        onClick: this.handleClick.bind(this),
        ...(this.props.disabled || this.props.loading ? { disabled: true } : {}),
      },
      content: this.props.loading ? "Loading..." : this.props.text,
    };

    return buttonNode;
  }

  /**
   * Handle button click
   */
  private handleClick(): void {
    if (this.props.disabled || this.props.loading) {
      return;
    }

    this.props.onClick?.();
    // Emit generic event instead of click-specific
    this.context.emit?.("button:click", { componentId: this.getId() });
  }

  /**
   * Handle input events
   */
  protected override onInput(event: InputEvent): boolean {
    if (event.type === "keyboard") {
      if (event.key === "Enter" || event.key === " ") {
        this.handleClick();
        event.preventDefault?.();
        return true;
      }
    }
    return false;
  }

  /**
   * Validate button props
   */
  protected override validateProps(props: ButtonProps): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!props.text || props.text.trim().length === 0) {
      errors.push("Button text is required");
    }

    if (props.text && props.text.length > 50) {
      warnings.push("Button text is very long, consider shortening it");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get input handling priority
   */
  protected override getInputPriority(): number {
    return this.isFocused() ? 100 : 0;
  }
}

/**
 * Text input component properties
 */
interface TextInputProps extends ComponentProps {
  /**
   * Input placeholder text
   */
  placeholder?: string;

  /**
   * Input value
   */
  value?: string;

  /**
   * Input type
   */
  type?: "text" | "password" | "email" | "number";

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Submit handler (Enter key)
   */
  onSubmit?: (value: string) => void;

  /**
   * Maximum input length
   */
  maxLength?: number;

  /**
   * Required field
   */
  required?: boolean;
}

/**
 * Text input component state
 */
interface TextInputState {
  internalValue: string;
  isFocused: boolean;
  isValid: boolean;
  validationError?: string;
}

/**
 * Example text input component
 */
export class AbstractTextInput extends AbstractComponent<
  TextInputProps,
  TextInputState
> {
  constructor(props: TextInputProps, context: ComponentContext) {
    super(props, context, {
      internalValue: props.value || "",
      isFocused: false,
      isValid: true,
    });
  }

  /**
   * Render text input as RenderNode
   */
  override render(): RenderNode {
    const { ComponentStyling, DEFAULT_THEME } = require("../ComponentStyling");
    const styling = new ComponentStyling(DEFAULT_THEME, "terminal");

    const computedStyle = styling.computeStyles(COMPONENT_STYLES.input, {
      props: {
        disabled: this.props.disabled,
        focused: this.state.getState().isFocused,
      },
      state: {
        focus: this.isFocused(),
        hover: false,
        active: false,
      },
    });

    const inputNode: RenderNode = {
      type: "input",
      key: this.getId(),
      className: computedStyle.className,
      style: computedStyle.style,
      ...(this.props.testId ? { testId: this.props.testId } : {}),
      props: {
        type: this.props.type || "text",
        ...(this.props.placeholder ? { placeholder: this.props.placeholder } : {}),
        value: this.state.getState().internalValue,
        ...(this.props.disabled ? { disabled: this.props.disabled } : {}),
        ...(this.props.maxLength ? { maxLength: this.props.maxLength } : {}),
        ...(this.props.required ? { required: this.props.required } : {}),
      },
    };

    return inputNode;
  }

  /**
   * Get current input value
   */
  getValue(): string {
    return this.state.getState().internalValue;
  }

  /**
   * Set input value
   */
  setValue(value: string): void {
    this.state.setState({ internalValue: value });
    this.validateInput(value);
    this.props.onChange?.(value);
  }

  /**
   * Clear input value
   */
  clear(): void {
    this.setValue("");
  }

  /**
   * Handle input events
   */
  protected override onInput(event: InputEvent): boolean {
    if (event.type === "keyboard") {
      const currentValue = this.state.getState().internalValue;

      if (event.key === "Enter") {
        this.props.onSubmit?.(currentValue);
        event.preventDefault?.();
        return true;
      }

      if (event.key === "Backspace") {
        this.setValue(currentValue.slice(0, -1));
        event.preventDefault?.();
        return true;
      }

      if (event.key && event.key.length === 1) {
        const newValue = currentValue + event.key;
        if (!this.props.maxLength || newValue.length <= this.props.maxLength) {
          this.setValue(newValue);
        }
        event.preventDefault?.();
        return true;
      }
    }

    return false;
  }

  /**
   * Focus event handler
   */
  protected override async onFocus(): Promise<void> {
    this.state.setState({ isFocused: true });
  }

  /**
   * Blur event handler
   */
  protected override async onBlur(): Promise<void> {
    this.state.setState({ isFocused: false });
  }

  /**
   * Validate input value
   */
  private validateInput(value: string): void {
    let isValid = true;
    let validationError: string | undefined;

    if (this.props.required && value.trim().length === 0) {
      isValid = false;
      validationError = "This field is required";
    }

    if (this.props.type === "email" && value.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        validationError = "Please enter a valid email address";
      }
    }

    const stateUpdate: Partial<TextInputState> = { isValid };
    if (validationError) {
      stateUpdate.validationError = validationError;
    }
    this.state.setState(stateUpdate);
  }

  /**
   * Validate input props
   */
  protected override validateProps(props: TextInputProps): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (props.maxLength && props.maxLength < 1) {
      errors.push("maxLength must be greater than 0");
    }

    if (
      props.value &&
      props.maxLength &&
      props.value.length > props.maxLength
    ) {
      warnings.push("Initial value exceeds maxLength");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get input handling priority
   */
  protected override getInputPriority(): number {
    return this.isFocused() ? 200 : 0; // Higher priority than buttons when focused
  }
}

/**
 * Container component properties
 */
interface ContainerProps extends ComponentProps {
  /**
   * Layout direction
   */
  direction?: "row" | "column";

  /**
   * Content alignment
   */
  align?: "start" | "center" | "end" | "stretch";

  /**
   * Content justification
   */
  justify?: "start" | "center" | "end" | "space-between" | "space-around";

  /**
   * Gap between children
   */
  gap?: number;

  /**
   * Container padding
   */
  padding?: number;

  /**
   * Container border
   */
  border?: boolean;

  /**
   * Children components
   */
  children?: AbstractComponent[];
}

/**
 * Container component state
 */
interface ContainerState {
  childrenMounted: boolean;
}

/**
 * Example container component for layout
 */
export class AbstractContainer extends AbstractComponent<
  ContainerProps,
  ContainerState
> {
  constructor(props: ContainerProps, context: ComponentContext) {
    super(props, context, {
      childrenMounted: false,
    });
  }

  /**
   * Render container as RenderNode
   */
  override render(): RenderNode {
    const { ComponentStyling, DEFAULT_THEME } = require("../ComponentStyling");
    const styling = new ComponentStyling(DEFAULT_THEME, "terminal");

    const computedStyle = styling.computeStyles(COMPONENT_STYLES.container, {
      props: {
        disabled: this.props.disabled,
      },
    });

    // Build child nodes
    const children: RenderNode[] = [];
    if (this.props.children) {
      for (const child of this.props.children) {
        children.push(child.render());
      }
    }

    const containerNode: ContainerNode = {
      type: "container",
      key: this.getId(),
      className: computedStyle.className,
      style: {
        ...computedStyle.style,
        flexDirection: this.props.direction || "column",
        alignItems: this.props.align || "stretch",
        justifyContent: this.props.justify || "start",
        gap: this.props.gap,
        padding: this.props.padding,
        border: this.props.border
          ? { width: 1, style: "solid", color: "gray" }
          : undefined,
      },
      ...(this.props.testId ? { testId: this.props.testId } : {}),
      props: {
        direction: this.props.direction || "column",
        align: this.props.align || "stretch",
        justify: this.props.justify || "start",
        ...(this.props.gap !== undefined ? { gap: this.props.gap } : {}),
        ...(this.props.padding !== undefined ? { padding: this.props.padding } : {}),
      },
      children,
    };

    return containerNode;
  }

  /**
   * Add child component
   */
  addChild(child: AbstractComponent): void {
    const children = this.props.children || [];
    children.push(child);
    this.updateProps({ children });
  }

  /**
   * Remove child component
   */
  removeChild(childId: string): void {
    const children = this.props.children || [];
    const filteredChildren = children.filter(
      (child) => child.getId() !== childId,
    );
    this.updateProps({ children: filteredChildren });
  }

  /**
   * Mount lifecycle - mount all children
   */
  protected override async onDidMount(): Promise<void> {
    if (this.props.children) {
      for (const child of this.props.children) {
        if (!child.isMounted()) {
          await child.mount();
        }
      }
    }
    this.state.setState({ childrenMounted: true });
  }

  /**
   * Unmount lifecycle - unmount all children
   */
  protected override async onWillUnmount(): Promise<void> {
    if (this.props.children) {
      for (const child of this.props.children) {
        if (child.isMounted()) {
          await child.unmount();
        }
      }
    }
  }

  /**
   * Validate container props
   */
  protected override validateProps(props: ContainerProps): ComponentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (props.gap && props.gap < 0) {
      errors.push("Gap cannot be negative");
    }

    if (props.padding && props.padding < 0) {
      errors.push("Padding cannot be negative");
    }

    if (props.children && props.children.length > 20) {
      warnings.push(
        "Container has many children, consider virtualization for performance",
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

/**
 * Example usage demonstrating component composition
 */
// Input management types for the example
type ExampleInputManager = {
  addHandler(handler: any): () => void;
  removeHandler(handler: any): void;
};
type ExampleInputHandler = {
  canHandle: (event: InputEvent) => boolean;
  handle: (event: InputEvent) => boolean;
  priority?: number;
};

export async function createExampleApp(
  inputManager: ExampleInputManager,
  renderManager: import("@core/rendering").RenderManager,
  platformService: import("@core/platform").PlatformService,
): Promise<AbstractContainer> {
  const context = {
    renderManager,
    platformService,
    registerInputHandler: (handler: ExampleInputHandler) => {
      inputManager.addHandler(handler);
      return () => inputManager.removeHandler(handler);
    },
    requestFocus: () => {},
    releaseFocus: () => {},
    emit: () => {},
    listen: () => () => {},
  };

  // Create components
  const titleButton = new AbstractButton(
    {
      text: "jsont - JSON Viewer",
      variant: "primary",
      size: "lg",
      disabled: true,
    },
    context,
  );

  const searchInput = new AbstractTextInput(
    {
      placeholder: "Search JSON...",
      type: "text",
      onChange: (value) => console.log("Search:", value),
      onSubmit: (value) => console.log("Submit search:", value),
    },
    context,
  );

  const actionContainer = new AbstractContainer(
    {
      direction: "row",
      justify: "space-between",
      gap: 2,
      children: [],
    },
    context,
  );

  const copyButton = new AbstractButton(
    {
      text: "Copy",
      variant: "secondary",
      size: "sm",
      onClick: () => console.log("Copy clicked"),
    },
    context,
  );

  const exportButton = new AbstractButton(
    {
      text: "Export",
      variant: "success",
      size: "sm",
      onClick: () => console.log("Export clicked"),
    },
    context,
  );

  // Build component hierarchy
  actionContainer.addChild(copyButton);
  actionContainer.addChild(exportButton);

  const mainContainer = new AbstractContainer(
    {
      direction: "column",
      gap: 2,
      padding: 2,
      border: true,
      children: [titleButton, searchInput, actionContainer],
    },
    context,
  );

  // Mount the main container (will mount all children)
  await mainContainer.mount();

  return mainContainer;
}

/**
 * Render example to platform-specific output
 */
export function renderExampleApp(app: AbstractContainer): ReactElement {
  return app.renderToPlatform();
}
