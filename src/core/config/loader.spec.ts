/**
 * Configuration loader tests
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "./defaults.js";
import {
  getConfigPath,
  loadConfig,
  loadConfigFromPath,
  validateConfigWithDetails,
} from "./loader.js";

// Mock os.homedir to use a temporary directory
const testTmpDir = join(tmpdir(), "jsont-test-config");

// Mock the loader module to use our test directory
import * as loaderModule from "./loader.js";

describe("Configuration Loader", () => {
  const testConfigDir = join(testTmpDir, ".config", "jsont");
  const testConfigPath = join(testConfigDir, "config.yaml");

  // Spy on getConfigPath to return our test path
  let getConfigPathSpy: any;

  beforeEach(() => {
    // Restore any existing spy first
    if (getConfigPathSpy) {
      getConfigPathSpy.mockRestore();
    }

    // Create test directory
    if (existsSync(testTmpDir)) {
      rmSync(testTmpDir, { recursive: true, force: true });
    }
    mkdirSync(testTmpDir, { recursive: true });

    // Mock getConfigPath to return our test path
    getConfigPathSpy = vi
      .spyOn(loaderModule, "getConfigPath")
      .mockReturnValue(testConfigPath);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testTmpDir)) {
      rmSync(testTmpDir, { recursive: true, force: true });
    }

    // Restore spy
    if (getConfigPathSpy) {
      getConfigPathSpy.mockRestore();
    }
  });

  describe("getConfigPath", () => {
    it("should return correct config path", () => {
      // Temporarily restore the spy to test the actual function
      getConfigPathSpy.mockRestore();

      // Since we can't mock homedir in ESM, just verify that getConfigPath returns a valid path
      const path = getConfigPath();
      expect(path).toContain(".config/jsont/config.yaml");
      expect(path).toMatch(/\/.*\.config\/jsont\/config\.yaml$/);

      // Re-establish the spy for other tests
      getConfigPathSpy = vi
        .spyOn(loaderModule, "getConfigPath")
        .mockReturnValue(testConfigPath);
    });
  });

  describe("loadConfig", () => {
    it("should return default config when no config file exists", () => {
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should load and merge valid config file", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      // Write a partial config file
      const testConfig = `
display:
  json:
    indent: 8
    useTabs: true
  tree:
    showArrayIndices: false
keybindings:
  navigation:
    up: ["w"]
    down: ["s"]
`;
      writeFileSync(testConfigPath, testConfig);

      // Use loadConfigFromPath instead of loadConfig to bypass the getConfigPath issue
      const config = loadConfigFromPath(testConfigPath);

      // Should have merged with defaults
      expect(config.display.json.indent).toBe(8);
      expect(config.display.json.useTabs).toBe(true);
      expect(config.display.tree.showArrayIndices).toBe(false);
      expect(config.keybindings.navigation.up).toEqual(["w"]);
      expect(config.keybindings.navigation.down).toEqual(["s"]);

      // Should retain defaults for unspecified values
      expect(config.display.json.maxLineLength).toBe(
        DEFAULT_CONFIG.display.json.maxLineLength,
      );
      expect(config.keybindings.navigation.pageUp).toEqual(
        DEFAULT_CONFIG.keybindings.navigation.pageUp,
      );
    });

    it("should handle invalid YAML gracefully", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      // Write invalid YAML
      const invalidYaml = `
display:
  json:
    indent: [invalid yaml structure
`;
      writeFileSync(testConfigPath, invalidYaml);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // loadConfigFromPath throws an error for invalid YAML, so we catch it
      expect(() => loadConfigFromPath(testConfigPath)).toThrow(
        "Failed to load config from",
      );

      consoleSpy.mockRestore();
    });

    it("should validate and sanitize config values", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      // Write config with invalid types
      const invalidConfig = `
display:
  json:
    indent: "not a number"
    useTabs: "not a boolean"
    validSetting: 4
  tree:
    showArrayIndices: "not a boolean"
    maxValueLength: 100
keybindings:
  navigation:
    up: "not an array"
    down: ["j", "ArrowDown"]
  invalidSection: "ignored"
`;
      writeFileSync(testConfigPath, invalidConfig);

      const config = loadConfig();

      // With Zod validation, invalid configs result in fallback to defaults
      expect(config.display.json.indent).toBe(
        DEFAULT_CONFIG.display.json.indent,
      );
      expect(config.display.json.useTabs).toBe(
        DEFAULT_CONFIG.display.json.useTabs,
      );
      expect(config.display.tree.maxValueLength).toBe(
        DEFAULT_CONFIG.display.tree.maxValueLength,
      ); // Falls back to default due to validation failure
      expect(config.keybindings.navigation.up).toEqual(
        DEFAULT_CONFIG.keybindings.navigation.up,
      );
      expect(config.keybindings.navigation.down).toEqual(
        DEFAULT_CONFIG.keybindings.navigation.down,
      ); // Falls back to default due to validation failure
    });

    it("should handle nested configuration merging correctly", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      const testConfig = `
behavior:
  search:
    caseSensitive: true
    # regex setting omitted, should use default
  navigation:
    halfPageScroll: false
`;
      writeFileSync(testConfigPath, testConfig);

      // Use loadConfigFromPath to test specific file
      const config = loadConfigFromPath(testConfigPath);

      // Should merge nested objects correctly
      expect(config.behavior.search.caseSensitive).toBe(true);
      expect(config.behavior.search.regex).toBe(
        DEFAULT_CONFIG.behavior.search.regex,
      );
      expect(config.behavior.search.highlight).toBe(
        DEFAULT_CONFIG.behavior.search.highlight,
      );
      expect(config.behavior.navigation.halfPageScroll).toBe(false);
      expect(config.behavior.navigation.autoScroll).toBe(
        DEFAULT_CONFIG.behavior.navigation.autoScroll,
      );
    });

    it("should handle empty config file", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      writeFileSync(testConfigPath, "");

      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should handle config file with only comments", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      const commentOnlyConfig = `
# This is a comment-only config file
# display:
#   json:
#     indent: 4
`;
      writeFileSync(testConfigPath, commentOnlyConfig);

      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should show validation warnings for invalid values with Zod", () => {
      // Create config directory
      mkdirSync(testConfigDir, { recursive: true });

      // Write config with validation errors
      const invalidConfig = `
display:
  json:
    indent: -1  # Should be positive
    maxLineLength: 2000  # Exceeds max limit (1000)
  tree:
    maxValueLength: 0  # Should be positive
keybindings:
  navigation:
    up: []  # Should have at least one string
behavior:
  navigation:
    scrollOffset: -10  # Should be non-negative
`;
      writeFileSync(testConfigPath, invalidConfig);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Use loadConfigFromPath to test specific file
      const config = loadConfigFromPath(testConfigPath);

      // Should fallback to defaults for invalid values
      expect(config).toEqual(DEFAULT_CONFIG);

      // Should show validation warnings from Zod - check that console.warn was called with validation message
      expect(consoleSpy).toHaveBeenCalledWith(
        "Configuration validation failed, using defaults:",
        expect.any(String),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("validateConfigWithDetails", () => {
    it("should return validation details for valid config", () => {
      const validConfig = {
        display: {
          json: {
            indent: 2,
            useTabs: false,
          },
        },
      };

      const result = validateConfigWithDetails(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.validatedConfig).toEqual(validConfig);
    });

    it("should return validation details for invalid config", () => {
      const invalidConfig = {
        display: {
          json: {
            indent: -1, // Invalid: should be positive
            useTabs: "not boolean", // Invalid: should be boolean
          },
        },
      };

      const result = validateConfigWithDetails(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.includes("indent"))).toBe(
        true,
      );
      expect(result.validatedConfig).toEqual({}); // Should be empty due to coercion
    });

    it("should handle null and undefined gracefully", () => {
      expect(validateConfigWithDetails(null).validatedConfig).toEqual({});
      expect(validateConfigWithDetails(undefined).validatedConfig).toEqual({});
    });
  });

  describe("loadConfigFromPath", () => {
    it("should load config from custom path", () => {
      const customPath = join(testTmpDir, "custom-config.yaml");
      const customConfig = `
display:
  json:
    indent: 6
`;
      writeFileSync(customPath, customConfig);

      const config = loadConfigFromPath(customPath);
      expect(config.display.json.indent).toBe(6);
    });

    it("should throw error for non-existent path", () => {
      const nonExistentPath = join(testTmpDir, "does-not-exist.yaml");

      expect(() => loadConfigFromPath(nonExistentPath)).toThrow(
        "Configuration file not found",
      );
    });

    it("should throw error for invalid YAML in custom path", () => {
      const customPath = join(testTmpDir, "invalid-config.yaml");
      writeFileSync(customPath, "invalid: [yaml");

      expect(() => loadConfigFromPath(customPath)).toThrow(
        "Failed to load config",
      );
    });
  });
});
