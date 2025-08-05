/**
 * Multi-platform rendering system exports
 * Provides unified rendering abstraction for terminal and web UIs
 */

// Re-export key types for convenience
export type {
  BorderStyle,
  ButtonNode,
  ContainerNode,
  InputFieldOptions,
  InputNode,
  LayoutOptions,
  RenderCapabilities,
  RenderNode,
  RenderStyle,
  TextNode,
  TextStyle,
  ViewportInfo,
} from "./RenderSystem";
// Core rendering system
export * from "./RenderSystem";
export {
  RenderAdapter,
  RenderManager,
  RenderUtils,
} from "./RenderSystem";
// Platform-specific adapters
export * from "./TerminalRenderAdapter";
export {
  createTerminalRenderAdapter,
  TerminalRenderAdapter,
} from "./TerminalRenderAdapter";
export * from "./WebRenderAdapter";

export {
  createWebRenderAdapter,
  generateWebCSS,
  WebRenderAdapter,
} from "./WebRenderAdapter";
