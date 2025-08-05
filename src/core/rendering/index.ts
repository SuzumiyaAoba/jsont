/**
 * Multi-platform rendering system exports
 * Provides unified rendering abstraction for terminal and web UIs
 */

// Core rendering system
export * from "./RenderSystem";

// Platform-specific adapters
export * from "./TerminalRenderAdapter";
export * from "./WebRenderAdapter";

// Re-export key types for convenience
export type {
  RenderNode,
  ContainerNode,
  TextNode,
  InputNode,
  ButtonNode,
  RenderStyle,
  LayoutOptions,
  TextStyle,
  BorderStyle,
  InputFieldOptions,
  ViewportInfo,
  RenderCapabilities,
} from "./RenderSystem";

export {
  RenderAdapter,
  RenderManager,
  RenderUtils,
} from "./RenderSystem";

export {
  TerminalRenderAdapter,
  createTerminalRenderAdapter,
} from "./TerminalRenderAdapter";

export {
  WebRenderAdapter,
  createWebRenderAdapter,
  generateWebCSS,
} from "./WebRenderAdapter";