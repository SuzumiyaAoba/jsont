/**
 * Tests for configuration utilities with defu
 */

import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.js";
import type { JsontConfig, PartialJsontConfig } from "../types.js";
import {
  applyConfigPreset,
  CONFIG_BUILDERS,
  CONFIG_PRESETS,
  createConfigPreset,
  getConfigDiff,
  getConfigSummary,
  isDefaultConfig,
  smartMergeConfigs,
} from "../utils.js";

describe("Configuration Utils with defu", () => {
  describe("createConfigPreset", () => {
    it("should create a named configuration preset", () => {
      const customPreset = createConfigPreset("test", {
        display: {
          interface: {
            showLineNumbers: true,
          },
        },
      });

      expect(customPreset.name).toBe("test");
      expect(customPreset.config.display.interface.showLineNumbers).toBe(true);
      // Should preserve defaults for other values
      expect(customPreset.config.display.interface.debugMode).toBe(
        DEFAULT_CONFIG.display.interface.debugMode,
      );
    });
  });

  describe("CONFIG_PRESETS", () => {
    it("should have built-in presets available", () => {
      expect(CONFIG_PRESETS.minimal).toBeDefined();
      expect(CONFIG_PRESETS.developer).toBeDefined();
      expect(CONFIG_PRESETS.compact).toBeDefined();
      expect(CONFIG_PRESETS.accessibility).toBeDefined();
    });

    it("should have minimal preset with reduced UI", () => {
      const minimal = CONFIG_PRESETS.minimal.config;
      expect(minimal.display.interface.showLineNumbers).toBe(false);
      expect(minimal.display.interface.showStatusBar).toBe(false);
      expect(minimal.display.tree.showArrayIndices).toBe(false);
    });

    it("should have developer preset with enhanced features", () => {
      const developer = CONFIG_PRESETS.developer.config;
      expect(developer.display.interface.debugMode).toBe(true);
      expect(developer.display.tree.showSchemaTypes).toBe(true);
      expect(developer.behavior.search.regex).toBe(true);
    });

    it("should have accessibility preset with screen reader support", () => {
      const accessibility = CONFIG_PRESETS.accessibility.config;
      expect(accessibility.display.tree.useUnicodeTree).toBe(false); // ASCII for screen readers
      expect(accessibility.behavior.navigation.halfPageScroll).toBe(false);
      expect(accessibility.behavior.navigation.scrollOffset).toBe(3);
    });
  });

  describe("applyConfigPreset", () => {
    it("should apply preset with overrides", () => {
      const config = applyConfigPreset("minimal", {
        display: {
          interface: {
            debugMode: true, // Override minimal preset
          },
        },
      });

      // Should have minimal preset values
      expect(config.display.interface.showLineNumbers).toBe(false);
      // But also have the override
      expect(config.display.interface.debugMode).toBe(true);
    });

    it("should handle array overrides correctly", () => {
      const config = applyConfigPreset("developer", {
        keybindings: {
          navigation: {
            up: ["w"], // Override default array
          },
        },
      });

      // Should replace the entire array, not merge
      expect(config.keybindings.navigation.up).toEqual(["w"]);
      // Other navigation keys should remain from defaults
      expect(config.keybindings.navigation.down).toEqual(
        DEFAULT_CONFIG.keybindings.navigation.down,
      );
    });
  });

  describe("CONFIG_BUILDERS", () => {
    it("should have builder for large files", () => {
      const config = CONFIG_BUILDERS.forLargeFiles();
      expect(config.display.tree.maxValueLength).toBe(20);
      expect(config.display.tree.showPrimitiveValues).toBe(false);
      expect(config.behavior.navigation.autoScroll).toBe(false);
    });

    it("should have builder for small terminals", () => {
      const config = CONFIG_BUILDERS.forSmallTerminal();
      expect(config.display.interface.showStatusBar).toBe(false);
      expect(config.display.interface.defaultHeight).toBe(15);
      expect(config.display.tree.useUnicodeTree).toBe(false);
    });

    it("should have builder for debugging", () => {
      const config = CONFIG_BUILDERS.forDebugging();
      expect(config.display.interface.debugMode).toBe(true);
      expect(config.display.tree.showSchemaTypes).toBe(true);
    });

    it("should have builder for presentations", () => {
      const config = CONFIG_BUILDERS.forPresentation();
      expect(config.display.interface.showLineNumbers).toBe(false);
      expect(config.display.interface.showStatusBar).toBe(false);
      expect(config.display.tree.useUnicodeTree).toBe(true);
    });

    it("should allow customizations in builders", () => {
      const config = CONFIG_BUILDERS.forLargeFiles({
        display: {
          json: {
            indent: 4, // Custom override
          },
        },
      });

      // Should have both builder optimizations and custom values
      expect(config.display.tree.maxValueLength).toBe(20); // From builder
      expect(config.display.json.indent).toBe(4); // From customization
    });
  });

  describe("smartMergeConfigs", () => {
    it("should merge multiple configurations intelligently", () => {
      const config1: PartialJsontConfig = {
        display: {
          interface: {
            showLineNumbers: true,
          },
        },
      };

      const config2: PartialJsontConfig = {
        display: {
          tree: {
            showArrayIndices: false,
          },
        },
      };

      const config3: PartialJsontConfig = {
        keybindings: {
          navigation: {
            up: ["w"],
          },
        },
      };

      const merged = smartMergeConfigs(config1, config2, config3);

      expect(merged.display.interface.showLineNumbers).toBe(true);
      expect(merged.display.tree.showArrayIndices).toBe(false);
      expect(merged.keybindings.navigation.up).toEqual(["w"]);
      // Should preserve defaults for unspecified values
      expect(merged.display.json.indent).toBe(
        DEFAULT_CONFIG.display.json.indent,
      );
    });

    it("should handle precedence correctly (first config wins)", () => {
      const config1: PartialJsontConfig = {
        display: {
          interface: {
            showLineNumbers: true,
          },
        },
      };

      const config2: PartialJsontConfig = {
        display: {
          interface: {
            showLineNumbers: false, // Should be overridden by config1
          },
        },
      };

      const merged = smartMergeConfigs(config1, config2);
      expect(merged.display.interface.showLineNumbers).toBe(true);
    });
  });

  describe("getConfigDiff", () => {
    it("should return empty diff for default config", () => {
      const diff = getConfigDiff(DEFAULT_CONFIG);
      expect(Object.keys(diff)).toHaveLength(0);
    });

    it("should return differences from default", () => {
      const customConfig: JsontConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          interface: {
            ...DEFAULT_CONFIG.display.interface,
            showLineNumbers: true, // Different from default
          },
        },
      };

      const diff = getConfigDiff(customConfig);
      expect(diff.display).toBeDefined();
      expect(diff.keybindings).toBeUndefined(); // No changes
    });
  });

  describe("isDefaultConfig", () => {
    it("should return true for default config", () => {
      expect(isDefaultConfig(DEFAULT_CONFIG)).toBe(true);
    });

    it("should return false for modified config", () => {
      const modifiedConfig: JsontConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          interface: {
            ...DEFAULT_CONFIG.display.interface,
            debugMode: true,
          },
        },
      };

      expect(isDefaultConfig(modifiedConfig)).toBe(false);
    });
  });

  describe("getConfigSummary", () => {
    it("should return default message for default config", () => {
      const summary = getConfigSummary(DEFAULT_CONFIG);
      expect(summary).toEqual(["Using default configuration"]);
    });

    it("should describe configuration changes", () => {
      const customConfig: JsontConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          interface: {
            ...DEFAULT_CONFIG.display.interface,
            showLineNumbers: true,
            debugMode: true,
          },
          tree: {
            ...DEFAULT_CONFIG.display.tree,
            useUnicodeTree: false,
          },
          json: {
            ...DEFAULT_CONFIG.display.json,
            indent: 4,
          },
        },
      };

      const summary = getConfigSummary(customConfig);
      expect(summary).toContain("Line numbers: enabled");
      expect(summary).toContain("Debug mode: enabled");
      expect(summary).toContain("Tree style: ASCII");
      expect(summary).toContain("JSON indent: 4 spaces");
    });
  });

  describe("defu integration behavior", () => {
    it("should handle null values correctly", () => {
      const config = smartMergeConfigs({
        display: {
          interface: {
            showLineNumbers: null as any, // null should be ignored
          },
        },
      });

      // Should use default value when null is provided
      expect(config.display.interface.showLineNumbers).toBe(
        DEFAULT_CONFIG.display.interface.showLineNumbers,
      );
    });

    it("should handle undefined values correctly", () => {
      const config = smartMergeConfigs({
        display: {
          interface: {
            showLineNumbers: undefined as any,
          },
        },
      });

      // Should use default value when undefined is provided
      expect(config.display.interface.showLineNumbers).toBe(
        DEFAULT_CONFIG.display.interface.showLineNumbers,
      );
    });

    it("should replace arrays completely", () => {
      const config = smartMergeConfigs({
        keybindings: {
          navigation: {
            up: ["w", "ArrowUp"], // New array
          },
        },
      });

      // Should replace entire array, not merge with default
      expect(config.keybindings.navigation.up).toEqual(["w", "ArrowUp"]);
      expect(config.keybindings.navigation.up).not.toContain("k"); // Default value should not be present
    });

    it("should handle deep nested object merging", () => {
      const config = smartMergeConfigs({
        behavior: {
          search: {
            caseSensitive: true, // Only change this one property
          },
        },
      });

      // Should merge deeply but only change specified property
      expect(config.behavior.search.caseSensitive).toBe(true);
      expect(config.behavior.search.regex).toBe(
        DEFAULT_CONFIG.behavior.search.regex,
      ); // Unchanged
      expect(config.behavior.navigation).toEqual(
        DEFAULT_CONFIG.behavior.navigation,
      ); // Unchanged
    });
  });
});
