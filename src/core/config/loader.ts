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
function isObject(value: unknown): value is Record<string, unknown> {
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
  const configObj = config as Record<string, unknown>;

  if (isObject(configObj["keybindings"])) {
    validated.keybindings = {};

    if (isValidKeyBindings(configObj["keybindings"]["navigation"])) {
      validated.keybindings.navigation = configObj["keybindings"]["navigation"];
    }

    if (isValidKeyBindings(configObj["keybindings"]["modes"])) {
      validated.keybindings.modes = configObj["keybindings"]["modes"];
    }

    if (isValidKeyBindings(configObj["keybindings"]["search"])) {
      validated.keybindings.search = configObj["keybindings"]["search"];
    }
  }

  if (configObj["display"] && typeof configObj["display"] === "object") {
    validated.display = {};
    const displayObj = configObj["display"] as Record<string, unknown>;

    if (displayObj["json"] && typeof displayObj["json"] === "object") {
      validated.display.json = {};
      const jsonObj = displayObj["json"] as Record<string, unknown>;
      if (typeof jsonObj["indent"] === "number") {
        validated.display.json.indent = jsonObj["indent"];
      }
      if (typeof jsonObj["useTabs"] === "boolean") {
        validated.display.json.useTabs = jsonObj["useTabs"];
      }
      if (typeof jsonObj["maxLineLength"] === "number") {
        validated.display.json.maxLineLength = jsonObj["maxLineLength"];
      }
    }

    if (displayObj["tree"] && typeof displayObj["tree"] === "object") {
      validated.display.tree = {};
      const treeObj = displayObj["tree"] as Record<string, unknown>;
      if (typeof treeObj["showArrayIndices"] === "boolean") {
        validated.display.tree.showArrayIndices = treeObj["showArrayIndices"];
      }
      if (typeof treeObj["showPrimitiveValues"] === "boolean") {
        validated.display.tree.showPrimitiveValues =
          treeObj["showPrimitiveValues"];
      }
      if (typeof treeObj["maxValueLength"] === "number") {
        validated.display.tree.maxValueLength = treeObj["maxValueLength"];
      }
      if (typeof treeObj["useUnicodeTree"] === "boolean") {
        validated.display.tree.useUnicodeTree = treeObj["useUnicodeTree"];
      }
      if (typeof treeObj["showSchemaTypes"] === "boolean") {
        validated.display.tree.showSchemaTypes = treeObj["showSchemaTypes"];
      }
    }

    if (
      displayObj["interface"] &&
      typeof displayObj["interface"] === "object"
    ) {
      validated.display.interface = {};
      const interfaceObj = displayObj["interface"] as Record<string, unknown>;
      if (typeof interfaceObj["showLineNumbers"] === "boolean") {
        validated.display.interface.showLineNumbers =
          interfaceObj["showLineNumbers"];
      }
      if (typeof interfaceObj["debugMode"] === "boolean") {
        validated.display.interface.debugMode = interfaceObj["debugMode"];
      }
      if (typeof interfaceObj["defaultHeight"] === "number") {
        validated.display.interface.defaultHeight =
          interfaceObj["defaultHeight"];
      }
      if (typeof interfaceObj["showStatusBar"] === "boolean") {
        validated.display.interface.showStatusBar =
          interfaceObj["showStatusBar"];
      }
    }
  }

  if (configObj["behavior"] && typeof configObj["behavior"] === "object") {
    validated.behavior = {};
    const behaviorObj = configObj["behavior"] as Record<string, unknown>;

    if (behaviorObj["search"] && typeof behaviorObj["search"] === "object") {
      validated.behavior.search = {};
      const searchObj = behaviorObj["search"] as Record<string, unknown>;
      if (typeof searchObj["caseSensitive"] === "boolean") {
        validated.behavior.search.caseSensitive = searchObj["caseSensitive"];
      }
      if (typeof searchObj["regex"] === "boolean") {
        validated.behavior.search.regex = searchObj["regex"];
      }
      if (typeof searchObj["highlight"] === "boolean") {
        validated.behavior.search.highlight = searchObj["highlight"];
      }
    }

    if (
      behaviorObj["navigation"] &&
      typeof behaviorObj["navigation"] === "object"
    ) {
      validated.behavior.navigation = {};
      const navigationObj = behaviorObj["navigation"] as Record<
        string,
        unknown
      >;
      if (typeof navigationObj["halfPageScroll"] === "boolean") {
        validated.behavior.navigation.halfPageScroll =
          navigationObj["halfPageScroll"];
      }
      if (typeof navigationObj["autoScroll"] === "boolean") {
        validated.behavior.navigation.autoScroll = navigationObj["autoScroll"];
      }
      if (typeof navigationObj["scrollOffset"] === "number") {
        validated.behavior.navigation.scrollOffset =
          navigationObj["scrollOffset"];
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
      current = (current as Record<string, unknown>)[key];
    } else {
      throw new Error(`Configuration path "${path}" not found`);
    }
  }

  return current as T;
}
