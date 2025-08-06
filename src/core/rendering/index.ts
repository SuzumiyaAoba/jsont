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
} from "@core/rendering/RenderSystem";
// Core rendering system
export * from "@core/rendering/RenderSystem";
export {
  RenderAdapter,
  RenderManager,
  RenderUtils,
} from "@core/rendering/RenderSystem";
// Platform-specific adapters
export * from "@core/rendering/TerminalRenderAdapter";
export {
  createTerminalRenderAdapter,
  TerminalRenderAdapter,
} from "@core/rendering/TerminalRenderAdapter";
export * from "@core/rendering/WebRenderAdapter";

export {
  createWebRenderAdapter,
  generateWebCSS,
  WebRenderAdapter,
} from "@core/rendering/WebRenderAdapter";
