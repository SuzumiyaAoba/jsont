/**
 * Web rendering adapter for React/CSS
 * Converts abstract RenderNode tree to standard React components with CSS
 */

import type { CSSProperties, ReactElement } from "react";
import type {
  ButtonNode,
  ContainerNode,
  InputNode,
  RenderCapabilities,
  RenderNode,
  TextNode,
  ViewportInfo,
} from "./RenderSystem";
import { RenderAdapter, RenderUtils } from "./RenderSystem";

/**
 * Web-specific rendering capabilities
 */
const WEB_CAPABILITIES: RenderCapabilities = {
  supportsColor: true,
  supportsMouse: true,
  supportsTouch: true,
  supportsAnimations: true,
  maxColors: 16777216, // 24-bit color
  supportsUnicode: true,
};

/**
 * Web render adapter using React and CSS
 */
export class WebRenderAdapter extends RenderAdapter {
  private currentViewport: ViewportInfo;
  private cssClassPrefix: string;

  constructor(cssClassPrefix = "jsont-web") {
    super(WEB_CAPABILITIES);
    this.cssClassPrefix = cssClassPrefix;
    this.currentViewport = {
      width: window.innerWidth || 1024,
      height: window.innerHeight || 768,
      scrollX: window.scrollX || 0,
      scrollY: window.scrollY || 0,
      pixelRatio: window.devicePixelRatio || 1,
    };

    // Listen for viewport changes
    this.setupViewportListeners();
  }

  /**
   * Render a node tree to React JSX
   */
  render(node: RenderNode, viewport: ViewportInfo): ReactElement {
    this.currentViewport = viewport;
    return this.renderNode(node);
  }

  /**
   * Create a container node
   */
  createContainer(options: any, children: RenderNode[] = []): ContainerNode {
    return {
      type: "container",
      props: options,
      children,
    };
  }

  /**
   * Create a text node
   */
  createText(content: string, style: any = {}): TextNode {
    return {
      type: "text",
      props: style,
      content,
    };
  }

  /**
   * Create an input node
   */
  createInput(options: any, style: any = {}): InputNode {
    return {
      type: "input",
      props: { ...options, ...style },
    };
  }

  /**
   * Create a button node
   */
  createButton(
    content: string,
    onClick?: () => void,
    style: Record<string, unknown> = {},
  ): ButtonNode {
    return {
      type: "button",
      props: { 
        ...style, 
        ...(onClick ? { onClick } : {})
      },
      content,
    };
  }

