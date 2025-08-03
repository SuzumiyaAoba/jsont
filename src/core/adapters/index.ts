/**
 * UI adapter interfaces and implementations
 * Enables multiple UI frontends (TUI, Web, etc.)
 */

export type {
  ConfigChangeEvent,
  DisplayDimensions,
  FileOperationRequest,
  FileOperationResult,
  RenderContext,
  UIEvent,
  UIInputEvent,
  UIRenderData,
  UIUpdateInstruction,
} from "./UIAdapter";
export { UIAdapter, UIController } from "./UIAdapter";
