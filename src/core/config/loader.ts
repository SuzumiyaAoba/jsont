/**
 * Configuration file loader for jsont application
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { load as yamlLoad } from "js-yaml";
import { DEFAULT_CONFIG } from "./defaults.js";
import type { JsontConfig, PartialJsontConfig } from "./types.js";

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return join(homedir(), ".config", "jsont", "config.yaml");
}

/**
 * Deep merge two configuration objects
 */
function mergeConfig(
  target: JsontConfig,
  source: PartialJsontConfig,
): JsontConfig {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key as keyof PartialJsontConfig];
    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      const targetValue = result[key as keyof JsontConfig];
      if (
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        result[key as keyof JsontConfig] = {
          ...targetValue,
          ...sourceValue,
        } as any;

        // Handle nested objects
        for (const nestedKey in sourceValue) {
          const nestedSourceValue =
            sourceValue[nestedKey as keyof typeof sourceValue];
          const nestedTargetValue = (targetValue as any)[nestedKey];
          if (
            nestedSourceValue &&
            typeof nestedSourceValue === "object" &&
            !Array.isArray(nestedSourceValue) &&
            nestedTargetValue &&
            typeof nestedTargetValue === "object" &&
            !Array.isArray(nestedTargetValue)
          ) {
            (result[key as keyof JsontConfig] as any)[nestedKey] = {
              ...(nestedTargetValue as Record<string, any>),
              ...(nestedSourceValue as Record<string, any>),
            };
          }
        }
      }
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Validate configuration object
 */
function validateConfig(config: any): PartialJsontConfig {
  // Basic validation - ensure required sections exist and have correct types
  const validated: PartialJsontConfig = {};

  if (config.keybindings && typeof config.keybindings === "object") {
    validated.keybindings = {};

    if (
      config.keybindings.navigation &&
      typeof config.keybindings.navigation === "object"
    ) {
      validated.keybindings.navigation = {};
      for (const [key, value] of Object.entries(
        config.keybindings.navigation,
      )) {
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          (validated.keybindings.navigation as any)[key] = value;
        }
      }
    }

    if (
      config.keybindings.modes &&
      typeof config.keybindings.modes === "object"
    ) {
      validated.keybindings.modes = {};
      for (const [key, value] of Object.entries(config.keybindings.modes)) {
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          (validated.keybindings.modes as any)[key] = value;
        }
      }
    }

    if (
      config.keybindings.search &&
      typeof config.keybindings.search === "object"
    ) {
      validated.keybindings.search = {};
      for (const [key, value] of Object.entries(config.keybindings.search)) {
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          (validated.keybindings.search as any)[key] = value;
        }
      }
    }
  }

  if (config.display && typeof config.display === "object") {
    validated.display = {};

    if (config.display.json && typeof config.display.json === "object") {
      validated.display.json = {};
      if (typeof config.display.json.indent === "number") {
        validated.display.json.indent = config.display.json.indent;
      }
      if (typeof config.display.json.useTabs === "boolean") {
        validated.display.json.useTabs = config.display.json.useTabs;
      }
      if (typeof config.display.json.maxLineLength === "number") {
        validated.display.json.maxLineLength =
          config.display.json.maxLineLength;
      }
    }

    if (config.display.tree && typeof config.display.tree === "object") {
      validated.display.tree = {};
      if (typeof config.display.tree.showArrayIndices === "boolean") {
        validated.display.tree.showArrayIndices =
          config.display.tree.showArrayIndices;
      }
      if (typeof config.display.tree.showPrimitiveValues === "boolean") {
        validated.display.tree.showPrimitiveValues =
          config.display.tree.showPrimitiveValues;
      }
      if (typeof config.display.tree.maxValueLength === "number") {
        validated.display.tree.maxValueLength =
          config.display.tree.maxValueLength;
      }
      if (typeof config.display.tree.useUnicodeTree === "boolean") {
        validated.display.tree.useUnicodeTree =
          config.display.tree.useUnicodeTree;
      }
      if (typeof config.display.tree.showSchemaTypes === "boolean") {
        validated.display.tree.showSchemaTypes =
          config.display.tree.showSchemaTypes;
      }
    }

    if (
      config.display.interface &&
      typeof config.display.interface === "object"
    ) {
      validated.display.interface = {};
      if (typeof config.display.interface.showLineNumbers === "boolean") {
        validated.display.interface.showLineNumbers =
          config.display.interface.showLineNumbers;
      }
      if (typeof config.display.interface.debugMode === "boolean") {
        validated.display.interface.debugMode =
          config.display.interface.debugMode;
      }
      if (typeof config.display.interface.defaultHeight === "number") {
        validated.display.interface.defaultHeight =
          config.display.interface.defaultHeight;
      }
      if (typeof config.display.interface.showStatusBar === "boolean") {
        validated.display.interface.showStatusBar =
          config.display.interface.showStatusBar;
      }
    }
  }

  if (config.behavior && typeof config.behavior === "object") {
    validated.behavior = {};

    if (config.behavior.search && typeof config.behavior.search === "object") {
      validated.behavior.search = {};
      if (typeof config.behavior.search.caseSensitive === "boolean") {
        validated.behavior.search.caseSensitive =
          config.behavior.search.caseSensitive;
      }
      if (typeof config.behavior.search.regex === "boolean") {
        validated.behavior.search.regex = config.behavior.search.regex;
      }
      if (typeof config.behavior.search.highlight === "boolean") {
        validated.behavior.search.highlight = config.behavior.search.highlight;
      }
    }

    if (
      config.behavior.navigation &&
      typeof config.behavior.navigation === "object"
    ) {
      validated.behavior.navigation = {};
      if (typeof config.behavior.navigation.halfPageScroll === "boolean") {
        validated.behavior.navigation.halfPageScroll =
          config.behavior.navigation.halfPageScroll;
      }
      if (typeof config.behavior.navigation.autoScroll === "boolean") {
        validated.behavior.navigation.autoScroll =
          config.behavior.navigation.autoScroll;
      }
      if (typeof config.behavior.navigation.scrollOffset === "number") {
        validated.behavior.navigation.scrollOffset =
          config.behavior.navigation.scrollOffset;
      }
    }
  }

  return validated;
}

/**
 * Load and parse the configuration file
 */
export function loadConfig(): JsontConfig {
  const configPath = getConfigPath();

  // Return default config if file doesn't exist
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = readFileSync(configPath, "utf-8");
    const parsedConfig = yamlLoad(fileContent) as any;

    // Validate and sanitize the configuration
    const validatedConfig = validateConfig(parsedConfig);

    // Merge with defaults
    return mergeConfig(DEFAULT_CONFIG, validatedConfig);
  } catch (error) {
    console.warn(`Warning: Failed to load config from ${configPath}:`, error);
    console.warn("Using default configuration.");
    return DEFAULT_CONFIG;
  }
}

/**
 * Get a specific configuration value by path
 */
export function getConfigValue<T = any>(config: JsontConfig, path: string): T {
  const keys = path.split(".");
  let current: any = config;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      throw new Error(`Configuration path "${path}" not found`);
    }
  }

  return current as T;
}