  /**
   * Update viewport information
   */
  updateViewport(viewport: ViewportInfo): void {
    this.currentViewport = viewport;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Remove event listeners
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange);
  }

  /**
   * Render a single node to React JSX
   */
  private renderNode(node: RenderNode): ReactElement {
    switch (node.type) {
      case "container":
        return this.renderContainer(node as ContainerNode);
      case "text":
        return this.renderText(node as TextNode);
      case "input":
        return this.renderInput(node as InputNode);
      case "button":
        return this.renderButton(node as ButtonNode);
      case "spacer":
        return this.renderSpacer(node);
      default:
        return (
          <div
            key={node.key}
            className={`${this.cssClassPrefix}-unknown`}
          ></div>
        );
    }
  }

  /**
   * Render a container node as div
   */
  private renderContainer(node: ContainerNode): ReactElement {
    const style = this.mapToWebStyles(node);
    const className = this.buildClassName("container", node.className);

    return (
      <div
        key={node.key}
        className={className}
        style={style}
        data-testid={node.testId}
      >
        {node.children?.map((child, index) =>
          this.renderNode({ ...child, key: child.key || `child-${index}` }),
        )}
      </div>
    );
  }

  /**
   * Render a text node as span
   */
  private renderText(node: TextNode): ReactElement {
    const style = this.mapToWebStyles(node);
    const className = this.buildClassName("text", node.className);

    return (
      <span
        key={node.key}
        className={className}
        style={style}
        data-testid={node.testId}
      >
        {node.content}
      </span>
    );
  }

  /**
   * Render an input node as input element
   */
  private renderInput(node: InputNode): ReactElement {
    const style = this.mapToWebStyles(node);
    const className = this.buildClassName("input", node.className);

    return (
      <input
        key={node.key}
        type={node.props.type || "text"}
        placeholder={node.props.placeholder}
        defaultValue={node.props.value}
        disabled={node.props.disabled}
        required={node.props.required}
        maxLength={node.props.maxLength}
        className={className}
        style={style}
        data-testid={node.testId}
      />
    );
  }

  /**
   * Render a button node as button element
   */
  private renderButton(node: ButtonNode): ReactElement {
    const style = this.mapToWebStyles(node);
    const className = this.buildClassName("button", node.className);

    return (
      <button
        key={node.key}
        onClick={node.props.onClick}
        disabled={node.props.disabled}
        className={className}
        style={style}
        data-testid={node.testId}
      >
        {node.content}
      </button>
    );
  }

  /**
   * Render a spacer node as empty div
   */
  private renderSpacer(node: RenderNode): ReactElement {
    const { width, height } = RenderUtils.calculateDimensions(
      node,
      this.currentViewport,
    );
    const className = this.buildClassName("spacer", node.className);

    return (
      <div
        key={node.key}
        className={className}
        style={{
          width: width || "1px",
          height: height || "1px",
          flexShrink: 0,
        }}
        data-testid={node.testId}
      />
    );
  }

  /**
   * Map abstract styles to CSS properties
   */
  private mapToWebStyles(node: RenderNode): CSSProperties {
    const { props, style } = node;
    const mergedStyle = RenderUtils.mergeStyles(props, style);

    const cssStyles: CSSProperties = {};

    // Layout and positioning
    if (mergedStyle.display) {
      cssStyles.display = mergedStyle.display;
    } else if (node.type === "container") {
      cssStyles.display = "flex";
    }

    if (mergedStyle.position) {
      cssStyles.position = mergedStyle.position;
    }

    if (mergedStyle.zIndex !== undefined) {
      cssStyles.zIndex = mergedStyle.zIndex;
    }

    // Flexbox layout
    if (mergedStyle.direction) {
      cssStyles.flexDirection = mergedStyle.direction;
    }

    if (mergedStyle.justify) {
      const justifyMap = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        "space-between": "space-between",
        "space-around": "space-around",
        "space-evenly": "space-evenly",
      };
      cssStyles.justifyContent =
        justifyMap[mergedStyle.justify] || mergedStyle.justify;
    }

    if (mergedStyle.align) {
      const alignMap = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        stretch: "stretch",
      };
      cssStyles.alignItems = alignMap[mergedStyle.align] || mergedStyle.align;
    }

    if (mergedStyle.wrap !== undefined) {
      cssStyles.flexWrap = mergedStyle.wrap ? "wrap" : "nowrap";
    }

    if (mergedStyle.gap !== undefined) {
      cssStyles.gap =
        typeof mergedStyle.gap === "number"
          ? `${mergedStyle.gap}px`
          : mergedStyle.gap;
    }

    // Dimensions
    if (mergedStyle.width !== undefined) {
      cssStyles.width =
        typeof mergedStyle.width === "number"
          ? `${mergedStyle.width}px`
          : mergedStyle.width;
    }

    if (mergedStyle.height !== undefined) {
      cssStyles.height =
        typeof mergedStyle.height === "number"
          ? `${mergedStyle.height}px`
          : mergedStyle.height;
    }

    // Spacing
    if (mergedStyle.padding !== undefined) {
      cssStyles.padding =
        typeof mergedStyle.padding === "number"
          ? `${mergedStyle.padding}px`
          : mergedStyle.padding;
    }

    if (mergedStyle.margin !== undefined) {
      cssStyles.margin =
        typeof mergedStyle.margin === "number"
          ? `${mergedStyle.margin}px`
          : mergedStyle.margin;
    }

    // Typography
    if (mergedStyle.color) {
      cssStyles.color = RenderUtils.normalizeColor(mergedStyle.color);
    }

    if (mergedStyle.backgroundColor) {
      cssStyles.backgroundColor = RenderUtils.normalizeColor(
        mergedStyle.backgroundColor,
      );
    }

    if (mergedStyle.fontSize) {
      cssStyles.fontSize =
        typeof mergedStyle.fontSize === "number"
          ? `${mergedStyle.fontSize}px`
          : mergedStyle.fontSize;
    }

    if (mergedStyle.fontFamily) {
      cssStyles.fontFamily = mergedStyle.fontFamily;
    }

    if (mergedStyle.bold) {
      cssStyles.fontWeight = "bold";
    }

    if (mergedStyle.italic) {
      cssStyles.fontStyle = "italic";
    }

    if (mergedStyle.underline) {
      cssStyles.textDecoration = "underline";
    }

    if (mergedStyle.textAlign) {
      cssStyles.textAlign = mergedStyle.textAlign;
    }

    if (mergedStyle.dimColor) {
      cssStyles.opacity = 0.6;
    }

    // Border
    if (mergedStyle.border) {
      const border = mergedStyle.border;
      const borderWidth = border.width || 1;
      const borderStyle = border.style || "solid";
      const borderColor = border.color
        ? RenderUtils.normalizeColor(border.color)
        : "currentColor";

      cssStyles.border = `${borderWidth}px ${borderStyle} ${borderColor}`;

      if (border.radius !== undefined) {
        cssStyles.borderRadius = `${border.radius}px`;
      }
    }

    // Visual effects
    if (mergedStyle.opacity !== undefined) {
      cssStyles.opacity = mergedStyle.opacity;
    }

    if (mergedStyle.overflow) {
      cssStyles.overflow = mergedStyle.overflow;
    }

    return cssStyles;
  }

  /**
   * Build CSS class name with prefix
   */
  private buildClassName(type: string, additionalClass?: string): string {
    const baseClass = `${this.cssClassPrefix}-${type}`;
    return additionalClass ? `${baseClass} ${additionalClass}` : baseClass;
  }

  /**
   * Setup viewport change listeners
   */
  private setupViewportListeners(): void {
    this.handleViewportChange = this.handleViewportChange.bind(this);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange);
  }

  /**
   * Handle viewport changes
   */
  private handleViewportChange(): void {
    this.currentViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      pixelRatio: window.devicePixelRatio || 1,
    };
  }
}

