/**
 * Configuration utilities using defu for better default handling
 */

import { createDefu } from "defu";
import { DEFAULT_CONFIG } from "./defaults";
import type { JsontConfig, PartialJsontConfig } from "./types";

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
 * Create a themed configuration preset
 * Allows for easy creation of configuration themes/presets
 */
export function createConfigPreset(
  name: string,
  preset: PartialJsontConfig,
): { name: string; config: JsontConfig } {
  return {
    name,
    config: defuReplaceArray(preset, DEFAULT_CONFIG) as JsontConfig,
  };
}

/**
 * Built-in configuration presets
 */
export const CONFIG_PRESETS = {
  minimal: createConfigPreset("minimal", {
    display: {
      interface: {
        showLineNumbers: false,
        showStatusBar: false,
        debugMode: false,
      },
      tree: {
        showArrayIndices: false,
        showSchemaTypes: false,
        useUnicodeTree: false,
      },
    },
  }),

  developer: createConfigPreset("developer", {
    display: {
      interface: {
        showLineNumbers: true,
        showStatusBar: true,
        debugMode: true,
      },
      tree: {
        showArrayIndices: true,
        showSchemaTypes: true,
        showPrimitiveValues: true,
      },
      json: {
        indent: 4,
        maxLineLength: 120,
      },
    },
    behavior: {
      search: {
        regex: true,
        highlight: true,
      },
    },
  }),

  compact: createConfigPreset("compact", {
    display: {
      json: {
        indent: 1,
        maxLineLength: 60,
      },
      tree: {
        maxValueLength: 30,
        showPrimitiveValues: false,
      },
      interface: {
        defaultHeight: 20,
      },
    },
  }),

  accessibility: createConfigPreset("accessibility", {
    display: {
      interface: {
        showLineNumbers: true,
        showStatusBar: true,
      },
      tree: {
        useUnicodeTree: false, // Use ASCII for better screen reader support
        showSchemaTypes: true,
        maxValueLength: 80,
      },
    },
    behavior: {
      navigation: {
        halfPageScroll: false, // Full page scroll for easier navigation
        scrollOffset: 3, // More context when scrolling
      },
    },
  }),
} as const;

/**
 * Apply a configuration preset with optional overrides
 */
export function applyConfigPreset(
  presetName: keyof typeof CONFIG_PRESETS,
  overrides: PartialJsontConfig = {},
): JsontConfig {
  const preset = CONFIG_PRESETS[presetName];
  return defuReplaceArray(overrides, preset.config) as JsontConfig;
}

/**
 * Create a configuration for specific use cases
 */
export const CONFIG_BUILDERS = {
  /**
   * Configuration optimized for large JSON files
   */
  forLargeFiles: (customizations: PartialJsontConfig = {}): JsontConfig => {
    const optimized: PartialJsontConfig = {
      display: {
        tree: {
          maxValueLength: 20, // Shorter values for performance
          showPrimitiveValues: false, // Hide values for large files
        },
        json: {
          maxLineLength: 100,
        },
      },
      behavior: {
        navigation: {
          halfPageScroll: true,
          autoScroll: false, // Disable auto-scroll for better performance
        },
      },
    };
    return defuReplaceArray(
      customizations,
      optimized,
      DEFAULT_CONFIG,
    ) as JsontConfig;
  },

  /**
   * Configuration optimized for small terminal windows
   */
  forSmallTerminal: (customizations: PartialJsontConfig = {}): JsontConfig => {
    const compact: PartialJsontConfig = {
      display: {
        interface: {
          showStatusBar: false, // Save space
          defaultHeight: 15,
        },
        json: {
          maxLineLength: 50,
          indent: 1,
        },
        tree: {
          maxValueLength: 25,
          useUnicodeTree: false, // ASCII takes less space
        },
      },
    };
    return defuReplaceArray(
      customizations,
      compact,
      DEFAULT_CONFIG,
    ) as JsontConfig;
  },

  /**
   * Configuration for debugging and development
   */
  forDebugging: (customizations: PartialJsontConfig = {}): JsontConfig => {
    const debug: PartialJsontConfig = {
      display: {
        interface: {
          debugMode: true,
          showLineNumbers: true,
          showStatusBar: true,
        },
        tree: {
          showSchemaTypes: true,
          showArrayIndices: true,
          showPrimitiveValues: true,
        },
      },
    };
    return defuReplaceArray(
      customizations,
      debug,
      DEFAULT_CONFIG,
    ) as JsontConfig;
  },

  /**
   * Configuration for presentation/demo mode
   */
  forPresentation: (customizations: PartialJsontConfig = {}): JsontConfig => {
    const presentation: PartialJsontConfig = {
      display: {
        interface: {
          showLineNumbers: false,
          showStatusBar: false,
        },
        tree: {
          useUnicodeTree: true,
          showSchemaTypes: false,
          maxValueLength: 40,
        },
        json: {
          indent: 2,
          maxLineLength: 80,
        },
      },
    };
    return defuReplaceArray(
      customizations,
      presentation,
      DEFAULT_CONFIG,
    ) as JsontConfig;
  },
} as const;

