/**
 * Multi-platform rendering system abstraction
 * Enables both terminal and web UI rendering through a unified interface
 */

/**
 * Base properties for all render nodes
 */
export interface BaseRenderProps {
  /** Unique identifier for the node */
  key?: string;
  /** CSS class name for styling */
  className?: string;
  /** Inline styles */
  style?: RenderStyle;
  /** Test identifier for testing */
  testId?: string;
}

/**
 * Layout configuration for containers
 */
export interface LayoutOptions {
  /** Flex direction */
  direction?: "row" | "column";
  /** Justify content alignment */
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  /** Align items */
  align?: "start" | "center" | "end" | "stretch";
  /** Flex wrap */
  wrap?: boolean;
  /** Gap between items */
  gap?: number;
  /** Padding */
  padding?: number | string;
  /** Margin */
  margin?: number | string;
}

/**
 * Text styling options
 */
export interface TextStyle {
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Font weight */
  bold?: boolean;
  /** Font style */
  italic?: boolean;
  /** Text decoration */
  underline?: boolean;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Text alignment */
  textAlign?: "left" | "center" | "right";
  /** Dimmed appearance */
  dimColor?: boolean;
  /** Padding */
  padding?: number | string;
}

/**
 * Border styling options
 */
export interface BorderStyle {
  /** Border width */
  width?: number;
  /** Border style */
  style?: "solid" | "dashed" | "dotted" | "double";
  /** Border color */
  color?: string;
  /** Border radius */
  radius?: number;
}

/**
 * Comprehensive render style interface
 */
export interface RenderStyle extends TextStyle, LayoutOptions {
  /** Element dimensions */
  width?: number | string;
  height?: number | string;
  /** Border styling */
  border?: BorderStyle;
  /** Visibility */
  display?: "block" | "inline" | "flex" | "none";
  /** Position */
  position?: "static" | "relative" | "absolute" | "fixed";
  /** Z-index for layering */
  zIndex?: number;
  /** Opacity */
  opacity?: number;
  /** Overflow behavior */
  overflow?: "visible" | "hidden" | "scroll" | "auto";
}

/**
 * Input field configuration
 */
export interface InputFieldOptions {
  /** Input type */
  type?: "text" | "password" | "number" | "email";
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  value?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Auto focus */
  autoFocus?: boolean;
}

/**
 * Platform-independent render node
 */
export interface RenderNode extends BaseRenderProps {
  /** Node type */
  type: "container" | "text" | "input" | "button" | "image" | "spacer";
  /** Node properties specific to the type */
  props: Record<string, any>;
  /** Child nodes */
  children?: RenderNode[];
  /** Text content for text nodes */
  content?: string;
}

/**
 * Container-specific render node
 */
export interface ContainerNode extends RenderNode {
  type: "container";
  props: LayoutOptions;
}

/**
 * Text-specific render node
 */
export interface TextNode extends RenderNode {
  type: "text";
  props: TextStyle;
  content: string;
}

/**
 * Input-specific render node
 */
export interface InputNode extends RenderNode {
  type: "input";
  props: InputFieldOptions & TextStyle;
}

/**
 * Button-specific render node
 */
export interface ButtonNode extends RenderNode {
  type: "button";
  props: TextStyle & {
    onClick?: () => void;
    disabled?: boolean;
  };
  content: string;
}

/**
 * Viewport information for rendering context
 */
export interface ViewportInfo {
  /** Viewport width */
  width: number;
  /** Viewport height */
  height: number;
  /** Scroll position X */
  scrollX: number;
  /** Scroll position Y */
  scrollY: number;
  /** Device pixel ratio */
  pixelRatio?: number;
}

/**
 * Rendering capabilities and constraints
 */
export interface RenderCapabilities {
  /** Supports color rendering */
  supportsColor: boolean;
  /** Supports mouse interactions */
  supportsMouse: boolean;
  /** Supports touch interactions */
  supportsTouch: boolean;
  /** Supports animations */
  supportsAnimations: boolean;
  /** Maximum colors supported */
  maxColors?: number;
  /** Supports Unicode characters */
  supportsUnicode: boolean;
}

/**
 * Abstract base class for platform-specific rendering adapters
 */
export abstract class RenderAdapter {
  protected capabilities: RenderCapabilities;

  constructor(capabilities: RenderCapabilities) {
    this.capabilities = capabilities;
  }

  /**
   * Get rendering capabilities
   */
  getCapabilities(): RenderCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Render a node tree to platform-specific output
   */
  abstract render(node: RenderNode, viewport: ViewportInfo): any;

  /**
   * Create a container node
   */
  abstract createContainer(options: LayoutOptions, children?: RenderNode[]): ContainerNode;

  /**
   * Create a text node
   */
  abstract createText(content: string, style?: TextStyle): TextNode;

  /**
   * Create an input node
   */
  abstract createInput(options: InputFieldOptions, style?: TextStyle): InputNode;

  /**
   * Create a button node
   */
  abstract createButton(content: string, onClick?: () => void, style?: TextStyle): ButtonNode;

  /**
   * Create a spacer node for layout
   */
  createSpacer(size: number | string): RenderNode {
    return {
      type: "spacer",
      props: {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      },
    };
  }

  /**
   * Update viewport information
   */
  abstract updateViewport(viewport: ViewportInfo): void;

  /**
   * Cleanup resources
   */
  abstract cleanup(): void;
}

/**
 * Render manager coordinating rendering operations
 */
export class RenderManager {
  private adapter: RenderAdapter;
  private currentViewport: ViewportInfo;

