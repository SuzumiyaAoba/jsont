/**
 * Configuration file loader for jsont application
 * Now using Zod for robust runtime validation
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createDefu } from "defu";
import { load as yamlLoad } from "js-yaml";
import { DEFAULT_CONFIG } from "./defaults.js";
import {
  coerceToPartialConfig,
  getValidationErrors,
  safeValidatePartialJsontConfig,
} from "./schema.js";
import type { JsontConfig, PartialJsontConfig } from "./types.js";

/**
 * Custom defu instance that replaces arrays instead of concatenating them
 * This is useful for configuration where we want to completely override arrays
 * rather than merge them (e.g., keybindings should replace, not accumulate)
 */
const defuReplaceArray = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) || Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
  return false;
});

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return join(homedir(), ".config", "jsont", "config.yaml");
}

/**
 * Deep merge configuration objects using defu for better default value handling
 * defu provides intelligent merging that handles arrays, nested objects, and null values properly
 * Uses custom merger to replace arrays instead of concatenating them
 */
function mergeConfig(
  source: PartialJsontConfig,
  ...defaults: JsontConfig[]
): JsontConfig {
  // Use custom defu instance that replaces arrays instead of concatenating
  // This ensures that array values are completely replaced, not merged
  return defuReplaceArray(source, ...defaults) as JsontConfig;
}

/**
 * Validate configuration object using Zod schemas
 * This provides robust runtime validation with detailed error messages
 */
function validateConfig(config: unknown): PartialJsontConfig {
  // Use Zod-based validation with fallback to empty config
  return coerceToPartialConfig(config) as PartialJsontConfig;
}

/**
 * Load and parse the configuration file with enhanced Zod validation
 */
export function loadConfig(): JsontConfig {
  const configPath = getConfigPath();

  // Return default config if file doesn't exist
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = readFileSync(configPath, "utf-8");
    const parsedConfig = yamlLoad(fileContent) as unknown;

    // Validate using Zod with detailed error reporting
    const validationResult = safeValidatePartialJsontConfig(parsedConfig);

    if (!validationResult.success) {
      const errors = getValidationErrors(parsedConfig);
      console.warn(`Configuration validation warnings in ${configPath}:`);
      for (const error of errors) {
        console.warn(`  - ${error}`);
      }
      console.warn("Invalid values will be ignored and defaults will be used.");
    }

    // Use coercion for robust handling of invalid data
    const validatedConfig = validateConfig(parsedConfig);

    // Merge with defaults using defu
    return mergeConfig(validatedConfig, DEFAULT_CONFIG);
  } catch (error) {
    if (error instanceof Error) {
      console.warn(
        `Warning: Failed to load config from ${configPath}: ${error.message}`,
      );
    } else {
      console.warn(`Warning: Failed to load config from ${configPath}:`, error);
    }
    console.warn("Using default configuration.");
    return DEFAULT_CONFIG;
  }
}

/**
 * Get a specific configuration value by path
 */
export function getConfigValue<T = unknown>(
  config: JsontConfig,
  path: string,
): T {
  const keys = path.split(".");
  let current: unknown = config;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      throw new Error(`Configuration path "${path}" not found`);
    }
  }

  return current as T;
}

/**
 * Validate a configuration object and return validation details
 * Useful for debugging configuration issues
 */
export function validateConfigWithDetails(config: unknown): {
  isValid: boolean;
  errors: string[];
  validatedConfig: PartialJsontConfig;
} {
  const validationResult = safeValidatePartialJsontConfig(config);
  const errors = validationResult.success ? [] : getValidationErrors(config);
  const validatedConfig = coerceToPartialConfig(config);

  return {
    isValid: validationResult.success,
    errors,
    validatedConfig: validatedConfig as PartialJsontConfig,
  };
}

/**
 * Load configuration from a custom path (useful for testing)
 */
export function loadConfigFromPath(configPath: string): JsontConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const fileContent = readFileSync(configPath, "utf-8");
    const parsedConfig = yamlLoad(fileContent) as unknown;
    const validatedConfig = validateConfig(parsedConfig);
    return mergeConfig(validatedConfig, DEFAULT_CONFIG);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Create a configuration object with defu-powered defaults
 * This function allows for easy creation of configuration objects with proper defaults
 */
export function createConfig(
  userConfig: PartialJsontConfig = {},
  customDefaults?: Partial<JsontConfig>,
): JsontConfig {
  const defaults = customDefaults
    ? mergeConfig(customDefaults as PartialJsontConfig, DEFAULT_CONFIG)
    : DEFAULT_CONFIG;

  return mergeConfig(userConfig, defaults);
}

