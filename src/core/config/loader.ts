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
      ...source.keybindings,
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
      ...source.display,
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
      ...source.behavior,
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
 * Type guards for configuration validation
 */
function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isValidKeyBindings(value: unknown): value is Record<string, string[]> {
  if (!isObject(value)) return false;
  return Object.values(value).every(isStringArray);
}

/**
 * Validate configuration object
 */
function validateConfig(config: unknown): PartialJsontConfig {
  // Basic validation - ensure required sections exist and have correct types
  const validated: PartialJsontConfig = {};

  // Handle null or undefined config
  if (!isObject(config)) {
    return validated;
  }

  // Validate keybindings with safe type assertion
  const configObj = config as Record<string, any>;

  if (isObject(configObj.keybindings)) {
    validated.keybindings = {};

    if (isValidKeyBindings(configObj.keybindings.navigation)) {
      validated.keybindings.navigation = configObj.keybindings.navigation;
    }

    if (isValidKeyBindings(configObj.keybindings.modes)) {
      validated.keybindings.modes = configObj.keybindings.modes;
    }

    if (isValidKeyBindings(configObj.keybindings.search)) {
      validated.keybindings.search = configObj.keybindings.search;
    }
  }

  if (configObj.display && typeof configObj.display === "object") {
    validated.display = {};

    if (configObj.display.json && typeof configObj.display.json === "object") {
      validated.display.json = {};
      if (typeof configObj.display.json.indent === "number") {
        validated.display.json.indent = configObj.display.json.indent;
      }
      if (typeof configObj.display.json.useTabs === "boolean") {
        validated.display.json.useTabs = configObj.display.json.useTabs;
      }
      if (typeof configObj.display.json.maxLineLength === "number") {
        validated.display.json.maxLineLength =
          configObj.display.json.maxLineLength;
      }
    }

    if (configObj.display.tree && typeof configObj.display.tree === "object") {
      validated.display.tree = {};
      if (typeof configObj.display.tree.showArrayIndices === "boolean") {
        validated.display.tree.showArrayIndices =
          configObj.display.tree.showArrayIndices;
      }
      if (typeof configObj.display.tree.showPrimitiveValues === "boolean") {
        validated.display.tree.showPrimitiveValues =
          configObj.display.tree.showPrimitiveValues;
      }
      if (typeof configObj.display.tree.maxValueLength === "number") {
        validated.display.tree.maxValueLength =
          configObj.display.tree.maxValueLength;
      }
      if (typeof configObj.display.tree.useUnicodeTree === "boolean") {
        validated.display.tree.useUnicodeTree =
          configObj.display.tree.useUnicodeTree;
      }
      if (typeof configObj.display.tree.showSchemaTypes === "boolean") {
        validated.display.tree.showSchemaTypes =
          configObj.display.tree.showSchemaTypes;
      }
    }

    if (
      configObj.display.interface &&
      typeof configObj.display.interface === "object"
    ) {
      validated.display.interface = {};
      if (typeof configObj.display.interface.showLineNumbers === "boolean") {
        validated.display.interface.showLineNumbers =
          configObj.display.interface.showLineNumbers;
      }
      if (typeof configObj.display.interface.debugMode === "boolean") {
        validated.display.interface.debugMode =
          configObj.display.interface.debugMode;
      }
      if (typeof configObj.display.interface.defaultHeight === "number") {
        validated.display.interface.defaultHeight =
          configObj.display.interface.defaultHeight;
      }
      if (typeof configObj.display.interface.showStatusBar === "boolean") {
        validated.display.interface.showStatusBar =
          configObj.display.interface.showStatusBar;
      }
    }
  }

  if (configObj.behavior && typeof configObj.behavior === "object") {
    validated.behavior = {};

    if (
      configObj.behavior.search &&
      typeof configObj.behavior.search === "object"
    ) {
      validated.behavior.search = {};
      if (typeof configObj.behavior.search.caseSensitive === "boolean") {
        validated.behavior.search.caseSensitive =
          configObj.behavior.search.caseSensitive;
      }
      if (typeof configObj.behavior.search.regex === "boolean") {
        validated.behavior.search.regex = configObj.behavior.search.regex;
      }
      if (typeof configObj.behavior.search.highlight === "boolean") {
        validated.behavior.search.highlight =
          configObj.behavior.search.highlight;
      }
    }

    if (
      configObj.behavior.navigation &&
      typeof configObj.behavior.navigation === "object"
    ) {
      validated.behavior.navigation = {};
      if (typeof configObj.behavior.navigation.halfPageScroll === "boolean") {
        validated.behavior.navigation.halfPageScroll =
          configObj.behavior.navigation.halfPageScroll;
      }
      if (typeof configObj.behavior.navigation.autoScroll === "boolean") {
        validated.behavior.navigation.autoScroll =
          configObj.behavior.navigation.autoScroll;
      }
      if (typeof configObj.behavior.navigation.scrollOffset === "number") {
        validated.behavior.navigation.scrollOffset =
          configObj.behavior.navigation.scrollOffset;
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
    const parsedConfig = yamlLoad(fileContent) as unknown;

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
export function getConfigValue<T = unknown>(
  config: JsontConfig,
  path: string,
): T {
  const keys = path.split(".");
  let current: unknown = config;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, any>)[key];
    } else {
      throw new Error(`Configuration path "${path}" not found`);
    }
  }

  return current as T;
}