/**
 * Generate CSS for web styling
 */
export function generateWebCSS(cssClassPrefix = "jsont-web"): string {
  return `
    /* Base styles for jsont web components */
    .${cssClassPrefix}-container {
      box-sizing: border-box;
    }
    
    .${cssClassPrefix}-text {
      font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Courier New', monospace;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .${cssClassPrefix}-input {
      font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Courier New', monospace;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      color: #333;
    }
    
    .${cssClassPrefix}-input:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }
    
    .${cssClassPrefix}-input:disabled {
      background: #f5f5f5;
      color: #999;
      cursor: not-allowed;
    }
    
    .${cssClassPrefix}-button {
      font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Courier New', monospace;
      padding: 4px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f8f8f8;
      color: #333;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .${cssClassPrefix}-button:hover {
      background: #e8e8e8;
      border-color: #999;
    }
    
    .${cssClassPrefix}-button:active {
      background: #ddd;
      transform: translateY(1px);
    }
    
    .${cssClassPrefix}-button:disabled {
      background: #f5f5f5;
      color: #999;
      cursor: not-allowed;
      transform: none;
    }
    
    .${cssClassPrefix}-spacer {
      flex-shrink: 0;
    }
    
    /* Theme support */
    .${cssClassPrefix}-theme-dark .${cssClassPrefix}-input {
      background: #2d2d2d;
      color: #fff;
      border-color: #555;
    }
    
    .${cssClassPrefix}-theme-dark .${cssClassPrefix}-button {
      background: #404040;
      color: #fff;
      border-color: #555;
    }
    
    .${cssClassPrefix}-theme-dark .${cssClassPrefix}-button:hover {
      background: #505050;
      border-color: #777;
    }
  `;
}

/**
 * Utility to create a web render adapter instance
 */
export function createWebRenderAdapter(
  cssClassPrefix?: string,
): WebRenderAdapter {
  return new WebRenderAdapter(cssClassPrefix);
}