/**
 * Merge multiple partial configurations with defaults
 * Useful for layered configuration (e.g., global -> user -> project)
 */
export function mergeConfigs(
  configs: PartialJsontConfig[],
  baseDefaults: JsontConfig = DEFAULT_CONFIG,
): JsontConfig {
  return defuReplaceArray({}, ...configs, baseDefaults) as JsontConfig;
}

/**
 * Create a partial configuration with intelligent defaults
 * Only includes non-default values, useful for config file generation
 */
export function createPartialConfig(
  userConfig: PartialJsontConfig,
  removeDefaults: boolean = true,
): PartialJsontConfig {
  if (!removeDefaults) {
    return userConfig;
  }

  // Create a deep copy to avoid mutations
  const result: PartialJsontConfig = {};

  // Helper function to check if a value differs from default
  const isDifferentFromDefault = (
    userValue: unknown,
    defaultValue: unknown,
  ): boolean => {
    if (Array.isArray(userValue) && Array.isArray(defaultValue)) {
      return JSON.stringify(userValue) !== JSON.stringify(defaultValue);
    }
    if (
      typeof userValue === "object" &&
      typeof defaultValue === "object" &&
      userValue !== null &&
      defaultValue !== null
    ) {
      return JSON.stringify(userValue) !== JSON.stringify(defaultValue);
    }
    return userValue !== defaultValue;
  };

  // Process keybindings
  if (userConfig.keybindings) {
    const keybindingsDiff: PartialJsontConfig["keybindings"] = {};
    let hasKeybindingChanges = false;

    if (
      userConfig.keybindings.navigation &&
      isDifferentFromDefault(
        userConfig.keybindings.navigation,
        DEFAULT_CONFIG.keybindings.navigation,
      )
    ) {
      keybindingsDiff.navigation = userConfig.keybindings.navigation;
      hasKeybindingChanges = true;
    }

    if (
      userConfig.keybindings.modes &&
      isDifferentFromDefault(
        userConfig.keybindings.modes,
        DEFAULT_CONFIG.keybindings.modes,
      )
    ) {
      keybindingsDiff.modes = userConfig.keybindings.modes;
      hasKeybindingChanges = true;
    }

    if (
      userConfig.keybindings.search &&
      isDifferentFromDefault(
        userConfig.keybindings.search,
        DEFAULT_CONFIG.keybindings.search,
      )
    ) {
      keybindingsDiff.search = userConfig.keybindings.search;
      hasKeybindingChanges = true;
    }

    if (hasKeybindingChanges) {
      result.keybindings = keybindingsDiff;
    }
  }

  // Process display settings
  if (userConfig.display) {
    const displayDiff: PartialJsontConfig["display"] = {};
    let hasDisplayChanges = false;

    if (
      userConfig.display.json &&
      isDifferentFromDefault(
        userConfig.display.json,
        DEFAULT_CONFIG.display.json,
      )
    ) {
      displayDiff.json = userConfig.display.json;
      hasDisplayChanges = true;
    }

    if (
      userConfig.display.tree &&
      isDifferentFromDefault(
        userConfig.display.tree,
        DEFAULT_CONFIG.display.tree,
      )
    ) {
      displayDiff.tree = userConfig.display.tree;
      hasDisplayChanges = true;
    }

    if (
      userConfig.display.interface &&
      isDifferentFromDefault(
        userConfig.display.interface,
        DEFAULT_CONFIG.display.interface,
      )
    ) {
      displayDiff.interface = userConfig.display.interface;
      hasDisplayChanges = true;
    }

    if (hasDisplayChanges) {
      result.display = displayDiff;
    }
  }

  // Process behavior settings
  if (userConfig.behavior) {
    const behaviorDiff: PartialJsontConfig["behavior"] = {};
    let hasBehaviorChanges = false;

    if (
      userConfig.behavior.search &&
      isDifferentFromDefault(
        userConfig.behavior.search,
        DEFAULT_CONFIG.behavior.search,
      )
    ) {
      behaviorDiff.search = userConfig.behavior.search;
      hasBehaviorChanges = true;
    }

    if (
      userConfig.behavior.navigation &&
      isDifferentFromDefault(
        userConfig.behavior.navigation,
        DEFAULT_CONFIG.behavior.navigation,
      )
    ) {
      behaviorDiff.navigation = userConfig.behavior.navigation;
      hasBehaviorChanges = true;
    }

    if (hasBehaviorChanges) {
      result.behavior = behaviorDiff;
    }
  }

  return result;
}
