/**
 * Help feature exports
 */

export type { HelpViewerProps } from "./components/HelpViewer";
export { HelpViewer } from "./components/HelpViewer";

export type {
  HelpAction,
  HelpActionType,
  HelpContent,
  HelpSection,
  HelpShortcut,
  HelpState,
} from "./types/help";

export {
  createInitialHelpState,
  formatShortcut,
  getAvailableModes,
  getHelpContentForMode,
  getQuickHelpText,
  getShortcutsByCategory,
  isHelpKey,
} from "./utils/helpUtils";