  constructor(adapter: RenderAdapter) {
    if (!adapter) {
      throw new Error("RenderAdapter is required");
    }
    this.adapter = adapter;
    this.currentViewport = {
      width: 80,
      height: 24,
      scrollX: 0,
      scrollY: 0,
      pixelRatio: 1,
    };
  }

  /**
   * Get current rendering capabilities
   */
  getCapabilities(): RenderCapabilities {
    return this.adapter.getCapabilities();
  }

  /**
   * Render a node tree
   */
  render(node: RenderNode): any {
    return this.adapter.render(node, this.currentViewport);
  }

  /**
   * Create a layout container
   */
  createLayout(options: LayoutOptions, children: RenderNode[] = []): ContainerNode {
    return this.adapter.createContainer(options, children);
  }

  /**
   * Create a text element
   */
  createText(content: string, style?: TextStyle): TextNode {
    return this.adapter.createText(content, style);
  }

  /**
   * Create an input field
   */
  createInput(options: InputFieldOptions, style?: TextStyle): InputNode {
    return this.adapter.createInput(options, style);
  }

  /**
   * Create a button
   */
  createButton(content: string, onClick?: () => void, style?: TextStyle): ButtonNode {
    return this.adapter.createButton(content, onClick, style);
  }

  /**
   * Create a spacer for layout
   */
  createSpacer(size: number | string): RenderNode {
    return this.adapter.createSpacer(size);
  }

  /**
   * Update viewport dimensions
   */
  updateViewport(viewport: Partial<ViewportInfo>): void {
    this.currentViewport = { ...this.currentViewport, ...viewport };
    this.adapter.updateViewport(this.currentViewport);
  }

  /**
   * Get current viewport information
   */
  getViewport(): ViewportInfo {
    return { ...this.currentViewport };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.adapter.cleanup();
  }
}

/**
 * Utility functions for render operations
 */
export class RenderUtils {
  /**
   * Merge render styles with precedence
   */
  static mergeStyles(...styles: (RenderStyle | undefined)[]): RenderStyle {
    return styles.reduce<RenderStyle>((merged, style) => {
      if (style) {
        return { ...merged, ...style };
      }
      return merged;
    }, {});
  }

  /**
   * Convert color names to platform-specific values
   */
  static normalizeColor(color: string): string {
    const colorMap: Record<string, string> = {
      red: "#ff0000",
      green: "#00ff00",
      blue: "#0000ff",
      yellow: "#ffff00",
      cyan: "#00ffff",
      magenta: "#ff00ff",
      white: "#ffffff",
      black: "#000000",
      gray: "#808080",
      grey: "#808080",
    };

    return colorMap[color.toLowerCase()] || color;
  }

  /**
   * Calculate layout dimensions
   */
  static calculateDimensions(
    node: RenderNode,
    viewport: ViewportInfo
  ): { width: number; height: number } {
    const style = node.style || {};
    
    let width = 0;
    let height = 0;

    // Calculate width
    if (typeof style.width === "number") {
      width = style.width;
    } else if (typeof style.width === "string") {
      if (style.width.endsWith("%")) {
        const percentage = parseInt(style.width) / 100;
        width = viewport.width * percentage;
      } else if (style.width.endsWith("px")) {
        width = parseInt(style.width);
      }
    }

    // Calculate height
    if (typeof style.height === "number") {
      height = style.height;
    } else if (typeof style.height === "string") {
      if (style.height.endsWith("%")) {
        const percentage = parseInt(style.height) / 100;
        height = viewport.height * percentage;
      } else if (style.height.endsWith("px")) {
        height = parseInt(style.height);
      }
    }

    return { width, height };
  }

  /**
   * Validate render node structure
   */
  static validateNode(node: RenderNode): boolean {
    if (!node || typeof node !== "object") {
      return false;
    }

    if (!node.type || typeof node.type !== "string") {
      return false;
    }

    const validTypes = ["container", "text", "input", "button", "image", "spacer"];
    if (!validTypes.includes(node.type)) {
      return false;
    }

    if (node.children && !Array.isArray(node.children)) {
      return false;
    }

    // Recursively validate children
    if (node.children) {
      for (const child of node.children) {
        if (!RenderUtils.validateNode(child)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Deep clone a render node
   */
  static cloneNode(node: RenderNode): RenderNode {
    const cloned: any = {
      type: node.type,
      props: { ...node.props },
    };

    // Only add optional properties if they exist
    if (node.key !== undefined) {
      cloned.key = node.key;
    }
    
    if (node.className !== undefined) {
      cloned.className = node.className;
    }
    
    if (node.testId !== undefined) {
      cloned.testId = node.testId;
    }
    
    if (node.style !== undefined) {
      cloned.style = { ...node.style };
    }
    
    if (node.content !== undefined) {
      cloned.content = node.content;
    }

    if (node.children !== undefined) {
      cloned.children = node.children.map(child => RenderUtils.cloneNode(child));
    }

    return cloned as RenderNode;
  }

  /**
   * Find nodes by type in a tree
   */
  static findNodesByType(node: RenderNode, type: string): RenderNode[] {
    const results: RenderNode[] = [];

    if (node.type === type) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...RenderUtils.findNodesByType(child, type));
      }
    }

    return results;
  }

  /**
   * Count total nodes in a tree
   */
  static countNodes(node: RenderNode): number {
    let count = 1;

    if (node.children) {
      for (const child of node.children) {
        count += RenderUtils.countNodes(child);
      }
    }

    return count;
  }
}