/**
 * Configuration management exports
 */

export { DEFAULT_CONFIG } from "./defaults.js";
export { getConfigPath, getConfigValue, loadConfig } from "./loader.js";
export type {
  BehaviorConfig,
  DisplayConfig,
  InterfaceConfig,
  JsonDisplayConfig,
  JsontConfig,
  KeyBinding,
  KeyBindings,
  ModeKeys,
  NavigationConfig,
  NavigationKeys,
  PartialJsontConfig,
  SearchConfig,
  SearchKeys,
  TreeDisplayConfig,
} from "./types.js";
