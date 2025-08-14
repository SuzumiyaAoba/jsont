/**
 * Configuration types for jsont application
 * These types are now derived from Zod schemas to ensure consistency
 */

// Re-export all types from schema to maintain backward compatibility
export type {
  AppearanceConfig,
  BehaviorConfig,
  BorderConfig,
  ColorConfig,
  DisplayConfig,
  HeightConfig,
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
} from "./schema";