/**
 * Merge configurations with intelligent array handling
 * Uses defu's smart merging that replaces arrays instead of concatenating
 */
export function smartMergeConfigs(
  ...configs: (PartialJsontConfig | JsontConfig)[]
): JsontConfig {
  return defuReplaceArray({}, ...configs, DEFAULT_CONFIG) as JsontConfig;
}

/**
 * Create a configuration diff showing what changed from defaults
 */
export function getConfigDiff(config: JsontConfig): PartialJsontConfig {
  const diff: PartialJsontConfig = {};

  // Compare keybindings
  if (
    JSON.stringify(config.keybindings) !==
    JSON.stringify(DEFAULT_CONFIG.keybindings)
  ) {
    diff.keybindings = config.keybindings;
  }

  // Compare display settings
  if (
    JSON.stringify(config.display) !== JSON.stringify(DEFAULT_CONFIG.display)
  ) {
    diff.display = config.display;
  }

  // Compare behavior settings
  if (
    JSON.stringify(config.behavior) !== JSON.stringify(DEFAULT_CONFIG.behavior)
  ) {
    diff.behavior = config.behavior;
  }

  return diff;
}

/**
 * Validate if a configuration is effectively the same as defaults
 */
export function isDefaultConfig(config: JsontConfig): boolean {
  return JSON.stringify(config) === JSON.stringify(DEFAULT_CONFIG);
}

/**
 * Get a human-readable summary of configuration changes
 */
export function getConfigSummary(config: JsontConfig): string[] {
  const changes: string[] = [];
  const diff = getConfigDiff(config);

  if (diff.keybindings) {
    changes.push("Custom keybindings configured");
  }

  if (diff.display?.interface?.showLineNumbers !== undefined) {
    changes.push(
      `Line numbers: ${diff.display.interface.showLineNumbers ? "enabled" : "disabled"}`,
    );
  }

  if (diff.display?.interface?.debugMode !== undefined) {
    changes.push(
      `Debug mode: ${diff.display.interface.debugMode ? "enabled" : "disabled"}`,
    );
  }

  if (diff.display?.tree?.useUnicodeTree !== undefined) {
    changes.push(
      `Tree style: ${diff.display.tree.useUnicodeTree ? "Unicode" : "ASCII"}`,
    );
  }

  if (diff.display?.json?.indent !== undefined) {
    changes.push(`JSON indent: ${diff.display.json.indent} spaces`);
  }

  if (diff.behavior?.search?.caseSensitive !== undefined) {
    changes.push(
      `Search: ${diff.behavior.search.caseSensitive ? "case-sensitive" : "case-insensitive"}`,
    );
  }

  return changes.length > 0 ? changes : ["Using default configuration"];
}
