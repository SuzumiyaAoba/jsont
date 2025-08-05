/**
 * Terminal rendering adapter for Ink
 * Converts abstract RenderNode tree to Ink components
 */

import type { ReactElement } from "react";
import { Box, Text } from "ink";
import {
  RenderAdapter,
  RenderUtils,
} from "./RenderSystem";
import type {
  ButtonNode,
  ContainerNode,
  InputNode,
  RenderCapabilities,
  RenderNode,
  TextNode,
  ViewportInfo,
} from "./RenderSystem";

/**
 * Terminal-specific rendering capabilities
 */
const TERMINAL_CAPABILITIES: RenderCapabilities = {
  supportsColor: true,
  supportsMouse: false, // Ink has limited mouse support
  supportsTouch: false,
  supportsAnimations: false,
  maxColors: 256,
  supportsUnicode: true,
};

/**
 * Terminal render adapter using Ink
 */
export class TerminalRenderAdapter extends RenderAdapter {
  private currentViewport: ViewportInfo;

  constructor() {
    super(TERMINAL_CAPABILITIES);
    this.currentViewport = {
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      scrollX: 0,
      scrollY: 0,
      pixelRatio: 1,
    };
  }

  /**
   * Render a node tree to Ink JSX
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
  createButton(content: string, onClick?: () => void, style: any = {}): ButtonNode {
    return {
      type: "button",
      props: { ...style, onClick },
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
    // No cleanup needed for terminal adapter
  }

  /**
   * Render a single node to Ink JSX
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
        return <Box key={node.key}></Box>;
    }
  }

  /**
   * Render a container node as Ink Box
   */
  private renderContainer(node: ContainerNode): ReactElement {
    const inkProps = this.mapToInkBoxProps(node);
    
    return (
      <Box key={node.key} {...inkProps}>
        {node.children?.map((child, index) => 
          this.renderNode({ ...child, key: child.key || `child-${index}` })
        )}
      </Box>
    );
  }

  /**
   * Render a text node as Ink Text
   */
  private renderText(node: TextNode): ReactElement {
    const inkProps = this.mapToInkTextProps(node);
    
    return (
      <Text key={node.key} {...inkProps}>
        {node.content}
      </Text>
    );
  }

  /**
   * Render an input node (simplified for terminal)
   */
  private renderInput(node: InputNode): ReactElement {
    // For terminal, we'll render input as a styled text box
    // In a full implementation, this would integrate with ink-text-input
    const value = node.props.value || node.props.placeholder || "";
    const inkProps = this.mapToInkTextProps(node);
    
    return (
      <Box key={node.key} borderStyle="single" paddingX={1}>
        <Text {...inkProps}>
          {value}
          {node.props.disabled ? " (disabled)" : ""}
        </Text>
      </Box>
    );
  }

  /**
   * Render a button node (simplified for terminal)
   */
  private renderButton(node: ButtonNode): ReactElement {
    const inkProps = this.mapToInkTextProps(node);
    
    return (
      <Box key={node.key} borderStyle="single" paddingX={1}>
        <Text {...inkProps} bold>
          {node.content}
          {node.props.disabled ? " (disabled)" : ""}
        </Text>
      </Box>
    );
  }

  /**
   * Render a spacer node
   */
  private renderSpacer(node: RenderNode): ReactElement {
    const { width, height } = RenderUtils.calculateDimensions(node, this.currentViewport);
    
    return (
      <Box key={node.key} width={width || 1} height={height || 1}>
        <Text> </Text>
      </Box>
    );
  }

  /**
   * Map abstract container props to Ink Box props
   */
  private mapToInkBoxProps(node: ContainerNode): any {
    const { props, style } = node;
    const mergedStyle = RenderUtils.mergeStyles(props, style);

    const inkProps: any = {};

    // Layout direction
    if (mergedStyle.direction) {
      inkProps.flexDirection = mergedStyle.direction;
    }

    // Justify content
    if (mergedStyle.justify) {
      const justifyMap = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        "space-between": "space-between",
        "space-around": "space-around",
        "space-evenly": "space-evenly",
      };
      inkProps.justifyContent = justifyMap[mergedStyle.justify] || mergedStyle.justify;
    }

    // Align items
    if (mergedStyle.align) {
      const alignMap = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        stretch: "stretch",
      };
      inkProps.alignItems = alignMap[mergedStyle.align] || mergedStyle.align;
    }

    // Dimensions
    if (mergedStyle.width !== undefined) {
      inkProps.width = typeof mergedStyle.width === "string" 
        ? parseInt(mergedStyle.width) 
        : mergedStyle.width;
    }

    if (mergedStyle.height !== undefined) {
      inkProps.height = typeof mergedStyle.height === "string"
        ? parseInt(mergedStyle.height)
        : mergedStyle.height;
    }

    // Padding and margin
    if (mergedStyle.padding !== undefined) {
      if (typeof mergedStyle.padding === "number") {
        inkProps.paddingX = mergedStyle.padding;
        inkProps.paddingY = mergedStyle.padding;
      }
    }

    if (mergedStyle.margin !== undefined) {
      if (typeof mergedStyle.margin === "number") {
        inkProps.marginX = mergedStyle.margin;
        inkProps.marginY = mergedStyle.margin;
      }
    }

    // Border
    if (mergedStyle.border) {
      if (mergedStyle.border.style) {
        const borderStyleMap = {
          solid: "single",
          dashed: "single", // Ink doesn't support dashed
          dotted: "single", // Ink doesn't support dotted
          double: "double",
        };
        inkProps.borderStyle = borderStyleMap[mergedStyle.border.style] || "single";
      }
      
      if (mergedStyle.border.color) {
        inkProps.borderColor = RenderUtils.normalizeColor(mergedStyle.border.color);
      }
    }

    // Wrap
    if (mergedStyle.wrap !== undefined) {
      inkProps.flexWrap = mergedStyle.wrap ? "wrap" : "nowrap";
    }

    // Gap (Ink doesn't directly support gap, but we can simulate with margin)
    if (mergedStyle.gap !== undefined) {
      // This would need more sophisticated handling in a full implementation
    }

    return inkProps;
  }

  /**
   * Map abstract text props to Ink Text props
   */
  private mapToInkTextProps(node: TextNode | InputNode | ButtonNode): any {
    const { props, style } = node;
    const mergedStyle = RenderUtils.mergeStyles(props, style);

    const inkProps: any = {};

    // Text color
    if (mergedStyle.color) {
      inkProps.color = RenderUtils.normalizeColor(mergedStyle.color);
    }

    // Background color
    if (mergedStyle.backgroundColor) {
      inkProps.backgroundColor = RenderUtils.normalizeColor(mergedStyle.backgroundColor);
    }

    // Font weight
    if (mergedStyle.bold) {
      inkProps.bold = true;
    }

    // Font style
    if (mergedStyle.italic) {
      inkProps.italic = true;
    }

    // Text decoration
    if (mergedStyle.underline) {
      inkProps.underline = true;
    }

    // Dimmed appearance
    if (mergedStyle.dimColor) {
      inkProps.dimColor = true;
    }

    return inkProps;
  }
}

/**
 * Utility to create a terminal render adapter instance
 */
export function createTerminalRenderAdapter(): TerminalRenderAdapter {
  return new TerminalRenderAdapter();
}