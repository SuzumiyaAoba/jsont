/**
 * Zod validation schemas for jsont configuration
 * This provides runtime validation and type safety for configuration loading
 */

import { z } from "zod";
import type {
  BehaviorConfig,
  DisplayConfig,
  InterfaceConfig,
  JsonDisplayConfig,
  JsontConfig,
  KeyBindings,
  ModeKeys,
  NavigationConfig,
  NavigationKeys,
  SearchConfig,
  SearchKeys,
  TreeDisplayConfig,
} from "./types.js";

// Base primitive schemas
const stringArraySchema = z.array(z.string()).min(1);
const positiveNumberSchema = z.number().positive();
const nonNegativeNumberSchema = z.number().min(0);

// Navigation keys schema
const navigationKeysSchema = z.object({
  up: stringArraySchema,
  down: stringArraySchema,
  pageUp: stringArraySchema,
  pageDown: stringArraySchema,
  top: stringArraySchema,
  bottom: stringArraySchema,
}) satisfies z.ZodType<NavigationKeys>;

// Mode keys schema
const modeKeysSchema = z.object({
  search: stringArraySchema,
  schema: stringArraySchema,
  tree: stringArraySchema,
  collapsible: stringArraySchema,
  jq: stringArraySchema,
  lineNumbers: stringArraySchema,
  debug: stringArraySchema,
  help: stringArraySchema,
  export: stringArraySchema,
  exportData: stringArraySchema,
  quit: stringArraySchema,
}) satisfies z.ZodType<ModeKeys>;

// Search keys schema
const searchKeysSchema = z.object({
  next: stringArraySchema,
  previous: stringArraySchema,
  exit: stringArraySchema,
}) satisfies z.ZodType<SearchKeys>;

// Key bindings schema
const keyBindingsSchema = z.object({
  navigation: navigationKeysSchema,
  modes: modeKeysSchema,
  search: searchKeysSchema,
}) satisfies z.ZodType<KeyBindings>;

// JSON display configuration schema
const jsonDisplayConfigSchema = z.object({
  indent: positiveNumberSchema.max(10),
  useTabs: z.boolean(),
  maxLineLength: positiveNumberSchema.max(1000),
}) satisfies z.ZodType<JsonDisplayConfig>;

// Tree display configuration schema
const treeDisplayConfigSchema = z.object({
  showArrayIndices: z.boolean(),
  showPrimitiveValues: z.boolean(),
  maxValueLength: positiveNumberSchema.max(1000),
  useUnicodeTree: z.boolean(),
  showSchemaTypes: z.boolean(),
}) satisfies z.ZodType<TreeDisplayConfig>;

// Interface configuration schema
const interfaceConfigSchema = z.object({
  showLineNumbers: z.boolean(),
  debugMode: z.boolean(),
  defaultHeight: positiveNumberSchema.max(1000),
  showStatusBar: z.boolean(),
}) satisfies z.ZodType<InterfaceConfig>;

// Display configuration schema
const displayConfigSchema = z.object({
  json: jsonDisplayConfigSchema,
  tree: treeDisplayConfigSchema,
  interface: interfaceConfigSchema,
}) satisfies z.ZodType<DisplayConfig>;

// Search configuration schema
const searchConfigSchema = z.object({
  caseSensitive: z.boolean(),
  regex: z.boolean(),
  highlight: z.boolean(),
}) satisfies z.ZodType<SearchConfig>;

// Navigation configuration schema
const navigationConfigSchema = z.object({
  halfPageScroll: z.boolean(),
  autoScroll: z.boolean(),
  scrollOffset: nonNegativeNumberSchema.max(100),
}) satisfies z.ZodType<NavigationConfig>;

// Behavior configuration schema
const behaviorConfigSchema = z.object({
  search: searchConfigSchema,
  navigation: navigationConfigSchema,
}) satisfies z.ZodType<BehaviorConfig>;

// Full configuration schema
export const jsontConfigSchema = z.object({
  keybindings: keyBindingsSchema,
  display: displayConfigSchema,
  behavior: behaviorConfigSchema,
}) satisfies z.ZodType<JsontConfig>;

// Partial configuration schema for user overrides
export const partialJsontConfigSchema = z
  .object({
    keybindings: z
      .object({
        navigation: navigationKeysSchema.partial(),
        modes: modeKeysSchema.partial(),
        search: searchKeysSchema.partial(),
      })
      .partial(),
    display: z
      .object({
        json: jsonDisplayConfigSchema.partial(),
        tree: treeDisplayConfigSchema.partial(),
        interface: interfaceConfigSchema.partial(),
      })
      .partial(),
    behavior: z
      .object({
        search: searchConfigSchema.partial(),
        navigation: navigationConfigSchema.partial(),
      })
      .partial(),
  })
  .partial();

/**
 * Validate a complete configuration object
 */
export function validateJsontConfig(data: unknown): JsontConfig {
  return jsontConfigSchema.parse(data);
}

/**
 * Validate a partial configuration object (for user overrides)
 */
export function validatePartialJsontConfig(data: unknown) {
  return partialJsontConfigSchema.parse(data);
}

/**
 * Safe validation that returns validation result with error handling
 */
export function safeValidateJsontConfig(data: unknown) {
  return jsontConfigSchema.safeParse(data);
}

/**
 * Safe validation for partial configuration
 */
export function safeValidatePartialJsontConfig(data: unknown) {
  return partialJsontConfigSchema.safeParse(data);
}

/**
 * Get detailed validation errors in a human-readable format
 */
export function getValidationErrors(data: unknown): string[] {
  const result = partialJsontConfigSchema.safeParse(data);
  if (result.success) {
    return [];
  }

  if (!result.error) {
    return ["Unknown validation error"];
  }

  // Handle Zod error structure (ZodError has 'issues' property)
  try {
    if ("issues" in result.error && Array.isArray(result.error.issues)) {
      return result.error.issues.map((issue: unknown) => {
        if (typeof issue === "object" && issue !== null) {
          const issueObj = issue as { path?: unknown; message?: string };
          const path =
            Array.isArray(issueObj.path) && issueObj.path.length > 0
              ? issueObj.path.join(".")
              : "root";
          return `${path}: ${issueObj.message || "Invalid value"}`;
        }
        return "Invalid value";
      });
    }
  } catch {
    // Fallback if error structure is unexpected
  }

  return [
    `Validation error: ${result.error.message || "Invalid configuration"}`,
  ];
}

/**
 * Validate and coerce unknown data to partial config with fallbacks
 */
export function coerceToPartialConfig(data: unknown) {
  // First try direct validation
  const result = partialJsontConfigSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // For debug purposes, we can log validation details
  const errors = getValidationErrors(data);
  if (errors.length > 0) {
    console.warn(
      "Configuration validation failed, using defaults:",
      errors.join(", "),
    );
  }

  // If validation fails, return empty config to use defaults
  return {};
}
