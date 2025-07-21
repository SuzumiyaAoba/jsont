/**
 * Configuration management exports
 */

export { DEFAULT_CONFIG } from "./defaults.js";
export {
  createConfig,
  createPartialConfig,
  getConfigPath,
  getConfigValue,
  loadConfig,
  loadConfigFromPath,
  mergeConfigs,
  validateConfigWithDetails,
} from "./loader.js";
export type {
  BehaviorConfig,
  DisplayConfig,
  InterfaceConfig,
  JsonDisplayConfig,
  JsontConfig,
  KeyBindings,
  ModeKeys,
  NavigationConfig,
  NavigationKeys,
  PartialJsontConfig,
  SearchConfig,
  SearchKeys,
  TreeDisplayConfig,
} from "./types.js";
export {
  applyConfigPreset,
  CONFIG_BUILDERS,
  CONFIG_PRESETS,
  createConfigPreset,
  getConfigDiff,
  getConfigSummary,
  isDefaultConfig,
  smartMergeConfigs,
} from "./utils.js";
