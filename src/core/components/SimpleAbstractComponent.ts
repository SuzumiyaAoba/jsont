/**
 * Simplified abstract component system for multi-platform UI components
 * Focuses on core abstraction principles with minimal TypeScript complexity
 */

import type { ReactElement } from "react";
import type { RenderNode, RenderManager } from "@core/rendering";
import type { PlatformService } from "@core/platform";

/**
 * Basic component properties
 */
export interface BaseComponentProps {
  id?: string;
  className?: string;
  testId?: string;
  visible?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Component context for platform services
 */
export interface BaseComponentContext {
  renderManager: RenderManager;
  platformService: PlatformService;
}

/**
 * Simplified abstract component base class
 */
export abstract class SimpleAbstractComponent<TProps extends BaseComponentProps = BaseComponentProps> {
  protected props: TProps;
  protected context: BaseComponentContext;
  private componentId: string;

  constructor(props: TProps, context: BaseComponentContext) {
    this.props = props;
    this.context = context;
    this.componentId = props.id || `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get component ID
   */
  getId(): string {
    return this.componentId;
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
    return this.props.disabled === true;
  }

  /**
   * Update component properties
   */
  updateProps(newProps: Partial<TProps>): void {
    this.props = { ...this.props, ...newProps };
  }

  /**
   * Abstract method to render component as RenderNode
   */
  abstract render(): RenderNode;

  /**
   * Render component to platform-specific output
   */
  renderToPlatform(): ReactElement {
    const renderNode = this.render();
    return this.context.renderManager.render(renderNode);
  }
}

/**
 * Example button component using simplified abstraction
 */
interface SimpleButtonProps extends BaseComponentProps {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export class SimpleButton extends SimpleAbstractComponent<SimpleButtonProps> {
  render(): RenderNode {
    return {
      type: "button",
      key: this.getId(),
      className: this.props.className,
      testId: this.props.testId,
      props: {
        onClick: this.props.onClick,
        disabled: this.props.disabled,
      },
      content: this.props.text,
      style: {
        backgroundColor: this.props.variant === "primary" ? "#007acc" : "transparent",
        color: this.props.variant === "primary" ? "white" : "#007acc",
        padding: 8,
        border: { width: 1, style: "solid", color: "#007acc" },
      },
    };
  }
}

/**
 * Example container component using simplified abstraction
 */
interface SimpleContainerProps extends BaseComponentProps {
  direction?: "row" | "column";
  gap?: number;
  padding?: number;
  children?: SimpleAbstractComponent[];
}

export class SimpleContainer extends SimpleAbstractComponent<SimpleContainerProps> {
  render(): RenderNode {
    const children: RenderNode[] = [];
    
    if (this.props.children) {
      for (const child of this.props.children) {
        children.push(child.render());
      }
    }

    return {
      type: "container",
      key: this.getId(),
      className: this.props.className,
      testId: this.props.testId,
      props: {
        direction: this.props.direction || "column",
        gap: this.props.gap,
        padding: this.props.padding,
      },
      children,
      style: {
        display: "flex",
        flexDirection: this.props.direction || "column",
        gap: this.props.gap,
        padding: this.props.padding,
      },
    };
  }

  addChild(child: SimpleAbstractComponent): void {
    const children = this.props.children || [];
    children.push(child);
    this.updateProps({ children });
  }
}

/**
 * Example text component using simplified abstraction
 */
interface SimpleTextProps extends BaseComponentProps {
  content: string;
  color?: string;
  bold?: boolean;
}

export class SimpleText extends SimpleAbstractComponent<SimpleTextProps> {
  render(): RenderNode {
    return {
      type: "text",
      key: this.getId(),
      className: this.props.className,
      testId: this.props.testId,
      props: {
        bold: this.props.bold,
        color: this.props.color,
      },
      content: this.props.content,
      style: {
        color: this.props.color,
        fontWeight: this.props.bold ? "bold" : "normal",
      },
    };
  }
}

/**
 * Create a simple example application
 */
export function createSimpleExampleApp(
  renderManager: RenderManager,
  platformService: PlatformService
): SimpleContainer {
  const context: BaseComponentContext = {
    renderManager,
    platformService,
  };

  // Create components
  const title = new SimpleText(
    { content: "jsont - Multi-Platform JSON Viewer", bold: true, color: "#007acc" },
    context
  );

  const primaryButton = new SimpleButton(
    { 
      text: "Primary Action", 
      variant: "primary", 
      onClick: () => console.log("Primary clicked") 
    },
    context
  );

  const secondaryButton = new SimpleButton(
    { 
      text: "Secondary Action", 
      variant: "secondary", 
      onClick: () => console.log("Secondary clicked") 
    },
    context
  );

  const buttonContainer = new SimpleContainer(
    { direction: "row", gap: 2 },
    context
  );
  buttonContainer.addChild(primaryButton);
  buttonContainer.addChild(secondaryButton);

  const mainContainer = new SimpleContainer(
    { direction: "column", gap: 2, padding: 2 },
    context
  );
  mainContainer.addChild(title);
  mainContainer.addChild(buttonContainer);

  return mainContainer;
}