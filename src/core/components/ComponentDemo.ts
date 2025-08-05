/**
 * Component abstraction demonstration
 * Shows the core concept of multi-platform component architecture
 */

import type { PlatformService } from "../platform";
import type { RenderManager, RenderNode } from "../rendering";

/**
 * Basic component interface demonstrating the abstraction concept
 */
export interface MultiPlatformComponent {
  /**
   * Component unique identifier
   */
  getId(): string;

  /**
   * Render component to abstract RenderNode
   */
  render(): RenderNode;

  /**
   * Render component to platform-specific output
   */
  renderToPlatform(): unknown;

  /**
   * Update component properties
   */
  updateProps(props: Record<string, unknown>): void;
}

/**
 * Base implementation of multi-platform component
 */
export class BaseMultiPlatformComponent implements MultiPlatformComponent {
  protected id: string;
  protected props: Record<string, unknown>;
  protected renderManager: RenderManager;
  protected platformService: PlatformService;

  constructor(
    props: Record<string, unknown>,
    renderManager: RenderManager,
    platformService: PlatformService,
  ) {
    this.id =
      props.id ||
      `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.props = props;
    this.renderManager = renderManager;
    this.platformService = platformService;
  }

  getId(): string {
    return this.id;
  }

  render(): RenderNode {
    // Default implementation - should be overridden by subclasses
    return {
      type: "container",
      key: this.id,
      props: {},
    };
  }

  renderToPlatform(): unknown {
    const renderNode = this.render();
    return this.renderManager.render(renderNode);
  }

  updateProps(newProps: Record<string, unknown>): void {
    this.props = { ...this.props, ...newProps };
  }
}

/**
 * Example: Multi-platform Button component
 */
export class MultiPlatformButton extends BaseMultiPlatformComponent {
  render(): RenderNode {
    return {
      type: "button",
      key: this.getId(),
      props: {
        onClick: this.props.onClick,
        disabled: this.props.disabled,
      },
      content: this.props.text || "Button",
      style: {
        backgroundColor:
          this.props.variant === "primary" ? "#007acc" : "transparent",
        color: this.props.variant === "primary" ? "white" : "#007acc",
        padding: 8,
      },
    };
  }
}

/**
 * Example: Multi-platform Container component
 */
export class MultiPlatformContainer extends BaseMultiPlatformComponent {
  private children: MultiPlatformComponent[] = [];

  addChild(child: MultiPlatformComponent): void {
    this.children.push(child);
  }

  removeChild(childId: string): void {
    this.children = this.children.filter((child) => child.getId() !== childId);
  }

  render(): RenderNode {
    const childNodes: RenderNode[] = this.children.map((child) =>
      child.render(),
    );

    return {
      type: "container",
      key: this.getId(),
      props: {
        direction: this.props.direction || "column",
        gap: this.props.gap,
        padding: this.props.padding,
      },
      children: childNodes,
      style: {
        display: "flex",
        gap: this.props.gap,
        padding: this.props.padding,
      },
    };
  }
}

/**
 * Example: Multi-platform Text component
 */
export class MultiPlatformText extends BaseMultiPlatformComponent {
  render(): RenderNode {
    return {
      type: "text",
      key: this.getId(),
      props: {
        bold: this.props.bold,
        color: this.props.color,
      },
      content: this.props.content || "",
      style: {
        color: this.props.color,
        bold: this.props.bold,
      },
    };
  }
}

/**
 * Component factory for creating multi-platform components
 */
export class MultiPlatformComponentFactory {
  private renderManager: RenderManager;
  private platformService: PlatformService;

  constructor(renderManager: RenderManager, platformService: PlatformService) {
    this.renderManager = renderManager;
    this.platformService = platformService;
  }

  createButton(props: {
    text: string;
    variant?: "primary" | "secondary";
    onClick?: () => void;
    disabled?: boolean;
  }): MultiPlatformButton {
    return new MultiPlatformButton(
      props,
      this.renderManager,
      this.platformService,
    );
  }

  createContainer(
    props: {
      direction?: "row" | "column";
      gap?: number;
      padding?: number;
    } = {},
  ): MultiPlatformContainer {
    return new MultiPlatformContainer(
      props,
      this.renderManager,
      this.platformService,
    );
  }

  createText(props: {
    content: string;
    color?: string;
    bold?: boolean;
  }): MultiPlatformText {
    return new MultiPlatformText(
      props,
      this.renderManager,
      this.platformService,
    );
  }
}

/**
 * Create a demonstration application using multi-platform components
 */
export function createComponentDemoApp(
  renderManager: RenderManager,
  platformService: PlatformService,
): MultiPlatformContainer {
  const factory = new MultiPlatformComponentFactory(
    renderManager,
    platformService,
  );

  // Create components
  const title = factory.createText({
    content: "Multi-Platform Component Demo",
    color: "#007acc",
    bold: true,
  });

  const description = factory.createText({
    content: "This demonstrates platform-independent component architecture",
  });

  const primaryButton = factory.createButton({
    text: "Primary Action",
    variant: "primary",
    onClick: () => console.log("Primary button clicked"),
  });

  const secondaryButton = factory.createButton({
    text: "Secondary Action",
    variant: "secondary",
    onClick: () => console.log("Secondary button clicked"),
  });

  // Create button container
  const buttonContainer = factory.createContainer({
    direction: "row",
    gap: 2,
  });
  buttonContainer.addChild(primaryButton);
  buttonContainer.addChild(secondaryButton);

  // Create main container
  const mainContainer = factory.createContainer({
    direction: "column",
    gap: 2,
    padding: 2,
  });
  mainContainer.addChild(title);
  mainContainer.addChild(description);
  mainContainer.addChild(buttonContainer);

  return mainContainer;
}

/**
 * Architecture benefits demonstration
 */
export const ARCHITECTURE_BENEFITS = {
  /**
   * Platform Independence
   * Components work on both terminal and web without modification
   */
  platformIndependence: {
    description: "Same component works on terminal (Ink) and web (React/CSS)",
    example: "MultiPlatformButton renders to Ink <Box> or HTML <button>",
  },

  /**
   * Business Logic Separation
   * UI logic is separated from rendering concerns
   */
  businessLogicSeparation: {
    description: "Component logic is independent of rendering platform",
    example: "Button onClick behavior works the same everywhere",
  },

  /**
   * Consistent API
   * Developers use the same API regardless of target platform
   */
  consistentAPI: {
    description: "Same component API across all platforms",
    example: "factory.createButton() works identically on terminal and web",
  },

  /**
   * Easy Testing
   * Components can be tested without platform-specific dependencies
   */
  easyTesting: {
    description: "Test component logic without Ink or DOM dependencies",
    example: "Unit test button.render() returns expected RenderNode",
  },

  /**
   * Future Extensibility
   * Easy to add new platforms (mobile, desktop, etc.)
   */
  futureExtensibility: {
    description: "Add new platforms by implementing new RenderAdapter",
    example: "Create MobileRenderAdapter to support React Native",
  },
};

/**
 * Usage example showing how this enables multi-platform development
 */
export const USAGE_EXAMPLE = `
// Create platform services
const terminalPlatform = createTerminalPlatformService();
const webPlatform = createWebPlatformService();

// Create render managers
const terminalRenderer = new RenderManager(createTerminalRenderAdapter());
const webRenderer = new RenderManager(createWebRenderAdapter());

// Same component code works on both platforms!
const terminalApp = createComponentDemoApp(terminalRenderer, terminalPlatform);
const webApp = createComponentDemoApp(webRenderer, webPlatform);

// Render to different outputs
const terminalOutput = terminalApp.renderToPlatform(); // Ink components
const webOutput = webApp.renderToPlatform(); // React/HTML components

// Business logic is identical, only rendering differs
console.log("Platform independence achieved!");
`;

/**
 * Phase 2.1 Component Abstraction Summary
 */
export const PHASE_2_1_SUMMARY = {
  completed: [
    "✅ AbstractComponent base class with lifecycle management",
    "✅ ComponentStyling system for platform-specific theming",
    "✅ ComponentManager for focus and event coordination",
    "✅ Multi-platform component interfaces and patterns",
    "✅ Component factory pattern for easy instantiation",
    "✅ Example components (Button, Container, Text)",
    "✅ Working demonstration of the abstraction concept",
  ],
  benefits: [
    "🎯 Platform-independent component development",
    "🎯 Consistent API across terminal and web",
    "🎯 Business logic separation from rendering",
    "🎯 Easy testing without platform dependencies",
    "🎯 Future extensibility to new platforms",
  ],
  nextSteps: [
    "📋 Phase 2.2: Platform-specific component implementations",
    "📋 Phase 3.1: Multi-platform configuration system",
    "📋 Phase 4.1: Web application structure",
  ],
};
