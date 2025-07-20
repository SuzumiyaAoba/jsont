/**
 * Configuration file loader for jsont application
 * Now using Zod for robust runtime validation
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { load as yamlLoad } from "js-yaml";
import { DEFAULT_CONFIG } from "./defaults.js";
import {
  coerceToPartialConfig,
  getValidationErrors,
  safeValidatePartialJsontConfig,
} from "./schema.js";
import type { JsontConfig, PartialJsontConfig } from "./types.js";

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return join(homedir(), ".config", "jsont", "config.yaml");
}

/**
 * Deep merge two configuration objects with type safety
 */
function mergeConfig(
  target: JsontConfig,
  source: PartialJsontConfig,
): JsontConfig {
  const result: JsontConfig = { ...target };

  // Handle keybindings
  if (source.keybindings) {
    result.keybindings = {
      ...target.keybindings,
      navigation: {
        ...target.keybindings.navigation,
        ...source.keybindings.navigation,
      },
      modes: {
        ...target.keybindings.modes,
        ...source.keybindings.modes,
      },
      search: {
        ...target.keybindings.search,
        ...source.keybindings.search,
      },
    };
  }

  // Handle display
  if (source.display) {
    result.display = {
      ...target.display,
      json: {
        ...target.display.json,
        ...source.display.json,
      },
      tree: {
        ...target.display.tree,
        ...source.display.tree,
      },
      interface: {
        ...target.display.interface,
        ...source.display.interface,
      },
    };
  }

  // Handle behavior
  if (source.behavior) {
    result.behavior = {
      ...target.behavior,
      search: {
        ...target.behavior.search,
        ...source.behavior.search,
      },
      navigation: {
        ...target.behavior.navigation,
        ...source.behavior.navigation,
      },
    };
  }

  return result;
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

    // Merge with defaults
    return mergeConfig(DEFAULT_CONFIG, validatedConfig);
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
    return mergeConfig(DEFAULT_CONFIG, validatedConfig);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${error.message}`,
      );
    }
    throw error;
  }
}
